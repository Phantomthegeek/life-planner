'use client'

import { Brain } from 'lucide-react'
import { motion } from 'framer-motion'

export function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-6">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg ring-2 ring-blue-500/20">
          <Brain className="h-5 w-5 text-white" />
        </div>
      </div>
      <div className="flex items-center gap-1 bg-card border border-border/50 rounded-2xl rounded-bl-md px-4 py-3 shadow-lg">
        <motion.div
          className="w-2 h-2 rounded-full bg-primary"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="w-2 h-2 rounded-full bg-primary"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="w-2 h-2 rounded-full bg-primary"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
        />
      </div>
    </div>
  )
}

