import './globals.css'
import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'SignalSafe - AI Intelligence Platform',
  description: 'Real-time misinformation and panic escalation detection',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-signal-black min-h-screen">
        <Navigation />
        {children}
      </body>
    </html>
  )
}
