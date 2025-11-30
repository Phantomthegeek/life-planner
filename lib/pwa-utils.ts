export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false
  
  // Check if running as standalone (installed PWA)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true
  }

  // Check if running as standalone on iOS
  if ((window.navigator as any).standalone === true) {
    return true
  }

  return false
}

export function isIOS(): boolean {
  if (typeof window === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export function getInstallInstructions(): { platform: string; instructions: string[] } {
  const userAgent = typeof window !== 'undefined' ? navigator.userAgent : ''
  
  if (/iPad|iPhone|iPod/.test(userAgent)) {
    return {
      platform: 'iOS',
      instructions: [
        'Tap the Share button (square with arrow)',
        'Scroll down and tap "Add to Home Screen"',
        'Tap "Add" to confirm'
      ]
    }
  }

  if (/Android/.test(userAgent)) {
    return {
      platform: 'Android',
      instructions: [
        'Tap the menu button (three dots)',
        'Select "Install app" or "Add to Home screen"',
        'Tap "Install" to confirm'
      ]
    }
  }

  if (/Chrome/.test(userAgent)) {
    return {
      platform: 'Chrome',
      instructions: [
        'Click the install icon in the address bar',
        'Or go to Settings → More tools → Create shortcut',
        'Check "Open as window" and click "Create"'
      ]
    }
  }

  return {
    platform: 'Desktop',
    instructions: [
      'Look for the install icon in your browser\'s address bar',
      'Or check the browser menu for "Install" option',
      'Follow your browser\'s installation prompts'
    ]
  }
}

