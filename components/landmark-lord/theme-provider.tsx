"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type Theme = "dark" | "light"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark")
  const [mounted, setMounted] = useState(false)

  // Apply theme on mount and changes
  useEffect(() => {
    setMounted(true)
    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark")
  }

  // Prevent flash during hydration
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <div className="dark">{children}</div>
      </ThemeContext.Provider>
    )
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
