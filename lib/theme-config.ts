/**
 * Theme Configuration
 * All available themes for Arcana
 */

export interface ThemeInfo {
  id: string
  name: string
  description: string
  mood: string
  lightId: string
  darkId?: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  preview: {
    bg: string
    primary: string
    secondary: string
    accent: string
  }
}

export const themes: ThemeInfo[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Classic clean theme',
    mood: 'balanced',
    lightId: 'default',
    primaryColor: '#222222',
    secondaryColor: '#666666',
    accentColor: '#0070f3',
    preview: {
      bg: '#ffffff',
      primary: '#222222',
      secondary: '#666666',
      accent: '#0070f3',
    },
  },
  {
    id: 'neo-focus',
    name: 'Neo Focus',
    description: 'Clean, minimal, productivity-focused',
    mood: 'calm, structured, futuristic',
    lightId: 'neo-focus',
    darkId: 'neo-focus-dark',
    primaryColor: '#4F5DFF',
    secondaryColor: '#8B97FF',
    accentColor: '#FFB81C',
    preview: {
      bg: '#F5F7FB',
      primary: '#4F5DFF',
      secondary: '#8B97FF',
      accent: '#FFB81C',
    },
  },
  {
    id: 'vibrant-intelligence',
    name: 'Vibrant Intelligence',
    description: 'Bold, energetic, motivational',
    mood: 'electric, ambitious, motivational',
    lightId: 'vibrant-intelligence',
    darkId: 'vibrant-intelligence-dark',
    primaryColor: '#FF4D67',
    secondaryColor: '#6739FF',
    accentColor: '#00E5A0',
    preview: {
      bg: '#0F0F12',
      primary: '#FF4D67',
      secondary: '#6739FF',
      accent: '#00E5A0',
    },
  },
  {
    id: 'einstein',
    name: 'Einstein Blueprint',
    description: 'Geeky, modern, premium tech',
    mood: 'smart, clean, Apple meets SpaceX',
    lightId: 'einstein',
    darkId: 'einstein-dark',
    primaryColor: '#0066FF',
    secondaryColor: '#00CCFF',
    accentColor: '#FFD700',
    preview: {
      bg: '#F2F4F8',
      primary: '#0066FF',
      secondary: '#00CCFF',
      accent: '#FFD700',
    },
  },
  {
    id: 'calm-discipline',
    name: 'Calm Discipline',
    description: 'Soft, warm, habit-focused',
    mood: 'balanced, comforting, supportive',
    lightId: 'calm-discipline',
    darkId: 'calm-discipline-dark',
    primaryColor: '#2E7D5F',
    secondaryColor: '#A3D9A5',
    accentColor: '#FF946B',
    preview: {
      bg: '#FAF7F3',
      primary: '#2E7D5F',
      secondary: '#A3D9A5',
      accent: '#FF946B',
    },
  },
  {
    id: 'cyber-scholar',
    name: 'Cyber Scholar',
    description: 'Dark, sleek, high-tech',
    mood: 'hacker aesthetic, AI assistant',
    lightId: 'cyber-scholar',
    darkId: 'cyber-scholar-dark',
    primaryColor: '#00E3FF',
    secondaryColor: '#2B2F36',
    accentColor: '#FF3370',
    preview: {
      bg: '#0A0A0C',
      primary: '#00E3FF',
      secondary: '#2B2F36',
      accent: '#FF3370',
    },
  },
  {
    id: 'aurora-mind',
    name: 'Aurora Mind',
    description: 'Dreamy, creative, flow state',
    mood: 'ethereal, imaginative, calming',
    lightId: 'aurora-mind',
    darkId: 'aurora-mind-dark',
    primaryColor: '#7B61FF',
    secondaryColor: '#61FFD9',
    accentColor: '#FF7BC1',
    preview: {
      bg: '#F0F4FF',
      primary: '#7B61FF',
      secondary: '#61FFD9',
      accent: '#FF7BC1',
    },
  },
  {
    id: 'urban-edge',
    name: 'Urban Edge',
    description: 'Modern, gritty, streetwise',
    mood: 'bold, confident, edgy',
    lightId: 'urban-edge',
    darkId: 'urban-edge-dark',
    primaryColor: '#FF6B00',
    secondaryColor: '#1C1C1E',
    accentColor: '#FFD600',
    preview: {
      bg: '#121212',
      primary: '#FF6B00',
      secondary: '#1C1C1E',
      accent: '#FFD600',
    },
  },
  {
    id: 'minimal-zen',
    name: 'Minimal Zen',
    description: 'Ultra-clean, meditative',
    mood: 'calm, focused, uncluttered',
    lightId: 'minimal-zen',
    darkId: 'minimal-zen-dark',
    primaryColor: '#5C6B73',
    secondaryColor: '#A0B9C0',
    accentColor: '#F2C94C',
    preview: {
      bg: '#FFFFFF',
      primary: '#5C6B73',
      secondary: '#A0B9C0',
      accent: '#F2C94C',
    },
  },
  {
    id: 'solar-flare',
    name: 'Solar Flare',
    description: 'Bright, energetic, optimistic',
    mood: 'uplifting, warm, playful',
    lightId: 'solar-flare',
    darkId: 'solar-flare-dark',
    primaryColor: '#FF6F00',
    secondaryColor: '#FFB74D',
    accentColor: '#FF4081',
    preview: {
      bg: '#FFF8F0',
      primary: '#FF6F00',
      secondary: '#FFB74D',
      accent: '#FF4081',
    },
  },
  {
    id: 'neo-noir',
    name: 'Neo Noir',
    description: 'Mystery, elegant, futuristic',
    mood: 'sleek, mysterious, cinematic',
    lightId: 'neo-noir',
    darkId: 'neo-noir-dark',
    primaryColor: '#1F1F2E',
    secondaryColor: '#9E63FF',
    accentColor: '#FF3366',
    preview: {
      bg: '#0A0A0F',
      primary: '#1F1F2E',
      secondary: '#9E63FF',
      accent: '#FF3366',
    },
  },
  {
    id: 'arcana',
    name: 'Arcana',
    description: 'Mystical, intelligent, magical productivity',
    mood: 'mystique, intelligence, magical yet professional',
    lightId: 'arcana',
    darkId: 'arcana-dark',
    primaryColor: '#2A2D7C', // Deep Indigo
    secondaryColor: '#00C1B3', // AI Teal
    accentColor: '#9C6ADE', // Arcane Purple
    preview: {
      bg: '#F8F7F4', // Surface
      primary: '#2A2D7C',
      secondary: '#00C1B3',
      accent: '#9C6ADE',
    },
  },
]

/**
 * Convert hex color to HSL for CSS variables
 */
export function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h: number = 0
  let s: number = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

