"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { MapPin, User, ListTodo, Wine, Sparkles, AlertTriangle, LocateFixed, X, Send, Bot } from "lucide-react"
import { cn } from "@/lib/utils"

declare global {
  interface Window {
    AMap?: any
    marked?: {
      parse: (text: string) => string
    }
    _AMapSecurityConfig?: {
      securityJsCode?: string
    }
  }
}

interface LandmarkMarker {
  id: string
  name: string
  latitude: number
  longitude: number
  level: 1 | 2 | 3
  guardian: string
}

interface MapPlaceholderProps {
  onSelectLandmark?: (id: string) => void
  selectedLandmark?: string | null
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

const fallbackTasks = [
  { id: "t1", x: 28, y: 40 },
  { id: "t2", x: 78, y: 58 },
]

const fallbackBottles = [
  { id: "b1", x: 70, y: 55 },
  { id: "b2", x: 40, y: 35 },
]

const AMAP_KEY = process.env.NEXT_PUBLIC_AMAP_KEY
const AMAP_SECURITY_JS_CODE = process.env.NEXT_PUBLIC_AMAP_SECURITY_JS_CODE
const DEFAULT_CENTER: [number, number] = [116.4074, 39.9042] // 北京坐标
const AMAP_SCRIPT_ID = "amap-sdk-script"

let amapScriptPromise: Promise<any> | null = null

function loadAMapScript(key: string): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("当前不是浏览器环境"))
  }

  if (window.AMap) {
    return Promise.resolve(window.AMap)
  }

  if (amapScriptPromise) {
    return amapScriptPromise
  }

  // 高德 JS API 2.0 在部分 key 配置下需要安全密钥，否则会出现底图不加载但对象可创建的现象。
  if (AMAP_SECURITY_JS_CODE) {
    window._AMapSecurityConfig = {
      securityJsCode: AMAP_SECURITY_JS_CODE,
    }
  }

  amapScriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(AMAP_SCRIPT_ID) as HTMLScriptElement | null

    if (existing) {
      const startAt = Date.now()
      const maxWaitMs = 10000
      const checkLoaded = () => {
        if (window.AMap) {
          resolve(window.AMap)
          return
        }
        if (Date.now() - startAt > maxWaitMs) {
          amapScriptPromise = null
          reject(new Error("高德地图脚本已存在但初始化超时，请检查 Key、域名白名单或网络"))
        } else {
          setTimeout(checkLoaded, 100)
        }
      }
      checkLoaded()
      return
    }

    const script = document.createElement("script")
    script.id = AMAP_SCRIPT_ID
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}`
    script.async = true

    script.onload = () => {
      if (window.AMap) {
        resolve(window.AMap)
      } else {
        amapScriptPromise = null
        reject(new Error("高德地图脚本已加载，但 AMap 未挂载到 window"))
      }
    }

    script.onerror = () => {
      amapScriptPromise = null
      reject(new Error("高德地图脚本加载失败"))
    }

    document.body.appendChild(script)
  })

  return amapScriptPromise
}

function isValidLngLat(lng: unknown, lat: unknown) {
  const x = Number(lng)
  const y = Number(lat)
  return Number.isFinite(x) && Number.isFinite(y) && x >= -180 && x <= 180 && y >= -90 && y <= 90
}

// WGS-84 转 GCJ-02 坐标系转换函数
function wgs84ToGcj02(lng: number, lat: number): [number, number] {
  const pi = Math.PI
  const a = 6378245.0
  const ee = 0.00669342162296594323
  
  // 检查是否在中国范围内，不在范围内直接返回原坐标
  if (!isInChina(lat, lng)) {
    return [lng, lat]
  }
  
  // 注意：transformLat 和 transformLng 的参数顺序是 (经度差, 纬度差)
  let dLat = transformLat(lng - 105.0, lat - 35.0)
  let dLng = transformLng(lng - 105.0, lat - 35.0)
  const radLat = lat * pi / 180.0
  let magic = Math.sin(radLat)
  magic = 1 - ee * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi)
  dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * pi)
  const mgLat = lat + dLat
  const mgLng = lng + dLng
  return [mgLng, mgLat]
}

// 检查坐标是否在中国范围内
function isInChina(lat: number, lng: number): boolean {
  return lng >= 73.66 && lng <= 135.05 && lat >= 3.86 && lat <= 53.55
}

function transformLat(x: number, y: number): number {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
  ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0
  ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0
  return ret
}

function transformLng(x: number, y: number): number {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
  ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0
  ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0
  return ret
}

function normalizeLandmark(raw: any): LandmarkMarker | null {
  if (!raw) return null
  if (!raw.id || !raw.name) return null
  if (!isValidLngLat(raw.longitude, raw.latitude)) return null

  const levelNum = Number(raw.level)
  const level: 1 | 2 | 3 = levelNum === 2 ? 2 : levelNum === 3 ? 3 : 1

  return {
    id: String(raw.id),
    name: String(raw.name),
    longitude: Number(raw.longitude),
    latitude: Number(raw.latitude),
    level,
    guardian: String(raw.guardian ?? ""),
  }
}

export function MapPlaceholder({ onSelectLandmark, selectedLandmark }: MapPlaceholderProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const amapInstanceRef = useRef<any>(null)
  const markerInstancesRef = useRef<Record<string, any>>({})
  const userMarkerRef = useRef<any>(null)
  const hasInitializedMapRef = useRef(false)

  const [landmarks, setLandmarks] = useState<LandmarkMarker[]>([])
  const [userPosition, setUserPosition] = useState<{ lng: number; lat: number } | null>(null)
  const [mode, setMode] = useState<"fallback" | "amap">('fallback')
  const [errorText, setErrorText] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [isAiOpen, setIsAiOpen] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "你好，我是地标 AI 助手。你可以问我景点推荐、路线规划、历史文化、打卡建议。" },
  ])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.marked) return
    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js"
    script.async = true
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
  }, [])

  const renderAssistantMarkdown = (text: string) => {
    if (typeof window !== "undefined" && window.marked) {
      return { __html: window.marked.parse(text) }
    }
    return { __html: text.replace(/\n/g, "<br/>") }
  }

  useEffect(() => {
    let cancelled = false

    const loadLandmarks = async () => {
      try {
        const res = await fetch("/api/landmarks")
        if (!res.ok) {
          throw new Error(`地标接口请求失败: ${res.status}`)
        }

        const json = await res.json()
        if (!Array.isArray(json.data)) {
          throw new Error("地标接口返回格式错误")
        }

        const safeLandmarks = json.data
          .map((item: any) => normalizeLandmark(item))
          .filter((item: LandmarkMarker | null): item is LandmarkMarker => item !== null)

        if (!cancelled) {
          setLandmarks(safeLandmarks)
          if (safeLandmarks.length === 0) {
            setErrorText("地标数据为空")
          }
        }
      } catch (error) {
        console.error("地标数据加载失败:", error)
        if (!cancelled) {
          setLandmarks([])
          setErrorText(error instanceof Error ? error.message : "地标数据加载失败")
        }
      }
    }

    void loadLandmarks()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) return

    let cancelled = false

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return
        const lng = position.coords.longitude
        const lat = position.coords.latitude

        if (isValidLngLat(lng, lat)) {
          // 将WGS-84坐标系转换为GCJ-02坐标系
          const [gcjLng, gcjLat] = wgs84ToGcj02(lng, lat)
          setUserPosition({ lng: gcjLng, lat: gcjLat })
        }
      },
      () => {
        // 保持默认中心即可
      },
      { enableHighAccuracy: true, timeout: 5000 }
    )

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let disposed = false

    const waitForContainerReady = async (el: HTMLDivElement) => {
      let attempts = 0
      const maxAttempts = 30

      while (attempts < maxAttempts) {
        const rect = el.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          return
        }
        await new Promise((resolve) => setTimeout(resolve, 100))
        attempts++
      }

      throw new Error("地图容器尺寸未就绪")
    }

    const initMap = async () => {
      if (hasInitializedMapRef.current) return

      if (!AMAP_KEY) {
        setMode("fallback")
        setErrorText("未配置 NEXT_PUBLIC_AMAP_KEY")
        return
      }

      const container = mapContainerRef.current
      if (!container) {
        setMode("fallback")
        setErrorText("地图容器不存在")
        return
      }

      try {
        await waitForContainerReady(container)
        if (disposed) return

        const AMap = await loadAMapScript(AMAP_KEY)
        if (disposed || !mapContainerRef.current) return

        const center: [number, number] = userPosition
          ? [userPosition.lng, userPosition.lat]
          : DEFAULT_CENTER

        const map = new AMap.Map(mapContainerRef.current, {
          zoom: 11,
          center,
          mapStyle: "amap://styles/normal",
          viewMode: "2D",
          resizeEnable: true,
        })

        let completed = false
        const completeTimeout = window.setTimeout(() => {
          if (!completed) {
            setErrorText("底图加载超时：请检查高德 Key 域名白名单，或配置 NEXT_PUBLIC_AMAP_SECURITY_JS_CODE")
          }
        }, 8000)

        const onComplete = () => {
          completed = true
          window.clearTimeout(completeTimeout)
        }

        const onError = (e: any) => {
          window.clearTimeout(completeTimeout)
          console.error("地图错误:", e)
          setErrorText(`地图错误: ${e?.message || "未知错误"}`)
        }

        map.on("complete", onComplete)
        map.on("error", onError)

        amapInstanceRef.current = map
        hasInitializedMapRef.current = true
        setMode("amap")
        setErrorText(null)

        const actualCenter = userPosition
          ? [userPosition.lng, userPosition.lat]
          : DEFAULT_CENTER

        userMarkerRef.current = new AMap.Marker({
          position: actualCenter,
          content:
            '<div style="width:14px;height:14px;border-radius:9999px;background:#00d4ff;box-shadow:0 0 16px rgba(0,212,255,.8);border:2px solid white"></div>',
          offset: new AMap.Pixel(-7, -7),
        })

        map.add(userMarkerRef.current)

          // 保存到实例上，方便 cleanup 时 off
          ; (map as any).__chatgpt_onComplete = onComplete
          ; (map as any).__chatgpt_onError = onError
      } catch (error) {
        console.error("地图初始化错误:", error)
        setMode("fallback")
        setErrorText(`高德地图初始化失败: ${error instanceof Error ? error.message : "未知错误"}`)
      }
    }

    void initMap()

    return () => {
      disposed = true
    }
  }, [userPosition])

  useEffect(() => {
    const map = amapInstanceRef.current
    if (!map || !window.AMap) return

    const AMap = window.AMap
    const center: [number, number] = userPosition
      ? [userPosition.lng, userPosition.lat]
      : DEFAULT_CENTER

    map.setCenter(center)

    if (userMarkerRef.current) {
      userMarkerRef.current.setPosition(center)
    } else {
      userMarkerRef.current = new AMap.Marker({
        position: center,
        content:
          '<div style="width:14px;height:14px;border-radius:9999px;background:#00d4ff;box-shadow:0 0 16px rgba(0,212,255,.8);border:2px solid white"></div>',
        offset: new AMap.Pixel(-7, -7),
      })
      map.add(userMarkerRef.current)
    }
  }, [userPosition])

  useEffect(() => {
    const map = amapInstanceRef.current
    if (!map || landmarks.length === 0 || userPosition) return
    // 用户定位不可用时，至少将视角移动到首个地标，保证进入地图就能看到坐标点。
    map.setCenter([landmarks[0].longitude, landmarks[0].latitude])
  }, [landmarks, userPosition])

  useEffect(() => {
    const map = amapInstanceRef.current
    if (!map || !window.AMap) return

    Object.values(markerInstancesRef.current).forEach((marker: any) => {
      map.remove(marker)
    })
    markerInstancesRef.current = {}

    const instances: Record<string, any> = {}

    landmarks.forEach((item) => {
      const color =
        item.level === 1 ? "#00d4ff" : item.level === 2 ? "#b388ff" : "#f7c948"

      const marker = new window.AMap.Marker({
        position: [item.longitude, item.latitude],
        title: item.name,
        content: `<div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9999px;background:${color};color:#111;font-weight:700;border:2px solid #fff;box-shadow:0 0 12px rgba(0,0,0,.35)">${item.level}</div>`,
        offset: new window.AMap.Pixel(-14, -14),
        zIndex: 120,
      })

      marker.on("click", () => {
        onSelectLandmark?.(item.id);
      })
      map.add(marker)
      instances[item.id] = marker
    })

    markerInstancesRef.current = instances
  }, [mode, landmarks, onSelectLandmark])

  useEffect(() => {
    if (mode !== "amap" || !window.AMap) return

    Object.entries(markerInstancesRef.current).forEach(([id, marker]) => {
      marker.setLabel(undefined)
      marker.setzIndex(id === selectedLandmark ? 200 : 100)

      if (id === selectedLandmark) {
        marker.setLabel({
          direction: "top",
          content:
            '<div style="padding:2px 6px;background:#0b1220;color:#fff;border-radius:999px;border:1px solid rgba(255,255,255,.15)">当前地标</div>',
        })
      }
    })
  }, [mode, selectedLandmark])

  const recenterToUser = () => {
    if (!navigator.geolocation) {
      setErrorText("当前浏览器不支持定位")
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const [gcjLng, gcjLat] = wgs84ToGcj02(position.coords.longitude, position.coords.latitude)
        const point = { lng: gcjLng, lat: gcjLat }
        setUserPosition(point)
        if (amapInstanceRef.current) {
          amapInstanceRef.current.setCenter([point.lng, point.lat])
        }
        setLocating(false)
      },
      () => {
        setLocating(false)
        setErrorText("定位失败，请检查浏览器定位权限")
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
    )
  }

  const sendAiMessage = async () => {
    const message = chatInput.trim()
    if (!message || chatLoading) return
    const history = [...chatMessages, { role: "user" as const, content: message }]
    setChatMessages(history)
    setChatInput("")
    setChatLoading(true)
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: history.slice(-10),
        }),
      })
      const json = await res.json()
      if (!res.ok || json?.code !== 0 || !json?.data?.reply) {
        throw new Error(json?.message || "AI 服务暂不可用")
      }
      setChatMessages((prev) => [...prev, { role: "assistant", content: String(json.data.reply) }])
    } catch (error) {
      const text = error instanceof Error ? error.message : "AI 服务异常，请稍后重试"
      setChatMessages((prev) => [...prev, { role: "assistant", content: `抱歉，${text}` }])
    } finally {
      setChatLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      const map = amapInstanceRef.current
      if (map) {
        const onComplete = (map as any).__chatgpt_onComplete
        const onError = (map as any).__chatgpt_onError

        if (onComplete) map.off("complete", onComplete)
        if (onError) map.off("error", onError)

        map.clearMap()
        map.destroy()
      }

      amapInstanceRef.current = null
      userMarkerRef.current = null
      markerInstancesRef.current = {}
      hasInitializedMapRef.current = false
    }
  }, [])

  // 硬编码的地标数据作为fallback
  const fallbackLandmarks = useMemo(() => {
    const points = [
      [25, 30],
      [45, 20],
      [65, 45],
      [35, 60],
      [55, 70],
      [75, 25],
    ]

    // 如果从API获取的地标数据为空，使用硬编码的地标数据
    if (landmarks.length === 0) {
      return [
        { id: "beijing_031", name: "天坛公园", longitude: 116.426667, latitude: 39.905, level: 2, guardian: "Traveler", x: 25, y: 30 },
        { id: "beijing_049", name: "故宫博物院", longitude: 116.268889, latitude: 39.838056, level: 1, guardian: "HistoryBuff", x: 45, y: 20 },
        { id: "beijing_050", name: "八达岭长城", longitude: 116.015, latitude: 40.358333, level: 3, guardian: "Explorer_Alex", x: 65, y: 45 },
        { id: "beijing_032", name: "颐和园", longitude: 116.3225, latitude: 39.894167, level: 2, guardian: "Traveler", x: 35, y: 60 },
        { id: "beijing_033", name: "圆明园", longitude: 116.378333, latitude: 39.865, level: 2, guardian: "Traveler", x: 55, y: 70 },
        { id: "beijing_034", name: "王府井步行街", longitude: 116.410556, latitude: 39.913889, level: 2, guardian: "Shopaholic", x: 75, y: 25 },
      ]
    }

    return landmarks.map((item, idx) => ({
      ...item,
      x: points[idx]?.[0] ?? 50,
      y: points[idx]?.[1] ?? 50,
    }))
  }, [landmarks])

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1:
        return "from-cyan/80 to-cyan"
      case 2:
        return "from-purple/80 to-purple"
      case 3:
        return "from-gold/80 to-gold"
      default:
        return "from-cyan/80 to-cyan"
    }
  }

  const mapContainer = (
    <div
      ref={mapContainerRef}
      className="absolute inset-0 w-full h-full"
      style={{
        minHeight: "600px",
        backgroundColor: mode === "amap" ? "#f0f0f0" : "transparent",
        opacity: mode === "amap" ? 1 : 0,
        pointerEvents: mode === "amap" ? "auto" : "none",
        zIndex: mode === "amap" ? 1 : -1,
      }}
    />
  )

  if (mode === "amap") {
    return (
      <div className="flex-1 relative bg-gradient-to-br from-background via-secondary/20 to-background overflow-hidden">
        {mapContainer}

        <div className="absolute top-4 left-4 bg-card/85 backdrop-blur-sm border border-border rounded-lg p-3 space-y-2 z-10">
          <div className="text-xs text-muted-foreground">地图模式：高德 API</div>
          <div className="text-xs text-muted-foreground">已加载 {landmarks.length} 个地标</div>
          <div className="text-xs text-muted-foreground">API Key: {AMAP_KEY ? "已配置" : "未配置"}</div>
          {errorText && <div className="text-xs text-orange mt-1">错误: {errorText}</div>}
        </div>

        <button
          type="button"
          onClick={() => setIsAiOpen(true)}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm border border-border rounded-full z-10 hover:bg-card transition-colors"
        >
          <Sparkles className="w-4 h-4 text-cyan" />
          <span className="text-sm text-muted-foreground">
            快快探索吧！
          </span>
        </button>

        <button
          type="button"
          onClick={recenterToUser}
          className="absolute bottom-4 right-4 z-10 w-11 h-11 rounded-full bg-card/90 border border-border shadow-lg hover:bg-card transition-colors flex items-center justify-center"
          title="返回我的当前位置"
        >
          <LocateFixed className={cn("w-5 h-5 text-cyan", locating && "animate-pulse")} />
        </button>
        {isAiOpen && (
          <div className="absolute right-4 bottom-20 z-20 w-[360px] h-[480px] bg-card/90 backdrop-blur-md border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan/20 to-purple/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-cyan" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">AI 探索助手</div>
                  <div className="text-xs text-muted-foreground">地图问答 · 路线建议 · 地标解说</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-secondary/70 transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 p-3 space-y-2 overflow-y-auto bg-gradient-to-b from-transparent to-secondary/10">
              {chatMessages.map((msg, idx) => (
                <div
                  key={`${msg.role}-${idx}`}
                  className={cn(
                    "max-w-[88%] px-3 py-2 rounded-xl text-sm leading-relaxed",
                    msg.role === "user"
                      ? "ml-auto bg-cyan/20 border border-cyan/30 text-foreground"
                      : "mr-auto bg-secondary/60 border border-border text-foreground"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <div
                      className="ai-chat-markdown whitespace-normal [&_h1]:text-base [&_h1]:font-semibold [&_h1]:mb-1 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-medium [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-black/20"
                      dangerouslySetInnerHTML={renderAssistantMarkdown(msg.content)}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div className="mr-auto max-w-[88%] px-3 py-2 rounded-xl text-sm bg-secondary/60 border border-border text-muted-foreground animate-pulse">
                  AI 正在思考中...
                </div>
              )}
            </div>
            <div className="p-3 border-t border-border">
              <div className="flex items-center gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      void sendAiMessage()
                    }
                  }}
                  placeholder="输入你的问题，比如：帮我规划今天北京打卡路线"
                  className="flex-1 h-10 px-3 rounded-lg bg-secondary/60 border border-border outline-none focus:ring-2 focus:ring-cyan/40 text-sm"
                />
                <button
                  type="button"
                  onClick={() => void sendAiMessage()}
                  disabled={chatLoading || !chatInput.trim()}
                  className="w-10 h-10 rounded-lg bg-cyan/20 border border-cyan/30 hover:bg-cyan/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  <Send className="w-4 h-4 text-cyan" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 relative bg-gradient-to-br from-background via-secondary/20 to-background overflow-hidden">
      {mapContainer}

      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-cyan"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <svg
        className="absolute inset-0 w-full h-full opacity-20"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d="M 10 50 Q 30 30 50 45 T 90 40"
          stroke="currentColor"
          strokeWidth="0.5"
          fill="none"
          className="text-cyan"
        />
        <path
          d="M 20 80 Q 40 60 60 70 T 85 55"
          stroke="currentColor"
          strokeWidth="0.3"
          fill="none"
          className="text-muted-foreground"
        />
        <path
          d="M 15 20 Q 35 35 55 25 T 90 30"
          stroke="currentColor"
          strokeWidth="0.3"
          fill="none"
          className="text-muted-foreground"
        />
        <path
          d="M 50 10 Q 45 40 50 45 T 45 90"
          stroke="currentColor"
          strokeWidth="0.4"
          fill="none"
          className="text-cyan/50"
        />
      </svg>

      {fallbackLandmarks.map((marker) => (
        <button
          key={marker.id}
          className={cn(
            "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-10",
            "hover:scale-125",
            selectedLandmark === marker.id && "scale-125 z-20"
          )}
          style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
          onClick={() => {
            onSelectLandmark?.(marker.id);
          }}
        >
          <div className={cn("relative group", selectedLandmark === marker.id && "animate-bounce")}>
            <div
              className={cn(
                "w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg",
                getLevelColor(marker.level),
                selectedLandmark === marker.id &&
                "ring-2 ring-foreground ring-offset-2 ring-offset-background"
              )}
            >
              <MapPin className="w-5 h-5 text-background" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center">
              <span className="text-[10px] font-bold text-gold">L{marker.level}</span>
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border border-border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {marker.name}
            </div>
          </div>
        </button>
      ))}

      <div className="absolute" style={{ left: "50%", top: "45%", transform: "translate(-50%, -50%)" }}>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan to-primary flex items-center justify-center shadow-[0_0_20px_rgba(0,200,255,0.5)] animate-pulse">
          <User className="w-4 h-4 text-background" />
        </div>
      </div>

      {fallbackTasks.map((marker) => (
        <div
          key={marker.id}
          className="absolute w-6 h-6 rounded-full bg-orange/90 flex items-center justify-center shadow-[0_0_12px_rgba(255,150,50,0.4)]"
          style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
        >
          <ListTodo className="w-3 h-3 text-background" />
        </div>
      ))}

      {fallbackBottles.map((marker) => (
        <div
          key={marker.id}
          className="absolute w-6 h-6 rounded-full bg-purple/90 flex items-center justify-center shadow-[0_0_12px_rgba(180,100,255,0.4)] animate-bounce"
          style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
        >
          <Wine className="w-3 h-3 text-background" />
        </div>
      ))}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm border border-border rounded-full">
        <Sparkles className="w-4 h-4 text-cyan" />
        <span className="text-sm text-muted-foreground">
          {AMAP_KEY ? "地图脚本加载失败，当前为降级展示" : "未配置 NEXT_PUBLIC_AMAP_KEY，当前为降级展示"}
        </span>
      </div>

      {(errorText || !AMAP_KEY) && (
        <div className="absolute top-4 right-4 max-w-xs bg-card/85 backdrop-blur-sm border border-border rounded-lg p-3 z-10">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-orange mt-0.5" />
            <div className="text-xs text-muted-foreground leading-5">
              <div>{errorText ?? "请在 .env.local 中配置 NEXT_PUBLIC_AMAP_KEY。"}</div>
              <div>代码位置：components/landmark-lord/map-placeholder.tsx</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}