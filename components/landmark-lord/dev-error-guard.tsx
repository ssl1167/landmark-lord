"use client"

import { useEffect } from "react"

/**
 * Ignore noisy unhandled promise rejections from browser extensions in dev.
 * These often surface as `reason === null` and break the Next.js error overlay.
 */
export function DevErrorGuard() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason == null) {
        event.preventDefault()
      }
    }

    window.addEventListener("unhandledrejection", onUnhandledRejection)
    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection)
    }
  }, [])

  return null
}
