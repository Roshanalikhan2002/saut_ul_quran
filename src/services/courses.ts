import { isDemoAuthMode } from '@/lib/demoAuth'
import {
  demoGetCourse,
  demoListCourses,
  demoListLessonContent,
  demoListLessons,
  demoGetLesson,
  demoUpsertCourse,
  demoUpsertLesson,
} from '@/lib/demoStore'
import { supabase } from '@/lib/supabase'
import {
  deleteFile,
  uploadFile,
  type StorageBucket,
} from '@/services/storage'
import type { AppLocale, Tables, TablesInsert, TablesUpdate } from '@/types/database'

export type Course = Tables<'courses'>
export type CourseTranslation = Tables<'course_translations'>
export type Lesson = Tables<'lessons'>
export type LessonTranslation = Tables<'lesson_translations'>
export type LessonContent = Tables<'lesson_content'>

export type CourseWithTranslations = Course & {
  course_translations: CourseTranslation[]
}

export type LessonWithTranslations = Lesson & {
  lesson_translations: LessonTranslation[]
}

export interface UpsertCourseInput {
  id?: string
  slug: string
  cover_image_url?: string | null
  difficulty?: string | null
  estimated_hours?: number | null
  is_published?: boolean
  sort_order?: number
  translations: Array<{
    locale: AppLocale
    title: string
    description?: string | null
  }>
}

