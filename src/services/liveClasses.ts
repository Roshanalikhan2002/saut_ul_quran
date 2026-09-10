import { isDemoAuthMode } from '@/lib/demoAuth'
import { demoListMyGroups, demoListUpcomingLive } from '@/lib/demoStore'
import { supabase } from '@/lib/supabase'
import type {
  LiveClassStatus,
  Tables,
  TablesInsert,
  TablesUpdate,
} from '@/types/database'
import { uploadFile, type StorageBucket } from '@/services/storage'

export type LiveClass = Tables<'live_classes'>
export type RecordedClass = Tables<'recorded_classes'>
export type Group = Tables<'groups'>

export type LiveClassWithCourse = LiveClass & {
  courses: (Tables<'courses'> & {
    course_translations: Tables<'course_translations'>[]
  }) | null
}

/**
 * Live video uses free external meeting links (Google Meet, Jitsi, Zoom personal
 * link, etc.). Teachers paste a URL into meeting_url — no paid Zoom/Meet API.
 * Students join by opening that URL in a new tab.
 */

export interface CreateLiveClassInput {
  titleEn: string
  titleUr?: string | null
  descriptionEn?: string | null
  descriptionUr?: string | null
  courseId?: string | null
  /** Optional group label stored in notes (no group_id column on live_classes). */
  groupId?: string | null
  groupName?: string | null
  scheduledAt: string
  endsAt?: string | null
  meetingUrl?: string | null
  hostId?: string | null
  notes?: string | null
}

function composeNotes(
  notes: string | null | undefined,
  groupId?: string | null,
  groupName?: string | null,
): string | null {
  const parts: string[] = []
  if (groupId) parts.push(`group_id=${groupId}`)
  if (groupName) parts.push(`group=${groupName}`)
  if (notes?.trim()) parts.push(notes.trim())
  return parts.length ? parts.join(' | ') : null
}

export function parseGroupFromNotes(notes: string | null): {
  groupId: string | null
  groupName: string | null
} {
  if (!notes) return { groupId: null, groupName: null }
  const idMatch = notes.match(/group_id=([0-9a-f-]{36})/i)
  const nameMatch = notes.match(/group=([^|]+)/i)
  return {
    groupId: idMatch?.[1] ?? null,
    groupName: nameMatch?.[1]?.trim() ?? null,
  }
}

export async function listUpcoming(options?: {
  courseId?: string
  includePast?: boolean
  limit?: number
}): Promise<LiveClassWithCourse[]> {
  if (isDemoAuthMode()) {
    return demoListUpcomingLive(options) as LiveClassWithCourse[]
  }

  let query = supabase
    .from('live_classes')
    .select('*, courses(*, course_translations(*))')
    .order('scheduled_at', { ascending: true })

  if (!options?.includePast) {
    query = query.in('status', ['scheduled', 'live'])
  }

  if (options?.courseId) query = query.eq('course_id', options.courseId)
  if (options?.limit) query = query.limit(options.limit)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as LiveClassWithCourse[]
}

