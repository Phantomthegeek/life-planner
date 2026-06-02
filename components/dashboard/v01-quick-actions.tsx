'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MessageSquare, Wand2, Plus } from 'lucide-react'

const actions = [
  {
    href: '/dashboard/planner',
    label: 'Planner',
    description: 'See and edit today',
    icon: Calendar,
    variant: 'default' as const,
  },
  {
    href: '/dashboard/coach',
    label: 'Plan my day',
    description: 'Let Arcana draft a schedule',
    icon: Wand2,
    variant: 'outline' as const,
  },
  {
    href: '/dashboard/chat',
    label: 'Chat',
    description: 'Think out loud with Arcana',
    icon: MessageSquare,
    variant: 'outline' as const,
  },
  {
    href: '/dashboard/planner',
    label: 'Add task',
    description: 'Quick add in planner',
    icon: Plus,
    variant: 'outline' as const,
  },
]

export function V01QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Jump in</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {actions.map(({ href, label, description, icon: Icon, variant }) => (
          <Button
            key={`${href}-${label}`}
            variant={variant}
            className="h-auto py-3 px-3 justify-start"
            asChild
          >
            <Link href={href} className="flex flex-col items-start gap-1 w-full">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
              <span className="text-xs font-normal opacity-70 text-left">
                {description}
              </span>
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
