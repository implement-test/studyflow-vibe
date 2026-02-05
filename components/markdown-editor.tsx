'use client'

import { useState } from 'react'
import { cn } from '@/utils/cn'
import { MarkdownRenderer } from './markdown-renderer'
import { Button } from '@/components/ui/button'
import { Eye, PenLine } from 'lucide-react'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
  disabled?: boolean
  className?: string
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write something...",
  minHeight = "min-h-[150px]",
  disabled = false,
  className
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<'write' | 'preview'>('write')

  return (
    <div className={cn("flex flex-col border border-neutral-200 dark:border-neutral-800 rounded-md overflow-hidden bg-white dark:bg-neutral-950", className)}>
      <div className="flex items-center gap-1 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-2 py-1.5">
        <button
          type="button"
          onClick={() => setTab('write')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors",
            tab === 'write' 
              ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm" 
              : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          )}
        >
          <PenLine className="h-3.5 w-3.5" />
          Write
        </button>
        <button
          type="button"
          onClick={() => setTab('preview')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors",
            tab === 'preview' 
              ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm" 
              : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          )}
        >
          <Eye className="h-3.5 w-3.5" />
          Preview
        </button>
      </div>
      
      <div className="relative">
        {tab === 'write' ? (
          <textarea
            className={cn(
              "w-full p-4 bg-transparent resize-y focus:outline-none text-sm font-mono",
              minHeight
            )}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        ) : (
          <div className={cn("w-full p-4 overflow-y-auto bg-neutral-50/30 dark:bg-neutral-900/30", minHeight)}>
            {value.trim() ? (
              <MarkdownRenderer content={value} />
            ) : (
              <p className="text-sm text-neutral-400 italic">Nothing to preview</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
