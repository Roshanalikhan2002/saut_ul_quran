import { isDemoAuthMode } from '@/lib/demoAuth'
import {
  demoAwardBadge,
  demoAwardPoints,
  demoGetBadge,
  demoGetPointsTotal,
  demoListBadges,
  demoListPointsLedger,
  demoListStudentBadges,
} from '@/lib/demoStore'
import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert } from '@/types/database'
import { notifyUser } from '@/services/notifications'

export type Badge = Tables<'badges'>
export type StudentBadge = Tables<'student_badges'>
export type PointsLedgerEntry = Tables<'points_ledger'>

export type StudentBadgeWithBadge = StudentBadge & {
  badges: Badge | null
}

export async function getPointsTotal(studentId: string): Promise<number> {
  if (isDemoAuthMode()) {
    return demoGetPointsTotal(studentId)
  }

  const { data, error } = await supabase
    .from('points_ledger')
    .select('points')
    .eq('student_id', studentId)

  if (error) throw error
  return (data ?? []).reduce((sum, row) => sum + (row.points ?? 0), 0)
}

export async function listPointsLedger(
  studentId: string,
  limit = 50,
): Promise<PointsLedgerEntry[]> {
  if (isDemoAuthMode()) {
    return demoListPointsLedger(studentId, limit)
  }

  const { data, error } = await supabase
    .from('points_ledger')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

export async function listBadges(): Promise<Badge[]> {
  if (isDemoAuthMode()) {
    return demoListBadges()
  }

  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('is_active', true)
    .order('points_required', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function listStudentBadges(
  studentId: string,
): Promise<StudentBadgeWithBadge[]> {
  if (isDemoAuthMode()) {
    return demoListStudentBadges(studentId) as StudentBadgeWithBadge[]
  }

  const { data, error } = await supabase
    .from('student_badges')
    .select('*, badges(*)')
    .eq('student_id', studentId)
    .order('awarded_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as StudentBadgeWithBadge[]
}

/** Staff: award points to a student. */
export async function awardPoints(input: {
  studentId: string
  points: number
  reason: string
  createdBy?: string | null
  referenceType?: string | null
  referenceId?: string | null
}): Promise<PointsLedgerEntry> {
  const payload: TablesInsert<'points_ledger'> = {
    student_id: input.studentId,
    points: input.points,
    reason: input.reason,
    created_by: input.createdBy ?? null,
    reference_type: input.referenceType ?? null,
    reference_id: input.referenceId ?? null,
  }

  let data: PointsLedgerEntry
  if (isDemoAuthMode()) {
    data = demoAwardPoints(payload)
  } else {
    const result = await supabase
      .from('points_ledger')
      .insert(payload)
      .select('*')
      .single()
    if (result.error) throw result.error
    data = result.data
  }

  try {
    await notifyUser({
      userId: input.studentId,
      type: 'badge',
      titleEn: `+${input.points} points`,
      titleUr: `+${input.points} پوائنٹس`,
      bodyEn: input.reason,
      link: '/student/settings',
    })
  } catch {
    /* notification is best-effort */
  }

  return data
}

/** Staff: award a badge to a student (idempotent on unique pair if present). */
export async function awardBadge(input: {
  studentId: string
  badgeId: string
  awardedBy?: string | null
}): Promise<StudentBadge> {
  if (isDemoAuthMode()) {
    const data = demoAwardBadge(input)
    const badge = demoGetBadge(input.badgeId)
    try {
      await notifyUser({
        userId: input.studentId,
        type: 'badge',
        titleEn: `Badge earned: ${badge?.name_en ?? 'New badge'}`,
        titleUr: badge?.name_ur
          ? `بیج حاصل ہوا: ${badge.name_ur}`
          : 'نیا بیج',
        link: '/student/settings',
      })
    } catch {
      /* best-effort */
    }
    return data
  }

  const existing = await supabase
    .from('student_badges')
    .select('*')
    .eq('student_id', input.studentId)
    .eq('badge_id', input.badgeId)
    .maybeSingle()

  if (existing.error) throw existing.error
  if (existing.data) return existing.data

  const payload: TablesInsert<'student_badges'> = {
    student_id: input.studentId,
    badge_id: input.badgeId,
    awarded_by: input.awardedBy ?? null,
  }

  const { data, error } = await supabase
    .from('student_badges')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error

  const badge = await supabase
    .from('badges')
    .select('name_en, name_ur')
    .eq('id', input.badgeId)
    .maybeSingle()

  try {
    await notifyUser({
      userId: input.studentId,
      type: 'badge',
      titleEn: `Badge earned: ${badge.data?.name_en ?? 'New badge'}`,
      titleUr: badge.data?.name_ur
        ? `بیج حاصل ہوا: ${badge.data.name_ur}`
        : 'نیا بیج',
      link: '/student/settings',
    })
  } catch {
    /* best-effort */
  }

  return data
}

export async function getStudentGamification(studentId: string): Promise<{
  points: number
  badges: StudentBadgeWithBadge[]
  allBadges: Badge[]
}> {
  const [points, badges, allBadges] = await Promise.all([
    getPointsTotal(studentId),
    listStudentBadges(studentId),
    listBadges(),
  ])
  return { points, badges, allBadges }
}
