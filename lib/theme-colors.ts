/**
 * Theme Color Definitions
 * Helper functions to convert hex to HSL for CSS variables
 */

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // Remove # if present
  hex = hex.replace('#', '')
  
  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
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

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

export function hslToString(hsl: { h: number; s: number; l: number }): string {
  return `${hsl.h} ${hsl.s}% ${hsl.l}%`
}

// Theme color palettes
export const themeColors = {
  'neo-focus-light': {
    primary: '#4F5DFF',
    secondary: '#8B97FF',
    accent: '#FFB81C',
    background: '#F5F7FB',
    surface: '#FFFFFF',
    text: '#1A1A1A',
  },
  'neo-focus-dark': {
    primary: '#6B7BFF',
    secondary: '#A0ABFF',
    accent: '#FFD044',
    background: '#1C1E26',
    surface: '#242730',
    text: '#F2F2F2',
  },
  'vibrant-intelligence-light': {
    primary: '#FF4D67',
    secondary: '#6739FF',
    accent: '#00E5A0',
    background: '#0F0F12',
    surface: '#1B1B20',
    text: '#F2F2F2',
  },
  'vibrant-intelligence-dark': {
    primary: '#FF6B81',
    secondary: '#8B5AFF',
    accent: '#00FFB8',
    background: '#0A0A0D',
    surface: '#15151A',
    text: '#FFFFFF',
  },
  'calm-discipline-light': {
    primary: '#2E7D5F',
    secondary: '#A3D9A5',
    accent: '#FF946B',
    background: '#FAF7F3',
    surface: '#FFFFFF',
    text: '#2B2B2B',
  },
  'calm-discipline-dark': {
    primary: '#3A9D7A',
    secondary: '#B8E6BA',
    accent: '#FFB088',
    background: '#1A1714',
    surface: '#25221E',
    text: '#F5F5F5',
  },
  'cyber-scholar-light': {
    primary: '#00E3FF',
    secondary: '#2B2F36',
    accent: '#FF3370',
    background: '#0A0A0C',
    surface: '#121214',
    text: '#F5F5F5',
  },
  'cyber-scholar-dark': {
    primary: '#00FFFF',
    secondary: '#3A3F48',
    accent: '#FF4D7E',
    background: '#050506',
    surface: '#0D0D0F',
    text: '#FFFFFF',
  },
  'aurora-mind-light': {
    primary: '#7B61FF',
    secondary: '#61FFD9',
    accent: '#FF7BC1',
    background: '#F0F4FF',
    surface: '#FFFFFF',
    text: '#2A2A2A',
  },
  'aurora-mind-dark': {
    primary: '#9B81FF',
    secondary: '#81FFFF',
    accent: '#FF9BD1',
    background: '#1A1526',
    surface: '#241F32',
    text: '#EAEAEA',
  },
  'urban-edge-light': {
    primary: '#FF6B00',
    secondary: '#1C1C1E',
    accent: '#FFD600',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#EDEDED',
  },
  'urban-edge-dark': {
    primary: '#FF8B33',
    secondary: '#2C2C30',
    accent: '#FFE633',
    background: '#0A0A0A',
    surface: '#151515',
    text: '#FFFFFF',
  },
  'minimal-zen-light': {
    primary: '#5C6B73',
    secondary: '#A0B9C0',
    accent: '#F2C94C',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#1D1D1D',
  },
  'minimal-zen-dark': {
    primary: '#7A8B93',
    secondary: '#C0D9E0',
    accent: '#F4D96C',
    background: '#0F0F0F',
    surface: '#1A1A1A',
    text: '#EDEDED',
  },
  'solar-flare-light': {
    primary: '#FF6F00',
    secondary: '#FFB74D',
    accent: '#FF4081',
    background: '#FFF8F0',
    surface: '#FFFFFF',
    text: '#2C2C2C',
  },
  'solar-flare-dark': {
    primary: '#FF8F33',
    secondary: '#FFC76D',
    accent: '#FF60A1',
    background: '#1A1208',
    surface: '#251A0F',
    text: '#F5F5F5',
  },
  'neo-noir-light': {
    primary: '#1F1F2E',
    secondary: '#9E63FF',
    accent: '#FF3366',
    background: '#0A0A0F',
    surface: '#121218',
    text: '#EAEAEA',
  },
  'neo-noir-dark': {
    primary: '#2F2F3E',
    secondary: '#BE83FF',
    accent: '#FF5386',
    background: '#050508',
    surface: '#0D0D12',
    text: '#FFFFFF',
  },
}

