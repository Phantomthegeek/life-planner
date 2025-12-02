import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Class name utility - merges Tailwind classes properly
// Using clsx + twMerge is the standard approach for conditional classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get app URL - handles both server and client contexts
// This is needed because window isn't available on the server
export function getAppUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side: use env var or fallback
    return process.env.NEXT_PUBLIC_APP_URL || 'https://life-planner.vercel.app'
  }
  
  // Client-side: prefer env var, fallback to current origin
  return process.env.NEXT_PUBLIC_APP_URL || window.location.origin
}

// Date formatting - converts Date to YYYY-MM-DD string
// Used throughout the app for date inputs and API calls
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Add days to a date - returns new Date object
// Doesn't mutate the original, which is important
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// Subtract days from a date
export function subDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() - days)
  return result
}

// Format date to ISO string (YYYY-MM-DD) - alias for formatDate
// Kept for backward compatibility with existing code
export function formatDateToISO(date: Date): string {
  return formatDate(date)
}

// Format time in seconds to MM:SS format
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
