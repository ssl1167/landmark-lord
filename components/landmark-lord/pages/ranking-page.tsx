"use client"

import { useState } from "react"
import { Crown, User, Trophy, MapPin, Flame, Users } from "lucide-react"
import { cn } from "@/lib/utils"

type RankingType = "global" | "landmark" | "friends"

interface RankingUser {
  rank: number
  name: string
  score: number
  level: number
  isCurrentUser?: boolean
  isFriend?: boolean
  avatar?: string
  change?: number
}

const globalRankings: RankingUser[] = [
  { rank: 1, name: "TechNomad", score: 125600, level: 45 },
  { rank: 2, name: "CityExplorer", score: 118200, level: 42 },
  { rank: 3, name: "HistoryBuff", score: 98500, level: 38 },
  { rank: 4, name: "Explorer_Alex", score: 86500, level: 24, isCurrentUser: true, change: 2 },
  { rank: 5, name: "SeaLover", score: 72800, level: 31, isFriend: true },
  { rank: 6, name: "SunsetChaser", score: 68200, level: 28, isFriend: true },
  { rank: 7, name: "Pilgrim42", score: 54600, level: 26 },
  { rank: 8, name: "CoffeeLover", score: 42800, level: 22, isFriend: true },
  { rank: 9, name: "NightOwl", score: 38500, level: 20 },
  { rank: 10, name: "SecretFinder", score: 35200, level: 19 },
]

const landmarkRankings: RankingUser[] = [
  { rank: 1, name: "Explorer_Alex", score: 2450, level: 24, isCurrentUser: true },
  { rank: 2, name: "TechNomad", score: 2100, level: 45 },
  { rank: 3, name: "CityExplorer", score: 1850, level: 42 },
  { rank: 4, name: "SeaLover", score: 1200, level: 31, isFriend: true },
  { rank: 5, name: "HistoryBuff", score: 980, level: 38 },
]

const friendsRankings: RankingUser[] = [
  { rank: 1, name: "SeaLover", score: 72800, level: 31, isFriend: true },
  { rank: 2, name: "SunsetChaser", score: 68200, level: 28, isFriend: true },
  { rank: 3, name: "Explorer_Alex", score: 86500, level: 24, isCurrentUser: true },
  { rank: 4, name: "CoffeeLover", score: 42800, level: 22, isFriend: true },
]

export function RankingPage() {
  const [type, setType] = useState<RankingType>("global")

  const rankings = type === "global" 
    ? globalRankings 
    : type === "landmark" 
      ? landmarkRankings 
      : friendsRankings

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return { color: "text-gold bg-gold/20 border-gold/30", icon: Crown }
      case 2: return { color: "text-gray-400 bg-gray-400/20 border-gray-400/30", icon: null }
      case 3: return { color: "text-orange bg-orange/20 border-orange/30", icon: null }
      default: return { color: "text-muted-foreground bg-secondary border-border/50", icon: null }
    }
  }

  // Find current user for stats
  const currentUser = rankings.find(u => u.isCurrentUser)

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">排行榜</h1>
          <p className="text-muted-foreground mt-1">与其他探索者一较高下</p>
        </div>

        {/* Your Stats */}
        {currentUser && (
          <div className="bg-gradient-to-r from-cyan/20 to-purple/20 border border-cyan/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan to-purple p-0.5">
                  <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-lg font-bold text-cyan">
                    你
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">{currentUser.name}</h3>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gold">Lv.{currentUser.level}</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-muted-foreground">{currentUser.score.toLocaleString()} 积分</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-cyan">#{currentUser.rank}</div>
                {currentUser.change !== undefined && currentUser.change > 0 && (
                  <div className="flex items-center gap-1 text-success text-sm">
                    <Flame className="w-3 h-3" />
                    <span>上升 {currentUser.change} 名</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Type Tabs */}
        <div className="flex items-center gap-2 p-1 bg-secondary rounded-xl">
          {[
            { id: "global", label: "全球榜", icon: Trophy },
            { id: "landmark", label: "地标榜", icon: MapPin },
            { id: "friends", label: "好友榜", icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setType(tab.id as RankingType)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
                type === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Rankings List */}
        <div className="space-y-2">
          {rankings.map((user) => {
            const badge = getRankBadge(user.rank)
            return (
              <div
                key={user.rank}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border transition-colors",
                  user.isCurrentUser 
                    ? "bg-cyan/10 border-cyan/30" 
                    : user.rank <= 3 
                      ? badge.color
                      : "bg-card border-border/50 hover:border-primary/30"
                )}
              >
                {/* Rank */}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                  user.rank <= 3 ? badge.color : "bg-secondary text-muted-foreground"
                )}>
                  {user.rank === 1 && badge.icon ? (
                    <Crown className="w-5 h-5 fill-current" />
                  ) : (
                    user.rank
                  )}
                </div>

                {/* Avatar */}
                <div className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center",
                  user.isCurrentUser 
                    ? "bg-gradient-to-br from-cyan to-purple" 
                    : user.isFriend 
                      ? "bg-gradient-to-br from-purple to-cyan"
                      : "bg-secondary"
                )}>
                  <User className={cn(
                    "w-5 h-5",
                    user.isCurrentUser || user.isFriend ? "text-background" : "text-muted-foreground"
                  )} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-semibold truncate",
                      user.isCurrentUser ? "text-cyan" : "text-foreground"
                    )}>
                      {user.name}
                    </span>
                    {user.isCurrentUser && (
                      <span className="text-xs px-1.5 py-0.5 bg-cyan/20 text-cyan rounded">你</span>
                    )}
                    {user.isFriend && !user.isCurrentUser && (
                      <span className="text-xs px-1.5 py-0.5 bg-purple/20 text-purple rounded">好友</span>
                    )}
                  </div>
                  <span className="text-xs text-gold">Lv.{user.level}</span>
                </div>

                {/* Score */}
                <div className="text-right">
                  <span className={cn(
                    "font-bold",
                    user.rank === 1 ? "text-gold" : "text-foreground"
                  )}>
                    {user.score.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">积分</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
