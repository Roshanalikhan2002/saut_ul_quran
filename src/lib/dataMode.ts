/**
 * Unified data-mode switch for Saut Ul Quran.
 *
 * Priority:
 * 1. VITE_DEMO_MODE=true  → always demo (even if Supabase creds exist)
 * 2. VITE_DEMO_MODE=false → always Supabase (requires valid URL + anon key)
 * 3. unset               → auto: demo when Supabase is not configured
 *
 * UI pages must call services only — never branch on this flag themselves
 * except for optional banners / demo login buttons.
 */
import { isSupabaseConfigured } from '@/lib/supabaseConfig'

export type DataMode = 'demo' | 'supabase'

function readDemoFlag(): boolean | null {
  const raw = (import.meta.env.VITE_DEMO_MODE ?? '').toString().trim().toLowerCase()
  if (raw === 'true' || raw === '1' || raw === 'yes') return true
  if (raw === 'false' || raw === '0' || raw === 'no') return false
  return null
}

/** True when the app should use in-memory / localStorage demo repositories. */
export function isDemoMode(): boolean {
  const flag = readDemoFlag()
  if (flag === true) return true
  if (flag === false) return false
  return !isSupabaseConfigured()
}

export function getDataMode(): DataMode {
  return isDemoMode() ? 'demo' : 'supabase'
}

/**
 * Call before production Supabase operations.
 * Throws a clear Error if demo mode is on or credentials are missing.
 */
export function assertSupabaseMode(operation = 'This operation'): void {
  if (isDemoMode()) {
    throw new Error(
      `${operation} requires production mode. Set VITE_DEMO_MODE=false and configure Supabase.`,
    )
  }
  if (!isSupabaseConfigured()) {
    throw new Error(
      `${operation} requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.`,
    )
  }
}
