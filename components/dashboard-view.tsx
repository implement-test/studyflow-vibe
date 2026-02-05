'use client'

import { useState } from 'react'
import { TopicWithSchedules } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LayoutGrid, List as ListIcon, Plus, ChevronLeft, ChevronRight, Search, ArrowUpDown, CheckCircle2, Circle, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isWithinInterval
} from 'date-fns'
import { CreateTopicModal } from '@/components/create-topic-modal'
import { cn } from '@/utils/cn'

interface DashboardViewProps {
  topics: TopicWithSchedules[]
}

type SortOption = 'newest' | 'oldest' | 'az' | 'za'

export function DashboardView({ topics }: DashboardViewProps) {
  const [view, setView] = useState<'calendar' | 'list'>('list')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const categories = ['All', 'Vibe Coding', 'Game Engine', '3D Modeling']

  // 1. Filter by Category
  let processedTopics = selectedCategory === 'All' 
    ? topics 
    : topics.filter(t => t.category === selectedCategory)

  // 2. Filter by Search Query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    processedTopics = processedTopics.filter(t => 
      t.title.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query) ||
      t.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // 3. Sort
  processedTopics = [...processedTopics].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'az':
        return a.title.localeCompare(b.title)
      case 'za':
        return b.title.localeCompare(a.title)
      default:
        return 0
    }
  })

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  })

  const getTopicsForDay = (day: Date) => {
    return topics.filter(topic => 
      topic.topic_schedules.some(schedule => {
        const start = new Date(schedule.start_date)
        const end = new Date(schedule.end_date)
        return isWithinInterval(day, { start, end }) || isSameDay(day, start) || isSameDay(day, end)
      })
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-950">
            <Button
              variant={view === 'calendar' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('calendar')}
              className="px-2"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
              className="px-2"
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Topic
          </Button>
        </div>
      </div>

      <CreateTopicModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map(cat => (
            <Button
                key={cat}
                variant={selectedCategory === cat ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="whitespace-nowrap rounded-full"
            >
                {cat}
            </Button>
            ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                <Input 
                    placeholder="Search topics..." 
                    className="pl-9 h-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="relative">
                <select 
                    className="h-9 rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 dark:border-neutral-800 dark:bg-neutral-950 dark:focus-visible:ring-neutral-300"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="az">A-Z</option>
                    <option value="za">Z-A</option>
                </select>
            </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={view + selectedCategory + searchQuery + sortBy + topics.length}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {view === 'list' ? (
            <motion.div 
              className="space-y-4"
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
            >
              {processedTopics.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-neutral-100 dark:border-neutral-800 rounded-xl">
                  <div className="h-12 w-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                     <Search className="h-6 w-6 text-neutral-400" />
                  </div>
                  <p className="text-neutral-500 font-medium">No topics found</p>
                  <p className="text-neutral-400 text-sm mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                processedTopics.map((topic) => (
                  <motion.div
                    key={topic.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0 }
                    }}
                  >
                    <Link href={`/topic/${topic.id}`}>
                      <Card className="hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer border-l-4 border-l-black dark:border-l-white group">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {topic.title}
                            </CardTitle>
                            <div className="flex gap-2">
                                <span className={cn(
                                    "flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border",
                                    topic.status === 'Done' ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900" :
                                    topic.status === 'In Progress' ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900" :
                                    "bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800"
                                )}>
                                    {topic.status === 'Done' ? <CheckCircle2 className="h-3 w-3" /> :
                                     topic.status === 'In Progress' ? <Clock className="h-3 w-3" /> :
                                     <Circle className="h-3 w-3" />}
                                    {topic.status || 'Not Started'}
                                </span>
                                <span className="text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-full">
                                {topic.category}
                                </span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-neutral-500 line-clamp-2">
                            {topic.description}
                          </p>
                          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                            {topic.tags?.map((tag) => (
                              <span
                                key={tag}
                                className="text-xs text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950 px-2 py-0.5 rounded whitespace-nowrap"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))
              )}
            </motion.div>
          ) : (
            <div className="bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
              <div className="p-4 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
                <h2 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={prevMonth} className="h-8 w-8 p-0">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={nextMonth} className="h-8 w-8 p-0">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-7 border-b border-neutral-200 dark:border-neutral-800">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-2 text-center text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {calendarDays.map((day, i) => {
                  const dayTopics = processedTopics.filter(topic => 
                    topic.topic_schedules.some(schedule => {
                      const start = new Date(schedule.start_date)
                      const end = new Date(schedule.end_date)
                      return isWithinInterval(day, { start, end }) || isSameDay(day, start) || isSameDay(day, end)
                    })
                  )
                  return (
                    <div 
                      key={day.toString()} 
                      className={cn(
                        "min-h-[120px] p-2 border-r border-b border-neutral-200 dark:border-neutral-800 last:border-r-0",
                        !isSameMonth(day, monthStart) && "bg-neutral-50/50 dark:bg-neutral-900/50"
                      )}
                    >
                      <div className={cn(
                        "text-xs mb-2 font-medium",
                        isSameDay(day, new Date()) ? "text-blue-600 dark:text-blue-400 font-bold" : "text-neutral-500"
                      )}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayTopics.map(topic => (
                          <Link key={topic.id} href={`/topic/${topic.id}`}>
                            <div className="text-[10px] px-1.5 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black truncate hover:opacity-80 transition-opacity">
                              {topic.title}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

    </div>
  )
}

