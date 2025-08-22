import type React from "react"
import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { ThemeProvider } from "@/components/theme-provider"
import { ErrorBoundary } from "@/lib/error-boundary"
import { NotificationProvider } from "@/lib/notifications"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { HighlightInit } from "@/components/HighlightInit"
import "./globals.css"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#16a34a" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f0c" }
  ]
}

export const metadata: Metadata = {
  title: "AcaDance",
  description: "Modern Academic Management System with AI-powered features",
  generator: "v0.app",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AcaDance"
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/styles/login-3d.css" />
        <link rel="stylesheet" href="/styles/dashboard-3d.css" />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <HighlightInit />
        <ErrorBoundary>
          <AuthProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              <NotificationProvider>
                {children}
                <Toaster />
              </NotificationProvider>
            </ThemeProvider>
          </AuthProvider>
        </ErrorBoundary>
        
        {/* Enhanced 3D Effects Scripts */}
        <script src="/js/effects-3d.js" defer></script>
        <script src="/js/login-3d.js" defer></script>
        <script src="/init-animations.js" defer></script>
      </body>
    </html>
  )
}
