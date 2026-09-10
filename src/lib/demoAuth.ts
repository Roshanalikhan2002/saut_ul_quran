import type { User, Session } from '@supabase/supabase-js'
import type { AppRole, Tables } from '@/types/database'
import { isDemoMode } from '@/lib/dataMode'
import { isSupabaseConfigured } from '@/lib/supabaseConfig'

export { isSupabaseConfigured }

const DEMO_STORAGE_KEY = 'suq_demo_auth'

export type DemoProfile = Tables<'profiles'>

export interface DemoAuthState {
  role: AppRole
  email: string
  fullName: string
}

/**
 * @deprecated Prefer `isDemoMode()` from `@/lib/dataMode`.
 * Kept as alias so existing service imports keep working.
 */
export function isDemoAuthMode(): boolean {
  return isDemoMode()
}

export function readDemoAuth(): DemoAuthState | null {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DemoAuthState
    if (!parsed?.role || !parsed?.email) return null
    return parsed
  } catch {
    return null
  }
}

export function writeDemoAuth(state: DemoAuthState): void {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state))
}

export function clearDemoAuth(): void {
  localStorage.removeItem(DEMO_STORAGE_KEY)
}

export function buildDemoUser(state: DemoAuthState): User {
  const id = `demo-${state.role}-0000-0000-000000000001`
  const now = new Date().toISOString()
  return {
    id,
    app_metadata: { provider: 'demo', providers: ['demo'] },
    user_metadata: { full_name: state.fullName, demo: true },
    aud: 'authenticated',
    created_at: now,
    email: state.email,
    phone: '',
    role: 'authenticated',
    updated_at: now,
    identities: [],
    is_anonymous: false,
    factors: [],
  } as User
}

export function buildDemoSession(user: User): Session {
  return {
    access_token: 'demo-access-token',
    refresh_token: 'demo-refresh-token',
    expires_in: 60 * 60 * 24,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    token_type: 'bearer',
    user,
  }
}

export function buildDemoProfile(user: User, state: DemoAuthState): DemoProfile {
  const now = new Date().toISOString()
  return {
    id: user.id,
    email: state.email,
    full_name: state.fullName,
    full_name_ur: null,
    avatar_url: null,
    phone: null,
    locale: 'en',
    bio: 'Local demo session.',
    is_active: true,
    created_at: now,
    updated_at: now,
  }
}

export function demoDefaultsForRole(role: AppRole): DemoAuthState {
  if (role === 'admin') {
    return {
      role: 'admin',
      email: 'admin@demo.local',
      fullName: 'Demo Admin',
    }
  }
  if (role === 'teacher') {
    return {
      role: 'teacher',
      email: 'teacher@demo.local',
      fullName: 'Demo Teacher',
    }
  }
  return {
    role: 'student',
    email: 'student@demo.local',
    fullName: 'Demo Student',
  }
}
