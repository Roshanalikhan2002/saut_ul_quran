import { isDemoAuthMode } from '@/lib/demoAuth'
import {
  demoDemoteFromRole,
  demoListProfilesWithRoles,
  demoListStudents,
  demoPromoteToRole,
} from '@/lib/demoStore'
import { supabase } from '@/lib/supabase'
import type { AppRole, Tables, TablesInsert, TablesUpdate } from '@/types/database'

export type Student = Tables<'students'>
export type Profile = Tables<'profiles'>

export type StudentWithProfile = Student & {
  profiles: Profile
}

/**
 * List students with profile info (staff RLS).
 */
export async function listStudents(): Promise<StudentWithProfile[]> {
  if (isDemoAuthMode()) {
    return demoListStudents() as StudentWithProfile[]
  }

  const { data, error } = await supabase
    .from('students')
    .select('*, profiles(*)')
    .order('joined_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as StudentWithProfile[]
}

export async function getStudentByProfileId(
  profileId: string,
): Promise<StudentWithProfile | null> {
  const { data, error } = await supabase
    .from('students')
    .select('*, profiles(*)')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (error) throw error
  return data as StudentWithProfile | null
}

export async function updateStudent(
  id: string,
  patch: TablesUpdate<'students'>,
): Promise<Student> {
  const { data, error } = await supabase
    .from('students')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function createStudentNote(
  studentId: string,
  notes: string,
): Promise<Student> {
  return updateStudent(studentId, { notes })
}

/**
 * Promote a user to a role by inserting into `user_roles`.
 * Requires admin RLS on user_roles. Prefer an RPC in production.
 */
export async function promoteToRole(
  userId: string,
  role: AppRole,
  grantedBy?: string | null,
): Promise<void> {
  if (isDemoAuthMode()) {
    demoPromoteToRole(userId, role, grantedBy)
    return
  }

  const { error } = await supabase.from('user_roles').upsert(
    {
      user_id: userId,
      role,
      granted_by: grantedBy ?? null,
    } satisfies TablesInsert<'user_roles'>,
    { onConflict: 'user_id,role' },
  )
  if (error) throw error
}

/** Remove a role assignment (admin demote). */
export async function demoteFromRole(
  userId: string,
  role: AppRole,
): Promise<void> {
  if (isDemoAuthMode()) {
    demoDemoteFromRole(userId, role)
    return
  }

  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role', role)
  if (error) throw error
}

export type ProfileWithRoles = Profile & {
  roles: AppRole[]
}

/** Admin: list profiles joined with role assignments. */
export async function listProfilesWithRoles(): Promise<ProfileWithRoles[]> {
  if (isDemoAuthMode()) {
    return demoListProfilesWithRoles()
  }

  const [{ data: profiles, error: profileError }, { data: roles, error: roleError }] =
    await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('user_id, role'),
    ])

  if (profileError) throw profileError
  if (roleError) throw roleError

  const byUser = new Map<string, AppRole[]>()
  for (const row of roles ?? []) {
    const list = byUser.get(row.user_id) ?? []
    list.push(row.role)
    byUser.set(row.user_id, list)
  }

  return (profiles ?? []).map((p) => ({
    ...p,
    roles: byUser.get(p.id) ?? [],
  }))
}

/**
 * Attempt to create a student auth user via client signUp.
 *
 * LIMITATION (no service role on free-tier frontend):
 * - `supabase.auth.signUp` switches the browser session to the new user.
 * - Prefer: create the user in Supabase Dashboard (or Invite), then call
 *   `promoteToRole` / ensure student row exists, and share credentials out-of-band.
 * - Or use a secure Edge Function with the service role key.
 *
 * This helper signs up, then immediately signs the admin back in if
 * `adminEmail`/`adminPassword` are provided.
 */
export async function createStudentWithCredentials(input: {
  email: string
  password: string
  fullName: string
  adminEmail?: string
  adminPassword?: string
}): Promise<{ userId: string; sessionSwitched: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { full_name: input.fullName },
    },
  })

  if (error) throw error
  const userId = data.user?.id
  if (!userId) throw new Error('Sign-up did not return a user id')

  // Trigger typically assigns student role + profile.
  // Keep student role; do not promote here.

  let sessionSwitched = true
  if (input.adminEmail && input.adminPassword) {
    const { error: reAuthError } = await supabase.auth.signInWithPassword({
      email: input.adminEmail,
      password: input.adminPassword,
    })
    if (reAuthError) throw reAuthError
    sessionSwitched = false
  }

  return { userId, sessionSwitched }
}
