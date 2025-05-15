import type { Metadata } from 'next'
import './globals.css'
import BackendStatus from "@/components/backend-status"
import KeepAlive from "@/components/keep-alive"

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          {/* This invisible component keeps the backend alive */}
          <KeepAlive />
          
          <div className="fixed bottom-4 right-4 z-50">
            <BackendStatus />
          </div>
          
          {children}
        </div>
      </body>
    </html>
  )
}
