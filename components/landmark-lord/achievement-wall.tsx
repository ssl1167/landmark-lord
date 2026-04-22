"use client"

import { Trophy, MapPin, Flame, Crown, Star, Compass, Target, Zap, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

interface Achievement {
  id: string
  name: string
  description: string
  icon: typeof Trophy
  color: string
  unlocked: boolean
  progress?: number
  maxProgress?: number
}

const achievements: Achievement[] = [
  { id: "1", name: "First Steps", description: "Complete your first check-in", icon: MapPin, color: "cyan", unlocked: true },
  { id: "2", name: "Explorer", description: "Visit 10 landmarks", icon: Compass, color: "cyan", unlocked: true },
  { id: "3", name: "On Fire", description: "7-day check-in streak", icon: Flame, color: "orange", unlocked: true },
  { id: "4", name: "Guardian", description: "Become a landmark guardian", icon: Crown, color: "gold", unlocked: true },
  { id: "5", name: "Rising Star", description: "Reach Level 20", icon: Star, color: "gold", unlocked: true },
  { id: "6", name: "Sharpshooter", description: "Complete 50 tasks", icon: Target, color: "purple", unlocked: false, progress: 32, maxProgress: 50 },
  { id: "7", name: "Lightning", description: "Check-in within 10 seconds", icon: Zap, color: "cyan", unlocked: false },
  { id: "8", name: "Legend", description: "Reach Level 50", icon: Trophy, color: "gold", unlocked: false, progress: 24, maxProgress: 50 },
]

export function AchievementWall() {
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
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Achievements</h3>
        <span className="text-xs text-muted-foreground">
          {achievements.filter(a => a.unlocked).length}/{achievements.length} Unlocked
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {achievements.map((achievement) => (
          <div 
            key={achievement.id}
            className={cn(
              "relative aspect-square rounded-xl border flex flex-col items-center justify-center p-2 transition-all duration-200 group cursor-pointer",
              achievement.unlocked 
                ? "border-border/50 hover:border-primary/50 hover:shadow-[0_0_12px_rgba(0,200,255,0.1)]"
                : "border-border/30 opacity-60"
            )}
          >
            {/* Icon */}
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

            {/* Name */}
            <span className={cn(
              "text-[10px] font-medium text-center leading-tight",
              achievement.unlocked ? "text-foreground" : "text-muted-foreground"
            )}>
              {achievement.name}
            </span>

            {/* Progress indicator for locked with progress */}
            {!achievement.unlocked && achievement.progress !== undefined && (
              <div className="absolute bottom-1 left-1 right-1">
                <div className="h-0.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-muted-foreground rounded-full"
                    style={{ width: `${(achievement.progress / (achievement.maxProgress || 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border border-border rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {achievement.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
