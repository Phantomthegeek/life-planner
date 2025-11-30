'use client'

import { Sparkles } from 'lucide-react'

export function EinsteinBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#0066FF] to-[#00CCFF] text-white text-xs font-medium">
      <Sparkles className="h-3 w-3" />
      <span>Einstein</span>
    </div>
  )
}

