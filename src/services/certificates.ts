import { isDemoAuthMode } from '@/lib/demoAuth'
import { demoListCertificates, demoVerifyCertificate } from '@/lib/demoStore'
import { supabase } from '@/lib/supabase'
import type {
  CertificateStatus,
  Tables,
  TablesInsert,
  TablesUpdate,
} from '@/types/database'

export type Certificate = Tables<'certificates'>

export type CertificateWithDetails = Certificate & {
  profiles?: Pick<
    Tables<'profiles'>,
    'id' | 'full_name' | 'full_name_ur' | 'email'
  > | null
  courses?: Tables<'courses'> & {
    course_translations: Tables<'course_translations'>[]
  } | null
}

function generateCertificateNumber(): string {
  const year = new Date().getFullYear()
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `SUQ-${year}-${rand}`
}

export async function listCertificates(filters?: {
  studentId?: string
  courseId?: string
  status?: CertificateStatus
}): Promise<CertificateWithDetails[]> {
  if (isDemoAuthMode()) {
    return demoListCertificates(filters) as CertificateWithDetails[]
  }

  let query = supabase
    .from('certificates')
    .select(
      '*, profiles:student_id(id, full_name, full_name_ur, email), courses(*, course_translations(*))',
    )
    .order('created_at', { ascending: false })

  if (filters?.studentId) query = query.eq('student_id', filters.studentId)
  if (filters?.courseId) query = query.eq('course_id', filters.courseId)
  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as CertificateWithDetails[]
}

export async function getById(
  id: string,
): Promise<CertificateWithDetails | null> {
  const { data, error } = await supabase
    .from('certificates')
    .select(
      '*, profiles:student_id(id, full_name, full_name_ur, email), courses(*, course_translations(*))',
    )
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data as CertificateWithDetails | null
}

export async function getByNumber(
  certificateNumber: string,
): Promise<CertificateWithDetails | null> {
  const { data, error } = await supabase
    .from('certificates')
    .select(
      '*, profiles:student_id(id, full_name, full_name_ur, email), courses(*, course_translations(*))',
    )
    .eq('certificate_number', certificateNumber)
    .maybeSingle()

  if (error) throw error
  return data as CertificateWithDetails | null
}

/**
 * Staff (or auto-helper): issue a certificate for a student + course.
 * Upserts on unique (student_id, course_id).
 */
export async function issueCertificate(input: {
  studentId: string
  courseId: string
  issuedBy?: string | null
  metadata?: Tables<'certificates'>['metadata']
}): Promise<Certificate> {
  const existing = await supabase
    .from('certificates')
    .select('*')
    .eq('student_id', input.studentId)
    .eq('course_id', input.courseId)
    .maybeSingle()

  if (existing.error) throw existing.error

  const now = new Date().toISOString()

  if (existing.data) {
    const patch: TablesUpdate<'certificates'> = {
      status: 'issued',
      issued_at: now,
      issued_by: input.issuedBy ?? existing.data.issued_by,
      metadata: input.metadata ?? existing.data.metadata,
      updated_at: now,
    }
    const { data, error } = await supabase
      .from('certificates')
      .update(patch)
      .eq('id', existing.data.id)
      .select('*')
      .single()
    if (error) throw error
    return data
  }

  const payload: TablesInsert<'certificates'> = {
    student_id: input.studentId,
    course_id: input.courseId,
    certificate_number: generateCertificateNumber(),
    status: 'issued',
    issued_at: now,
    issued_by: input.issuedBy ?? null,
    metadata: input.metadata ?? {},
  }

  const { data, error } = await supabase
    .from('certificates')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data
}

/**
 * Public verification via SECURITY DEFINER RPC (works for anon).
 * Returns only safe display fields — not full certificate rows.
 */
export type PublicCertificateInfo = {
  certificate_number: string
  student_name: string | null
  student_name_ur: string | null
  course_title_en: string | null
  course_title_ur: string | null
  issued_at: string | null
  status: CertificateStatus
}

/** Raw row shape returned by `verify_certificate` RPC. */
export type VerifyCertificateRpcRow = {
  valid: boolean
  certificate_number: string
  status: CertificateStatus
  student_name: string | null
  student_name_ur: string | null
  course_title_en: string | null
  course_title_ur: string | null
  issued_at: string | null
}

/**
 * Map an RPC row (or null/empty) to `{ valid, certificate }` for the verify UI.
 * Pure — safe to unit test without Supabase.
 */
export function mapVerifyCertificateRpcRow(
  row: VerifyCertificateRpcRow | null | undefined,
): { valid: boolean; certificate: PublicCertificateInfo | null } {
  if (!row) {
    return { valid: false, certificate: null }
  }

  const certificate: PublicCertificateInfo = {
    certificate_number: row.certificate_number,
    student_name: row.student_name,
    student_name_ur: row.student_name_ur,
    course_title_en: row.course_title_en,
    course_title_ur: row.course_title_ur,
    issued_at: row.issued_at,
    status: row.status,
  }

  return { valid: Boolean(row.valid), certificate }
}

export async function verifyCertificate(
  certificateNumber: string,
): Promise<{
  valid: boolean
  certificate: PublicCertificateInfo | null
}> {
  if (isDemoAuthMode()) {
    return demoVerifyCertificate(certificateNumber)
  }

  const trimmed = certificateNumber.trim()
  if (!trimmed) {
    return { valid: false, certificate: null }
  }

  const { data, error } = await supabase.rpc('verify_certificate', {
    p_number: trimmed,
  })

  if (error) throw error

  const row = (Array.isArray(data) ? data[0] : data) as
    | VerifyCertificateRpcRow
    | null
    | undefined

  return mapVerifyCertificateRpcRow(row)
}

export async function revokeCertificate(id: string): Promise<Certificate> {
  const { data, error } = await supabase
    .from('certificates')
    .update({
      status: 'revoked',
      updated_at: new Date().toISOString(),
    } satisfies TablesUpdate<'certificates'>)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

/**
 * Auto-issue when enrollment is completed, or when every published lesson
 * has progress status `completed`. Returns null if not yet eligible.
 */
export async function issueIfCourseComplete(
  studentId: string,
  courseId: string,
  issuedBy?: string | null,
): Promise<Certificate | null> {
  const { data: enrollment, error: enrError } = await supabase
    .from('enrollments')
    .select('*')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .maybeSingle()

  if (enrError) throw enrError
  if (!enrollment) return null

  let eligible = enrollment.status === 'completed'

  if (!eligible) {
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', courseId)
      .eq('is_published', true)

    if (lessonsError) throw lessonsError
    const lessonIds = (lessons ?? []).map((l) => l.id)
    if (lessonIds.length === 0) return null

    const { data: progress, error: progressError } = await supabase
      .from('lesson_progress')
      .select('lesson_id, status')
      .eq('student_id', studentId)
      .in('lesson_id', lessonIds)

    if (progressError) throw progressError
    const completed = new Set(
      (progress ?? [])
        .filter((p) => p.status === 'completed')
        .map((p) => p.lesson_id),
    )
    eligible = lessonIds.every((id) => completed.has(id))
  }

  if (!eligible) return null

  return issueCertificate({
    studentId,
    courseId,
    issuedBy: issuedBy ?? null,
    metadata: { source: 'auto_course_complete' },
  })
}
