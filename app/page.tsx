"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { TopNav } from "@/components/landmark-lord/top-nav"
import { Sidebar } from "@/components/landmark-lord/sidebar"
import { MapPlaceholder } from "@/components/landmark-lord/map-placeholder"
import { LandmarkDetailPanel } from "@/components/landmark-lord/landmark-detail-panel"
import { TasksPage } from "@/components/landmark-lord/pages/tasks-page"
import { SocialPage } from "@/components/landmark-lord/pages/social-page"
import { BottlesPage } from "@/components/landmark-lord/pages/bottles-page"
import { RankingPage } from "@/components/landmark-lord/pages/ranking-page"
import { ProfilePage } from "@/components/landmark-lord/pages/profile-page"
import { MessagesPage } from "@/components/landmark-lord/pages/messages-page"
import { useApp } from "@/components/landmark-lord/app-context"
import { AuthPage } from "@/components/landmark-lord/auth-page"
import { cn } from "@/lib/utils"

export default function LandmarkLordApp() {
  const { currentPage, selectedLandmark, setSelectedLandmark, user, isAuthReady } = useApp()

  const handleSelectLandmark = (id: string | null) => {
    setSelectedLandmark(id);
  }
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)

  const renderPageContent = () => {
    switch (currentPage) {
      case "home":
        return (
          <>
            {/* Left Panel with Collapse */}
            <div className={cn(
              "relative transition-all duration-300 ease-in-out",
              leftPanelCollapsed ? "w-0" : "w-72"
            )}>
              <div className={cn(
                "absolute inset-0 overflow-hidden transition-opacity duration-300",
                leftPanelCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
              )}>
                <Sidebar />
              </div>
              {/* Left Collapse Toggle */}
              <button
                onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 z-20 w-6 h-12 bg-card border border-border rounded-r-lg flex items-center justify-center hover:bg-secondary transition-all duration-300 shadow-lg",
                  leftPanelCollapsed ? "left-0" : "-right-6"
                )}
                title={leftPanelCollapsed ? "展开左侧面板" : "收起左侧面板"}
              >
                {leftPanelCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>

            {/* Map - Expands to fill available space */}
            <div className="flex-1 relative h-full">
              <MapPlaceholder
                onSelectLandmark={handleSelectLandmark}
                selectedLandmark={selectedLandmark}
              />
            </div>

            {/* Right Panel with Collapse */}
            <div className={cn(
              "relative transition-all duration-300 ease-in-out",
              rightPanelCollapsed ? "w-0" : "w-80"
            )}>
              <div className={cn(
                "absolute inset-0 overflow-hidden transition-opacity duration-300",
                rightPanelCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
              )}>
                <LandmarkDetailPanel selectedLandmark={selectedLandmark} />
              </div>
              {/* Right Collapse Toggle */}
              <button
                onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 z-20 w-6 h-12 bg-card border border-border rounded-l-lg flex items-center justify-center hover:bg-secondary transition-all duration-300 shadow-lg",
                  rightPanelCollapsed ? "right-0" : "-left-6"
                )}
                title={rightPanelCollapsed ? "展开右侧面板" : "收起右侧面板"}
              >
                {rightPanelCollapsed ? (
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </>
        )
      case "tasks":
        return <TasksPage />
      case "social":
        return <SocialPage />
      case "bottles":
        return <BottlesPage />
      case "ranking":
        return <RankingPage />
      case "profile":
        return <ProfilePage />
      case "messages":
        return <MessagesPage />
      default:
        return (
          <>
            {/* Left Panel with Collapse */}
            <div className={cn(
              "relative transition-all duration-300 ease-in-out",
              leftPanelCollapsed ? "w-0" : "w-72"
            )}>
              <div className={cn(
                "absolute inset-0 overflow-hidden transition-opacity duration-300",
                leftPanelCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
              )}>
                <Sidebar />
              </div>
              <button
                onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 z-20 w-6 h-12 bg-card border border-border rounded-r-lg flex items-center justify-center hover:bg-secondary transition-all duration-300 shadow-lg",
                  leftPanelCollapsed ? "left-0" : "-right-6"
                )}
                title={leftPanelCollapsed ? "展开左侧面板" : "收起左侧面板"}
              >
                {leftPanelCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>

            <div className="flex-1 relative h-full">
              <MapPlaceholder
                onSelectLandmark={handleSelectLandmark}
                selectedLandmark={selectedLandmark}
              />
            </div>

            <div className={cn(
              "relative transition-all duration-300 ease-in-out",
              rightPanelCollapsed ? "w-0" : "w-80"
            )}>
              <div className={cn(
                "absolute inset-0 overflow-hidden transition-opacity duration-300",
                rightPanelCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
              )}>
                <LandmarkDetailPanel selectedLandmark={selectedLandmark} />
              </div>
              <button
                onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 z-20 w-6 h-12 bg-card border border-border rounded-l-lg flex items-center justify-center hover:bg-secondary transition-all duration-300 shadow-lg",
                  rightPanelCollapsed ? "right-0" : "-left-6"
                )}
                title={rightPanelCollapsed ? "展开右侧面板" : "收起右侧面板"}
              >
                {rightPanelCollapsed ? (
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </>
        )
    }
  }

  if (!isAuthReady) {
    return <div className="h-screen w-screen bg-background" />
  }

  if (!user) {
    return <AuthPage />
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <TopNav />
      <div className="flex-1 flex overflow-hidden">
        {renderPageContent()}
      </div>
    </div>
  )
}
