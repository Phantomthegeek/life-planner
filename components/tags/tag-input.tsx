'use client'

import { useState, useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { X, Plus, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  availableTags?: string[]
  className?: string
}

export function TagInput({ tags, onChange, availableTags = [], className }: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onChange([...tags, trimmedTag])
      setInputValue('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      handleAddTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      handleRemoveTag(tags[tags.length - 1])
    }
  }

  const filteredAvailableTags = availableTags.filter(
    (tag) => !tags.includes(tag) && tag.toLowerCase().includes(inputValue.toLowerCase())
  )

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px]">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {tag}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsOpen(true)}
              placeholder="Add tags..."
              className="border-0 shadow-none focus-visible:ring-0 flex-1 min-w-[120px]"
            />
          </PopoverTrigger>
          {filteredAvailableTags.length > 0 && (
            <PopoverContent className="w-[200px] p-2" align="start">
              <div className="space-y-1">
                {filteredAvailableTags.slice(0, 5).map((tag) => (
                  <Button
                    key={tag}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      handleAddTag(tag)
                      setIsOpen(false)
                    }}
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    {tag}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          )}
        </Popover>
      </div>
      {inputValue && !filteredAvailableTags.length && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAddTag(inputValue)}
          className="text-xs"
        >
          <Plus className="mr-1 h-3 w-3" />
          Add &quot;{inputValue}&quot;
        </Button>
      )}
    </div>
  )
}

