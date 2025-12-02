import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeInit } from './theme-init'
import { InstallPrompt } from '@/components/pwa/install-prompt'
import { OfflineIndicator } from '@/components/pwa/offline-indicator'
import { PWAHead } from '@/components/pwa/pwa-head'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://life-planner.vercel.app'),
  title: 'Little Einstein - Life Planner & AI Study Coach',
  description: 'Your personal life planner with AI-powered study coaching, task management, and intelligent learning system',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Little Einstein',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Little Einstein',
    title: 'Little Einstein - Life Planner & AI Study Coach',
    description: 'Your personal life planner with AI-powered study coaching',
    images: [
      {
        url: '/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'Little Einstein',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Little Einstein',
    description: 'Your personal life planner with AI-powered study coaching',
    images: ['/icon-512x512.png'],
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6366f1' },
    { media: '(prefers-color-scheme: dark)', color: '#6366f1' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <PWAHead />
        <ThemeInit />
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <OfflineIndicator />
            <InstallPrompt />
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}

