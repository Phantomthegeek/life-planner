import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the app URL, preferring environment variable over window.location
 * This ensures consistent URLs in both server and client contexts
 */
export function getAppUrl(): string {
  // Server-side: use environment variable
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_APP_URL || 'https://life-planner.vercel.app'
  }
  
  // Client-side: prefer env var, fallback to window.location
  return process.env.NEXT_PUBLIC_APP_URL || window.location.origin
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Subtract days from a date
 */
export function subDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() - days)
  return result
}
