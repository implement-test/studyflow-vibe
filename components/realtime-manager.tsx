'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function RealtimeManager() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // Subscribe to comments
    const commentsChannel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
        },
        (payload) => {
          console.log('Comment change received!', payload)
          router.refresh()
        }
      )
      .subscribe()

    // Subscribe to topics
    const topicsChannel = supabase
      .channel('topics-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'topics',
        },
        (payload) => {
          console.log('Topic change received!', payload)
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(commentsChannel)
      supabase.removeChannel(topicsChannel)
    }
  }, [router, supabase])

  return null
}
