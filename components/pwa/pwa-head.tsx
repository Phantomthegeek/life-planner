'use client'

import { useEffect } from 'react'

/**
 * PWA Head Component
 * Adds PWA-specific meta tags that aren't supported by Next.js metadata API
 */
export function PWAHead() {
  useEffect(() => {
    // Add apple-touch-icon if not already present
    if (typeof document !== 'undefined') {
      const existingIcon = document.querySelector('link[rel="apple-touch-icon"]')
      if (!existingIcon) {
        const link = document.createElement('link')
        link.rel = 'apple-touch-icon'
        link.href = '/icon-192x192.png'
        document.head.appendChild(link)
      }

      // Add PWA meta tags
      const metaTags = [
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'mobile-web-app-capable', content: 'yes' },
      ]

      metaTags.forEach(({ name, content }) => {
        const existing = document.querySelector(`meta[name="${name}"]`)
        if (!existing) {
          const meta = document.createElement('meta')
          meta.name = name
          meta.content = content
          document.head.appendChild(meta)
        }
      })
    }
  }, [])

  return null
}

