import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FIFA Fan Concierge',
  description: 'AI-powered multi-agent travel concierge for FIFA World Cup 2026.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
