"use client"

import { Home, ListTodo, Users, Wine, Trophy, User, Bell, MapPin, Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "./theme-provider"
import { useApp, type PageType } from "./app-context"
import { NotificationPanel } from "./notification-panel"

const navItems: { icon: typeof Home; label: string; page: PageType }[] = [
  { icon: Home, label: "首页", page: "home" },
  { icon: ListTodo, label: "任务", page: "tasks" },
  { icon: Users, label: "社交", page: "social" },
  { icon: Wine, label: "漂流瓶", page: "bottles" },
  { icon: Trophy, label: "排行榜", page: "ranking" },
  { icon: User, label: "个人中心", page: "profile" },
]

export function TopNav() {
  const { theme, toggleTheme } = useTheme()
  const { currentPage, setCurrentPage, showNotifications, setShowNotifications, user } = useApp()

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-4 shrink-0 relative z-40">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-purple flex items-center justify-center">
          <MapPin className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold bg-gradient-to-r from-cyan to-purple bg-clip-text text-transparent">
          地标领主
        </span>
      </div>

      {/* Navigation */}
      <nav className="hidden md:flex items-center gap-1">
        {navItems.map((item) => (
          <button
            key={item.page}
            onClick={() => setCurrentPage(item.page)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              currentPage === item.page
                ? "bg-primary/20 text-primary shadow-[0_0_12px_rgba(0,200,255,0.3)]"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
          title={theme === "dark" ? "切换明亮模式" : "切换暗色模式"}
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5 text-gold" />
          ) : (
            <Moon className="w-5 h-5 text-primary" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-orange rounded-full" />
          </button>
          {showNotifications && (
            <NotificationPanel onClose={() => setShowNotifications(false)} />
          )}
        </div>

        {/* User Avatar */}
        <button 
          onClick={() => setCurrentPage("profile")}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan to-purple p-0.5"
        >
          <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-cyan" />
            )}
          </div>
        </button>
      </div>
    </header>
  )
}
