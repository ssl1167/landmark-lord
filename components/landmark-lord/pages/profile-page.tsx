"use client"

import { useEffect, useRef, useState } from "react"
import { User, MapPin, Flame, Star, Crown, Trophy, Settings, Edit2, Share2, ChevronRight, Lock, Compass, Target, Zap, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "@/components/landmark-lord/app-context"

interface Achievement {
  id: string
  name: string
  description: string
  icon: typeof Trophy
  color: string
  unlocked: boolean
}

const achievements: Achievement[] = [
  { id: "1", name: "探索先锋", description: "完成首次打卡", icon: MapPin, color: "cyan", unlocked: true },
  { id: "2", name: "探索家", description: "访问10个地标", icon: Compass, color: "cyan", unlocked: true },
  { id: "3", name: "燃烧吧", description: "连续签到7天", icon: Flame, color: "orange", unlocked: true },
  { id: "4", name: "守护者", description: "成为地标守护者", icon: Crown, color: "gold", unlocked: true },
  { id: "5", name: "新星", description: "达到20级", icon: Star, color: "gold", unlocked: true },
  { id: "6", name: "神射手", description: "完成50个任务", icon: Target, color: "purple", unlocked: false },
  { id: "7", name: "闪电侠", description: "10秒内打卡", icon: Zap, color: "cyan", unlocked: false },
  { id: "8", name: "传奇", description: "达到50级", icon: Trophy, color: "gold", unlocked: false },
]

const stats = [
  { label: "打卡次数", value: "156", icon: MapPin, color: "cyan" },
  { label: "影响力", value: "2.4K", icon: Flame, color: "gold" },
  { label: "守护地标", value: "3", icon: Crown, color: "purple" },
  { label: "获得成就", value: "12", icon: Trophy, color: "orange" },
]

export function ProfilePage() {
  const { user, token, updateUser, logout } = useApp()
  const [username, setUsername] = useState(user?.username ?? "")
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setUsername(user?.username ?? "")
  }, [user?.username])

  const getColorClasses = (color: string, unlocked: boolean) => {
    if (!unlocked) return "bg-secondary/50 text-muted-foreground"
    switch (color) {
      case "cyan": return "bg-cyan/20 text-cyan"
      case "gold": return "bg-gold/20 text-gold"
      case "purple": return "bg-purple/20 text-purple"
      case "orange": return "bg-orange/20 text-orange"
      default: return "bg-secondary/50 text-muted-foreground"
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="bg-card border border-border/50 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan to-purple p-0.5 overflow-hidden">
                <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-2xl font-bold text-cyan overflow-hidden">
                  {user?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    "LL"
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{user?.username ?? user?.email ?? "未登录用户"}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Star className="w-4 h-4 text-gold fill-gold" />
                  <span className="text-gold font-medium">Lv.24</span>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-muted-foreground text-sm">城市探索者</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                <Share2 className="w-4 h-4 text-muted-foreground" />
              </button>
              <button className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                <Settings className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground">用户名</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full h-10 rounded-lg border border-border bg-background/60 px-3 text-sm outline-none focus:border-cyan"
                placeholder="请输入用户名"
                minLength={2}
                maxLength={20}
              />
            </div>
            <div className="flex flex-col justify-end gap-2">
              <button
                disabled={saving}
                onClick={async () => {
                  if (!token) return
                  setSaving(true)
                  try {
                    const res = await fetch("/api/users/me", {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ username }),
                    })
                    const json = await res.json()
                    if (!res.ok || json.code !== 0) throw new Error(json?.message || "保存失败")
                    updateUser({ username: json.data.username })
                  } finally {
                    setSaving(false)
                  }
                }}
                className="h-10 rounded-lg bg-gradient-to-r from-cyan to-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
              >
                {saving ? "保存中..." : "保存用户名"}
              </button>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file || !token) return
                  
                  // 验证文件大小
                  if (file.size > 2 * 1024 * 1024) {
                    alert('图片过大，最大支持2MB')
                    return
                  }
                  
                  // 验证文件类型
                  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
                  if (!allowedTypes.includes(file.type)) {
                    alert('只支持JPEG、PNG、WebP、GIF格式的图片')
                    return
                  }
                  
                  setUploading(true)
                  try {
                    const form = new FormData()
                    form.append("file", file)
                    const res = await fetch("/api/users/me/avatar", {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}` },
                      body: form,
                    })
                    
                    const json = await res.json()
                    if (!res.ok || json.code !== 0) {
                      throw new Error(json.message || '上传失败')
                    }
                    
                    updateUser({ avatarUrl: json.data.avatarUrl })
                    alert('头像上传成功')
                  } catch (error) {
                    console.error('上传头像失败:', error)
                    alert('上传失败，请稍后重试')
                  } finally {
                    setUploading(false)
                  }
                }}
              />

              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="h-10 rounded-lg border border-border bg-secondary/40 text-sm hover:bg-secondary/70 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                <span>{uploading ? '上传中...' : '上传头像'}</span>
              </button>
            </div>
          </div>

          {/* EXP Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">经验值</span>
              <span className="text-cyan font-medium">2,450 / 3,000</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan to-primary rounded-full"
                style={{ width: "82%" }}
              />
            </div>
            <p className="text-xs text-muted-foreground">还需 550 经验升到 Lv.25</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div 
              key={stat.label}
              className="bg-card border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-colors"
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center mb-2",
                stat.color === "cyan" && "bg-cyan/20 text-cyan",
                stat.color === "gold" && "bg-gold/20 text-gold",
                stat.color === "purple" && "bg-purple/20 text-purple",
                stat.color === "orange" && "bg-orange/20 text-orange"
              )}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-foreground">{stat.value}</span>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Achievements */}
        <div className="bg-card border border-border/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">成就墙</h3>
            <span className="text-xs text-muted-foreground">
              {achievements.filter(a => a.unlocked).length}/{achievements.length} 已解锁
            </span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id}
                className={cn(
                  "relative aspect-square rounded-xl border flex flex-col items-center justify-center p-2 transition-all group cursor-pointer",
                  achievement.unlocked 
                    ? "border-border/50 hover:border-primary/50"
                    : "border-border/30 opacity-60"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center mb-1",
                  getColorClasses(achievement.color, achievement.unlocked)
                )}>
                  {achievement.unlocked ? (
                    <achievement.icon className="w-5 h-5" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium text-center leading-tight",
                  achievement.unlocked ? "text-foreground" : "text-muted-foreground"
                )}>
                  {achievement.name}
                </span>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border border-border rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {achievement.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
          {[
            { label: "我的地标", icon: MapPin, color: "text-cyan", action: async () => {
              if (!token) return alert('请先登录');
              try {
                const res = await fetch('/api/users/me/landmarks', {
                  headers: { Authorization: `Bearer ${token}` }
                });
                const json = await res.json();
                if (json.code === 0) {
                  console.log('我的地标:', json.data);
                  alert(`获取到 ${json.data.length} 个地标`);
                } else {
                  alert(json.message || '获取失败');
                }
              } catch (error) {
                console.error('获取我的地标失败:', error);
                alert('获取失败，请稍后重试');
              }
            }},
            { label: "漂流瓶历史", icon: Compass, color: "text-purple", action: async () => {
              if (!token) return alert('请先登录');
              try {
                const res = await fetch('/api/users/me/bottles', {
                  headers: { Authorization: `Bearer ${token}` }
                });
                const json = await res.json();
                if (json.code === 0) {
                  console.log('漂流瓶历史:', json.data);
                  alert(`获取到 ${json.data.length} 个漂流瓶`);
                } else {
                  alert(json.message || '获取失败');
                }
              } catch (error) {
                console.error('获取漂流瓶历史失败:', error);
                alert('获取失败，请稍后重试');
              }
            }},
            { label: "好友列表", icon: User, color: "text-gold", action: async () => {
              if (!token) return alert('请先登录');
              try {
                const res = await fetch('/api/users/me/friends', {
                  headers: { Authorization: `Bearer ${token}` }
                });
                const json = await res.json();
                if (json.code === 0) {
                  console.log('好友列表:', json.data);
                  alert(`获取到 ${json.data.length} 个好友`);
                } else {
                  alert(json.message || '获取失败');
                }
              } catch (error) {
                console.error('获取好友列表失败:', error);
                alert('获取失败，请稍后重试');
              }
            }},
            { label: "编辑资料", icon: Edit2, color: "text-muted-foreground", action: () => {
              alert('编辑资料功能开发中...');
            }},
            { label: "设置", icon: Settings, color: "text-muted-foreground", action: () => {
              alert('设置功能开发中...');
            }},
          ].map((item, index) => (
            <button
              key={item.label}
              className={cn(
                "w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors",
                index !== 0 && "border-t border-border/50"
              )}
              onClick={item.action}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn("w-5 h-5", item.color)} />
                <span className="text-foreground">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
          <button
            onClick={logout}
            className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors border-t border-border/50"
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-orange" />
              <span className="text-orange">退出登录</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  )
}