export async function listAllLiveClasses(options?: {
  courseId?: string
}): Promise<LiveClassWithCourse[]> {
  if (isDemoAuthMode()) {
    return demoListUpcomingLive({
      ...options,
      includePast: true,
    }) as LiveClassWithCourse[]
  }

  let query = supabase
    .from('live_classes')
    .select('*, courses(*, course_translations(*))')
    .order('scheduled_at', { ascending: false })

  if (options?.courseId) query = query.eq('course_id', options.courseId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as LiveClassWithCourse[]
}

export async function createLiveClass(
  input: CreateLiveClassInput,
): Promise<LiveClass> {
  const payload: TablesInsert<'live_classes'> = {
    title_en: input.titleEn,
    title_ur: input.titleUr ?? null,
    description_en: input.descriptionEn ?? null,
    description_ur: input.descriptionUr ?? null,
    course_id: input.courseId ?? null,
    scheduled_at: input.scheduledAt,
    ends_at: input.endsAt ?? null,
    meeting_url: input.meetingUrl ?? null,
    host_id: input.hostId ?? null,
    status: 'scheduled',
    notes: composeNotes(input.notes, input.groupId, input.groupName),
  }

  const { data, error } = await supabase
    .from('live_classes')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function updateStatus(
  id: string,
  status: LiveClassStatus,
): Promise<LiveClass> {
  const patch: TablesUpdate<'live_classes'> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (status === 'ended') {
    patch.ends_at = new Date().toISOString()
  }
  if (status === 'live') {
    // keep scheduled_at; meeting may already be open
  }

  const { data, error } = await supabase
    .from('live_classes')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function setMeetingUrl(
  id: string,
  meetingUrl: string,
): Promise<LiveClass> {
  const { data, error } = await supabase
    .from('live_classes')
    .update({
      meeting_url: meetingUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function updateLiveClass(
  id: string,
  patch: TablesUpdate<'live_classes'>,
): Promise<LiveClass> {
  const { data, error } = await supabase
    .from('live_classes')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

/**
 * End a live class and attach a recording as a recorded_classes row
 * (external URL and/or uploaded file). No Zoom API — free external links only.
 */
export async function endAndAttachRecording(
  liveClassId: string,
  recording: {
    externalUrl?: string | null
    file?: File | null
    uploadedBy?: string | null
    titleEn?: string
    titleUr?: string | null
  },
): Promise<{ liveClass: LiveClass; recorded: RecordedClass | null }> {
  const { data: live, error: fetchError } = await supabase
    .from('live_classes')
    .select('*')
    .eq('id', liveClassId)
    .single()

  if (fetchError) throw fetchError

  const liveClass = await updateStatus(liveClassId, 'ended')

  let storagePath: string | null = null
  if (recording.file) {
    const courseFolder = live.course_id ?? 'general'
    const safeName = recording.file.name.replace(/[^\w.-]+/g, '_')
    const path = `${courseFolder}/${liveClassId}-${Date.now()}-${safeName}`
    const bucket: StorageBucket = 'recorded-classes'
    storagePath = await uploadFile(bucket, path, recording.file, {
      contentType: recording.file.type || 'video/mp4',
    })
  }

  const hasRecording = Boolean(recording.externalUrl || storagePath)
  if (!hasRecording) {
    return { liveClass, recorded: null }
  }

  const recordedPayload: TablesInsert<'recorded_classes'> = {
    course_id: live.course_id,
    title_en: recording.titleEn ?? `${live.title_en} (Recording)`,
    title_ur: recording.titleUr ?? live.title_ur,
    description_en: live.description_en,
    description_ur: live.description_ur,
    storage_path: storagePath,
    external_url: recording.externalUrl ?? null,
    recorded_at: new Date().toISOString(),
    uploaded_by: recording.uploadedBy ?? null,
    is_published: true,
  }

  const { data: recorded, error: recError } = await supabase
    .from('recorded_classes')
    .insert(recordedPayload)
    .select('*')
    .single()

  if (recError) throw recError

  const noteExtra = recording.externalUrl
    ? `recording=${recording.externalUrl}`
    : storagePath
      ? `recording_path=${storagePath}`
      : null

  if (noteExtra) {
    await updateLiveClass(liveClassId, {
      notes: live.notes ? `${live.notes} | ${noteExtra}` : noteExtra,
    })
  }

  return { liveClass, recorded }
}

export async function listCourseGroups(courseId?: string): Promise<Group[]> {
  if (isDemoAuthMode()) {
    return demoListMyGroups({ courseId }).map((g) => {
      const { courses: _c, ...group } = g
      void _c
      return group
    })
  }

  let query = supabase
    .from('groups')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (courseId) query = query.eq('course_id', courseId)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function listRecordings(courseId?: string): Promise<RecordedClass[]> {
  if (isDemoAuthMode()) {
    void courseId
    return []
  }

  let query = supabase
    .from('recorded_classes')
    .select('*')
    .eq('is_published', true)
    .order('recorded_at', { ascending: false })

  if (courseId) query = query.eq('course_id', courseId)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}
