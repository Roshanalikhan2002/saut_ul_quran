import { isDemoAuthMode } from '@/lib/demoAuth'
import { demoGetCorpusStats } from '@/lib/demoStore'
import { supabase } from '@/lib/supabase'
import type { Json } from '@/types/database'
import sampleCorpus from '@/data/quran.sample.json'

export const EXPECTED_SURAH_COUNT = 114

export interface CorpusStats {
  surahCount: number
  ayahCount: number
}

export interface QuranImportStatus extends CorpusStats {
  expectedSurahs: number
  /** True when all 114 surahs are present. */
  isComplete: boolean
  /** True when some rows exist but fewer than 114 surahs (e.g. seed sample). */
  sampleOnly: boolean
}

export interface QuranImportStep {
  id: string
  titleEn: string
  titleUr: string
  detailEn: string
  detailUr: string
}

export interface QuranCorpusSurah {
  number: number
  name_ar: string
  name_en: string
  name_ur?: string | null
  revelation_type?: string | null
  ayahs: Array<{
    number: number
    text_ar: string
    text_uthmani?: string | null
    translation_en?: string | null
    translation_ur?: string | null
    tajweed_html?: unknown
    tajweed_markup?: Json
    juz?: number | null
    page?: number | null
  }>
}

export interface QuranCorpusPayload {
  surahs: QuranCorpusSurah[]
}

export interface QuranImportResult {
  surahUpserts: number
  ayahUpserts: number
  mode: 'DEMO' | 'PRODUCTION'
}

/** Short checklist for the admin Quran import page. */
export const QURAN_IMPORT_STEPS: QuranImportStep[] = [
  {
    id: 'sample',
    titleEn: 'Try the sample',
    titleUr: 'نمونہ آزمائیں',
    detailEn: 'Click “Import sample” to load Al-Fatiha and Al-Ikhlas.',
    detailUr: '“Import sample” دبا کر الفاتحہ اور الاخلاص لوڈ کریں۔',
  },
  {
    id: 'pdf',
    titleEn: 'Or upload a simple PDF / text file',
    titleUr: 'یا سادہ PDF / ٹیکسٹ فائل اپ لوڈ کریں',
    detailEn:
      'Use lines like: SURAH 1 | Al-Fatiha | الفاتحة | makki then 1 | Arabic | English | Urdu. Download the sample PDF to copy the format.',
    detailUr:
      'لکیریں اس طرح: SURAH 1 | Al-Fatiha | الفاتحة | makki پھر 1 | عربی | انگریزی | اردو۔ فارمیٹ کے لیے نمونہ PDF ڈاؤن لوڈ کریں۔',
  },
  {
    id: 'check',
    titleEn: 'Check the counts',
    titleUr: 'گنتی چیک کریں',
    detailEn: 'After import, refresh — Surahs should move toward 114 / 114.',
    detailUr: 'امپورٹ کے بعد ریفریش کریں — سورتیں 114 / 114 کی طرف جائیں گی۔',
  },
]


/**
 * Count surahs/ayahs via the browser anon client (RLS: authenticated SELECT).
 * Intended for admin UI — does not use the service role.
 */
export async function getCorpusStats(): Promise<CorpusStats> {
  if (isDemoAuthMode()) {
    return demoGetCorpusStats()
  }

  const [surahs, ayahs] = await Promise.all([
    supabase.from('surahs').select('*', { count: 'exact', head: true }),
    supabase.from('ayahs').select('*', { count: 'exact', head: true }),
  ])

  if (surahs.error) throw surahs.error
  if (ayahs.error) throw ayahs.error

  return {
    surahCount: surahs.count ?? 0,
    ayahCount: ayahs.count ?? 0,
  }
}

/** Admin UI status: counts + whether the DB looks like a full vs sample import. */
export async function getQuranImportStatus(): Promise<QuranImportStatus> {
  const stats = await getCorpusStats()
  const isComplete = stats.surahCount >= EXPECTED_SURAH_COUNT
  const sampleOnly = stats.surahCount > 0 && !isComplete

  return {
    ...stats,
    expectedSurahs: EXPECTED_SURAH_COUNT,
    isComplete,
    sampleOnly,
  }
}

export function parseQuranCorpusJson(raw: unknown): QuranCorpusPayload {
  if (!raw || typeof raw !== 'object') {
    throw new Error('JSON must be an object with a "surahs" array.')
  }
  const surahs = (raw as { surahs?: unknown }).surahs
  if (!Array.isArray(surahs) || surahs.length === 0) {
    throw new Error('JSON must contain a non-empty "surahs" array.')
  }
  return { surahs: surahs as QuranCorpusSurah[] }
}

/** Bundled DEMO sample (Al-Fatiha + Al-Ikhlas). */
export function getBundledSampleCorpus(): QuranCorpusPayload {
  return parseQuranCorpusJson(sampleCorpus)
}

