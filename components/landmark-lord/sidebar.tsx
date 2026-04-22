"use client"

import { MapPin, Flame, Star } from "lucide-react"
import { TaskCard } from "./task-card"
import { useApp } from "./app-context"

const mockTasks = [
  {
    id: 1,
    title: "探索历史遗迹",
    progress: 66,
    reward: "150 经验",
    status: "active" as const,
  },
  {
    id: 2,
    title: "签到连续7天",
    progress: 85,
    reward: "皇冠徽章",
    status: "active" as const,
  },
  {
    id: 3,
    title: "投递漂流瓶",
    progress: 100,
    reward: "50 经验",
    status: "completed" as const,
  },
]

export function Sidebar() {
  const { setCurrentPage, user } = useApp()

  return (
    <aside className="w-72 border-r border-border bg-sidebar/50 backdrop-blur-sm flex flex-col shrink-0 overflow-hidden">
      {/* User Profile Card */}
      <div className="p-4 border-b border-border">
        <div className="bg-gradient-to-br from-card to-secondary/30 rounded-xl p-4 border border-border/50 shadow-[0_0_20px_rgba(0,200,255,0.05)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan to-purple p-0.5 overflow-hidden">
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-lg font-bold text-cyan overflow-hidden">
                {user?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  "LL"
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{user?.username ?? "Explorer_Alex"}</h3>
              <div className="flex items-center gap-1 text-gold text-sm">
                <Star className="w-3.5 h-3.5 fill-gold" />
                <span>等级 24</span>
              </div>
            </div>
          </div>
          
          {/* EXP Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">经验值</span>
              <span className="text-cyan">2,450 / 3,000</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan to-primary rounded-full transition-all duration-500"
                style={{ width: "82%" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-b border-border">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">快速统计</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-secondary/50 rounded-lg p-3 border border-border/50">
            <div className="flex items-center gap-2 text-cyan mb-1">
              <MapPin className="w-4 h-4" />
              <span className="text-xs text-muted-foreground">打卡次数</span>
            </div>
            <span className="text-xl font-bold text-foreground">156</span>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 border border-border/50">
            <div className="flex items-center gap-2 text-gold mb-1">
              <Flame className="w-4 h-4" />
              <span className="text-xs text-muted-foreground">影响力</span>
            </div>
            <span className="text-xl font-bold text-foreground">2.4K</span>
          </div>
        </div>
      </div>

      {/* Task Preview */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">进行中任务</h4>
          <button 
            onClick={() => setCurrentPage("tasks")}
            className="text-xs text-cyan hover:underline"
          >
            查看全部
          </button>
        </div>
        <div className="space-y-3">
          {mockTasks.map((task) => (
            <TaskCard key={task.id} {...task} compact />
          ))}
        </div>
      </div>
    </aside>
  )
}
