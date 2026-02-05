'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { X, Plus, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TopicWithSchedules } from '@/types'
import { TagInput } from './tag-input'
import { MarkdownEditor } from './markdown-editor'
import { toast } from 'sonner'

interface EditTopicModalProps {
  isOpen: boolean
  onClose: () => void
  topic: TopicWithSchedules
}

interface ScheduleRange {
  id?: string
  startDate: string
  endDate: string
}

type Category = 'Vibe Coding' | 'Game Engine' | '3D Modeling'

export function EditTopicModal({ isOpen, onClose, topic }: EditTopicModalProps) {
  const [title, setTitle] = useState(topic.title)
  const [description, setDescription] = useState(topic.description || '')
  const [category, setCategory] = useState<Category>((topic.category as Category) || 'Vibe Coding')
  const [tags, setTags] = useState<string[]>(topic.tags || [])
  const [schedules, setSchedules] = useState<ScheduleRange[]>(
    topic.topic_schedules.map(s => ({
      id: s.id,
      startDate: new Date(s.start_date).toISOString().slice(0, 10),
      endDate: new Date(s.end_date).toISOString().slice(0, 10)
    }))
  )
  const [loading, setLoading] = useState(false)
  
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
    
    // Update Topic
    const { error: topicError } = await supabase
      .from('topics')
      .update({
        title,
        description,
        category,
        tags,
        updated_at: new Date().toISOString()
      })
      .eq('id', topic.id)

    if (topicError) {
      toast.error(topicError.message)
      setLoading(false)
      return
    }

    // Handle Schedules: Delete all and re-insert for simplicity in this prototype
    const { error: deleteError } = await supabase.from('topic_schedules').delete().eq('topic_id', topic.id)
    if (deleteError) {
        toast.error('Failed to update schedules.')
        setLoading(false)
        return
    }

    const validSchedules = schedules
      .filter(s => s.startDate && s.endDate)
      .map(s => ({
        topic_id: topic.id,
        start_date: new Date(s.startDate).toISOString(),
        end_date: new Date(s.endDate).toISOString()
      }))

    if (validSchedules.length > 0) {
      const { error: insertError } = await supabase.from('topic_schedules').insert(validSchedules)
      if (insertError) {
          toast.error('Topic updated, but failed to save new schedules.')
      }
    }

    toast.success('Topic updated successfully!')
    setLoading(false)
    onClose()
    router.refresh()
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this entire topic? This cannot be undone.')) return
    
    setLoading(true)
    const { error } = await supabase.from('topics').delete().eq('id', topic.id)
    
    if (!error) {
      toast.success('Topic deleted.')
      router.push('/dashboard')
      router.refresh()
    } else {
      toast.error('Failed to delete topic.')
      setLoading(false)
    }
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
                <CardTitle>Edit Topic</CardTitle>
                <div className="flex gap-2">
                    <button type="button" onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors">
                        <Trash2 className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>
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
                      onChange={(e) => setCategory(e.target.value as Category)}
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

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
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