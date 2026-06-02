'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle2 } from 'lucide-react'

interface EnhancedProgressProps {
  value: number // 0–100
  label?: string
  showPercentage?: boolean
  animated?: boolean
  variant?: 'default' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

// Bar counts up from 0 over ~1.5s on mount when `animated` is true. This is
// purely cosmetic; reading the actual `value` is what matters everywhere else.
const ANIMATION_DURATION_MS = 1500
const ANIMATION_STEPS = 60

export function EnhancedProgress({
  value,
  label,
  showPercentage = true,
  animated = true,
  variant = 'default',
  size = 'md',
  showIcon = false,
  className,
}: EnhancedProgressProps) {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value)

  useEffect(() => {
    if (!animated) {
      setDisplayValue(value)
      return
    }

    const increment = value / ANIMATION_STEPS
    let step = 0
    const timer = setInterval(() => {
      step++
      setDisplayValue(Math.min(value, increment * step))
      if (step >= ANIMATION_STEPS) {
        clearInterval(timer)
        setDisplayValue(value)
      }
    }, ANIMATION_DURATION_MS / ANIMATION_STEPS)

    return () => clearInterval(timer)
  }, [value, animated])

  const heightMap = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-2.5',
  }

  const fillMap = {
    default: 'bg-foreground',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  }

  const isComplete = value >= 100

  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-sm font-medium text-foreground">{label}</span>
          )}
          {showPercentage && (
            <div className="flex items-center gap-1.5">
              {showIcon && isComplete && (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              )}
              <span
                className={cn(
                  'text-xs font-medium tabular-nums',
                  isComplete ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                )}
              >
                {Math.round(displayValue)}%
              </span>
            </div>
          )}
        </div>
      )}

      <div
        className={cn(
          'relative w-full rounded-full overflow-hidden bg-muted',
          heightMap[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            fillMap[variant]
          )}
          style={{ width: `${Math.min(100, Math.max(0, displayValue))}%` }}
        />
      </div>

      {size === 'lg' && (
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span className={value >= 25 ? 'font-medium text-foreground' : ''}>25%</span>
          <span className={value >= 50 ? 'font-medium text-foreground' : ''}>50%</span>
          <span className={value >= 75 ? 'font-medium text-foreground' : ''}>75%</span>
          <span className={value >= 100 ? 'font-medium text-green-600 dark:text-green-400' : ''}>
            100%
          </span>
        </div>
      )}
    </div>
  )
}

interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  label?: string
  variant?: 'default' | 'success' | 'warning' | 'error'
  className?: string
}

export function CircularProgress({
  value,
  size = 80,
  strokeWidth = 8,
  label,
  variant = 'default',
  className,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  const colorMap = {
    default: 'stroke-primary',
    success: 'stroke-green-500',
    warning: 'stroke-yellow-500',
    error: 'stroke-red-500',
  }

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-muted"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn(colorMap[variant], 'transition-all duration-700 ease-out')}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-semibold tabular-nums">
            {Math.round(value)}%
          </span>
        </div>
      </div>
      {label && (
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      )}
    </div>
  )
}
