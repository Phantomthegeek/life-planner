'use client'

import { Button } from '@/components/ui/button'
import { BookOpen, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ModuleLinkButtonProps {
  moduleId?: string
  certId?: string
  moduleName?: string
  certName?: string
}

export function ModuleLinkButton({ moduleId, certId, moduleName, certName }: ModuleLinkButtonProps) {
  const router = useRouter()

  if (!moduleId && !certId) return null

  const handleClick = () => {
    if (certId) {
      if (moduleId) {
        // Navigate to certification detail page - could scroll to module
        router.push(`/dashboard/certifications/${certId}`)
      } else {
        router.push(`/dashboard/certifications/${certId}`)
      }
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className="mt-2"
    >
      <BookOpen className="mr-2 h-4 w-4" />
      {moduleName ? `View ${moduleName}` : certName ? `View ${certName}` : 'View Module'}
      <ExternalLink className="ml-2 h-3 w-3" />
    </Button>
  )
}

