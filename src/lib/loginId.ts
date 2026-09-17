/** Admin-provisioned login IDs (teachers/students) use this internal domain. */
export const INTERNAL_AUTH_DOMAIN = 'suq.local'

/** Primary jamia admin email (real mailbox). */
export const PRIMARY_ADMIN_EMAIL = 'fehmidataj27@gmail.com'

export function normalizeLoginId(raw: string): string {
  return raw.trim().toLowerCase()
}

/**
 * Convert UI login (User ID or real email) → Supabase Auth email.
 * - `fehmidataj27@gmail.com` stays as-is (admin)
 * - `STU-001` → `stu-001@suq.local`
 */
export function loginIdToAuthEmail(loginOrEmail: string): string {
  const raw = normalizeLoginId(loginOrEmail)
  if (!raw) return raw
  if (raw.includes('@')) return raw
  return `${raw}@${INTERNAL_AUTH_DOMAIN}`
}

export function suggestLoginId(role: 'teacher' | 'student', seq?: number): string {
  const n = String(seq ?? Math.floor(Math.random() * 900) + 100).padStart(3, '0')
  return role === 'teacher' ? `TCH-${n}` : `STU-${n}`
}
