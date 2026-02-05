'use client'

import { useState } from 'react'
import { CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit2, CheckCircle2, Circle, Clock } from 'lucide-react'
import { EditTopicModal } from './edit-topic-modal'
import { TopicWithSchedules } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from '@/utils/cn'

interface TopicHeaderProps {
  topic: TopicWithSchedules
  isOwner: boolean
}

export function TopicHeader({ topic, isOwner }: TopicHeaderProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [status, setStatus] = useState(topic.status || 'Not Started')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleStatusChange = async (newStatus: 'Not Started' | 'In Progress' | 'Done') => {
    if (!isOwner || loading) return
    setLoading(true)
    const { error } = await supabase
      .from('topics')
      .update({ status: newStatus })
      .eq('id', topic.id)

    if (error) {
      toast.error('Failed to update status')
    } else {
      setStatus(newStatus)
      toast.success(`Status updated to ${newStatus}`)
      router.refresh()
    }
    setLoading(false)
  }

  const getStatusIcon = (s: string) => {
    switch (s) {
        case 'Done': return <CheckCircle2 className="h-4 w-4" />
        case 'In Progress': return <Clock className="h-4 w-4" />
        default: return <Circle className="h-4 w-4" />
    }
  }

  const getStatusColor = (s: string) => {
    switch (s) {
        case 'Done': return "text-green-600 bg-green-50 dark:bg-green-950/50 dark:text-green-400"
        case 'In Progress': return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/50 dark:text-yellow-400"
        default: return "text-neutral-500 bg-neutral-100 dark:bg-neutral-800"
    }
  }

  return (
    <CardHeader>
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <CardTitle className="text-3xl">{topic.title}</CardTitle>
             {isOwner ? (
                <div className="flex items-center rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-0.5">
                    {(['Not Started', 'In Progress', 'Done'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => handleStatusChange(s)}
                            disabled={loading}
                            className={cn(
                                "p-1.5 rounded-full transition-colors",
                                status === s ? getStatusColor(s) : "text-neutral-300 hover:text-neutral-500"
                            )}
                            title={s}
                        >
                            {getStatusIcon(s)}
                        </button>
                    ))}
                </div>
             ) : (
                <div className={cn("flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full", getStatusColor(status))}>
                    {getStatusIcon(status)}
                    {status}
                </div>
             )}
          </div>
          <div className="flex gap-2 mt-2">
            <span className="text-sm bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
              {topic.category}
            </span>
            {topic.tags?.map((tag: string) => (
              <span key={tag} className="text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400 px-2 py-1 rounded">
                #{tag}
              </span>
            ))}
          </div>
        </div>
        {isOwner && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditOpen(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Topic
          </Button>
        )}
      </div>
      <EditTopicModal 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        topic={topic} 
      />
    </CardHeader>
  )
}
