'use client'

import { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-yellow-500/90 dark:bg-yellow-600/90 backdrop-blur-sm border-b border-yellow-600 dark:border-yellow-700"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 text-yellow-900 dark:text-yellow-100">
            <WifiOff className="h-5 w-5 animate-pulse" />
            <span className="font-medium">You&apos;re offline. Some features may be limited.</span>
          </div>
        </motion.div>
      )}
      {isOnline && !navigator.onLine && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-green-500/90 dark:bg-green-600/90 backdrop-blur-sm border-b border-green-600 dark:border-green-700"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 text-green-900 dark:text-green-100">
            <Wifi className="h-5 w-5" />
            <span className="font-medium">You&apos;re back online!</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

