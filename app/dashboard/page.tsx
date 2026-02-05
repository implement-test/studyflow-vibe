import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardView } from '@/components/dashboard-view'
import { Navbar } from '@/components/layout/navbar'
import { PageWrapper } from '@/components/page-wrapper'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: topics } = await supabase
    .from('topics')
    .select('*, topic_schedules(*)')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Navbar />
      <main className="container mx-auto py-8 px-4">
        <PageWrapper>
          <DashboardView topics={topics || []} />
        </PageWrapper>
      </main>
    </div>
  )
}

