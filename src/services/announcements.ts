import { isDemoAuthMode } from '@/lib/demoAuth'
import {
  demoCreateAnnouncement,
  demoDeleteAnnouncement,
  demoListAnnouncements,
  demoUpdateAnnouncement,
} from '@/lib/demoStore'
import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database'
import { listEnrollments } from '@/services/enrollments'
import { createGroup, addMember } from '@/services/groups'

export type Announcement = Tables<'announcements'>

export type AnnouncementWithCourse = Announcement & {
  courses?: Tables<'courses'> & {
    course_translations: Tables<'course_translations'>[]
  } | null
  profiles?: Pick<Tables<'profiles'>, 'id' | 'full_name'> | null
}

export interface CreateAnnouncementInput {
  course_id?: string | null
  group_id?: string | null
  title_en: string
  title_ur?: string | null
  body_en: string
  body_ur?: string | null
  published_by?: string | null
  is_pinned?: boolean
  is_published?: boolean
  /** When true and course_id set, also post a message into an announcement group. */
  mirrorToGroup?: boolean
}

/**
 * Staff: create a course (or jamia-wide) announcement in the announcements table.
 * Optionally mirrors into a course announcement-type group for chat-style delivery.
 */
export async function createAnnouncement(
  input: CreateAnnouncementInput,
): Promise<Announcement> {
  const {
    mirrorToGroup,
    course_id,
    published_by,
    title_en,
    title_ur,
    body_en,
    body_ur,
    is_pinned = false,
    is_published = true,
    group_id,
  } = input

  if (isDemoAuthMode()) {
    return demoCreateAnnouncement({
      course_id: course_id ?? null,
      group_id: group_id ?? null,
      title_en,
      title_ur: title_ur ?? null,
      body_en,
      body_ur: body_ur ?? null,
      published_by: published_by ?? null,
      published_at: new Date().toISOString(),
      is_pinned,
      is_published,
    })
  }

  let resolvedGroupId = group_id ?? null

  if (mirrorToGroup && course_id && published_by) {
    // Find or create an announcement group for this course
    const { data: existing } = await supabase
      .from('groups')
      .select('id')
      .eq('course_id', course_id)
      .eq('group_type', 'announcement')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (existing?.id) {
      resolvedGroupId = existing.id
    } else {
      const group = await createGroup({
        name: `Announcements`,
        name_ur: 'اعلانات',
        group_type: 'announcement',
        course_id,
        description: 'Course announcements channel',
        created_by: published_by,
      })
      resolvedGroupId = group.id

      // Add enrolled students as members so they can read
      const enrollments = await listEnrollments({
        courseId: course_id,
        status: 'active',
      })
      for (const e of enrollments) {
        try {
          await addMember(group.id, e.student_id, 'member')
        } catch {
          /* ignore duplicate / RLS edge */
        }
      }
    }

    // Staff posts into announcement group (RLS: staff only)
    await supabase.from('group_messages').insert({
      group_id: resolvedGroupId,
      sender_id: published_by,
      body: `${title_en}\n\n${body_en}`,
    } satisfies TablesInsert<'group_messages'>)
  }

  const payload: TablesInsert<'announcements'> = {
    course_id: course_id ?? null,
    group_id: resolvedGroupId,
    title_en,
    title_ur: title_ur ?? null,
    body_en,
    body_ur: body_ur ?? null,
    published_by: published_by ?? null,
    published_at: new Date().toISOString(),
    is_pinned,
    is_published,
  }

  const { data, error } = await supabase
    .from('announcements')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data
}

/**
 * Staff list (all) or student list (published + enrolled / jamia-wide via RLS).
 */
export async function listAnnouncements(options?: {
  courseId?: string
  publishedOnly?: boolean
}): Promise<AnnouncementWithCourse[]> {
  if (isDemoAuthMode()) {
    return demoListAnnouncements(options) as AnnouncementWithCourse[]
  }

  let query = supabase
    .from('announcements')
    .select(
      '*, courses(*, course_translations(*)), profiles:published_by(id, full_name)',
    )
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false })

  if (options?.courseId) query = query.eq('course_id', options.courseId)
  if (options?.publishedOnly) query = query.eq('is_published', true)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as AnnouncementWithCourse[]
}

export async function getAnnouncement(
  id: string,
): Promise<AnnouncementWithCourse | null> {
  const { data, error } = await supabase
    .from('announcements')
    .select(
      '*, courses(*, course_translations(*)), profiles:published_by(id, full_name)',
    )
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data as AnnouncementWithCourse | null
}

export async function updateAnnouncement(
  id: string,
  patch: TablesUpdate<'announcements'>,
): Promise<Announcement> {
  if (isDemoAuthMode()) {
    return demoUpdateAnnouncement(id, {
      ...patch,
      updated_at: new Date().toISOString(),
    })
  }

  const { data, error } = await supabase
    .from('announcements')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function deleteAnnouncement(id: string): Promise<void> {
  if (isDemoAuthMode()) {
    demoDeleteAnnouncement(id)
    return
  }

  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) throw error
}

export async function setPinned(
  id: string,
  isPinned: boolean,
): Promise<Announcement> {
  return updateAnnouncement(id, { is_pinned: isPinned })
}
