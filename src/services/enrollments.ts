import { isDemoAuthMode } from '@/lib/demoAuth'
import { demoListEnrollments } from '@/lib/demoStore'
import { supabase } from '@/lib/supabase'
import type { EnrollmentStatus, Tables, TablesInsert, TablesUpdate } from '@/types/database'

export type Enrollment = Tables<'enrollments'>

export type EnrollmentWithCourse = Enrollment & {
  courses: Tables<'courses'> & {
    course_translations: Tables<'course_translations'>[]
  }
}

/**
 * List enrollments. Staff can filter by course/student;
 * students typically pass their own studentId (profile id).
 */
export async function listEnrollments(filters?: {
  courseId?: string
  studentId?: string
  status?: EnrollmentStatus
}): Promise<EnrollmentWithCourse[]> {
  if (isDemoAuthMode()) {
    return demoListEnrollments(filters) as EnrollmentWithCourse[]
  }

  let query = supabase
    .from('enrollments')
    .select('*, courses(*, course_translations(*))')
    .order('enrolled_at', { ascending: false })

  if (filters?.courseId) query = query.eq('course_id', filters.courseId)
  if (filters?.studentId) query = query.eq('student_id', filters.studentId)
  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as EnrollmentWithCourse[]
}

export async function getEnrollment(
  enrollmentId: string,
): Promise<Enrollment | null> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*')
    .eq('id', enrollmentId)
    .maybeSingle()

  if (error) throw error
  return data
}

/** Staff enrolls a student — students cannot self-enroll (RLS). */
export async function createEnrollment(
  input: TablesInsert<'enrollments'>,
): Promise<Enrollment> {
  const { data, error } = await supabase
    .from('enrollments')
    .insert(input)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function updateEnrollment(
  id: string,
  patch: TablesUpdate<'enrollments'>,
): Promise<Enrollment> {
  const { data, error } = await supabase
    .from('enrollments')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function setEnrollmentStatus(
  id: string,
  status: EnrollmentStatus,
): Promise<Enrollment> {
  const patch: TablesUpdate<'enrollments'> = { status }
  if (status === 'completed') {
    patch.completed_at = new Date().toISOString()
  }
  return updateEnrollment(id, patch)
}
