'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  opacity: number
}

export function Particles() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const particles: Particle[] = []
    const particleCount = 30

    const colors = [
      'hsl(var(--primary))',
      'hsl(var(--secondary))',
      'hsl(var(--accent))',
    ]

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        vx: (Math.random() - 0.5) * 0.02,
        vy: (Math.random() - 0.5) * 0.02,
        size: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.5 + 0.2,
      })
    }

    const animate = () => {
      particles.forEach((particle) => {
        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.x < 0 || particle.x > 100) particle.vx *= -1
        if (particle.y < 0 || particle.y > 100) particle.vy *= -1
      })

      container.innerHTML = particles
        .map(
          (p) => `
        <div
          style="
            position: absolute;
            left: ${p.x}%;
            top: ${p.y}%;
            width: ${p.size}px;
            height: ${p.size}px;
            background: ${p.color};
            border-radius: 50%;
            opacity: ${p.opacity};
            transform: translate(-50%, -50%);
            transition: all 0.3s ease;
          "
          class="particle"
        ></div>
      `
        )
        .join('')

      requestAnimationFrame(animate)
    }

    animate()
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}

