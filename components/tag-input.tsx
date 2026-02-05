'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
}

export function TagInput({ tags, onChange }: TagInputProps) {
  const [input, setInput] = useState('')

  const addTag = () => {
    const trimmed = input.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
      setInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(t => t !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    } else if (e.key === ',' || e.key === ' ') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 rounded-md border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 focus-within:ring-2 focus-within:ring-neutral-950 dark:focus-within:ring-neutral-300 transition-all">
        {tags.map(tag => (
          <span 
            key={tag} 
            className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-100 text-neutral-900 text-xs font-medium dark:bg-neutral-800 dark:text-neutral-100"
          >
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          className="flex-1 min-w-[80px] bg-transparent outline-none text-sm"
          placeholder={tags.length === 0 ? "Add tags..." : ""}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
        />
      </div>
      <p className="text-[10px] text-neutral-500 italic">Press Enter or comma to add</p>
    </div>
  )
}
