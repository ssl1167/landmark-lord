"use client"

import { useState } from "react"
import { Heart, MessageSquare, Share2, User, MapPin, Trophy, Wine, Image as ImageIcon, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

interface Post {
  id: string
  user: string
  userLevel: number
  action: "checkin" | "achievement" | "bottle" | "guardian"
  target: string
  content?: string
  image?: boolean
  timestamp: string
  likes: number
  comments: number
  liked: boolean
}

const mockPosts: Post[] = [
  { id: "1", user: "CityExplorer", userLevel: 28, action: "checkin", target: "中央车站", content: "今天天气真好,来打个卡", image: true, timestamp: "2分钟前", likes: 15, comments: 3, liked: false },
  { id: "2", user: "TechNomad", userLevel: 35, action: "achievement", target: "探索大师", timestamp: "15分钟前", likes: 42, comments: 8, liked: true },
  { id: "3", user: "SeaLover", userLevel: 22, action: "bottle", target: "海港观景台", content: "这里的日落真的很美,推荐下午6点来!", timestamp: "32分钟前", likes: 28, comments: 5, liked: false },
  { id: "4", user: "HistoryBuff", userLevel: 31, action: "guardian", target: "城市博物馆", timestamp: "1小时前", likes: 67, comments: 12, liked: true },
  { id: "5", user: "SunsetChaser", userLevel: 19, action: "checkin", target: "胜利广场", content: "第一次来这里,风景不错", timestamp: "2小时前", likes: 12, comments: 2, liked: false },
]

export function SocialPage() {
  const [posts, setPosts] = useState(mockPosts)

  const getActionIcon = (action: Post["action"]) => {
    switch (action) {
      case "checkin": return MapPin
      case "achievement": return Trophy
      case "bottle": return Wine
      case "guardian": return Trophy
    }
  }

  const getActionText = (post: Post) => {
    switch (post.action) {
      case "checkin": return `在「${post.target}」打卡`
      case "achievement": return `获得成就「${post.target}」`
      case "bottle": return `在「${post.target}」投递了漂流瓶`
      case "guardian": return `成为「${post.target}」的守护者`
    }
  }

  const getActionColor = (action: Post["action"]) => {
    switch (action) {
      case "checkin": return "text-cyan"
      case "achievement": return "text-gold"
      case "bottle": return "text-purple"
      case "guardian": return "text-gold"
    }
  }

  const handleLike = (id: string) => {
    setPosts(prev => prev.map(p => 
      p.id === id 
        ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } 
        : p
    ))
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">社交动态</h1>
          <p className="text-muted-foreground mt-1">查看好友的探索足迹</p>
        </div>

        {/* Feed */}
        <div className="space-y-4">
          {posts.map((post) => {
            const ActionIcon = getActionIcon(post.action)
            return (
              <div 
                key={post.id}
                className="bg-card border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan to-purple flex items-center justify-center">
                      <User className="w-5 h-5 text-background" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{post.user}</span>
                        <span className="text-xs px-1.5 py-0.5 bg-gold/20 text-gold rounded">Lv.{post.userLevel}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ActionIcon className={cn("w-3 h-3", getActionColor(post.action))} />
                        <span>{getActionText(post)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{post.timestamp}</span>
                    <button className="p-1 rounded-lg hover:bg-secondary transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                {post.content && (
                  <p className="text-sm text-foreground mb-3 leading-relaxed">{post.content}</p>
                )}

                {/* Image */}
                {post.image && (
                  <div className="relative h-48 rounded-lg bg-secondary/50 border border-border/50 mb-3 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan/10 to-purple/10" />
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-6 pt-2 border-t border-border/50">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className={cn(
                      "flex items-center gap-2 text-sm transition-colors",
                      post.liked ? "text-pink-400" : "text-muted-foreground hover:text-pink-400"
                    )}
                  >
                    <Heart className={cn("w-5 h-5", post.liked && "fill-current")} />
                    <span>{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan transition-colors">
                    <MessageSquare className="w-5 h-5" />
                    <span>{post.comments}</span>
                  </button>
                  <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors ml-auto">
                    <Share2 className="w-5 h-5" />
                    <span>分享</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
