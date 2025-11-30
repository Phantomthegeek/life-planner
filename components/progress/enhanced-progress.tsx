'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle2, Sparkles } from 'lucide-react'

interface EnhancedProgressProps {
  value: number // 0-100
  label?: string
  showPercentage?: boolean
  animated?: boolean
  variant?: 'default' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

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
    if (animated) {
      const duration = 1500 // 1.5 seconds
      const steps = 60
      const increment = value / steps
      let current = 0
      let step = 0

      const timer = setInterval(() => {
        step++
        current = Math.min(value, increment * step)
        setDisplayValue(current)

        if (step >= steps) {
          clearInterval(timer)
          setDisplayValue(value)
        }
      }, duration / steps)

      return () => clearInterval(timer)
    } else {
      setDisplayValue(value)
    }
  }, [value, animated])

  const heightMap = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }

  const variantMap = {
    default: 'from-primary via-secondary to-accent',
    success: 'from-green-500 via-emerald-400 to-teal-300',
    warning: 'from-yellow-500 via-orange-400 to-amber-300',
    error: 'from-red-500 via-rose-400 to-pink-300',
  }

  const isComplete = value >= 100

  return (
    <div className={cn('space-y-2', className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-sm font-medium text-foreground">{label}</span>
          )}
          {showPercentage && (
            <div className="flex items-center gap-2">
              {showIcon && isComplete && (
                <CheckCircle2 className="h-4 w-4 text-green-500 animate-bounce-in" />
              )}
              {showIcon && !isComplete && value > 0 && (
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              )}
              <span
                className={cn(
                  'text-sm font-bold tabular-nums',
                  isComplete && 'text-green-500',
                  value > 75 && value < 100 && 'text-primary',
                  value > 50 && value <= 75 && 'text-yellow-500',
                  value <= 50 && 'text-muted-foreground'
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
          'relative w-full rounded-full overflow-hidden bg-secondary/50',
          heightMap[size],
          'shadow-inner'
        )}
      >
        {/* Animated background gradient */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-r opacity-20',
            variantMap[variant],
            'animate-gradient-shift'
          )}
        />

        {/* Progress fill */}
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out relative overflow-hidden',
            variantMap[variant],
            isComplete && 'shadow-lg shadow-green-500/50'
          )}
          style={{ width: `${Math.min(100, Math.max(0, displayValue))}%` }}
        >
          {/* Shine effect */}
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent',
              'animate-shine',
              isComplete && 'hidden'
            )}
          />

          {/* Pulse effect for high progress */}
          {value > 90 && value < 100 && (
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          )}
        </div>

        {/* Completion celebration */}
        {isComplete && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white animate-bounce" />
          </div>
        )}
      </div>

      {/* Milestone markers */}
      {size === 'lg' && (
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span className={value >= 25 ? 'font-semibold text-primary' : ''}>25%</span>
          <span className={value >= 50 ? 'font-semibold text-primary' : ''}>50%</span>
          <span className={value >= 75 ? 'font-semibold text-primary' : ''}>75%</span>
          <span className={value >= 100 ? 'font-semibold text-green-500' : ''}>100%</span>
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
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-secondary/30"
          />
          {/* Progress circle */}
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
            className={cn(
              colorMap[variant],
              'transition-all duration-1000 ease-out'
            )}
            style={{
              filter: value >= 100 ? 'drop-shadow(0 0 8px currentColor)' : 'none',
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold tabular-nums">{Math.round(value)}%</span>
        </div>
      </div>
      {label && (
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
      )}
    </div>
  )
}

