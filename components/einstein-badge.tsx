'use client'

import { Sparkles } from 'lucide-react'

export function ArcanaBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#2A2D7C] to-[#9C6ADE] text-white text-xs font-medium">
      <Sparkles className="h-3 w-3" />
      <span>Arcana</span>
    </div>
  )
}

