import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/landmark-lord/theme-provider'
import { AppProvider } from '@/components/landmark-lord/app-context'
import { DevErrorGuard } from '@/components/landmark-lord/dev-error-guard'
import './globals.css'

export const metadata: Metadata = {
  title: '地标领主 - 城市探索游戏',
  description: '基于地理位置的城市探索与游戏化社交平台',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  }
}

export const viewport: Viewport = {
  themeColor: '#0a1628',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&display=swap" />
      </head>
      <body className="font-sans antialiased bg-background text-foreground overflow-hidden">
        <ThemeProvider>
          <AppProvider>
            <DevErrorGuard />
            {children}
          </AppProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
