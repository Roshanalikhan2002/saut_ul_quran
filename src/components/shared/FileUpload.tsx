import { useId, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { FileUp, Loader2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface FileUploadProps {
  accept?: string
  maxSizeBytes?: number
  disabled?: boolean
  className?: string
  onUpload: (file: File) => Promise<void> | void
  onRemove?: () => void
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileUpload({
  accept,
  maxSizeBytes,
  disabled = false,
  className,
  onUpload,
  onRemove,
}: FileUploadProps) {
  const { t } = useTranslation()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(next: File | null) {
    if (!next) return
    setError(null)

    if (maxSizeBytes && next.size > maxSizeBytes) {
      setError(t('fileUpload.maxSize', { size: formatBytes(maxSizeBytes) }))
      return
    }

    setFile(next)
    setUploading(true)
    try {
      await onUpload(next)
    } catch {
      setError(t('fileUpload.error'))
      setFile(null)
    } finally {
      setUploading(false)
    }
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null
    void handleFile(selected)
    event.target.value = ''
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setDragging(false)
    if (disabled || uploading) return
    const dropped = event.dataTransfer.files?.[0] ?? null
    void handleFile(dropped)
  }

  function clearFile() {
    setFile(null)
    setError(null)
    onRemove?.()
  }

  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled && !uploading) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface/50 px-4 py-8 text-center transition-colors',
          dragging && 'border-secondary bg-gold-soft/40',
          (disabled || uploading) && 'cursor-not-allowed opacity-60',
        )}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        ) : (
          <FileUp className="h-8 w-8 text-muted-foreground" aria-hidden />
        )}
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {uploading ? t('fileUpload.uploading') : t('fileUpload.dropHere')}
          </p>
          {accept ? (
            <p className="text-xs text-muted-foreground">
              {t('fileUpload.acceptedTypes', { types: accept })}
            </p>
          ) : null}
          {maxSizeBytes ? (
            <p className="text-xs text-muted-foreground">
              {t('fileUpload.maxSize', { size: formatBytes(maxSizeBytes) })}
            </p>
          ) : null}
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="sr-only"
          accept={accept}
          disabled={disabled || uploading}
          onChange={onChange}
        />
      </label>

      {file ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
          <span className="truncate">{file.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('fileUpload.remove')}
            onClick={clearFile}
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export { FileUpload }
