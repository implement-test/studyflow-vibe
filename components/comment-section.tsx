'use client'

import { useState, useEffect } from 'react'
import { CommentWithChildren } from '@/types/comment'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, Reply, Trash2, Edit2, Paperclip, FileIcon, X as XIcon } from 'lucide-react'
import { cn } from '@/utils/cn'
import { FileUploader } from './file-uploader'
import { toast } from 'sonner'
import { MarkdownEditor } from './markdown-editor'
import { MarkdownRenderer } from './markdown-renderer'

interface CommentSectionProps {
  topicId: string
  initialComments: CommentWithChildren[]
  currentUserId: string
}

export function CommentSection({ topicId, initialComments, currentUserId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null)
  const [attachmentType, setAttachmentType] = useState<string | null>(null)
  const [showUploader, setShowUploader] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() && !attachmentUrl) return

    setLoading(true)
    const { data: comment, error } = await supabase.from('comments').insert({
      topic_id: topicId,
      user_id: currentUserId,
      content: newComment,
    }).select().single()

    if (error) {
        toast.error('Failed to post comment.')
    } else if (comment && attachmentUrl) {
      const { error: attachError } = await supabase.from('attachments').insert({
        comment_id: comment.id,
        file_url: attachmentUrl,
        file_type: attachmentType,
        uploaded_by: currentUserId
      })
      if (attachError) toast.error('Comment posted, but attachment failed.')
    }

    if (!error) {
      toast.success('Comment posted!')
      setNewComment('')
      setAttachmentUrl(null)
      setAttachmentType(null)
      setShowUploader(false)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Comments</h3>
      <div className="space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <MarkdownEditor
              value={newComment}
              onChange={setNewComment}
              placeholder="Write a comment... (Markdown supported)"
              minHeight="min-h-[100px]"
            />
            
            <div className="flex justify-between items-center mt-2">
                 <div className="flex items-center gap-2">
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowUploader(!showUploader)}
                        className={cn(showUploader && "bg-neutral-100 dark:bg-neutral-800")}
                    >
                        <Paperclip className="h-4 w-4 mr-2" /> Attach File
                    </Button>
                 </div>
                 <Button type="submit" disabled={loading}>
                    Post Comment
                 </Button>
            </div>
          </div>
          
          {showUploader && (
            <div className="p-2 border rounded-md border-neutral-200 dark:border-neutral-800">
                <FileUploader onUploadSuccess={(url, type) => {
                    setAttachmentUrl(url)
                    setAttachmentType(type)
                }} />
            </div>
          )}

          {attachmentUrl && (
            <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400 p-2 rounded-md">
                <FileIcon className="h-3 w-3" />
                <span className="truncate flex-1">{attachmentUrl.split('/').pop()}</span>
                <button type="button" onClick={() => { setAttachmentUrl(null); setAttachmentType(null); }}>
                    <XIcon className="h-3 w-3" />
                </button>
            </div>
          )}
        </form>
      </div>
      <div className="space-y-4">
        {initialComments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} currentUserId={currentUserId} topicId={topicId} />
        ))}
      </div>
    </div>
  )
}

function CommentItem({ comment, currentUserId, topicId }: { comment: CommentWithChildren, currentUserId: string, topicId: string }) {
  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [editContent, setEditContent] = useState(comment.content)
  const [attachments, setAttachments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchAttachments()
  }, [comment.id])

  const fetchAttachments = async () => {
    const { data } = await supabase.from('attachments').select('*').eq('comment_id', comment.id)
    if (data) setAttachments(data)
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim()) return

    setLoading(true)
    const { error } = await supabase.from('comments').insert({
      topic_id: topicId,
      user_id: currentUserId,
      parent_id: comment.id,
      content: replyContent,
    })

    if (!error) {
      toast.success('Reply posted!')
      setReplyContent('')
      setIsReplying(false)
      router.refresh()
    } else {
        toast.error('Failed to post reply.')
    }
    setLoading(false)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editContent.trim()) return

    setLoading(true)
    const { error } = await supabase
      .from('comments')
      .update({ content: editContent })
      .eq('id', comment.id)

    if (!error) {
      toast.success('Comment updated!')
      setIsEditing(false)
      router.refresh()
    } else {
        toast.error('Failed to update comment.')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    setLoading(true)
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', comment.id)

    if (!error) {
      toast.success('Comment deleted.')
      router.refresh()
    } else {
        toast.error('Failed to delete comment.')
    }
    setLoading(false)
  }

  const isOwner = currentUserId === comment.user_id

  return (
    <div className={cn("flex flex-col gap-2", comment.parent_id && "pl-4 border-l border-neutral-200 dark:border-neutral-800")}>
      <div className="flex gap-3">
        <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold">
            {comment.profiles?.username?.[0] || 'U'}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{comment.profiles?.username || 'Unknown User'}</span>
            <span className="text-xs text-neutral-500">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              {comment.updated_at !== comment.created_at && " (edited)"}
            </span>
          </div>
          
          {isEditing ? (
            <form onSubmit={handleEdit} className="mt-1 flex flex-col gap-2">
              <MarkdownEditor
                value={editContent}
                onChange={setEditContent}
                minHeight="min-h-[100px]"
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button size="sm" type="submit" disabled={loading}>Save Changes</Button>
              </div>
            </form>
          ) : (
            <div className="space-y-2">
                <div className="text-sm mt-1">
                    <MarkdownRenderer content={comment.content} />
                </div>
                {attachments.map(a => (
                    <div key={a.id} className="mt-2">
                        {a.file_type.startsWith('image/') ? (
                            <img src={a.file_url} alt="attachment" className="max-w-xs rounded-lg border dark:border-neutral-800" />
                        ) : (
                            <a href={a.file_url} target="_blank" className="flex items-center gap-2 text-xs text-blue-600 hover:underline">
                                <FileIcon className="h-3 w-3" />
                                {a.file_url.split('/').pop()}
                            </a>
                        )}
                    </div>
                ))}
            </div>
          )}
          
          <div className="flex gap-3 mt-2">
            <button 
                onClick={() => setIsReplying(!isReplying)}
                className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition-colors"
            >
                <Reply className="h-3 w-3" /> Reply
            </button>
            {isOwner && !isEditing && (
              <>
                <button 
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition-colors"
                >
                    <Edit2 className="h-3 w-3" /> Edit
                </button>
                <button 
                    onClick={handleDelete}
                    className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                >
                    <Trash2 className="h-3 w-3" /> Delete
                </button>
              </>
            )}
          </div>

          {isReplying && (
             <form onSubmit={handleReply} className="mt-4 flex flex-col gap-2 bg-neutral-50 dark:bg-neutral-900/50 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <MarkdownEditor
                  value={replyContent}
                  onChange={setReplyContent}
                  placeholder="Write a reply..."
                  minHeight="min-h-[100px]"
                />
                <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => setIsReplying(false)}>Cancel</Button>
                    <Button size="sm" type="submit" disabled={loading}>Reply</Button>
                </div>
             </form>
          )}
        </div>
      </div>
      {/* Recursively render children */}
      {comment.children && comment.children.length > 0 && (
        <div className="mt-2 space-y-4">
          {comment.children.map((child) => (
            <CommentItem key={child.id} comment={child} currentUserId={currentUserId} topicId={topicId} />
          ))}
        </div>
      )}
    </div>
  )
}