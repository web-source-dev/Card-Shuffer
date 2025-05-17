import type { Metadata } from 'next'
import './globals.css'
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
          
      
          {children}
        </div>
      </body>
    </html>
  )
}
