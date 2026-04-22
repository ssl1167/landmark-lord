"use client"

import { Heart, MessageSquare, Trophy, TrendingUp, Bell, X, User, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: "like" | "comment" | "system" | "rank"
  title: string
  content: string
  time: string
  read: boolean
}

const mockNotifications: Notification[] = [
  { id: "1", type: "like", title: "收到点赞", content: "CityExplorer 赞了你的打卡动态", time: "2分钟前", read: false },
  { id: "2", type: "comment", title: "新评论", content: "TechNomad 评论了你的漂流瓶", time: "15分钟前", read: false },
  { id: "3", type: "rank", title: "排名上升", content: "你在「中央车站」的排名上升至第3名", time: "1小时前", read: false },
  { id: "4", type: "system", title: "系统通知", content: "恭喜获得「探索先锋」成就", time: "2小时前", read: true },
  { id: "5", type: "like", title: "收到点赞", content: "SeaLover 赞了你的评论", time: "3小时前", read: true },
  { id: "6", type: "system", title: "每日任务", content: "你的每日签到任务即将过期", time: "5小时前", read: true },
]

interface NotificationPanelProps {
  onClose: () => void
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "like": return Heart
      case "comment": return MessageSquare
      case "system": return Bell
      case "rank": return TrendingUp
    }
  }

  const getIconColor = (type: Notification["type"]) => {
    switch (type) {
      case "like": return "text-pink-400 bg-pink-400/20"
      case "comment": return "text-cyan bg-cyan/20"
      case "system": return "text-gold bg-gold/20"
      case "rank": return "text-success bg-success/20"
    }
  }

  const unreadCount = mockNotifications.filter(n => !n.read).length

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">消息通知</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-secondary transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Notification List */}
      <div className="max-h-96 overflow-y-auto">
        {mockNotifications.map((notification) => {
          const Icon = getIcon(notification.type)
          return (
            <div
              key={notification.id}
              className={cn(
                "flex gap-3 p-4 border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer",
                !notification.read && "bg-primary/5"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                getIconColor(notification.type)
              )}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-foreground">{notification.title}</span>
                  {!notification.read && (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{notification.content}</p>
                <span className="text-[10px] text-muted-foreground mt-1">{notification.time}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border bg-secondary/30">
        <button className="w-full text-center text-xs text-primary hover:underline">
          查看全部通知
        </button>
      </div>
    </div>
  )
}
