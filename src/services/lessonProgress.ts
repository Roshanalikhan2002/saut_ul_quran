import { isDemoAuthMode } from '@/lib/demoAuth'
import { supabase } from '@/lib/supabase'
import type {
  LessonProgressStatus,
  Tables,
  TablesInsert,
  TablesUpdate,
} from '@/types/database'

export type LessonProgress = Tables<'lesson_progress'>

export interface SaveProgressInput {
  studentId: string
  lessonId: string
  positionSeconds?: number
  status?: LessonProgressStatus
  percent?: number
}

/**
 * Fetch progress for one lesson (student_id + lesson_id unique).
 * `contentId` is accepted for API convenience but progress is tracked per lesson.
 */
export async function getProgress(
  studentId: string,
  lessonIdOrOpts: string | { lessonId?: string; contentId?: string },
): Promise<LessonProgress | null> {
  if (isDemoAuthMode()) {
    void studentId
    void lessonIdOrOpts
    return null
  }

  const lessonId =
    typeof lessonIdOrOpts === 'string'
      ? lessonIdOrOpts
      : lessonIdOrOpts.lessonId

  if (!lessonId) {
    // contentId alone cannot resolve progress without a lesson join; return null.
    return null
  }

  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('student_id', studentId)
    .eq('lesson_id', lessonId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function saveProgress(
  input: SaveProgressInput,
): Promise<LessonProgress> {
  const existing = await getProgress(input.studentId, input.lessonId)
  const now = new Date().toISOString()

  const progressPercent = Math.min(
    100,
    Math.max(0, input.percent ?? existing?.progress_percent ?? 0),
  )
  let status: LessonProgressStatus =
    input.status ?? existing?.status ?? 'in_progress'
  if (progressPercent >= 100) status = 'completed'
  else if (status === 'not_started' && (input.positionSeconds ?? 0) > 0) {
    status = 'in_progress'
  }

  const patch: TablesUpdate<'lesson_progress'> = {
    last_position_seconds:
      input.positionSeconds ?? existing?.last_position_seconds ?? 0,
    progress_percent: progressPercent,
    status,
    updated_at: now,
    completed_at:
      status === 'completed' ? (existing?.completed_at ?? now) : null,
  }

  if (existing) {
    const { data, error } = await supabase
      .from('lesson_progress')
      .update(patch)
      .eq('id', existing.id)
      .select('*')
      .single()
    if (error) throw error
    return data
  }

  const payload: TablesInsert<'lesson_progress'> = {
    student_id: input.studentId,
    lesson_id: input.lessonId,
    last_position_seconds: patch.last_position_seconds ?? 0,
    progress_percent: patch.progress_percent ?? 0,
    status,
    completed_at: patch.completed_at ?? null,
  }

  const { data, error } = await supabase
    .from('lesson_progress')
    .insert(payload)
    .select('*')
    .single()
  if (error) throw error
  return data
}

/** All lesson progress rows for a student within a course. */
export async function listCourseProgress(
  studentId: string,
  courseId: string,
): Promise<LessonProgress[]> {
  if (isDemoAuthMode()) {
    void studentId
    void courseId
    return []
  }

  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', courseId)

  if (lessonsError) throw lessonsError
  const lessonIds = (lessons ?? []).map((l) => l.id)
  if (lessonIds.length === 0) return []

  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('student_id', studentId)
    .in('lesson_id', lessonIds)

  if (error) throw error
  return data ?? []
}
