"use client"

import { useState } from "react"
import { Bell, Heart, MessageSquare, Trophy, TrendingUp, Check, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

type NotificationType = "all" | "like" | "comment" | "system"

interface Notification {
  id: string
  type: "like" | "comment" | "system" | "rank"
  title: string
  content: string
  time: string
  read: boolean
}

const mockNotifications: Notification[] = [
  { id: "1", type: "like", title: "收到点赞", content: "CityExplorer 赞了你在「中央车站」的打卡动态", time: "2分钟前", read: false },
  { id: "2", type: "comment", title: "新评论", content: "TechNomad 评论了你的漂流瓶: \"太棒了!下次一定去看看\"", time: "15分钟前", read: false },
  { id: "3", type: "rank", title: "排名上升", content: "你在「中央车站」的影响力排名上升至第3名", time: "1小时前", read: false },
  { id: "4", type: "system", title: "成就解锁", content: "恭喜获得「探索先锋」成就,奖励100经验值!", time: "2小时前", read: true },
  { id: "5", type: "like", title: "收到点赞", content: "SeaLover 赞了你的评论", time: "3小时前", read: true },
  { id: "6", type: "system", title: "任务提醒", content: "你的每日签到任务即将在2小时后过期", time: "5小时前", read: true },
  { id: "7", type: "comment", title: "新评论", content: "HistoryBuff 回复了你: \"谢谢分享!\"", time: "6小时前", read: true },
  { id: "8", type: "rank", title: "排名变化", content: "你在全球排行榜上升了5名,当前排名第156名", time: "1天前", read: true },
]

export function MessagesPage() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [filter, setFilter] = useState<NotificationType>("all")

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

  const filteredNotifications = filter === "all" 
    ? notifications 
    : notifications.filter(n => n.type === filter)

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">消息中心</h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount > 0 ? `${unreadCount} 条未读消息` : "暂无未读消息"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>全部已读</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 p-1 bg-secondary rounded-xl">
          {[
            { id: "all", label: "全部", count: notifications.length },
            { id: "like", label: "点赞", count: notifications.filter(n => n.type === "like").length },
            { id: "comment", label: "评论", count: notifications.filter(n => n.type === "comment").length },
            { id: "system", label: "系统", count: notifications.filter(n => n.type === "system" || n.type === "rank").length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as NotificationType)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all",
                filter === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>{tab.label}</span>
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                filter === tab.id ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-2">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">暂无消息</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const Icon = getIcon(notification.type)
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "flex gap-4 p-4 rounded-xl border transition-colors group",
                    notification.read 
                      ? "bg-card border-border/50 hover:border-primary/30" 
                      : "bg-primary/5 border-primary/30"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    getIconColor(notification.type)
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">{notification.title}</span>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.content}</p>
                    <span className="text-xs text-muted-foreground mt-1">{notification.time}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.read && (
                      <button 
                        onClick={() => markAsRead(notification.id)}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors"
                        title="标记已读"
                      >
                        <Check className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                    <button 
                      onClick={() => deleteNotification(notification.id)}
                      className="p-2 rounded-lg hover:bg-destructive/20 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
