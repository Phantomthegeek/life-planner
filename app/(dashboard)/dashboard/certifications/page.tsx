'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { BookOpen, Calendar, Loader2, Plus, Brain, Sparkles, Search, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Certification {
  id: string
  slug: string
  name: string
  description: string | null
  difficulty: number
  progress?: {
    id: string
    progress: number
    target_date: string | null
    exam_scheduled: boolean
    exam_date: string | null
  } | null
}

export default function CertificationsPage() {
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [certName, setCertName] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchCertifications()
  }, [])

  const fetchCertifications = async () => {
    try {
      const response = await fetch('/api/certifications?includeProgress=true')
      if (!response.ok) throw new Error('Failed to fetch certifications')
      const data = await response.json()
      setCertifications(data)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load certifications',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStartCertification = async (certId: string) => {
    try {
      const response = await fetch('/api/certifications/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cert_id: certId,
          progress: 0,
        }),
      })

      if (!response.ok) throw new Error('Failed to start certification')

      toast({
        title: 'Success',
        description: 'Course started!',
      })

      fetchCertifications()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start course',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteCertification = async (certId: string, certName: string) => {
    if (!confirm(`Are you sure you want to delete "${certName}"? This will also delete all associated progress and modules.`)) {
      return
    }

    try {
      const response = await fetch(`/api/certifications?id=${certId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to delete course')
      }

      toast({
        title: 'Success',
        description: 'Course deleted successfully',
      })

      fetchCertifications()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete course',
        variant: 'destructive',
      })
    }
  }

  const getDaysUntilExam = (examDate: string | null) => {
    if (!examDate) return null
    const today = new Date()
    const exam = new Date(examDate)
    const diff = Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const handleAIGenerate = async () => {
    if (!certName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a course name',
        variant: 'destructive',
      })
      return
    }

    setAiLoading(true)
    try {
      // Use AI to generate certification details
      const aiResponse = await fetch('/api/ai/generate-certification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificationName: certName }),
      })

      if (!aiResponse.ok) {
        throw new Error('Failed to generate certification details')
      }

      const certData = await aiResponse.json()

      // Save the certification
      const saveResponse = await fetch('/api/certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(certData),
      })

      if (!saveResponse.ok) {
        const error = await saveResponse.json()
        throw new Error(error.error || 'Failed to save certification')
      }

      toast({
        title: 'Success!',
        description: `Course "${certData.name}" added successfully!`,
      })

      setCertName('')
      setAddDialogOpen(false)
      fetchCertifications()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add course',
        variant: 'destructive',
      })
    } finally {
      setAiLoading(false)
    }
  }

  const filteredCerts = certifications.filter((cert) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      cert.name.toLowerCase().includes(query) ||
      cert.description?.toLowerCase().includes(query) ||
      cert.slug.toLowerCase().includes(query)
    )
  })

  const activeCerts = filteredCerts.filter((c) => c.progress && c.progress.progress < 100)
  const availableCerts = filteredCerts.filter((c) => !c.progress || c.progress.progress === 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Track your course progress and study plans.
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Course
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI-Powered Course Adder
              </DialogTitle>
              <DialogDescription>
                Enter a course name and AI will generate all the details for you!
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cert-name">Course Name</Label>
                <Input
                  id="cert-name"
                  placeholder="e.g., AWS Solutions Architect, Cisco CCNA"
                  value={certName}
                  onChange={(e) => setCertName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !aiLoading) {
                      handleAIGenerate()
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground">
                  AI will automatically generate the description, difficulty, and slug.
                </p>
              </div>
              <Button
                onClick={handleAIGenerate}
                disabled={aiLoading || !certName.trim()}
                className="w-full"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    AI is generating...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Generate & Add Course
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {activeCerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">In Progress</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeCerts.map((cert) => {
              const daysUntil = cert.progress?.exam_date
                ? getDaysUntilExam(cert.progress.exam_date)
                : null
              return (
                <Card key={cert.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      {cert.name}
                    </CardTitle>
                    <CardDescription>
                      {cert.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-semibold">
                          {cert.progress?.progress || 0}%
                        </span>
                      </div>
                      <Progress
                        value={cert.progress?.progress || 0}
                        className="h-2"
                      />
                    </div>
                    {daysUntil !== null && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {daysUntil > 0 ? (
                          <span>{daysUntil} days until exam</span>
                        ) : (
                          <span>Exam passed!</span>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Link href={`/dashboard/certifications/${cert.id}`} className="flex-1">
                        <Button className="w-full" variant="outline">
                          View Details
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCertification(cert.id, cert.name)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">
          {activeCerts.length > 0 ? 'Available Courses' : 'Courses'}
        </h2>
        {availableCerts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No courses available. Check back later!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableCerts.map((cert) => (
              <Card key={cert.id}>
                <CardHeader>
                  <CardTitle>{cert.name}</CardTitle>
                  <CardDescription>
                    {cert.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleStartCertification(cert.id)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Start Course
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCertification(cert.id, cert.name)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

