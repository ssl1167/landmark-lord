"use client"

import { MapPin, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckinButtonProps {
  state: "too-far" | "available" | "completed"
  onCheckin?: () => void
}

export function CheckinButton({ state, onCheckin }: CheckinButtonProps) {
  return (
    <button
      onClick={() => state === "available" && onCheckin?.()}
      disabled={state !== "available"}
      className={cn(
        "w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2",
        state === "too-far" && "bg-secondary text-muted-foreground cursor-not-allowed",
        state === "available" && "bg-gradient-to-r from-cyan to-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(0,200,255,0.4)] hover:scale-[1.02] active:scale-[0.98]",
        state === "completed" && "bg-success/20 text-success border border-success/30 cursor-default"
      )}
    >
      {state === "too-far" && (
        <>
          <X className="w-4 h-4" />
          <span>距离太远无法打卡</span>
        </>
      )}
      {state === "available" && (
        <>
          <MapPin className="w-4 h-4" />
          <span>立即打卡</span>
        </>
      )}
      {state === "completed" && (
        <>
          <Check className="w-4 h-4" />
          <span>已打卡</span>
        </>
      )}
    </button>
  )
}
