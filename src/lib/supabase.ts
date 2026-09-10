import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { isSupabaseConfigured } from '@/lib/supabaseConfig'
import { isDemoMode } from '@/lib/dataMode'

export { isSupabaseConfigured }

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (isDemoMode()) {
  console.info(
    '[SUQ] Running in DEMO data mode (VITE_DEMO_MODE or missing Supabase config).',
  )
} else if (!isSupabaseConfigured()) {
  console.warn(
    '[SUQ] VITE_DEMO_MODE=false but Supabase credentials look invalid.',
  )
}

export const supabase = createClient<Database>(
  url && !String(url).includes('YOUR_PROJECT')
    ? url
    : 'https://placeholder.supabase.co',
  anonKey && !String(anonKey).includes('your_anon_key')
    ? anonKey
    : 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)
