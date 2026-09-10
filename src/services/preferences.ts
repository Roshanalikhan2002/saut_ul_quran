import { supabase } from '@/lib/supabase'
import type { AppLocale, Tables, TablesInsert, TablesUpdate } from '@/types/database'

export type UserPreferences = Tables<'user_preferences'>
export type Profile = Tables<'profiles'>

export async function getPreferences(
  userId: string,
): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function upsertPreferences(
  userId: string,
  patch: Partial<
    Pick<
      UserPreferences,
      | 'locale'
      | 'theme'
      | 'notification_email'
      | 'notification_push'
      | 'settings'
    >
  >,
): Promise<UserPreferences> {
  const payload: TablesInsert<'user_preferences'> = {
    user_id: userId,
    locale: patch.locale ?? 'en',
    theme: patch.theme ?? 'system',
    notification_email: patch.notification_email ?? true,
    notification_push: patch.notification_push ?? true,
    settings: patch.settings ?? {},
    updated_at: new Date().toISOString(),
  }

  const existing = await getPreferences(userId)
  if (existing) {
    const update: TablesUpdate<'user_preferences'> = {
      ...patch,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('user_preferences')
      .update(update)
      .eq('user_id', userId)
      .select('*')
      .single()
    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function updateProfile(
  userId: string,
  patch: TablesUpdate<'profiles'>,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function setLocalePreference(
  userId: string,
  locale: AppLocale,
): Promise<void> {
  await updateProfile(userId, { locale })
  await upsertPreferences(userId, { locale })
}
