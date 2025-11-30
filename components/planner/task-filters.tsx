'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, X, Filter } from 'lucide-react'
import { Task } from '@/lib/types'

interface TaskFiltersProps {
  tasks: Task[]
  onFilteredTasks: (tasks: Task[]) => void
}

export function TaskFilters({ tasks, onFilteredTasks }: TaskFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  const categories = Array.from(new Set(tasks.map((t) => t.category).filter(Boolean)))

  const applyFilters = () => {
    let filtered = [...tasks]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          (task.detail && task.detail.toLowerCase().includes(query))
      )
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((task) => task.category === categoryFilter)
    }

    // Status filter
    if (statusFilter === 'done') {
      filtered = filtered.filter((task) => task.done)
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter((task) => !task.done)
    }

    // Date filter
    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0]
      filtered = filtered.filter((task) => task.date === today)
    } else if (dateFilter === 'this-week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      filtered = filtered.filter(
        (task) => new Date(task.date) >= weekAgo
      )
    } else if (dateFilter === 'upcoming') {
      const today = new Date().toISOString().split('T')[0]
      filtered = filtered.filter((task) => task.date >= today && !task.done)
    }

    onFilteredTasks(filtered)
  }

  // Apply filters whenever they change
  useState(() => {
    applyFilters()
  })

  const clearFilters = () => {
    setSearchQuery('')
    setCategoryFilter('all')
    setStatusFilter('all')
    setDateFilter('all')
    onFilteredTasks(tasks)
  }

  const hasActiveFilters =
    searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all'

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            applyFilters()
          }}
          className="pl-9"
        />
      </div>

      <Select value={categoryFilter} onValueChange={(value) => {
        setCategoryFilter(value)
        applyFilters()
      }}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat?.charAt(0).toUpperCase() + cat?.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={(value) => {
        setStatusFilter(value)
        applyFilters()
      }}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="done">Completed</SelectItem>
        </SelectContent>
      </Select>

      <Select value={dateFilter} onValueChange={(value) => {
        setDateFilter(value)
        applyFilters()
      }}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Date" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Dates</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="this-week">This Week</SelectItem>
          <SelectItem value="upcoming">Upcoming</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  )
}

