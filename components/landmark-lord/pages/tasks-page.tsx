"use client"

import { CheckCircle2, Clock, Gift, Target, Flame, Star, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

interface Task {
  id: number
  title: string
  description: string
  progress: number
  maxProgress: number
  reward: string
  rewardType: "exp" | "badge" | "item"
  category: "daily" | "weekly" | "achievement"
  status: "active" | "completed"
}

const mockTasks: Task[] = [
  { id: 1, title: "探索历史遗迹", description: "访问3个历史类地标", progress: 2, maxProgress: 3, reward: "150 经验", rewardType: "exp", category: "daily", status: "active" },
  { id: 2, title: "签到连续7天", description: "保持连续签到记录", progress: 5, maxProgress: 7, reward: "皇冠徽章", rewardType: "badge", category: "weekly", status: "active" },
  { id: 3, title: "投递漂流瓶", description: "在地标留下5个漂流瓶", progress: 5, maxProgress: 5, reward: "50 经验", rewardType: "exp", category: "daily", status: "completed" },
  { id: 4, title: "社交蝴蝶", description: "获得10个点赞", progress: 8, maxProgress: 10, reward: "100 经验", rewardType: "exp", category: "daily", status: "active" },
  { id: 5, title: "地标守护者", description: "成为3个地标的守护者", progress: 1, maxProgress: 3, reward: "守护者之星", rewardType: "badge", category: "achievement", status: "active" },
  { id: 6, title: "探索新区域", description: "访问5个未探索的地标", progress: 3, maxProgress: 5, reward: "200 经验", rewardType: "exp", category: "weekly", status: "active" },
]

export function TasksPage() {
  const getCategoryIcon = (category: Task["category"]) => {
    switch (category) {
      case "daily": return Clock
      case "weekly": return Target
      case "achievement": return Trophy
    }
  }

  const getCategoryLabel = (category: Task["category"]) => {
    switch (category) {
      case "daily": return "每日任务"
      case "weekly": return "每周任务"
      case "achievement": return "成就任务"
    }
  }

  const getCategoryColor = (category: Task["category"]) => {
    switch (category) {
      case "daily": return "text-cyan bg-cyan/20"
      case "weekly": return "text-purple bg-purple/20"
      case "achievement": return "text-gold bg-gold/20"
    }
  }

  const dailyTasks = mockTasks.filter(t => t.category === "daily")
  const weeklyTasks = mockTasks.filter(t => t.category === "weekly")
  const achievementTasks = mockTasks.filter(t => t.category === "achievement")

  const renderTaskCard = (task: Task) => {
    const isCompleted = task.status === "completed"
    const progressPercent = (task.progress / task.maxProgress) * 100
    const CategoryIcon = getCategoryIcon(task.category)

    return (
      <div 
        key={task.id}
        className={cn(
          "bg-card border border-border/50 rounded-xl p-4 transition-all duration-200",
          "hover:border-primary/50 hover:shadow-[0_0_16px_rgba(0,200,255,0.1)]",
          isCompleted && "opacity-60"
        )}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={cn(
                "font-semibold text-foreground",
                isCompleted && "line-through"
              )}>
                {task.title}
              </h3>
              {isCompleted && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
            </div>
            <p className="text-sm text-muted-foreground">{task.description}</p>
          </div>
          <div className={cn(
            "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
            getCategoryColor(task.category)
          )}>
            <CategoryIcon className="w-3 h-3" />
            <span>{getCategoryLabel(task.category)}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">进度</span>
            <span className="text-foreground font-medium">{task.progress}/{task.maxProgress}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isCompleted 
                  ? "bg-success" 
                  : "bg-gradient-to-r from-cyan to-primary"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Reward */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-gold" />
            <span className="text-sm text-gold font-medium">{task.reward}</span>
          </div>
          {isCompleted ? (
            <button className="px-3 py-1.5 bg-success/20 text-success rounded-lg text-xs font-medium">
              已领取
            </button>
          ) : progressPercent >= 100 ? (
            <button className="px-3 py-1.5 bg-gold text-background rounded-lg text-xs font-medium hover:bg-gold/90 transition-colors">
              领取奖励
            </button>
          ) : (
            <button className="px-3 py-1.5 bg-secondary text-muted-foreground rounded-lg text-xs cursor-not-allowed">
              进行中
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">任务中心</h1>
            <p className="text-muted-foreground mt-1">完成任务获取丰厚奖励</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl">
            <Flame className="w-5 h-5 text-orange" />
            <span className="text-sm text-muted-foreground">连续签到:</span>
            <span className="font-bold text-orange">5天</span>
          </div>
        </div>

        {/* Daily Tasks */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-cyan" />
            <h2 className="text-lg font-semibold text-foreground">每日任务</h2>
            <span className="text-xs text-muted-foreground">({dailyTasks.filter(t => t.status === "completed").length}/{dailyTasks.length})</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {dailyTasks.map(renderTaskCard)}
          </div>
        </section>

        {/* Weekly Tasks */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-purple" />
            <h2 className="text-lg font-semibold text-foreground">每周任务</h2>
            <span className="text-xs text-muted-foreground">({weeklyTasks.filter(t => t.status === "completed").length}/{weeklyTasks.length})</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {weeklyTasks.map(renderTaskCard)}
          </div>
        </section>

        {/* Achievement Tasks */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-gold" />
            <h2 className="text-lg font-semibold text-foreground">成就任务</h2>
            <span className="text-xs text-muted-foreground">({achievementTasks.filter(t => t.status === "completed").length}/{achievementTasks.length})</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {achievementTasks.map(renderTaskCard)}
          </div>
        </section>
      </div>
    </div>
  )
}
