export type Topic = {
  id: string
  title: string
  description: string | null
  category: 'Vibe Coding' | 'Game Engine' | '3D Modeling' | null
  tags: string[] | null
  status: 'Not Started' | 'In Progress' | 'Done'
  created_by: string
  created_at: string
  updated_at: string
}

export type TopicSchedule = {
  id: string
  topic_id: string
  start_date: string
  end_date: string
}

export type TopicWithSchedules = Topic & {
  topic_schedules: TopicSchedule[]
}
