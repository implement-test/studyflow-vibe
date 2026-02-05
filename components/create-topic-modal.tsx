'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { X, Plus, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TagInput } from './tag-input'
import { toast } from 'sonner'
import { MarkdownEditor } from './markdown-editor'

interface CreateTopicModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ScheduleRange {
  startDate: string
  endDate: string
}

export function CreateTopicModal({ isOpen, onClose }: CreateTopicModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Vibe Coding')
  const [tags, setTags] = useState<string[]>([])
  const [schedules, setSchedules] = useState<ScheduleRange[]>([{ startDate: '', endDate: '' }])
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  const supabase = createClient()
  const router = useRouter()

  const addSchedule = () => {
    setSchedules([...schedules, { startDate: '', endDate: '' }])
  }

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index))
  }

  const updateSchedule = (index: number, field: keyof ScheduleRange, value: string) => {
    const newSchedules = [...schedules]
    newSchedules[index][field] = value
    setSchedules(newSchedules)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Insert Topic
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .insert({
        title,
        description,
        category,
        tags,
        created_by: user.id
      })
      .select()
      .single()

    if (topicError) {
      toast.error(topicError.message)
      setLoading(false)
      return
    }

    // Insert Schedules
    const validSchedules = schedules
      .filter(s => s.startDate && s.endDate)
      .map(s => ({
        topic_id: topic.id,
        start_date: new Date(s.startDate).toISOString(),
        end_date: new Date(s.endDate).toISOString()
      }))

    if (validSchedules.length > 0) {
      const { error: scheduleError } = await supabase
        .from('topic_schedules')
        .insert(validSchedules)
      
      if (scheduleError) {
        toast.error('Topic created, but failed to save schedules.')
      }
    }

    toast.success('Topic created successfully!')
    setLoading(false)
    resetForm()
    
    startTransition(() => {
        onClose()
        router.refresh()
    })
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setCategory('Vibe Coding')
    setTags([])
    setSchedules([{ startDate: '', endDate: '' }])
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg my-auto"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Create New Topic</CardTitle>
                <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="pt-4 max-h-[80vh] overflow-y-auto px-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      placeholder="Topic Title" 
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-950 dark:border-neutral-800 dark:bg-neutral-950"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Vibe Coding">Vibe Coding</option>
                      <option value="Game Engine">Game Engine</option>
                      <option value="3D Modeling">3D Modeling</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <MarkdownEditor
                      value={description}
                      onChange={setDescription}
                      placeholder="What is this topic about? (Markdown supported)"
                      minHeight="min-h-[200px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tags</label>
                    <TagInput tags={tags} onChange={setTags} />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Schedule Ranges</label>
                      <Button type="button" variant="ghost" size="sm" onClick={addSchedule}>
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                    {schedules.map((schedule, index) => (
                      <div key={index} className="flex gap-4 items-end bg-neutral-50 dark:bg-neutral-900 p-3 rounded-lg relative group">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase text-neutral-500 font-bold">Start</span>
                            <Input 
                              type="date" 
                              value={schedule.startDate}
                              onChange={(e) => updateSchedule(index, 'startDate', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase text-neutral-500 font-bold">End</span>
                            <Input 
                              type="date" 
                              value={schedule.endDate}
                              onChange={(e) => updateSchedule(index, 'endDate', e.target.value)}
                            />
                          </div>
                        </div>
                        {schedules.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeSchedule(index)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading || isPending}>
                    {loading || isPending ? 'Creating...' : 'Create Topic'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
