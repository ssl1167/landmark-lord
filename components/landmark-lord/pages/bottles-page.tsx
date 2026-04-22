"use client"

import { useState } from "react"
import { Wine, Heart, MessageSquare, MapPin, User, Image as ImageIcon, Filter, Plus, Send } from "lucide-react"
import { cn } from "@/lib/utils"

interface Bottle {
  id: string
  author: string
  authorLevel: number
  location: string
  content: string
  hasImage: boolean
  likes: number
  comments: number
  liked: boolean
  timestamp: string
}

const mockBottles: Bottle[] = [
  { id: "1", author: "SunsetChaser", authorLevel: 24, location: "中央车站", content: "这里的建筑设计真的很有历史感,每一块砖都诉说着故事。推荐傍晚来,灯光亮起来的时候特别美!", hasImage: true, likes: 42, comments: 8, liked: true, timestamp: "10分钟前" },
  { id: "2", author: "CoffeeLover", authorLevel: 18, location: "城市博物馆", content: "旁边有家很棒的咖啡店,逛完博物馆可以去休息一下。他们的拿铁超好喝!", hasImage: false, likes: 28, comments: 5, liked: false, timestamp: "30分钟前" },
  { id: "3", author: "SecretFinder", authorLevel: 31, location: "海港观景台", content: "找到了一个隐藏的观景点!从主建筑后面的小路上去,视野更开阔,而且人少很多。", hasImage: true, likes: 56, comments: 12, liked: false, timestamp: "1小时前" },
  { id: "4", author: "HistoryBuff", authorLevel: 35, location: "胜利广场", content: "这里每到周末下午会有街头艺人表演,氛围很好。记得带点零钱支持他们!", hasImage: false, likes: 34, comments: 7, liked: true, timestamp: "2小时前" },
  { id: "5", author: "NightOwl", authorLevel: 22, location: "科技中心", content: "晚上来这里,建筑的灯光秀很壮观!每整点都会有一场,持续大约5分钟。", hasImage: true, likes: 67, comments: 15, liked: false, timestamp: "3小时前" },
]

export function BottlesPage() {
  const [bottles, setBottles] = useState(mockBottles)
  const [filter, setFilter] = useState<"all" | "mine" | "liked">("all")
  const [showCompose, setShowCompose] = useState(false)
  const [newBottle, setNewBottle] = useState("")

  const handleLike = (id: string) => {
    setBottles(prev => prev.map(b => 
      b.id === id 
        ? { ...b, liked: !b.liked, likes: b.liked ? b.likes - 1 : b.likes + 1 } 
        : b
    ))
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">漂流瓶</h1>
            <p className="text-muted-foreground mt-1">发现和分享地标的隐藏故事</p>
          </div>
          <button 
            onClick={() => setShowCompose(!showCompose)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple to-cyan text-background rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span>投递漂流瓶</span>
          </button>
        </div>

        {/* Compose */}
        {showCompose && (
          <div className="bg-card border border-purple/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-purple text-sm">
              <Wine className="w-4 h-4" />
              <span>写下你的发现</span>
            </div>
            <textarea
              value={newBottle}
              onChange={(e) => setNewBottle(e.target.value)}
              placeholder="分享这个地标的独特之处..."
              className="w-full h-24 px-3 py-2 bg-secondary border border-border/50 rounded-lg text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary"
            />
            <div className="flex items-center justify-between">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ImageIcon className="w-4 h-4" />
                <span>添加图片</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-purple text-background rounded-lg text-sm font-medium hover:bg-purple/90 transition-colors">
                <Send className="w-4 h-4" />
                <span>投递</span>
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {[
            { id: "all", label: "全部" },
            { id: "mine", label: "我的" },
            { id: "liked", label: "已赞" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id as typeof filter)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm transition-colors",
                filter === item.id
                  ? "bg-purple/20 text-purple"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Bottles Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {bottles.map((bottle) => (
            <div 
              key={bottle.id}
              className="bg-card border border-border/50 rounded-xl p-4 hover:border-purple/30 transition-colors"
            >
              {/* Author */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple to-cyan flex items-center justify-center">
                  <User className="w-4 h-4 text-background" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground text-sm">{bottle.author}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-purple/20 text-purple rounded">Lv.{bottle.authorLevel}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>{bottle.location}</span>
                    <span className="mx-1">·</span>
                    <span>{bottle.timestamp}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <p className="text-sm text-foreground leading-relaxed mb-3">{bottle.content}</p>

              {/* Image */}
              {bottle.hasImage && (
                <div className="relative h-32 rounded-lg bg-secondary/50 border border-border/50 mb-3 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple/10 to-cyan/10" />
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 pt-2 border-t border-border/50">
                <button 
                  onClick={() => handleLike(bottle.id)}
                  className={cn(
                    "flex items-center gap-1.5 text-sm transition-colors",
                    bottle.liked ? "text-pink-400" : "text-muted-foreground hover:text-pink-400"
                  )}
                >
                  <Heart className={cn("w-4 h-4", bottle.liked && "fill-current")} />
                  <span>{bottle.likes}</span>
                </button>
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-cyan transition-colors">
                  <MessageSquare className="w-4 h-4" />
                  <span>{bottle.comments}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
