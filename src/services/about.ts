import { isDemoAuthMode } from '@/lib/demoAuth'
import { supabase } from '@/lib/supabase'
import type { Tables, TablesUpdate } from '@/types/database'

export type AboutJamia = Tables<'about_jamia'>

export async function getAboutJamia(): Promise<AboutJamia | null> {
  if (isDemoAuthMode()) {
    return null
  }

  const { data, error } = await supabase
    .from('about_jamia')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

/** Staff-only update (requires admin/teacher RLS). */
export async function updateAboutJamia(
  id: string,
  patch: TablesUpdate<'about_jamia'>,
): Promise<AboutJamia> {
  const { data, error } = await supabase
    .from('about_jamia')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data
}
