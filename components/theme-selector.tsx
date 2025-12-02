'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTheme } from 'next-themes'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ThemeOption {
  id: string
  name: string
  description: string
  mood: string
  hasDarkMode: boolean
  preview: {
    primary: string
    secondary: string
    accent: string
    bg: string
  }
}

const themeOptions: ThemeOption[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Classic clean theme',
    mood: 'balanced',
    hasDarkMode: true,
    preview: {
      primary: '#222222',
      secondary: '#666666',
      accent: '#0070f3',
      bg: '#ffffff',
    },
  },
  {
    id: 'neo-focus',
    name: 'Neo Focus',
    description: 'Clean, minimal, productivity-focused',
    mood: 'calm, structured, futuristic',
    hasDarkMode: true,
    preview: {
      primary: '#4F5DFF',
      secondary: '#8B97FF',
      accent: '#FFB81C',
      bg: '#F5F7FB',
    },
  },
  {
    id: 'vibrant-intelligence',
    name: 'Vibrant Intelligence',
    description: 'Bold, energetic, motivational',
    mood: 'electric, ambitious, motivational',
    hasDarkMode: true,
    preview: {
      primary: '#FF4D67',
      secondary: '#6739FF',
      accent: '#00E5A0',
      bg: '#0F0F12',
    },
  },
  {
    id: 'einstein',
    name: 'Einstein Blueprint',
    description: 'Geeky, modern, premium tech',
    mood: 'smart, clean, Apple meets SpaceX',
    hasDarkMode: true,
    preview: {
      primary: '#0066FF',
      secondary: '#00CCFF',
      accent: '#FFD700',
      bg: '#F2F4F8',
    },
  },
  {
    id: 'calm-discipline',
    name: 'Calm Discipline',
    description: 'Soft, warm, habit-focused',
    mood: 'balanced, comforting, supportive',
    hasDarkMode: true,
    preview: {
      primary: '#2E7D5F',
      secondary: '#A3D9A5',
      accent: '#FF946B',
      bg: '#FAF7F3',
    },
  },
  {
    id: 'cyber-scholar',
    name: 'Cyber Scholar',
    description: 'Dark, sleek, high-tech',
    mood: 'hacker aesthetic, AI assistant',
    hasDarkMode: true,
    preview: {
      primary: '#00E3FF',
      secondary: '#2B2F36',
      accent: '#FF3370',
      bg: '#0A0A0C',
    },
  },
  {
    id: 'aurora-mind',
    name: 'Aurora Mind',
    description: 'Dreamy, creative, flow state',
    mood: 'ethereal, imaginative, calming',
    hasDarkMode: true,
    preview: {
      primary: '#7B61FF',
      secondary: '#61FFD9',
      accent: '#FF7BC1',
      bg: '#F0F4FF',
    },
  },
  {
    id: 'urban-edge',
    name: 'Urban Edge',
    description: 'Modern, gritty, streetwise',
    mood: 'bold, confident, edgy',
    hasDarkMode: true,
    preview: {
      primary: '#FF6B00',
      secondary: '#1C1C1E',
      accent: '#FFD600',
      bg: '#121212',
    },
  },
  {
    id: 'minimal-zen',
    name: 'Minimal Zen',
    description: 'Ultra-clean, meditative',
    mood: 'calm, focused, uncluttered',
    hasDarkMode: true,
    preview: {
      primary: '#5C6B73',
      secondary: '#A0B9C0',
      accent: '#F2C94C',
      bg: '#FFFFFF',
    },
  },
  {
    id: 'solar-flare',
    name: 'Solar Flare',
    description: 'Bright, energetic, optimistic',
    mood: 'uplifting, warm, playful',
    hasDarkMode: true,
    preview: {
      primary: '#FF6F00',
      secondary: '#FFB74D',
      accent: '#FF4081',
      bg: '#FFF8F0',
    },
  },
  {
    id: 'neo-noir',
    name: 'Neo Noir',
    description: 'Mystery, elegant, futuristic',
    mood: 'sleek, mysterious, cinematic',
    hasDarkMode: true,
    preview: {
      primary: '#1F1F2E',
      secondary: '#9E63FF',
      accent: '#FF3366',
      bg: '#0A0A0F',
    },
  },
  {
    id: 'arcana',
    name: 'Arcana',
    description: 'Mystical, intelligent, magical productivity',
    mood: 'mystique, intelligence, magical yet professional',
    hasDarkMode: true,
    preview: {
      primary: '#2A2D7C',
      secondary: '#00C1B3',
      accent: '#9C6ADE',
      bg: '#F8F7F4',
    },
  },
]

interface ThemeSelectorProps {
  currentTheme: string
  onThemeChange: (themeId: string) => void
}

export function ThemeSelector({ currentTheme, onThemeChange }: ThemeSelectorProps) {
  const { theme } = useTheme()
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null)

  const getCurrentThemeId = () => {
    if (currentTheme === 'default') return 'default'
    if (currentTheme.includes('einstein')) return 'einstein'
    if (currentTheme.includes('neo-focus')) return 'neo-focus'
    if (currentTheme.includes('vibrant-intelligence')) return 'vibrant-intelligence'
    if (currentTheme.includes('calm-discipline')) return 'calm-discipline'
    if (currentTheme.includes('cyber-scholar')) return 'cyber-scholar'
    if (currentTheme.includes('aurora-mind')) return 'aurora-mind'
    if (currentTheme.includes('urban-edge')) return 'urban-edge'
    if (currentTheme.includes('minimal-zen')) return 'minimal-zen'
    if (currentTheme.includes('solar-flare')) return 'solar-flare'
    if (currentTheme.includes('neo-noir')) return 'neo-noir'
    if (currentTheme.includes('arcana')) return 'arcana'
    return 'default'
  }

  const selectedId = getCurrentThemeId()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {themeOptions.map((option) => {
        const isSelected = selectedId === option.id || selectedId === option.id.split('-')[0]

        return (
          <Card
            key={option.id}
            className={cn(
              'cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105',
              isSelected && 'ring-2 ring-primary'
            )}
            onMouseEnter={() => setHoveredTheme(option.id)}
            onMouseLeave={() => setHoveredTheme(null)}
            onClick={() => {
              const mode = theme === 'dark' ? 'dark' : 'light'
              const themeId = mode === 'dark' && option.hasDarkMode
                ? `${option.id}-dark`
                : option.id
              onThemeChange(themeId)
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{option.name}</CardTitle>
                {isSelected && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Active
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs">{option.description}</CardDescription>
              <Badge variant="outline" className="mt-2 text-xs w-fit">
                {option.mood}
              </Badge>
            </CardHeader>
            <CardContent>
              {/* Color Preview */}
              <div
                className="rounded-lg p-4 space-y-2"
                style={{
                  background: option.preview.bg,
                }}
              >
                <div className="flex gap-2">
                  <div
                    className="h-8 flex-1 rounded"
                    style={{ backgroundColor: option.preview.primary }}
                  />
                  <div
                    className="h-8 flex-1 rounded"
                    style={{ backgroundColor: option.preview.secondary }}
                  />
                  <div
                    className="h-8 flex-1 rounded"
                    style={{ backgroundColor: option.preview.accent }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

