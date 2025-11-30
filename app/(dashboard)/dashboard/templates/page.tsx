'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Copy, Trash2, Loader2 } from 'lucide-react'
import { useTemplateStore, TaskTemplate } from '@/stores/use-template-store'
import { useToast } from '@/hooks/use-toast'

export default function TemplatesPage() {
  const templates = useTemplateStore((state) => state.templates)
  const addTemplate = useTemplateStore((state) => state.addTemplate)
  const updateTemplate = useTemplateStore((state) => state.updateTemplate)
  const deleteTemplate = useTemplateStore((state) => state.deleteTemplate)
  const duplicateTemplate = useTemplateStore((state) => state.duplicateTemplate)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    detail: '',
    duration_minutes: 60,
    category: 'work',
  })
  const { toast } = useToast()

  const handleSave = () => {
    if (!formData.name || !formData.title) {
      toast({
        title: 'Error',
        description: 'Name and title are required',
        variant: 'destructive',
      })
      return
    }

    if (editingTemplate) {
      updateTemplate(editingTemplate.id, formData)
      toast({
        title: 'Success',
        description: 'Template updated successfully',
      })
    } else {
      addTemplate(formData)
      toast({
        title: 'Success',
        description: 'Template created successfully',
      })
    }

    setDialogOpen(false)
    setEditingTemplate(null)
    setFormData({
      name: '',
      title: '',
      detail: '',
      duration_minutes: 60,
      category: 'work',
    })
  }

  const handleEdit = (template: TaskTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      title: template.title,
      detail: template.detail || '',
      duration_minutes: template.duration_minutes,
      category: template.category,
    })
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTemplate(id)
      toast({
        title: 'Success',
        description: 'Template deleted successfully',
      })
    }
  }

  const handleDuplicate = (id: string) => {
    duplicateTemplate(id)
    toast({
      title: 'Success',
      description: 'Template duplicated successfully',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Templates</h1>
          <p className="text-muted-foreground">
            Create reusable task templates for common activities.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingTemplate(null)
              setFormData({
                name: '',
                title: '',
                detail: '',
                duration_minutes: 60,
                category: 'work',
              })
            }}>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Morning Routine"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Task title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="detail">Description</Label>
                <Textarea
                  id="detail"
                  value={formData.detail}
                  onChange={(e) =>
                    setFormData({ ...formData, detail: e.target.value })
                  }
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration_minutes: parseInt(e.target.value) || 60,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="study">Study</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="break">Break</SelectItem>
                      <SelectItem value="habit">Habit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingTemplate ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plus className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No templates yet. Create your first template to get started!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
                <CardDescription>{template.title}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {template.detail && (
                  <p className="text-sm text-muted-foreground">
                    {template.detail}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Duration: {template.duration_minutes} min
                  </span>
                  <span className="px-2 py-1 rounded bg-secondary text-xs">
                    {template.category}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(template)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(template.id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
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
  )
}

