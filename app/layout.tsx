"use client"

import './globals.css'
import KeepAlive from "@/components/keep-alive"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ backgroundColor: 'transparent', background: 'transparent' }}>
        <div className="min-h-screen bg-transparent" style={{ backgroundColor: 'transparent' }}>
          {/* This invisible component keeps the backend alive */}
          <KeepAlive />
          
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </div>
      </body>
    </html>
  )
}
