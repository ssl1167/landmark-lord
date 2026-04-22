"use client"

import { useState } from "react"
import { Heart, MessageSquare, User, MapPin, Trophy, Wine } from "lucide-react"
import { cn } from "@/lib/utils"

interface Activity {
  id: string
  user: string
  action: "checkin" | "achievement" | "bottle" | "guardian"
  target?: string
  timestamp: string
  likes: number
  comments: number
}

const mockActivities: Activity[] = [
  { id: "1", user: "CityExplorer", action: "checkin", target: "中央车站", timestamp: "2分钟前", likes: 5, comments: 2 },
  { id: "2", user: "TechNomad", action: "achievement", target: "探索大师", timestamp: "15分钟前", likes: 24, comments: 8 },
  { id: "3", user: "SeaLover", action: "bottle", target: "海港观景台", timestamp: "32分钟前", likes: 12, comments: 4 },
  { id: "4", user: "HistoryBuff", action: "guardian", target: "城市博物馆", timestamp: "1小时前", likes: 45, comments: 12 },
  { id: "5", user: "SunsetChaser", action: "checkin", target: "胜利广场", timestamp: "2小时前", likes: 8, comments: 1 },
]

export function ActivityFeed() {
  const [activities, setActivities] = useState(mockActivities)

  const getActionIcon = (action: Activity["action"]) => {
    switch (action) {
      case "checkin": return MapPin
      case "achievement": return Trophy
      case "bottle": return Wine
      case "guardian": return Trophy
    }
  }

  const getActionText = (activity: Activity) => {
    switch (activity.action) {
      case "checkin": return `在「${activity.target}」打卡`
      case "achievement": return `获得成就「${activity.target}」`
      case "bottle": return `在「${activity.target}」投递漂流瓶`
      case "guardian": return `成为「${activity.target}」的守护者`
    }
  }

  const getActionColor = (action: Activity["action"]) => {
    switch (action) {
      case "checkin": return "text-cyan"
      case "achievement": return "text-gold"
      case "bottle": return "text-purple"
      case "guardian": return "text-gold"
    }
  }

  const handleLike = (id: string) => {
    setActivities(prev => prev.map(a => 
      a.id === id ? { ...a, likes: a.likes + 1 } : a
    ))
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const Icon = getActionIcon(activity.action)
        return (
          <div 
            key={activity.id}
            className="bg-card border border-border/50 rounded-lg p-3 hover:border-cyan/30 transition-colors"
          >
            <div className="flex gap-3">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan to-purple flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-background" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold text-foreground">{activity.user}</span>
                  <span className="text-muted-foreground"> {getActionText(activity)}</span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Icon className={cn("w-3 h-3", getActionColor(activity.action))} />
                  <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-2">
                  <button 
                    onClick={() => handleLike(activity.id)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-pink-400 transition-colors"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>{activity.likes}</span>
                  </button>
                  <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-cyan transition-colors">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{activity.comments}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
