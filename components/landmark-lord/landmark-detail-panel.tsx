"use client"

import { useEffect, useState } from "react"
import { MapPin, Crown, Sparkles, Wine, Settings, Navigation, Star, Users, Plus, Send, Image as ImageIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { CheckinButton } from "./checkin-button"
import { BottleCard } from "./bottle-card"
import { ActivityFeed } from "./activity-feed"
import { AIDescriptionPanel } from "./ai-description-panel"
import { RankingList } from "./ranking-list"
import { useApp } from "@/components/landmark-lord/app-context"

type PanelTab = "details" | "bottles" | "social" | "ai" | "ranking"

interface LandmarkDetail {
  id: string
  name: string
  city: string
  radius: number
  createdAt: string
  level: number
  guardian: string
  influenceProgress: number
  influenceScore: number
  description: string
  bottles: Array<{ id: string; content: string; author: string; likes: number; comments: number; hasImage?: boolean }>
  feed: Array<{ id: string; user: string; action: string; target: string; createdAt: string }>
  ranking: Array<{ userId: string; username: string; score: number; rank: number; isGuardian?: boolean }>
}

interface LandmarkDetailPanelProps {
  selectedLandmark: string | null
}

export function LandmarkDetailPanel({ selectedLandmark }: LandmarkDetailPanelProps) {
  const { user } = useApp()
  const [activeTab, setActiveTab] = useState<PanelTab>("details")
  const [checkinState, setCheckinState] = useState<"too-far" | "available" | "completed">("available")
  const [landmark, setLandmark] = useState<LandmarkDetail | null>(null)
  const [distance, setDistance] = useState<number>(0)
  const [currentLandmarkId, setCurrentLandmarkId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // 投递漂流瓶相关状态
  const [showComposeBottle, setShowComposeBottle] = useState(false)
  const [bottleContent, setBottleContent] = useState("")
  const [bottleImageUrl, setBottleImageUrl] = useState("")
  const [isSubmittingBottle, setIsSubmittingBottle] = useState(false)
  const [bottles, setBottles] = useState<LandmarkDetail['bottles']>([])
  
  // AI解说相关状态
  const [aiDescription, setAiDescription] = useState<string | null>(null)
  const [isLoadingAiDescription, setIsLoadingAiDescription] = useState(false)

  const DEFAULT_CENTER = { lat: 39.9042, lng: 116.4074 }

  const isInChina = (lat: number, lng: number) => lng >= 73.66 && lng <= 135.05 && lat >= 3.86 && lat <= 53.55
  const transformLat = (x: number, y: number) => {
    let ret = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
    ret += ((20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2) / 3
    ret += ((20 * Math.sin(y * Math.PI) + 40 * Math.sin((y / 3) * Math.PI)) * 2) / 3
    ret += ((160 * Math.sin((y / 12) * Math.PI) + 320 * Math.sin((y / 30) * Math.PI)) * 2) / 3
    return ret
  }
  const transformLng = (x: number, y: number) => {
    let ret = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
    ret += ((20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2) / 3
    ret += ((20 * Math.sin(x * Math.PI) + 40 * Math.sin((x / 3) * Math.PI)) * 2) / 3
    ret += ((150 * Math.sin((x / 12) * Math.PI) + 300 * Math.sin((x / 30) * Math.PI)) * 2) / 3
    return ret
  }
  const wgs84ToGcj02 = (lng: number, lat: number): [number, number] => {
    if (!isInChina(lat, lng)) return [lng, lat]
    const a = 6378245
    const ee = 0.00669342162296594323
    const pi = Math.PI
    let dLat = transformLat(lng - 105, lat - 35)
    let dLng = transformLng(lng - 105, lat - 35)
    const radLat = (lat * pi) / 180
    let magic = Math.sin(radLat)
    magic = 1 - ee * magic * magic
    const sqrtMagic = Math.sqrt(magic)
    dLat = (dLat * 180) / (((a * (1 - ee)) / (magic * sqrtMagic)) * pi)
    dLng = (dLng * 180) / ((a / sqrtMagic) * Math.cos(radLat) * pi)
    return [lng + dLng, lat + dLat]
  }

  useEffect(() => {
    setCurrentLandmarkId(selectedLandmark)
  }, [selectedLandmark])

  useEffect(() => {
    if (selectedLandmark) return

    let cancelled = false

    const fetchNearest = async (lat: number, lng: number) => {
      try {
        const res = await fetch(`/api/landmarks/nearby?lat=${lat}&lng=${lng}&limit=1`)
        if (!res.ok) return
        const json = await res.json()
        const nearest = Array.isArray(json.data) ? json.data[0] : null
        if (!cancelled && nearest?.id) {
          setCurrentLandmarkId(String(nearest.id))
        }
      } catch {
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const [gcjLng, gcjLat] = wgs84ToGcj02(position.coords.longitude, position.coords.latitude)
          fetchNearest(gcjLat, gcjLng)
        },
        () => {
          fetchNearest(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng)
        }
      )
    } else {
      fetchNearest(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng)
    }

    return () => {
      cancelled = true
    }
  }, [selectedLandmark])

  useEffect(() => {
    if (!currentLandmarkId) {
      setLandmark(null)
      return
    }

    let cancelled = false
    setIsLoading(true)

    fetch(`/api/landmarks/${currentLandmarkId}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) {
          setLandmark(json.data ?? null)
          setBottles(json.data?.bottles ?? [])
          if (json.data?.id) {
            // 获取AI解说
            fetchAiDescription(json.data.id)
          }
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLandmark(null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [currentLandmarkId])

  // 获取漂流瓶列表
  useEffect(() => {
    if (!currentLandmarkId) return
    
    let cancelled = false
    
    const fetchBottles = async () => {
      try {
        const res = await fetch(`/api/bottles?landmarkId=${currentLandmarkId}`)
        if (!cancelled && res.ok) {
          const json = await res.json()
          if (json.data) {
            setBottles(json.data)
          }
        }
      } catch (error) {
        console.error('获取漂流瓶失败:', error)
      }
    }
    
    fetchBottles()
    
    // 监听漂流瓶更新事件
    const handleBottleUpdated = () => {
      fetchBottles()
    }
    
    window.addEventListener('bottleUpdated', handleBottleUpdated)
    
    return () => {
      cancelled = true
      window.removeEventListener('bottleUpdated', handleBottleUpdated)
    }
  }, [currentLandmarkId])

  // 投递漂流瓶
  const handleSubmitBottle = async () => {
    if (!user || !landmark || !bottleContent.trim()) return
    
    setIsSubmittingBottle(true)
    try {
      const res = await fetch('/api/bottles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landmarkId: landmark.id,
          userId: user.id,
          content: bottleContent.trim(),
          imageUrl: bottleImageUrl || null,
          visibility: 'public',
        }),
      })
      
      const json = await res.json()
      
      if (json.code === 0) {
        // 清空表单
        setBottleContent('')
        setBottleImageUrl('')
        setShowComposeBottle(false)
        
        // 刷新漂流瓶列表
        const bottlesRes = await fetch(`/api/bottles?landmarkId=${landmark.id}`)
        const bottlesJson = await bottlesRes.json()
        if (bottlesJson.data) {
          setBottles(bottlesJson.data)
        }
      } else {
        alert(json.message || '投递失败')
      }
    } catch (error) {
      console.error('投递漂流瓶失败:', error)
      alert('投递失败，请稍后重试')
    } finally {
      setIsSubmittingBottle(false)
    }
  }

  // 获取AI解说
  const fetchAiDescription = async (landmarkId: string) => {
    setIsLoadingAiDescription(true)
    try {
      const res = await fetch(`/api/landmarks/${landmarkId}/ai-intro?lang=cn`)
      if (res.ok) {
        const json = await res.json()
        setAiDescription(json?.data?.introText ?? null)
      }
    } catch (error) {
      console.error('获取AI解说失败:', error)
    } finally {
      setIsLoadingAiDescription(false)
    }
  }

  useEffect(() => {
    if (!currentLandmarkId || !navigator.geolocation) {
      setDistance(0)
      setCheckinState("available")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void (async () => {
          try {
            const [gcjLng, gcjLat] = wgs84ToGcj02(position.coords.longitude, position.coords.latitude)
            const res = await fetch(`/api/landmarks/nearby?lat=${gcjLat}&lng=${gcjLng}&limit=500`)
            if (!res.ok) {
              setDistance(0)
              setCheckinState("too-far")
              return
            }
            const json = await res.json()
            const hit = (json.data ?? []).find((item: any) => item.id === currentLandmarkId)
            const currentDistance = hit?.distance ?? 0
            const radius = hit?.checkinRadius ?? hit?.radius ?? 1000
            setDistance(currentDistance)
            setCheckinState(currentDistance > radius ? "too-far" : "available")
          } catch {
            setDistance(0)
            setCheckinState("too-far")
          }
        })()
      },
      () => {
        setDistance(180)
        setCheckinState("too-far")
      }
    )
  }, [currentLandmarkId])

  const tabs: { id: PanelTab; label: string; icon: typeof MapPin }[] = [
    { id: "details", label: "详情", icon: MapPin },
    { id: "bottles", label: "漂流瓶", icon: Wine },
    { id: "social", label: "动态", icon: Users },
    { id: "ai", label: "AI", icon: Sparkles },
    { id: "ranking", label: "排名", icon: Star },
  ]

  if (!landmark) {
    return (
      <aside className="w-80 border-l border-border bg-sidebar/50 backdrop-blur-sm flex flex-col shrink-0">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-secondary/50 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              {isLoading ? "正在为你选择附近的地标..." : "暂时无法加载地标，请稍后重试"}
            </p>
          </div>
        </div>
      </aside>
    )
  }

  const isGuardian = landmark.guardian === "Explorer_Alex"

  return (
    <aside className="w-80 border-l border-border bg-sidebar/50 backdrop-blur-sm flex flex-col shrink-0 overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg text-foreground truncate">{landmark.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Navigation className="w-3.5 h-3.5 text-cyan" />
              <span className="text-sm text-cyan">距离 {distance}m</span>
            </div>
          </div>
          <div className={cn(
            "px-2 py-1 rounded-full text-xs font-bold",
            landmark.level === 1 && "bg-cyan/20 text-cyan",
            landmark.level === 2 && "bg-purple/20 text-purple",
            landmark.level === 3 && "bg-gold/20 text-gold"
          )}>
            Lv.{landmark.level}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Crown className="w-4 h-4 text-gold" />
          <span className="text-muted-foreground">守护者:</span>
          <span className={cn("font-medium", isGuardian ? "text-gold" : "text-foreground")}>
            {landmark.guardian}
            {isGuardian && " (你)"}
          </span>
        </div>

        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>城市</span>
            <span>{landmark.city}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>打卡半径</span>
            <span>{landmark.radius}m</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>创建时间</span>
            <span>{new Date(landmark.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">你的影响力</span>
            <span className="text-gold font-medium">{landmark.influenceScore.toLocaleString()} 点</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-gold to-orange rounded-full transition-all duration-500" style={{ width: `${landmark.influenceProgress}%` }} />
          </div>
        </div>
      </div>

      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 py-2 text-xs font-medium transition-colors",
              activeTab === tab.id ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="w-4 h-4 mx-auto mb-0.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "details" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{landmark.description}</p>
            <CheckinButton
              state={checkinState}
              onCheckin={async () => {
                if (!navigator.geolocation || !landmark || !user) return
                navigator.geolocation.getCurrentPosition((position) => {
                  void (async () => {
                    try {
                      const [gcjLng, gcjLat] = wgs84ToGcj02(position.coords.longitude, position.coords.latitude)
                      const res = await fetch('/api/checkins', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          landmarkId: landmark.id,
                          userId: user.id,
                          latitude: gcjLat,
                          longitude: gcjLng,
                        }),
                      })
                      const json = await res.json()
                      setCheckinState(json?.data?.isValid ? 'completed' : 'too-far')
                    } catch {
                      setCheckinState('too-far')
                    }
                  })()
                })
              }}
            />
            <div className="space-y-3">
              {/* AI解说内容（如果存在） */}
              {aiDescription && (
                <div className="bg-secondary/30 border border-border/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-cyan" />
                    <span className="text-sm font-medium">AI解说</span>
                  </div>
                  <div 
                    className="text-sm text-muted-foreground leading-relaxed max-h-60 overflow-y-auto pr-2"
                    dangerouslySetInnerHTML={{ 
                      __html: aiDescription
                        .replace(/\n/g, '<br/>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold mt-4 mb-2">$1</h1>')
                        .replace(/^## (.*$)/gim, '<h2 class="text-md font-bold mt-3 mb-1">$1</h2>')
                        .replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold mt-2 mb-1">$1</h3>')
                        .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" class="text-cyan hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
                        .replace(/`([^`]+)`/g, '<code class="bg-secondary px-1 py-0.5 rounded text-xs">$1</code>')
                    }}
                  />
                </div>
              )}
              
              {/* 操作按钮 */}
              <div className="grid grid-cols-2 gap-2">
                {!aiDescription && (
                  <button className="flex items-center justify-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm transition-colors" onClick={() => setActiveTab("ai")}>
                    <Sparkles className="w-4 h-4 text-cyan" />
                    <span>AI解说</span>
                  </button>
                )}
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm transition-colors" onClick={() => setActiveTab("bottles")}>
                  <Wine className="w-4 h-4 text-purple" />
                  <span>打开漂流瓶</span>
                </button>
              </div>
            </div>
            <div className={cn("p-3 rounded-lg border", isGuardian ? "bg-gold/10 border-gold/30" : "bg-secondary/30 border-border/50 opacity-60")}>
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4 text-gold" />
                <span className="text-sm font-medium">地标经营</span>
              </div>
              {isGuardian ? (
                <div className="space-y-2">
                  <button className="w-full px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded text-xs transition-colors">编辑简介</button>
                  <button className="w-full px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded text-xs transition-colors">应用贴纸</button>
                  <button className="w-full px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded text-xs transition-colors">应用主题</button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">只有守护者可以管理此地标</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "bottles" && (
          <div className="space-y-3">
            {/* 投递漂流瓶按钮 */}
            {user && (
              <button
                onClick={() => setShowComposeBottle(!showComposeBottle)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple/20 to-cyan/20 border border-purple/30 rounded-xl text-sm font-medium text-purple hover:from-purple/30 hover:to-cyan/30 transition-all"
              >
                {showComposeBottle ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{showComposeBottle ? '取消投递' : '投递漂流瓶'}</span>
              </button>
            )}
            
            {/* 投递漂流瓶表单 */}
            {showComposeBottle && user && (
              <div className="bg-card border border-purple/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-purple text-sm">
                  <Wine className="w-4 h-4" />
                  <span>写下你的发现</span>
                </div>
                <textarea
                  value={bottleContent}
                  onChange={(e) => setBottleContent(e.target.value)}
                  placeholder={`分享关于"${landmark.name}"的独特之处...`}
                  className="w-full h-24 px-3 py-2 bg-secondary border border-border/50 rounded-lg text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary"
                  disabled={isSubmittingBottle}
                />
                <div className="flex items-center justify-between">
                  <button 
                    className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    disabled={isSubmittingBottle}
                    onClick={() => alert('图片上传功能开发中...')}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>添加图片</span>
                  </button>
                  <button 
                    onClick={handleSubmitBottle}
                    disabled={!bottleContent.trim() || isSubmittingBottle}
                    className="flex items-center gap-2 px-4 py-2 bg-purple text-background rounded-lg text-sm font-medium hover:bg-purple/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmittingBottle ? '投递中...' : '投递'}</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* 漂流瓶列表 */}
            <div className="max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
              {bottles.length > 0 ? bottles.map((item) => (
                <BottleCard key={item.id} id={item.id} content={item.content} author={item.author} likes={item.likes} comments={item.comments} hasImage={item.hasImage} />
              )) : <p className="text-sm text-muted-foreground text-center py-8">当前地标暂无漂流瓶，来投递第一个吧！</p>}
            </div>
          </div>
        )}

        {activeTab === "social" && <ActivityFeed />}
        {activeTab === "ai" && <AIDescriptionPanel landmarkId={landmark.id} landmarkName={landmark.name} />}
        {activeTab === "ranking" && <RankingList />}
      </div>
    </aside>
  )
}
