"use client"

import { useState, useEffect } from "react"
import { Sparkles, Volume2, RefreshCw, Globe } from "lucide-react"

declare global {
  interface Window {
    marked?: {
      parse: (text: string) => string
    }
  }
}

interface AIDescriptionPanelProps {
  landmarkId: string
  landmarkName: string
}

export function AIDescriptionPanel({ landmarkId, landmarkName }: AIDescriptionPanelProps) {
  const [language, setLanguage] = useState<"en" | "cn">('cn')
  const [isLoading, setIsLoading] = useState(true)
  const [description, setDescription] = useState<string | null>(null)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js'
    script.async = true
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
  }, [])

  // 组件加载时自动获取AI解说
  useEffect(() => {
    const fetchDescription = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/landmarks/${landmarkId}/ai-intro?lang=${language}`)
        const json = await res.json()
        setDescription(json?.data?.introText ?? null)
      } catch (error) {
        console.error('获取AI解说失败:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchDescription()
  }, [landmarkId, language])

  const renderMarkdown = (text: string) => {
    if (typeof window !== 'undefined' && window.marked) {
      // 配置marked库，添加自定义样式
      if (!window.marked.getOptions) {
        // 简单的Markdown解析作为 fallback
        return { 
          __html: text
            .replace(/\n/g, '<br/>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold mt-4 mb-2">$1</h1>')
            .replace(/^## (.*$)/gim, '<h2 class="text-md font-bold mt-3 mb-1">$1</h2>')
            .replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold mt-2 mb-1">$1</h3>')
            .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" class="text-cyan hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
            .replace(/`([^`]+)`/g, '<code class="bg-secondary px-1 py-0.5 rounded text-xs">$1</code>')
        }
      }
      return { __html: window.marked.parse(text) }
    }
    // 服务器端渲染或marked未加载时的fallback
    return { 
      __html: text
        .replace(/\n/g, '<br/>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold mt-4 mb-2">$1</h1>')
        .replace(/^## (.*$)/gim, '<h2 class="text-md font-bold mt-3 mb-1">$1</h2>')
        .replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold mt-2 mb-1">$1</h3>')
        .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" class="text-cyan hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/`([^`]+)`/g, '<code class="bg-secondary px-1 py-0.5 rounded text-xs">$1</code>')
    }
  }

  const handleGenerate = async (nextLanguage = language) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/landmarks/${landmarkId}/ai-intro?lang=${nextLanguage}`)
      const json = await res.json()
      setDescription(json?.data?.introText ?? null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLanguageSwitch = async () => {
    const next = language === "en" ? "cn" : "en"
    setLanguage(next)
    if (description) {
      await handleGenerate(next)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan" />
          <span className="text-sm font-medium">AI解说 · {landmarkName}</span>
        </div>
        <button onClick={handleLanguageSwitch} className="flex items-center gap-1.5 px-2 py-1 bg-secondary rounded text-xs hover:bg-secondary/80 transition-colors">
          <Globe className="w-3 h-3" />
          {language === "en" ? "EN" : "中文"}
        </button>
      </div>

      {!description && !isLoading && (
        <button onClick={() => void handleGenerate()} className="w-full py-8 border-2 border-dashed border-border rounded-xl hover:border-cyan/50 hover:bg-cyan/5 transition-all flex flex-col items-center justify-center gap-2 group">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan/20 to-purple/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6 text-cyan" />
          </div>
          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">生成AI解说</span>
        </button>
      )}

      {isLoading && (
        <div className="py-8 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan/20 to-purple/20 flex items-center justify-center animate-pulse">
            <Sparkles className="w-6 h-6 text-cyan animate-spin" />
          </div>
          <div className="space-y-1 text-center">
            <p className="text-sm text-foreground">正在生成解说...</p>
            <p className="text-xs text-muted-foreground">AI正在创作独特故事</p>
          </div>
        </div>
      )}

      {description && !isLoading && (
        <div className="space-y-3">
          <div className="bg-secondary/30 border border-border/50 rounded-xl p-4 max-h-64 overflow-y-auto">
            <div
              className="text-sm text-foreground leading-relaxed ai-content"
              dangerouslySetInnerHTML={renderMarkdown(description)}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => void handleGenerate()} className="flex-1 flex items-center justify-center gap-2 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm transition-colors">
              <RefreshCw className="w-4 h-4" />
              重新生成
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm transition-colors">
              <Volume2 className="w-4 h-4 text-cyan" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}