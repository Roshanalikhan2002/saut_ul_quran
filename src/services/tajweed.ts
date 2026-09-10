import { getPublicUrl, getSignedUrl } from '@/services/storage'
import { isDemoAuthMode } from '@/lib/demoAuth'
import { demoGetAyahsBySurah, demoListSurahs } from '@/lib/demoStore'
import { supabase } from '@/lib/supabase'
import type { Json, Tables, TablesInsert } from '@/types/database'

export type Surah = Tables<'surahs'>
export type Ayah = Tables<'ayahs'>
export type AyahAudio = Tables<'ayah_audio'>
export type AyahKnowledge = Tables<'ayah_knowledge'>
export type TajweedRule = Tables<'tajweed_rules'>

export interface TajweedSegment {
  start: number
  end: number
  rule?: string
  color?: string
  label?: string
}

export function parseTajweedMarkup(markup: Json): TajweedSegment[] {
  if (!Array.isArray(markup)) return []
  const segments: TajweedSegment[] = []
  for (const item of markup) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    const record = item as Record<string, unknown>
    const start = Number(record.start)
    const end = Number(record.end)
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue
    segments.push({
      start,
      end,
      rule: typeof record.rule === 'string' ? record.rule : undefined,
      color: typeof record.color === 'string' ? record.color : undefined,
      label: typeof record.label === 'string' ? record.label : undefined,
    })
  }
  return segments
}

export async function listSurahs(): Promise<Surah[]> {
  if (isDemoAuthMode()) {
    return demoListSurahs()
  }

  const { data, error } = await supabase
    .from('surahs')
    .select('*')
    .order('number', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getAyahsBySurah(surahId: string): Promise<Ayah[]> {
  if (isDemoAuthMode()) {
    return demoGetAyahsBySurah(surahId)
  }

  const { data, error } = await supabase
    .from('ayahs')
    .select('*')
    .eq('surah_id', surahId)
    .order('ayah_number', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getAyahAudio(
  ayahId: string,
): Promise<AyahAudio | null> {
  if (isDemoAuthMode()) {
    void ayahId
    return null
  }

  const { data, error } = await supabase
    .from('ayah_audio')
    .select('*')
    .eq('ayah_id', ayahId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function listAyahAudioForSurah(
  ayahIds: string[],
): Promise<AyahAudio[]> {
  if (isDemoAuthMode()) {
    void ayahIds
    return []
  }

  if (ayahIds.length === 0) return []
  const { data, error } = await supabase
    .from('ayah_audio')
    .select('*')
    .in('ayah_id', ayahIds)
  if (error) throw error
  return data ?? []
}

/** Resolve a playable URL for an ayah audio row. */
export async function resolveAyahAudioUrl(
  audio: AyahAudio,
): Promise<string | null> {
  if (audio.external_url) return audio.external_url
  if (!audio.storage_path) return null
  try {
    return await getSignedUrl('ayah-audio', audio.storage_path)
  } catch {
    return getPublicUrl('ayah-audio', audio.storage_path)
  }
}

export async function getKnowledgeForStudent(
  studentProfileId: string,
  ayahIds: string[],
): Promise<AyahKnowledge[]> {
  if (isDemoAuthMode()) {
    void studentProfileId
    void ayahIds
    return []
  }

  if (ayahIds.length === 0) return []
  const { data, error } = await supabase
    .from('ayah_knowledge')
    .select('*')
    .eq('student_id', studentProfileId)
    .in('ayah_id', ayahIds)
  if (error) throw error
  return data ?? []
}

/** Mark ayah as known (mastery_level 5). Upserts on (student_id, ayah_id). */
export async function markAyahKnown(
  studentProfileId: string,
  ayahId: string,
): Promise<AyahKnowledge> {
  const payload: TablesInsert<'ayah_knowledge'> = {
    student_id: studentProfileId,
    ayah_id: ayahId,
    mastery_level: 5,
    last_reviewed_at: new Date().toISOString(),
    updated_by: studentProfileId,
  }

  const { data, error } = await supabase
    .from('ayah_knowledge')
    .upsert(payload, { onConflict: 'student_id,ayah_id' })
    .select('*')
    .single()
  if (error) throw error
  return data
}

/**
 * Percent of ayahs in a surah that have at least one audio recording.
 */
export async function getRecordingProgressPercent(
  surahId: string,
): Promise<number> {
  const ayahs = await getAyahsBySurah(surahId)
  if (ayahs.length === 0) return 0
  const audio = await listAyahAudioForSurah(ayahs.map((a) => a.id))
  const withAudio = new Set(
    audio
      .filter((row) => Boolean(row.external_url || row.storage_path))
      .map((row) => row.ayah_id),
  )
  return Math.round((withAudio.size / ayahs.length) * 100)
}

export async function listTajweedRules(): Promise<TajweedRule[]> {
  if (isDemoAuthMode()) {
    return []
  }

  const { data, error } = await supabase
    .from('tajweed_rules')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}
