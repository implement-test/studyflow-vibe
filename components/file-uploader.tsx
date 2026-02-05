'use client'

import { useState } from 'react'
import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, Upload, FileIcon, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { toast } from 'sonner'

interface FileUploaderProps {
  onUploadSuccess: (url: string, type: string) => void
  bucketName?: string
}

export function FileUploader({ onUploadSuccess, bucketName = 'project_files' }: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit.')
      toast.error('File size exceeds 5MB limit.')
      return
    }

    setError(null)
    setIsUploading(true)
    const toastId = toast.loading('Uploading...')

    try {
      let fileToUpload = file

      // Compress if it's an image
      if (file.type.startsWith('image/')) {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        }
        fileToUpload = await imageCompression(file, options)
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError, data } = await supabase.storage
        .from(bucketName)
        .upload(filePath, fileToUpload)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath)

      setPreview(file.type.startsWith('image/') ? publicUrl : null)
      toast.success('File uploaded successfully!', { id: toastId })
      onUploadSuccess(publicUrl, file.type)
    } catch (err: any) {
      const msg = err.message || 'Failed to upload file.'
      setError(msg)
      toast.error(msg, { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "relative border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg p-6 transition-colors",
          isUploading ? "bg-neutral-50 dark:bg-neutral-900" : "hover:bg-neutral-50 dark:hover:bg-neutral-900"
        )}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          onChange={handleFileChange}
          disabled={isUploading}
          accept="image/*,application/pdf"
        />
        <div className="flex flex-col items-center justify-center text-sm text-neutral-500">
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p>Uploading and compressing...</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 mb-2" />
              <p>Click or drag to upload (max 5MB)</p>
              <p className="text-xs mt-1">Images will be automatically resized</p>
            </>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {preview && (
        <div className="relative w-24 h-24 rounded-md overflow-hidden border border-neutral-200 dark:border-neutral-800">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <button
            onClick={() => setPreview(null)}
            className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}
