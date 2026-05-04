"use client"

import { FormEvent, useState } from "react"
import { MapPin, LogIn, UserPlus } from "lucide-react"
import { useApp } from "./app-context"

type AuthMode = "login" | "register"

export function AuthPage() {
  const { login } = useApp()
  const [mode, setMode] = useState<AuthMode>("login")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const title = mode === "login" ? "登录地标领主" : "注册新账号"

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register"
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "login" ? { email, password } : { username, email, password }),
      })
      const raw = await res.text()
      const json = raw ? JSON.parse(raw) : null
      if (!res.ok || json?.code !== 0) {
        throw new Error(json?.message || "认证失败")
      }
      if (!json?.data?.user || !json?.data?.token) {
        throw new Error("认证接口返回格式异常")
      }
      login({ user: json.data.user, token: json.data.token })
    } catch (e) {
      setError(e instanceof Error ? e.message : "认证失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-background via-secondary/20 to-background flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/80 backdrop-blur-md p-6 space-y-5 shadow-[0_0_50px_rgba(0,200,255,0.08)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan to-purple flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">{title}</h1>
            <p className="text-xs text-muted-foreground">沿用当前系统风格的认证入口</p>
          </div>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          {mode === "register" && (
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="用户名（2-20 字）"
              className="w-full h-11 rounded-lg border border-border bg-background/60 px-3 text-sm outline-none focus:border-cyan"
              minLength={2}
              maxLength={20}
              required
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱"
            className="w-full h-11 rounded-lg border border-border bg-background/60 px-3 text-sm outline-none focus:border-cyan"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码（至少 6 位）"
            className="w-full h-11 rounded-lg border border-border bg-background/60 px-3 text-sm outline-none focus:border-cyan"
            minLength={6}
            required
          />

          {error && <div className="text-xs text-orange">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-gradient-to-r from-cyan to-primary text-primary-foreground font-medium text-sm disabled:opacity-60"
          >
            {loading ? "处理中..." : mode === "login" ? "登录" : "注册并登录"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="w-full h-10 rounded-lg border border-border bg-secondary/40 text-sm text-foreground hover:bg-secondary/70 transition-colors flex items-center justify-center gap-2"
        >
          {mode === "login" ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
          {mode === "login" ? "没有账号？去注册" : "已有账号？去登录"}
        </button>
      </div>
    </div>
  )
}
