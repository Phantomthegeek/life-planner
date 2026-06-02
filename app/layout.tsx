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

// Get app URL for metadata. Prefer NEXT_PUBLIC_APP_URL (set per environment in
// Vercel), then VERCEL_URL which is auto-injected for every deployment, then
// localhost so the metadata is always valid in dev. We deliberately don't
// hardcode a production domain here — the env should be the single source of
// truth so previews and production each generate correct absolute URLs.
const getMetadataBase = () => {
  const explicit = process.env.NEXT_PUBLIC_APP_URL
  const vercel = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
  const candidate = explicit || vercel || 'http://localhost:3000'
  try {
    return new URL(candidate)
  } catch {
    return new URL('http://localhost:3000')
  }
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: 'Arcana - AI Productivity & Life Planner',
  description: 'Your intelligent productivity companion with AI-powered assistance, knowledge management, flow mode, time warp version control, and gamified habit tracking',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Arcana',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Arcana',
    title: 'Arcana - AI Productivity & Life Planner',
    description: 'Your intelligent productivity companion with AI-powered assistance, knowledge management, and flow mode',
    images: [
      {
        url: '/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'Arcana',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Arcana',
    description: 'Your intelligent productivity companion with AI-powered assistance',
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
    { media: '(prefers-color-scheme: light)', color: '#2A2D7C' }, // Deep Indigo - Arcana primary
    { media: '(prefers-color-scheme: dark)', color: '#1A1815' }, // Dark background - Arcana dark theme
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