/**
 * Upsert surahs/ayahs using the signed-in admin session (RLS is_admin()).
 * Does not use the service role key in the browser.
 */
export async function importQuranCorpus(
  payload: QuranCorpusPayload,
): Promise<QuranImportResult> {
  if (isDemoAuthMode()) {
    throw new Error(
      'Demo mode already includes sample Quran data. Turn off VITE_DEMO_MODE to import into Supabase.',
    )
  }

  const surahs = payload.surahs
  if (!Array.isArray(surahs) || surahs.length === 0) {
    throw new Error('JSON must contain a non-empty "surahs" array.')
  }

  let surahUpserts = 0
  let ayahUpserts = 0

  for (const surah of surahs) {
    if (
      typeof surah.number !== 'number' ||
      !surah.name_ar ||
      !surah.name_en ||
      !Array.isArray(surah.ayahs)
    ) {
      throw new Error(
        `Invalid surah (need number, name_ar, name_en, ayahs[]): ${String(surah?.number)}`,
      )
    }

    const revelation =
      surah.revelation_type === 'makki' || surah.revelation_type === 'madani'
        ? surah.revelation_type
        : null

    const ayahCount = surah.ayahs.length

    const { data: surahRow, error: surahError } = await supabase
      .from('surahs')
      .upsert(
        {
          number: surah.number,
          name_ar: surah.name_ar,
          name_en: surah.name_en,
          name_ur: surah.name_ur ?? null,
          revelation_type: revelation,
          ayah_count: ayahCount,
        },
        { onConflict: 'number' },
      )
      .select('id, number')
      .single()

    if (surahError) throw surahError
    if (!surahRow) {
      throw new Error(`Surah ${surah.number} upsert returned no row`)
    }
    surahUpserts += 1

    const ayahRows = surah.ayahs.map((ayah) => {
      if (typeof ayah.number !== 'number' || !ayah.text_ar) {
        throw new Error(
          `Invalid ayah under surah ${surah.number}: need number + text_ar`,
        )
      }
      void ayah.tajweed_html
      const markup = Array.isArray(ayah.tajweed_markup)
        ? ayah.tajweed_markup
        : []

      return {
        surah_id: surahRow.id,
        ayah_number: ayah.number,
        text_ar: ayah.text_ar,
        text_uthmani: ayah.text_uthmani ?? null,
        translation_en: ayah.translation_en ?? null,
        translation_ur: ayah.translation_ur ?? null,
        tajweed_markup: markup as Json,
        juz_number: typeof ayah.juz === 'number' ? ayah.juz : null,
        page_number: typeof ayah.page === 'number' ? ayah.page : null,
      }
    })

    const chunkSize = 50
    for (let i = 0; i < ayahRows.length; i += chunkSize) {
      const chunk = ayahRows.slice(i, i + chunkSize)
      const { error: ayahError } = await supabase
        .from('ayahs')
        .upsert(chunk, { onConflict: 'surah_id,ayah_number' })
      if (ayahError) throw ayahError
      ayahUpserts += chunk.length
    }
  }

  return {
    surahUpserts,
    ayahUpserts,
    mode: surahUpserts >= EXPECTED_SURAH_COUNT ? 'PRODUCTION' : 'DEMO',
  }
}

export async function importQuranCorpusFromFile(
  file: File,
): Promise<QuranImportResult> {
  const name = file.name.toLowerCase()
  const isPdf =
    name.endsWith('.pdf') || file.type === 'application/pdf'
  const isTxt =
    name.endsWith('.txt') || file.type === 'text/plain'

  if (isPdf) {
    const { extractTextFromPdf } = await import('@/lib/pdfText')
    const { parseQuranPlainText } = await import('@/lib/quranPlainText')
    const text = await extractTextFromPdf(file)
    return importQuranCorpus(parseQuranPlainText(text))
  }

  const text = await file.text()

  if (isTxt || (!name.endsWith('.json') && !text.trim().startsWith('{'))) {
    const { parseQuranPlainText } = await import('@/lib/quranPlainText')
    // Prefer plain-text layout; fall back to JSON if it looks like JSON
    if (text.trim().startsWith('{')) {
      try {
        return importQuranCorpus(parseQuranCorpusJson(JSON.parse(text)))
      } catch {
        return importQuranCorpus(parseQuranPlainText(text))
      }
    }
    return importQuranCorpus(parseQuranPlainText(text))
  }

  let raw: unknown
  try {
    raw = JSON.parse(text) as unknown
  } catch {
    throw new Error('Invalid JSON file.')
  }
  return importQuranCorpus(parseQuranCorpusJson(raw))
}

export async function importBundledSampleCorpus(): Promise<QuranImportResult> {
  return importQuranCorpus(getBundledSampleCorpus())
}
