'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'

interface TempoUIState {
  activeTimeBlock: boolean
  currentHour: number
  isFocusTime: boolean
  isBreakTime: boolean
}

export function useTempoUI() {
  const [state, setState] = useState<TempoUIState>({
    activeTimeBlock: false,
    currentHour: new Date().getHours(),
    isFocusTime: false,
    isBreakTime: false,
  })

  useEffect(() => {
    // Check for active time session
    const checkActiveSession = async () => {
      try {
        const response = await fetch('/api/time-tracking/status')
        const data = await response.json()
        
        setState((prev) => ({
          ...prev,
          activeTimeBlock: data.active || false,
          isFocusTime: data.active || false,
        }))
      } catch (error) {
        console.error('Error checking active session:', error)
      }
    }

    checkActiveSession()
    const interval = setInterval(checkActiveSession, 30000) // Check every 30 seconds

    // Update current hour
    const hourInterval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        currentHour: new Date().getHours(),
      }))
    }, 60000) // Update every minute

    return () => {
      clearInterval(interval)
      clearInterval(hourInterval)
    }
  }, [])

  // Check if current hour is in active time block
  const isInActiveTimeBlock = (taskStartTime?: string | null): boolean => {
    if (!taskStartTime || !state.activeTimeBlock) return false
    
    const startHour = new Date(taskStartTime).getHours()
    return state.currentHour === startHour
  }

  // Get animation class based on state
  const getPulseClass = (isActive: boolean): string => {
    if (!isActive) return ''
    return 'animate-pulse-slow'
  }

  return {
    ...state,
    isInActiveTimeBlock,
    getPulseClass,
  }
}

