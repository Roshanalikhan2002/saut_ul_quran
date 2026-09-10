import { isDemoAuthMode } from '@/lib/demoAuth'
import { demoGetAttendancePercentage } from '@/lib/demoStore'
import { supabase } from '@/lib/supabase'
import type {
  AttendanceStatus,
  Tables,
  TablesInsert,
  TablesUpdate,
} from '@/types/database'

export type AttendanceSession = Tables<'attendance_sessions'>
export type AttendanceRecord = Tables<'attendance_records'>

export type AttendanceSessionWithCourse = AttendanceSession & {
  courses: Tables<'courses'> & {
    course_translations: Tables<'course_translations'>[]
  }
}

export type AttendanceRecordWithSession = AttendanceRecord & {
  attendance_sessions: AttendanceSessionWithCourse
  profiles?: Tables<'profiles'> | null
}

export type AttendanceRecordWithProfile = AttendanceRecord & {
  profiles: Tables<'profiles'> | null
}

export type AttendanceSessionDetail = AttendanceSessionWithCourse & {
  attendance_records: AttendanceRecordWithProfile[]
}

export interface CreateSessionInput {
  courseId: string
  teacherId?: string | null
  sessionDate: string
  title?: string | null
  notes?: string | null
}

export interface MarkRecordInput {
  studentId: string
  status: AttendanceStatus
  notes?: string | null
}

export async function createSession(
  input: CreateSessionInput,
): Promise<AttendanceSession> {
  const payload: TablesInsert<'attendance_sessions'> = {
    course_id: input.courseId,
    teacher_id: input.teacherId ?? null,
    session_date: input.sessionDate,
    title: input.title ?? null,
    notes: input.notes ?? null,
  }

  const { data, error } = await supabase
    .from('attendance_sessions')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data
}

/** Bulk upsert attendance records for a session (unique session_id + student_id). */
export async function markRecords(
  sessionId: string,
  records: MarkRecordInput[],
  markedBy?: string | null,
): Promise<AttendanceRecord[]> {
  if (records.length === 0) return []

  const rows: TablesInsert<'attendance_records'>[] = records.map((r) => ({
    session_id: sessionId,
    student_id: r.studentId,
    status: r.status,
    notes: r.notes ?? null,
    marked_by: markedBy ?? null,
    marked_at: new Date().toISOString(),
  }))

  const { data, error } = await supabase
    .from('attendance_records')
    .upsert(rows, { onConflict: 'session_id,student_id' })
    .select('*')

  if (error) throw error
  return data ?? []
}

export async function updateRecord(
  recordId: string,
  patch: TablesUpdate<'attendance_records'>,
): Promise<AttendanceRecord> {
  const { data, error } = await supabase
    .from('attendance_records')
    .update({
      ...patch,
      marked_at: patch.marked_at ?? new Date().toISOString(),
    })
    .eq('id', recordId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function listSessions(filters?: {
  courseId?: string
  dateFrom?: string
  dateTo?: string
  studentId?: string
}): Promise<AttendanceSessionDetail[]> {
  if (isDemoAuthMode()) {
    void filters
    return []
  }

  let query = supabase
    .from('attendance_sessions')
    .select(
      '*, courses(*, course_translations(*)), attendance_records(*, profiles(*))',
    )
    .order('session_date', { ascending: false })

  if (filters?.courseId) query = query.eq('course_id', filters.courseId)
  if (filters?.dateFrom) query = query.gte('session_date', filters.dateFrom)
  if (filters?.dateTo) query = query.lte('session_date', filters.dateTo)

  const { data, error } = await query
  if (error) throw error

  let sessions = (data ?? []) as AttendanceSessionDetail[]

  if (filters?.studentId) {
    sessions = sessions
      .map((s) => ({
        ...s,
        attendance_records: s.attendance_records.filter(
          (r) => r.student_id === filters.studentId,
        ),
      }))
      .filter((s) => s.attendance_records.length > 0)
  }

  return sessions
}

export async function getStudentAttendanceHistory(
  studentProfileId: string,
  options?: { courseId?: string; limit?: number },
): Promise<AttendanceRecordWithSession[]> {
  if (isDemoAuthMode()) {
    void studentProfileId
    void options
    return []
  }

  let query = supabase
    .from('attendance_records')
    .select(
      '*, attendance_sessions(*, courses(*, course_translations(*)))',
    )
    .eq('student_id', studentProfileId)
    .order('marked_at', { ascending: false })

  if (options?.limit) query = query.limit(options.limit)

  const { data, error } = await query
  if (error) throw error

  let rows = (data ?? []) as AttendanceRecordWithSession[]
  if (options?.courseId) {
    rows = rows.filter(
      (r) => r.attendance_sessions?.course_id === options.courseId,
    )
  }
  return rows
}

/**
 * Attendance rate from attended count over total sessions.
 * Callers typically pass present+late as `present`.
 */
export function calcAttendancePercentage(
  present: number,
  total: number,
): number {
  if (total <= 0) return 0
  return Math.round((present / total) * 100)
}

/** Present + late count as attended for percentage. */
export async function getAttendancePercentage(
  studentProfileId: string,
  courseId?: string,
): Promise<{
  percentage: number
  total: number
  present: number
  absent: number
  late: number
  excused: number
}> {
  if (isDemoAuthMode()) {
    void studentProfileId
    void courseId
    return demoGetAttendancePercentage()
  }

  const history = await getStudentAttendanceHistory(studentProfileId, {
    courseId,
  })

  const total = history.length
  let present = 0
  let absent = 0
  let late = 0
  let excused = 0

  for (const row of history) {
    if (row.status === 'present') present += 1
    else if (row.status === 'absent') absent += 1
    else if (row.status === 'late') late += 1
    else if (row.status === 'excused') excused += 1
  }

  const attended = present + late
  const percentage = calcAttendancePercentage(attended, total)

  return { percentage, total, present, absent, late, excused }
}
