import type { Metadata } from 'next'
import './globals.css'
import KeepAlive from "@/components/keep-alive"

export const metadata: Metadata = {
  title: 'Card Shuffler',
  description: 'A simple card shuffler application',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: 'transparent', background: 'transparent' }}>
        <div className="min-h-screen bg-transparent" style={{ backgroundColor: 'transparent' }}>
          {/* This invisible component keeps the backend alive */}
          <KeepAlive />
          
      
          {children}
        </div>
      </body>
    </html>
  )
}
