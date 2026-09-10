import { isDemoAuthMode } from '@/lib/demoAuth'
import { demoListResources } from '@/lib/demoStore'
import { supabase } from '@/lib/supabase'
import type {
  ResourceType,
  Tables,
  TablesInsert,
  TablesUpdate,
} from '@/types/database'
import {
  deleteFile,
  getSignedUrl,
  uploadFile,
  type StorageBucket,
} from '@/services/storage'

export type LibraryResource = Tables<'library_resources'>

export type LibraryResourceWithCourse = LibraryResource & {
  courses: (Tables<'courses'> & {
    course_translations: Tables<'course_translations'>[]
  }) | null
}

export interface CreateResourceInput {
  titleEn: string
  titleUr?: string | null
  descriptionEn?: string | null
  descriptionUr?: string | null
  resourceType: ResourceType
  courseId?: string | null
  externalUrl?: string | null
  isPublic?: boolean
  uploadedBy?: string | null
  file?: File | null
}

function bucketForType(type: ResourceType): StorageBucket {
  if (type === 'audio') return 'course-audio'
  if (type === 'video') return 'course-videos'
  return 'course-notes'
}

export async function listResources(filters?: {
  courseId?: string
  resourceType?: ResourceType
  publicOnly?: boolean
}): Promise<LibraryResourceWithCourse[]> {
  if (isDemoAuthMode()) {
    return demoListResources(filters) as LibraryResourceWithCourse[]
  }

  let query = supabase
    .from('library_resources')
    .select('*, courses(*, course_translations(*))')
    .order('created_at', { ascending: false })

  if (filters?.courseId) query = query.eq('course_id', filters.courseId)
  if (filters?.resourceType) {
    query = query.eq('resource_type', filters.resourceType)
  }
  if (filters?.publicOnly) query = query.eq('is_public', true)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as LibraryResourceWithCourse[]
}

export async function createResource(
  input: CreateResourceInput,
): Promise<LibraryResource> {
  let storagePath: string | null = null

  if (input.file) {
    const folder = input.courseId ?? 'general'
    const safeName = input.file.name.replace(/[^\w.-]+/g, '_')
    const path = `${folder}/${Date.now()}-${safeName}`
    const bucket = bucketForType(input.resourceType)
    storagePath = await uploadFile(bucket, path, input.file, {
      contentType: input.file.type || undefined,
    })
  }

  const payload: TablesInsert<'library_resources'> = {
    title_en: input.titleEn,
    title_ur: input.titleUr ?? null,
    description_en: input.descriptionEn ?? null,
    description_ur: input.descriptionUr ?? null,
    resource_type: input.resourceType,
    course_id: input.courseId ?? null,
    storage_path: storagePath,
    external_url: input.externalUrl ?? null,
    is_public: input.isPublic ?? false,
    uploaded_by: input.uploadedBy ?? null,
  }

  const { data, error } = await supabase
    .from('library_resources')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function updateResource(
  id: string,
  patch: TablesUpdate<'library_resources'>,
): Promise<LibraryResource> {
  const { data, error } = await supabase
    .from('library_resources')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function deleteResource(id: string): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from('library_resources')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) throw fetchError

  if (existing?.storage_path) {
    const bucket = bucketForType(existing.resource_type)
    try {
      await deleteFile(bucket, existing.storage_path)
    } catch {
      // Continue deleting DB row even if storage remove fails
    }
  }

  const { error } = await supabase
    .from('library_resources')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getResourceDownloadUrl(
  resource: LibraryResource,
): Promise<string | null> {
  if (resource.external_url) return resource.external_url
  if (!resource.storage_path) return null
  const bucket = bucketForType(resource.resource_type)
  return getSignedUrl(bucket, resource.storage_path, 3600)
}
