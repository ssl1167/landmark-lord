"use client"

import { CheckCircle2, Clock, Gift } from "lucide-react"
import { cn } from "@/lib/utils"

interface TaskCardProps {
  id: number
  title: string
  progress: number
  reward: string
  status: "active" | "completed"
  compact?: boolean
}

export function TaskCard({ title, progress, reward, status, compact = false }: TaskCardProps) {
  const isCompleted = status === "completed"
  
  return (
    <div 
      className={cn(
        "rounded-lg border border-border/50 transition-all duration-200 hover:border-primary/50 hover:shadow-[0_0_12px_rgba(0,200,255,0.1)]",
        compact ? "bg-secondary/30 p-3" : "bg-card p-4",
        isCompleted && "opacity-75"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className={cn(
          "font-medium text-foreground leading-tight",
          compact ? "text-sm" : "text-base"
        )}>
          {title}
        </h3>
        {isCompleted ? (
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
        ) : (
          <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </div>
      
      {/* Progress bar */}
      <div className="mb-2">
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isCompleted 
                ? "bg-success" 
                : "bg-gradient-to-r from-cyan to-primary"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      {/* Reward */}
      <div className="flex items-center gap-1 text-xs">
        <Gift className="w-3 h-3 text-gold" />
        <span className="text-gold">{reward}</span>
      </div>
    </div>
  )
}
