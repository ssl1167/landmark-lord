"use client"

import { Crown, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface RankingItem {
  rank: number
  name: string
  score: number
  isCurrentUser?: boolean
  isFriend?: boolean
}

const mockRankings: RankingItem[] = [
  { rank: 1, name: "TechNomad", score: 12450 },
  { rank: 2, name: "CityExplorer", score: 11200 },
  { rank: 3, name: "HistoryBuff", score: 9800 },
  { rank: 4, name: "Explorer_Alex", score: 8650, isCurrentUser: true },
  { rank: 5, name: "SeaLover", score: 7200, isFriend: true },
  { rank: 6, name: "SunsetChaser", score: 6800, isFriend: true },
  { rank: 7, name: "Pilgrim42", score: 5400 },
  { rank: 8, name: "CoffeeLover", score: 4200, isFriend: true },
]

export function RankingList() {
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return "text-gold"
      case 2: return "text-gray-400"
      case 3: return "text-orange"
      default: return "text-muted-foreground"
    }
  }

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1: return "bg-gold/20 border-gold/30"
      case 2: return "bg-gray-400/20 border-gray-400/30"
      case 3: return "bg-orange/20 border-orange/30"
      default: return "bg-secondary/50 border-border/50"
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">排行榜</h3>
        <span className="text-xs text-muted-foreground">此地标</span>
      </div>

      {mockRankings.map((item) => (
        <div
          key={item.rank}
          className={cn(
            "flex items-center gap-3 p-2 rounded-lg border transition-colors",
            item.isCurrentUser 
              ? "bg-cyan/10 border-cyan/30 ring-1 ring-cyan/20" 
              : getRankBg(item.rank),
            item.isFriend && !item.isCurrentUser && "border-purple/30"
          )}
        >
          {/* Rank */}
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
            item.rank <= 3 ? getRankColor(item.rank) : "text-muted-foreground"
          )}>
            {item.rank === 1 ? (
              <Crown className="w-4 h-4 fill-gold text-gold" />
            ) : (
              item.rank
            )}
          </div>

          {/* Avatar */}
          <div className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center",
            item.isCurrentUser 
              ? "bg-gradient-to-br from-cyan to-purple" 
              : item.isFriend 
                ? "bg-gradient-to-br from-purple to-cyan"
                : "bg-secondary"
          )}>
            <User className={cn(
              "w-3.5 h-3.5",
              item.isCurrentUser || item.isFriend ? "text-background" : "text-muted-foreground"
            )} />
          </div>

          {/* Name */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className={cn(
                "text-sm font-medium truncate",
                item.isCurrentUser ? "text-cyan" : "text-foreground"
              )}>
                {item.name}
              </span>
              {item.isCurrentUser && (
                <span className="text-[10px] px-1.5 py-0.5 bg-cyan/20 text-cyan rounded">你</span>
              )}
              {item.isFriend && !item.isCurrentUser && (
                <span className="text-[10px] px-1.5 py-0.5 bg-purple/20 text-purple rounded">好友</span>
              )}
            </div>
          </div>

          {/* Score */}
          <span className={cn(
            "text-sm font-semibold",
            item.rank === 1 ? "text-gold" : "text-muted-foreground"
          )}>
            {item.score.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}
