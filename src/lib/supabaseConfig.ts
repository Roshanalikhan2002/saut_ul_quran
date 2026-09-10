/**
 * Supabase public client configuration helpers.
 * Kept separate from demoAuth so dataMode can import without cycles.
 */

export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL ?? ''
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
  if (!url || !key) return false
  if (url.includes('YOUR_PROJECT') || url.includes('placeholder')) return false
  if (
    key.includes('your_anon_key') ||
    key === 'placeholder' ||
    key.length < 20
  ) {
    return false
  }
  return true
}
