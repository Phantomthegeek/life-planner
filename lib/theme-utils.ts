/**
 * Theme Utility Functions
 * Helpers for managing theme application
 */

export type ThemeId =
  | 'default'
  | 'neo-focus'
  | 'vibrant-intelligence'
  | 'einstein'
  | 'calm-discipline'
  | 'cyber-scholar'
  | 'aurora-mind'
  | 'urban-edge'
  | 'minimal-zen'
  | 'solar-flare'
  | 'neo-noir'

export type ThemeMode = 'light' | 'dark'

export interface ThemeConfig {
  id: ThemeId
  hasDarkMode: boolean
  lightId: string
  darkId: string
}

export const themeConfigs: Record<ThemeId, ThemeConfig> = {
  default: {
    id: 'default',
    hasDarkMode: true,
    lightId: 'default',
    darkId: 'default',
  },
  'neo-focus': {
    id: 'neo-focus',
    hasDarkMode: true,
    lightId: 'neo-focus',
    darkId: 'neo-focus-dark',
  },
  'vibrant-intelligence': {
    id: 'vibrant-intelligence',
    hasDarkMode: true,
    lightId: 'vibrant-intelligence',
    darkId: 'vibrant-intelligence-dark',
  },
  einstein: {
    id: 'einstein',
    hasDarkMode: true,
    lightId: 'einstein',
    darkId: 'einstein-dark',
  },
  'calm-discipline': {
    id: 'calm-discipline',
    hasDarkMode: true,
    lightId: 'calm-discipline',
    darkId: 'calm-discipline-dark',
  },
  'cyber-scholar': {
    id: 'cyber-scholar',
    hasDarkMode: true,
    lightId: 'cyber-scholar',
    darkId: 'cyber-scholar-dark',
  },
  'aurora-mind': {
    id: 'aurora-mind',
    hasDarkMode: true,
    lightId: 'aurora-mind',
    darkId: 'aurora-mind-dark',
  },
  'urban-edge': {
    id: 'urban-edge',
    hasDarkMode: true,
    lightId: 'urban-edge',
    darkId: 'urban-edge-dark',
  },
  'minimal-zen': {
    id: 'minimal-zen',
    hasDarkMode: true,
    lightId: 'minimal-zen',
    darkId: 'minimal-zen-dark',
  },
  'solar-flare': {
    id: 'solar-flare',
    hasDarkMode: true,
    lightId: 'solar-flare',
    darkId: 'solar-flare-dark',
  },
  'neo-noir': {
    id: 'neo-noir',
    hasDarkMode: true,
    lightId: 'neo-noir',
    darkId: 'neo-noir-dark',
  },
}

/**
 * Parse theme string to get base theme ID
 */
export function getThemeBaseId(themeString: string): ThemeId {
  if (themeString === 'default') return 'default'
  
  const baseId = themeString.replace('-dark', '') as ThemeId
  return themeConfigs[baseId] ? baseId : 'default'
}

/**
 * Get full theme ID based on theme base and mode
 */
export function getFullThemeId(themeId: ThemeId, mode: ThemeMode): string {
  if (themeId === 'default') return 'default'
  
  const config = themeConfigs[themeId]
  if (!config) return 'default'
  
  return mode === 'dark' && config.hasDarkMode
    ? config.darkId
    : config.lightId
}

/**
 * Apply theme to the document
 */
export function applyTheme(themeId: ThemeId, mode: ThemeMode) {
  const html = document.documentElement
  const fullThemeId = getFullThemeId(themeId, mode)
  
  // Remove all theme attributes first
  const themeAttrs = Object.values(themeConfigs).flatMap(config => [
    config.lightId,
    config.darkId,
  ])
  themeAttrs.forEach(attr => html.removeAttribute(`data-theme`))
  
  // Apply new theme
  if (themeId === 'default') {
    html.removeAttribute('data-theme')
  } else {
    html.setAttribute('data-theme', fullThemeId)
  }
  
  // Apply dark mode class
  if (mode === 'dark') {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
  
  // Save to localStorage
  localStorage.setItem('app-theme', fullThemeId)
  localStorage.setItem('theme-mode', mode)
  localStorage.setItem('theme-base', themeId)
}

/**
 * Get current theme from localStorage
 */
export function getSavedTheme(): { themeId: ThemeId; mode: ThemeMode } {
  if (typeof window === 'undefined') {
    return { themeId: 'default', mode: 'light' }
  }
  
  const savedBase = localStorage.getItem('theme-base') as ThemeId
  const savedMode = (localStorage.getItem('theme-mode') || 'light') as ThemeMode
  
  if (savedBase && themeConfigs[savedBase]) {
    return { themeId: savedBase, mode: savedMode }
  }
  
  const savedTheme = localStorage.getItem('app-theme') || 'default'
  const themeId = getThemeBaseId(savedTheme)
  const mode = savedTheme.includes('-dark') ? 'dark' : 'light'
  
  return { themeId, mode }
}

