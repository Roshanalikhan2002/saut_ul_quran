import { listStudents, type StudentWithProfile } from '@/services/students'
import { isDemoAuthMode } from '@/lib/demoAuth'
import {
  demoApproveHifzProgress,
  demoListHifzDaily,
  demoListHifzProgress,
  demoUpsertHifzDaily,
  demoUpsertHifzProgress,
} from '@/lib/demoStore'
import { supabase } from '@/lib/supabase'
import type { HifzStatus, Tables, TablesInsert, TablesUpdate } from '@/types/database'

export type HifzProgress = Tables<'hifz_progress'>
export type HifzDailyRecord = Tables<'hifz_daily_records'>
export type Surah = Tables<'surahs'>

/** Traditional daily lesson categories stored in teacher_notes prefix. */
export type HifzLessonType = 'sabaq' | 'sabqi' | 'manzil' | 'para'

const LESSON_PREFIX = /^\[lesson:(sabaq|sabqi|manzil|para)\]\s*/i

export type HifzProgressWithSurah = HifzProgress & {
  surahs: Surah | null
}

export type HifzDailyRecordParsed = HifzDailyRecord & {
  lesson_type: HifzLessonType | null
  notes_body: string
  surahs?: Surah | null
}

export function encodeTeacherNotes(
  lessonType: HifzLessonType,
  notes?: string | null,
): string {
  const body = (notes ?? '').trim()
  return body ? `[lesson:${lessonType}] ${body}` : `[lesson:${lessonType}]`
}

export function parseTeacherNotes(raw: string | null): {
  lesson_type: HifzLessonType | null
  notes_body: string
} {
  if (!raw) return { lesson_type: null, notes_body: '' }
  const match = LESSON_PREFIX.exec(raw)
  if (!match) return { lesson_type: null, notes_body: raw }
  return {
    lesson_type: match[1].toLowerCase() as HifzLessonType,
    notes_body: raw.slice(match[0].length).trim(),
  }
}

function withParsedNotes(
  row: HifzDailyRecord & { surahs?: Surah | null },
): HifzDailyRecordParsed {
  const parsed = parseTeacherNotes(row.teacher_notes)
  return {
    ...row,
    lesson_type: parsed.lesson_type,
    notes_body: parsed.notes_body,
  }
}

/** Staff: students available for Hifz (profile id is the hifz student_id). */
export async function listStudentsForHifz(): Promise<StudentWithProfile[]> {
  return listStudents()
}

export async function getProgress(
  studentProfileId: string,
): Promise<HifzProgressWithSurah[]> {
  if (isDemoAuthMode()) {
    return demoListHifzProgress(studentProfileId) as HifzProgressWithSurah[]
  }

  const { data, error } = await supabase
    .from('hifz_progress')
    .select('*, surahs(*)')
    .eq('student_id', studentProfileId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as HifzProgressWithSurah[]
}

export async function upsertProgress(
  input: TablesInsert<'hifz_progress'>,
): Promise<HifzProgress> {
  if (isDemoAuthMode()) {
    return demoUpsertHifzProgress(input)
  }

  if (input.id) {
    const { data, error } = await supabase
      .from('hifz_progress')
      .update({
        surah_id: input.surah_id,
        ayah_from: input.ayah_from,
        ayah_to: input.ayah_to,
        status: input.status,
        notes: input.notes,
        assigned_by: input.assigned_by,
        updated_at: new Date().toISOString(),
      } satisfies TablesUpdate<'hifz_progress'>)
      .eq('id', input.id)
      .select('*')
      .single()
    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('hifz_progress')
    .insert(input)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function approveProgress(
  progressId: string,
  status: HifzStatus = 'memorized',
  notes?: string | null,
): Promise<HifzProgress> {
  if (isDemoAuthMode()) {
    return demoApproveHifzProgress(progressId, status, notes)
  }

  const { data, error } = await supabase
    .from('hifz_progress')
    .update({
      status,
      notes: notes ?? undefined,
      updated_at: new Date().toISOString(),
    } satisfies TablesUpdate<'hifz_progress'>)
    .eq('id', progressId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export interface UpsertDailyRecordInput {
  id?: string
  studentId: string
  recordDate: string
  lessonType: HifzLessonType
  surahId?: string | null
  ayahFrom?: number | null
  ayahTo?: number | null
  pagesRevised?: number | null
  qualityRating?: number | null
  notes?: string | null
  recordedBy?: string | null
}

/** Teacher: create or update a daily Hifz log (sabaq / sabqi / manzil / para). */
export async function upsertDailyRecord(
  input: UpsertDailyRecordInput,
): Promise<HifzDailyRecordParsed> {
  const payload: TablesInsert<'hifz_daily_records'> = {
    id: input.id,
    student_id: input.studentId,
    record_date: input.recordDate,
    surah_id: input.surahId ?? null,
    ayah_from: input.ayahFrom ?? null,
    ayah_to: input.ayahTo ?? null,
    pages_revised: input.pagesRevised ?? null,
    quality_rating: input.qualityRating ?? null,
    teacher_notes: encodeTeacherNotes(input.lessonType, input.notes),
    recorded_by: input.recordedBy ?? null,
  }

  if (isDemoAuthMode()) {
    return withParsedNotes(demoUpsertHifzDaily(payload))
  }

  if (input.id) {
    const { data, error } = await supabase
      .from('hifz_daily_records')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)
      .select('*, surahs(*)')
      .single()
    if (error) throw error
    return withParsedNotes(data as HifzDailyRecord & { surahs: Surah | null })
  }

  const { data, error } = await supabase
    .from('hifz_daily_records')
    .insert(payload)
    .select('*, surahs(*)')
    .single()
  if (error) throw error
  return withParsedNotes(data as HifzDailyRecord & { surahs: Surah | null })
}

export async function listDailyRecords(
  studentProfileId: string,
  limit = 60,
): Promise<HifzDailyRecordParsed[]> {
  if (isDemoAuthMode()) {
    return demoListHifzDaily(studentProfileId, limit).map((row) =>
      withParsedNotes(row),
    )
  }

  const { data, error } = await supabase
    .from('hifz_daily_records')
    .select('*, surahs(*)')
    .eq('student_id', studentProfileId)
    .order('record_date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map((row) =>
    withParsedNotes(row as HifzDailyRecord & { surahs: Surah | null }),
  )
}

/** Student read-only: own progress + recent daily records. */
export async function getStudentOwnProgress(studentProfileId: string): Promise<{
  progress: HifzProgressWithSurah[]
  daily: HifzDailyRecordParsed[]
}> {
  const [progress, daily] = await Promise.all([
    getProgress(studentProfileId),
    listDailyRecords(studentProfileId),
  ])
  return { progress, daily }
}

export function summarizeProgress(progress: HifzProgressWithSurah[]): {
  totalRanges: number
  memorized: number
  inProgress: number
  weak: number
  percentComplete: number
} {
  const totalRanges = progress.length
  const memorized = progress.filter(
    (p) => p.status === 'memorized' || p.status === 'revised',
  ).length
  const inProgress = progress.filter((p) => p.status === 'in_progress').length
  const weak = progress.filter((p) => p.status === 'weak').length
  const percentComplete =
    totalRanges === 0 ? 0 : Math.round((memorized / totalRanges) * 100)
  return { totalRanges, memorized, inProgress, weak, percentComplete }
}
