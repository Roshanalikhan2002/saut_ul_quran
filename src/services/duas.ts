import { isDemoAuthMode } from '@/lib/demoAuth'
import { demoListDuas } from '@/lib/demoStore'
import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database'
import {
  deleteFile,
  getPublicUrl,
  uploadFile,
} from '@/services/storage'

export type DailyDua = Tables<'daily_duas'>

export interface UpsertDuaInput {
  id?: string
  slug?: string | null
  titleEn: string
  titleUr?: string | null
  arabicText: string
  transliteration?: string | null
  translationEn?: string | null
  translationUr?: string | null
  category?: string | null
  sortOrder?: number
  isPublished?: boolean
  audioFile?: File | null
  clearAudio?: boolean
}

export async function listDuas(options?: {
  publishedOnly?: boolean
  category?: string
}): Promise<DailyDua[]> {
  if (isDemoAuthMode()) {
    return demoListDuas(options)
  }

  let query = supabase
    .from('daily_duas')
    .select('*')
    .order('sort_order', { ascending: true })

  if (options?.publishedOnly) query = query.eq('is_published', true)
  if (options?.category) query = query.eq('category', options.category)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function upsertDua(input: UpsertDuaInput): Promise<DailyDua> {
  let audioPath: string | null | undefined

  if (input.clearAudio) {
    audioPath = null
  }

  if (input.audioFile) {
    const safeName = input.audioFile.name.replace(/[^\w.-]+/g, '_')
    const path = `${input.slug || 'dua'}-${Date.now()}-${safeName}`
    audioPath = await uploadFile('dua-audio', path, input.audioFile, {
      contentType: input.audioFile.type || 'audio/mpeg',
      upsert: true,
    })
  }

  if (input.id) {
    const existing = await supabase
      .from('daily_duas')
      .select('*')
      .eq('id', input.id)
      .single()

    if (existing.error) throw existing.error

    if (
      input.audioFile &&
      existing.data.audio_path &&
      existing.data.audio_path !== audioPath
    ) {
      try {
        await deleteFile('dua-audio', existing.data.audio_path)
      } catch {
        // ignore stale file cleanup errors
      }
    }

    if (input.clearAudio && existing.data.audio_path) {
      try {
        await deleteFile('dua-audio', existing.data.audio_path)
      } catch {
        // ignore
      }
    }

    const patch: TablesUpdate<'daily_duas'> = {
      slug: input.slug ?? existing.data.slug,
      title_en: input.titleEn,
      title_ur: input.titleUr ?? null,
      arabic_text: input.arabicText,
      transliteration: input.transliteration ?? null,
      translation_en: input.translationEn ?? null,
      translation_ur: input.translationUr ?? null,
      category: input.category ?? null,
      sort_order: input.sortOrder ?? existing.data.sort_order,
      is_published: input.isPublished ?? existing.data.is_published,
      updated_at: new Date().toISOString(),
    }

    if (audioPath !== undefined) {
      patch.audio_path = audioPath
    }

    const { data, error } = await supabase
      .from('daily_duas')
      .update(patch)
      .eq('id', input.id)
      .select('*')
      .single()

    if (error) throw error
    return data
  }

  const payload: TablesInsert<'daily_duas'> = {
    slug: input.slug ?? null,
    title_en: input.titleEn,
    title_ur: input.titleUr ?? null,
    arabic_text: input.arabicText,
    transliteration: input.transliteration ?? null,
    translation_en: input.translationEn ?? null,
    translation_ur: input.translationUr ?? null,
    audio_path: audioPath ?? null,
    category: input.category ?? null,
    sort_order: input.sortOrder ?? 0,
    is_published: input.isPublished ?? true,
  }

  const { data, error } = await supabase
    .from('daily_duas')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function deleteDua(id: string): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from('daily_duas')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) throw fetchError

  if (existing?.audio_path) {
    try {
      await deleteFile('dua-audio', existing.audio_path)
    } catch {
      // continue
    }
  }

  const { error } = await supabase.from('daily_duas').delete().eq('id', id)
  if (error) throw error
}

export function getDuaAudioUrl(dua: DailyDua): string | null {
  if (!dua.audio_path) return null
  return getPublicUrl('dua-audio', dua.audio_path)
}
