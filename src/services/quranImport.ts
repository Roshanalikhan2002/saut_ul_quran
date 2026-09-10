import { isDemoAuthMode } from '@/lib/demoAuth'
import { demoGetCorpusStats } from '@/lib/demoStore'
import { supabase } from '@/lib/supabase'

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

/** High-level checklist shown on the admin Quran import page. */
export const QURAN_IMPORT_STEPS: QuranImportStep[] = [
  {
    id: 'obtain',
    titleEn: 'Obtain an authentic corpus',
    titleUr: 'مستند قرآنی مواد حاصل کریں',
    detailEn:
      'Use a licensed Arabic text and translations. Do not invent verses.',
    detailUr:
      'لائسنس یافتہ عربی متن اور تراجم استعمال کریں۔ آیات خود نہ بنائیں۔',
  },
  {
    id: 'map',
    titleEn: 'Map JSON to the import schema',
    titleUr: 'JSON کو امپورٹ اسکیمہ سے ملائیں',
    detailEn:
      'See docs/QURAN_IMPORT.md and supabase/data/quran.sample.json for the shape.',
    detailUr:
      'شکل کے لیے docs/QURAN_IMPORT.md اور supabase/data/quran.sample.json دیکھیں۔',
  },
  {
    id: 'run',
    titleEn: 'Run the import script (service role)',
    titleUr: 'امپورٹ اسکرپٹ چلائیں (سروس رول)',
    detailEn:
      'npm run import:quran -- path/to/corpus.json with SUPABASE_SERVICE_ROLE_KEY set.',
    detailUr:
      'SUPABASE_SERVICE_ROLE_KEY کے ساتھ npm run import:quran -- path/to/corpus.json',
  },
  {
    id: 'rls',
    titleEn: 'RLS: admin write only',
    titleUr: 'RLS: صرف ایڈمن تحریر',
    detailEn:
      'Authenticated users can read surahs/ayahs; inserts/updates require is_admin() or the service-role script.',
    detailUr:
      'تصديق شدہ صارفین پڑھ سکتے ہیں؛ لکھنے کے لیے is_admin() یا سروس رول اسکرپٹ درکار ہے۔',
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
