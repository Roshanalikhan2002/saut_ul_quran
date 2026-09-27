import type { QuranCorpusPayload, QuranCorpusSurah } from '@/services/quranImport'

/**
 * Simple text / PDF layout for Quran import:
 *
 * SURAH 1 | Al-Fatiha | الفاتحة | makki
 * 1 | Arabic text | English | Urdu
 * 2 | Arabic text | English | Urdu
 *
 * SURAH 112 | Al-Ikhlas | الإخلاص | makki
 * 1 | ...
 *
 * Columns after ayah number: text_ar | translation_en | translation_ur (EN/UR optional).
 */

const SURAH_LINE =
  /^\s*SURAH\s+(\d{1,3})\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*(makki|madani)?\s*$/i
const AYAH_LINE =
  /^\s*(\d{1,3})\s*\|\s*([^|]+?)(?:\s*\|\s*([^|]*))?(?:\s*\|\s*(.*))?\s*$/

export function parseQuranPlainText(text: string): QuranCorpusPayload {
  const normalized = text
    .replace(/\u0000/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')

  // Allow a PDF/TXT that is actually JSON
  const trimmed = normalized.trim()
  if (trimmed.startsWith('{')) {
    try {
      const raw = JSON.parse(trimmed) as { surahs?: unknown }
      if (Array.isArray(raw.surahs) && raw.surahs.length > 0) {
        return { surahs: raw.surahs as QuranCorpusSurah[] }
      }
    } catch {
      /* fall through to line parser */
    }
  }

  const lines = normalized.split('\n')
  const surahs: QuranCorpusSurah[] = []
  let current: QuranCorpusSurah | null = null

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#') || line.startsWith('_comment')) continue

    const surahMatch = line.match(SURAH_LINE)
    if (surahMatch) {
      if (current && current.ayahs.length > 0) surahs.push(current)
      const number = Number(surahMatch[1])
      const name_en = surahMatch[2].trim()
      const name_ar = surahMatch[3].trim()
      const revelation = (surahMatch[4] || '').toLowerCase()
      current = {
        number,
        name_en,
        name_ar,
        name_ur: name_ar,
        revelation_type:
          revelation === 'makki' || revelation === 'madani' ? revelation : null,
        ayahs: [],
      }
      continue
    }

    const ayahMatch = line.match(AYAH_LINE)
    if (ayahMatch && current) {
      const number = Number(ayahMatch[1])
      const text_ar = ayahMatch[2].trim()
      if (!text_ar) continue
      current.ayahs.push({
        number,
        text_ar,
        translation_en: ayahMatch[3]?.trim() || null,
        translation_ur: ayahMatch[4]?.trim() || null,
        tajweed_markup: [],
      })
    }
  }

  if (current && current.ayahs.length > 0) surahs.push(current)

  if (surahs.length === 0) {
    throw new Error(
      'Could not find surahs in this file. Use lines like:\nSURAH 1 | Al-Fatiha | الفاتحة | makki\n1 | Arabic | English | Urdu',
    )
  }

  for (const s of surahs) {
    if (s.ayahs.length === 0) {
      throw new Error(`Surah ${s.number} has no ayahs.`)
    }
  }

  return { surahs }
}
