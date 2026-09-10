import { supabase } from '@/lib/supabase'

export type StorageBucket =
  | 'course-videos'
  | 'course-audio'
  | 'course-notes'
  | 'recorded-classes'
  | 'dua-audio'
  | 'ayah-audio'
  | 'logos'
  | 'certificates'
  | 'chat-media'

export interface UploadOptions {
  upsert?: boolean
  contentType?: string
  cacheControl?: string
}

export interface FileValidationOptions {
  /** Allowed MIME types, e.g. ['audio/mpeg', 'application/pdf'] */
  allowedTypes?: string[]
  /** Max size in bytes */
  maxSizeBytes?: number
}

export class FileValidationError extends Error {
  readonly code: 'type' | 'size' | 'empty'

  constructor(code: 'type' | 'size' | 'empty', message: string) {
    super(message)
    this.name = 'FileValidationError'
    this.code = code
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Validate file MIME type and size before upload.
 * Throws FileValidationError with a clear message on failure.
 */
export function validateFile(
  file: File | Blob,
  options: FileValidationOptions = {},
): void {
  const size = file.size
  if (!size || size <= 0) {
    throw new FileValidationError('empty', 'File is empty or unreadable.')
  }

  if (options.maxSizeBytes != null && size > options.maxSizeBytes) {
    throw new FileValidationError(
      'size',
      `File is too large (${formatBytes(size)}). Maximum allowed is ${formatBytes(options.maxSizeBytes)}.`,
    )
  }

  const mime =
    'type' in file && typeof file.type === 'string' ? file.type : ''
  if (options.allowedTypes && options.allowedTypes.length > 0) {
    const allowed = options.allowedTypes
    const ok =
      mime &&
      allowed.some(
        (t) =>
          t === mime ||
          (t.endsWith('/*') && mime.startsWith(t.slice(0, -1))),
      )
    if (!ok) {
      throw new FileValidationError(
        'type',
        mime
          ? `File type "${mime}" is not allowed. Accepted: ${allowed.join(', ')}.`
          : `File type could not be detected. Accepted: ${allowed.join(', ')}.`,
      )
    }
  }
}

/**
 * Upload a file to a Supabase Storage bucket.
 * Returns the storage path (not a signed URL).
 * Pass validation options to reject oversize / wrong-type files early.
 */
export async function uploadFile(
  bucket: StorageBucket,
  path: string,
  file: File | Blob,
  options: UploadOptions & FileValidationOptions = {},
): Promise<string> {
  if (options.allowedTypes || options.maxSizeBytes != null) {
    validateFile(file, {
      allowedTypes: options.allowedTypes,
      maxSizeBytes: options.maxSizeBytes,
    })
  }

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: options.upsert ?? false,
    contentType: options.contentType,
    cacheControl: options.cacheControl ?? '3600',
  })
  if (error) throw error
  return path
}

export async function deleteFile(
  bucket: StorageBucket,
  path: string,
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw error
}

export async function deleteFiles(
  bucket: StorageBucket,
  paths: string[],
): Promise<void> {
  if (paths.length === 0) return
  const { error } = await supabase.storage.from(bucket).remove(paths)
  if (error) throw error
}

export async function getSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn = 3600,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)
  if (error) throw error
  return data.signedUrl
}

export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