export async function listCourses(options?: {
  publishedOnly?: boolean
}): Promise<CourseWithTranslations[]> {
  if (isDemoAuthMode()) {
    return demoListCourses(options) as CourseWithTranslations[]
  }

  let query = supabase
    .from('courses')
    .select('*, course_translations(*)')
    .order('sort_order', { ascending: true })

  if (options?.publishedOnly) {
    query = query.eq('is_published', true)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as CourseWithTranslations[]
}

export async function getCourse(
  idOrSlug: string,
): Promise<CourseWithTranslations | null> {
  if (isDemoAuthMode()) {
    return demoGetCourse(idOrSlug) as CourseWithTranslations | null
  }

  const byId = await supabase
    .from('courses')
    .select('*, course_translations(*)')
    .eq('id', idOrSlug)
    .maybeSingle()

  if (byId.data) return byId.data as CourseWithTranslations
  if (byId.error && byId.error.code !== 'PGRST116') throw byId.error

  const { data, error } = await supabase
    .from('courses')
    .select('*, course_translations(*)')
    .eq('slug', idOrSlug)
    .maybeSingle()

  if (error) throw error
  return data as CourseWithTranslations | null
}

export async function upsertCourse(
  input: UpsertCourseInput,
): Promise<CourseWithTranslations> {
  if (isDemoAuthMode()) {
    return demoUpsertCourse(input) as CourseWithTranslations
  }

  const {
    translations,
    id,
    slug,
    cover_image_url,
    difficulty,
    estimated_hours,
    is_published,
    sort_order,
  } = input

  const coursePayload: TablesInsert<'courses'> = {
    slug,
    cover_image_url: cover_image_url ?? null,
    difficulty: difficulty ?? null,
    estimated_hours: estimated_hours ?? null,
    is_published: is_published ?? false,
    sort_order: sort_order ?? 0,
  }

  let course: Course

  if (id) {
    const { data, error } = await supabase
      .from('courses')
      .update({ ...coursePayload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    course = data
  } else {
    const { data, error } = await supabase
      .from('courses')
      .insert(coursePayload)
      .select('*')
      .single()
    if (error) throw error
    course = data
  }

  for (const tr of translations) {
    const { error } = await supabase.from('course_translations').upsert(
      {
        course_id: course.id,
        locale: tr.locale,
        title: tr.title,
        description: tr.description ?? null,
      },
      { onConflict: 'course_id,locale' },
    )
    if (error) throw error
  }

  const full = await getCourse(course.id)
  if (!full) throw new Error('Course not found after upsert')
  return full
}

export async function deleteCourse(courseId: string): Promise<void> {
  const { error } = await supabase.from('courses').delete().eq('id', courseId)
  if (error) throw error
}

export async function listLessons(
  courseId: string,
): Promise<LessonWithTranslations[]> {
  if (isDemoAuthMode()) {
    return demoListLessons(courseId) as LessonWithTranslations[]
  }

  const { data, error } = await supabase
    .from('lessons')
    .select('*, lesson_translations(*)')
    .eq('course_id', courseId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []) as LessonWithTranslations[]
}

export async function getLesson(
  lessonId: string,
): Promise<LessonWithTranslations | null> {
  if (isDemoAuthMode()) {
    return demoGetLesson(lessonId) as LessonWithTranslations | null
  }

  const { data, error } = await supabase
    .from('lessons')
    .select('*, lesson_translations(*)')
    .eq('id', lessonId)
    .maybeSingle()

  if (error) throw error
  return data as LessonWithTranslations | null
}

export async function upsertLesson(
  input: TablesInsert<'lessons'> & {
    id?: string
    translations?: Array<{
      locale: AppLocale
      title: string
      summary?: string | null
    }>
  },
): Promise<LessonWithTranslations> {
  if (isDemoAuthMode()) {
    return demoUpsertLesson(input) as LessonWithTranslations
  }

  const { translations, id, ...rest } = input
  let lesson: Lesson

  if (id) {
    const { data, error } = await supabase
      .from('lessons')
      .update({ ...rest, updated_at: new Date().toISOString() } as TablesUpdate<'lessons'>)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    lesson = data
  } else {
    const { data, error } = await supabase
      .from('lessons')
      .insert(rest)
      .select('*')
      .single()
    if (error) throw error
    lesson = data
  }

  if (translations) {
    for (const tr of translations) {
      const { error } = await supabase.from('lesson_translations').upsert(
        {
          lesson_id: lesson.id,
          locale: tr.locale,
          title: tr.title,
          summary: tr.summary ?? null,
        },
        { onConflict: 'lesson_id,locale' },
      )
      if (error) throw error
    }
  }

  const full = await getLesson(lesson.id)
  if (!full) throw new Error('Lesson not found after upsert')
  return full
}

export async function listLessonContent(
  lessonId: string,
): Promise<LessonContent[]> {
  if (isDemoAuthMode()) {
    return demoListLessonContent(lessonId)
  }

  const { data, error } = await supabase
    .from('lesson_content')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function upsertLessonContent(
  input: TablesInsert<'lesson_content'> & { id?: string },
): Promise<LessonContent> {
  const { id, ...rest } = input

  if (id) {
    const { data, error } = await supabase
      .from('lesson_content')
      .update({ ...rest, updated_at: new Date().toISOString() } as TablesUpdate<'lesson_content'>)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('lesson_content')
    .insert(rest)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deleteLesson(lessonId: string): Promise<void> {
  const contents = await listLessonContent(lessonId)
  for (const item of contents) {
    await deleteLessonContent(item.id)
  }
  const { error } = await supabase.from('lessons').delete().eq('id', lessonId)
  if (error) throw error
}

export async function reorderLessons(
  courseId: string,
  orderedLessonIds: string[],
): Promise<void> {
  for (let i = 0; i < orderedLessonIds.length; i++) {
    const { error } = await supabase
      .from('lessons')
      .update({
        sort_order: i,
        updated_at: new Date().toISOString(),
      } satisfies TablesUpdate<'lessons'>)
      .eq('id', orderedLessonIds[i]!)
      .eq('course_id', courseId)
    if (error) throw error
  }
}

export async function deleteLessonContent(contentId: string): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from('lesson_content')
    .select('*')
    .eq('id', contentId)
    .maybeSingle()
  if (fetchError) throw fetchError

  if (existing?.storage_path) {
    const bucket = bucketForContentType(existing.content_type)
    if (bucket) {
      try {
        await deleteFile(bucket, existing.storage_path)
      } catch {
        // Storage cleanup is best-effort; row delete still proceeds.
      }
    }
  }

  const { error } = await supabase
    .from('lesson_content')
    .delete()
    .eq('id', contentId)
  if (error) throw error
}

function bucketForContentType(
  contentType: LessonContent['content_type'],
): StorageBucket | null {
  if (contentType === 'video') return 'course-videos'
  if (contentType === 'audio') return 'course-audio'
  if (contentType === 'pdf' || contentType === 'text' || contentType === 'image') {
    return 'course-notes'
  }
  return null
}

/**
 * Upload a lesson media/notes file to the matching storage bucket.
 * Returns the storage path (not a signed URL).
 */
export async function uploadLessonFile(input: {
  courseId: string
  lessonId: string
  contentType: LessonContent['content_type']
  file: File
}): Promise<{ bucket: StorageBucket; path: string }> {
  const bucket = bucketForContentType(input.contentType) ?? 'course-notes'
  const safeName = input.file.name.replace(/[^\w.-]+/g, '_')
  const path = `${input.courseId}/${input.lessonId}/${Date.now()}-${safeName}`
  await uploadFile(bucket, path, input.file, {
    upsert: true,
    contentType: input.file.type || undefined,
  })
  return { bucket, path }
}

export async function listCourseTeachers(
  courseId: string,
): Promise<Tables<'course_teachers'>[]> {
  const { data, error } = await supabase
    .from('course_teachers')
    .select('*')
    .eq('course_id', courseId)
    .order('assigned_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function assignCourseTeacher(input: {
  courseId: string
  teacherId: string
  isPrimary?: boolean
  assignedBy?: string | null
}): Promise<Tables<'course_teachers'>> {
  const { data, error } = await supabase
    .from('course_teachers')
    .upsert(
      {
        course_id: input.courseId,
        teacher_id: input.teacherId,
        is_primary: input.isPrimary ?? false,
        assigned_by: input.assignedBy ?? null,
      } satisfies TablesInsert<'course_teachers'>,
      { onConflict: 'course_id,teacher_id' },
    )
    .select('*')
    .single()
  if (error) throw error
  return data
}

export function pickCourseTitle(
  course: CourseWithTranslations,
  locale: AppLocale,
): string {
  const match =
    course.course_translations.find((t) => t.locale === locale) ??
    course.course_translations.find((t) => t.locale === 'en')
  return match?.title ?? course.slug
}

export function pickLessonTitle(
  lesson: LessonWithTranslations,
  locale: AppLocale,
): string {
  const match =
    lesson.lesson_translations.find((t) => t.locale === locale) ??
    lesson.lesson_translations.find((t) => t.locale === 'en')
  return match?.title ?? lesson.slug
}
