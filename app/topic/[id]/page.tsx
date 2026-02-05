import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CommentSection } from '@/components/comment-section'
import { AttachmentSection } from '@/components/attachment-section'
import { PageWrapper } from '@/components/page-wrapper'
import { TopicHeader } from '@/components/topic-header'
import { Comment, CommentWithChildren } from '@/types/comment'
import { format } from 'date-fns'
import { MarkdownRenderer } from '@/components/markdown-renderer'

interface TopicPageProps {
  params: Promise<{
    id: string
  }>
}

// Helper to nest comments
function nestComments(comments: Comment[]): CommentWithChildren[] {
  const commentMap = new Map<string, CommentWithChildren>();
  const roots: CommentWithChildren[] = [];

  comments.forEach((c) => {
    commentMap.set(c.id, { ...c, children: [] });
  });

  comments.forEach((c) => {
    const node = commentMap.get(c.id)!;
    if (c.parent_id) {
      const parent = commentMap.get(c.parent_id);
      if (parent) {
        parent.children?.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch Topic
  const { data: topic, error: topicError } = await supabase
    .from('topics')
    .select('*, topic_schedules(*), profiles(username)')
    .eq('id', id)
    .single()

  if (topicError || !topic) {
    notFound()
  }

  const isOwner = user.id === topic.created_by

  // Fetch Comments
  const { data: commentsData } = await supabase
    .from('comments')
    .select('*, profiles(username, avatar_url)')
    .eq('topic_id', id)
    .order('created_at', { ascending: true })

  const nestedComments = nestComments(commentsData as any[] || [])

  // Fetch Attachments
  const { data: attachmentsData } = await supabase
    .from('attachments')
    .select('*')
    .eq('topic_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Navbar />
      <main className="container mx-auto py-8 px-4">
        <PageWrapper>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                  <Card>
                      <TopicHeader topic={topic} isOwner={isOwner} />
                      <CardContent className="space-y-4">
                           <div className="text-sm text-neutral-500">
                              Posted by {topic.profiles?.username} on {format(new Date(topic.created_at), 'MMM d, yyyy')}
                           </div>
                           <div className="mt-4">
                              <MarkdownRenderer content={topic.description} />
                           </div>

                           {/* Schedule Display */}
                           {topic.topic_schedules && topic.topic_schedules.length > 0 && (
                               <div className="mt-6 border-t pt-4 border-neutral-100 dark:border-neutral-800">
                                  <h4 className="font-semibold mb-2">Schedule</h4>
                                  <ul className="list-disc list-inside space-y-1">
                                      {topic.topic_schedules.map((s: any) => (
                                          <li key={s.id} className="text-sm">
                                              {format(new Date(s.start_date), 'PPP p')} - {format(new Date(s.end_date), 'PPP p')}
                                          </li>
                                      ))}
                                  </ul>
                               </div>
                           )}
                      </CardContent>
                  </Card>

                  <CommentSection 
                      topicId={topic.id} 
                      initialComments={nestedComments} 
                      currentUserId={user.id} 
                  />
              </div>
              
              <div className="space-y-6">
                  <AttachmentSection 
                      topicId={topic.id} 
                      initialAttachments={attachmentsData || []} 
                      currentUserId={user.id} 
                  />
              </div>
          </div>
        </PageWrapper>
      </main>
    </div>
  )
}