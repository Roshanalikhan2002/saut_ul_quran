import { supabase } from '@/lib/supabase'
import { isDemoMode } from '@/lib/dataMode'
import { loginIdToAuthEmail, normalizeLoginId } from '@/lib/loginId'
import { toError } from '@/lib/errors'
import type { AppRole } from '@/types/database'
import {
  demoCreateProvisionedUser,
  demoResetUserPassword,
} from '@/lib/demoStore'

export type ProvisionRole = 'teacher' | 'student'

export interface ProvisionUserInput {
  loginId: string
  password: string
  fullName: string
  role: ProvisionRole
}

export interface ProvisionUserResult {
  userId: string
  loginId: string
  email: string
  role: ProvisionRole
}

async function invokeAdminManageUser(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('admin-manage-user', {
    body,
  })
  if (error) {
    const msg = toError(error).message || String(error)
    if (
      /failed to send|not found|404|FunctionsFetchError|Failed to send a request/i.test(
        msg,
      )
    ) {
      throw new Error(
        'Edge Function "admin-manage-user" is not deployed. In Supabase → Edge Functions, deploy admin-manage-user (see docs/ADMIN_PROVISIONING.md).',
      )
    }
    throw toError(error)
  }
  if (data?.error) throw new Error(String(data.error))
  return data
}

/** Admin creates teacher/student with login ID + password (no personal email). */
export async function adminProvisionUser(
  input: ProvisionUserInput,
): Promise<ProvisionUserResult> {
  const loginId = normalizeLoginId(input.loginId)
  if (!loginId || loginId.includes('@')) {
    throw new Error('Login ID required without @ (e.g. STU-001 or TCH-01)')
  }
  if (input.password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  if (isDemoMode()) {
    return demoCreateProvisionedUser({
      loginId,
      password: input.password,
      fullName: input.fullName,
      role: input.role,
    })
  }

  const data = await invokeAdminManageUser({
    action: 'create',
    loginId,
    password: input.password,
    fullName: input.fullName,
    role: input.role,
  })

  return {
    userId: data.userId,
    loginId: data.loginId,
    email: data.email,
    role: data.role,
  }
}

/** Only admin can reset another user's password. */
export async function adminResetPassword(
  userId: string,
  password: string,
): Promise<void> {
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  if (isDemoMode()) {
    demoResetUserPassword(userId, password)
    return
  }

  await invokeAdminManageUser({
    action: 'resetPassword',
    userId,
    password,
  })
}

/**
 * Resolve User ID / email for Supabase Auth sign-in.
 * Tries RPC first, then convention loginId@suq.local.
 */
export async function resolveAuthEmail(loginOrEmail: string): Promise<string> {
  const raw = loginOrEmail.trim()
  if (!raw) return raw
  if (raw.includes('@')) return raw.toLowerCase()

  if (isDemoMode()) {
    return loginIdToAuthEmail(raw)
  }

  try {
    const { data, error } = await supabase.rpc('resolve_login_email', {
      p_login: raw,
    })
    if (!error && typeof data === 'string' && data) return data
  } catch {
    /* fall through */
  }

  return loginIdToAuthEmail(raw)
}

export type { AppRole }
