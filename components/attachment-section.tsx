'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileUploader } from './file-uploader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileIcon, ExternalLink, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface Attachment {
  id: string
  file_url: string
  file_type: string
  created_at: string
}

interface AttachmentSectionProps {
  topicId: string
  initialAttachments: Attachment[]
  currentUserId: string
}

export function AttachmentSection({ topicId, initialAttachments, currentUserId }: AttachmentSectionProps) {
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments)
  const supabase = createClient()
  const router = useRouter()

  const handleUploadSuccess = async (url: string, type: string) => {
    const { data, error } = await supabase
      .from('attachments')
      .insert({
        topic_id: topicId,
        file_url: url,
        file_type: type,
        uploaded_by: currentUserId
      })
      .select()
      .single()

    if (!error && data) {
      setAttachments([...attachments, data])
      router.refresh()
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('attachments')
      .delete()
      .eq('id', id)

    if (!error) {
      setAttachments(attachments.filter(a => a.id !== id))
      router.refresh()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attachments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {attachments.length === 0 ? (
            <p className="text-sm text-neutral-500">No attachments yet.</p>
          ) : (
            attachments.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-2 rounded-md border border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileIcon className="h-4 w-4 shrink-0 text-neutral-500" />
                  <a 
                    href={a.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm truncate hover:underline text-blue-600 dark:text-blue-400"
                  >
                    {a.file_url.split('/').pop()}
                  </a>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)}>
                   <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            ))
          )}
        </div>
        
        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <FileUploader onUploadSuccess={handleUploadSuccess} />
        </div>
      </CardContent>
    </Card>
  )
}
