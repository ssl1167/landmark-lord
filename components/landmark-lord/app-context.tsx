"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

export type PageType = "home" | "tasks" | "social" | "bottles" | "ranking" | "profile" | "messages"

export interface AppUser {
  id: string
  email: string
  username: string
  avatarUrl?: string | null
  role: string
}

interface AppContextType {
  currentPage: PageType
  setCurrentPage: (page: PageType) => void
  selectedLandmark: string | null
  setSelectedLandmark: (id: string | null) => void
  showNotifications: boolean
  setShowNotifications: (show: boolean) => void
  user: AppUser | null
  token: string | null
  isAuthReady: boolean
  login: (payload: { user: AppUser; token: string }) => void
  updateUser: (patch: Partial<AppUser>) => void
  logout: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<PageType>("home")
  const [selectedLandmark, setSelectedLandmark] = useState<string | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [user, setUser] = useState<AppUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isAuthReady, setIsAuthReady] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("landmark_lord_auth")
      if (raw) {
        const parsed = JSON.parse(raw) as { user?: AppUser; token?: string }
        if (parsed?.user && parsed?.token) {
          setUser(parsed.user)
          setToken(parsed.token)
        }
      }
    } catch {
      // ignore invalid local cache
    } finally {
      setIsAuthReady(true)
    }
  }, [])

  const login = ({ user: nextUser, token: nextToken }: { user: AppUser; token: string }) => {
    setUser(nextUser)
    setToken(nextToken)
    localStorage.setItem("landmark_lord_auth", JSON.stringify({ user: nextUser, token: nextToken }))
  }

  const updateUser = (patch: Partial<AppUser>) => {
    setUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...patch }
      localStorage.setItem("landmark_lord_auth", JSON.stringify({ user: next, token }))
      return next
    })
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("landmark_lord_auth")
    setCurrentPage("home")
    setSelectedLandmark(null)
    setShowNotifications(false)
  }

  const value = useMemo(
    () => ({
      currentPage,
      setCurrentPage,
      selectedLandmark,
      setSelectedLandmark,
      showNotifications,
      setShowNotifications,
      user,
      token,
      isAuthReady,
      login,
      updateUser,
      logout,
    }),
    [currentPage, selectedLandmark, showNotifications, user, token, isAuthReady]
  )

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
