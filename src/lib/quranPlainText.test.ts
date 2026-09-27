import { describe, expect, it } from 'vitest'
import { parseQuranPlainText } from '@/lib/quranPlainText'

describe('parseQuranPlainText', () => {
  it('parses SURAH and ayah pipe lines', () => {
    const text = `
SURAH 1 | Al-Fatiha | الفاتحة | makki
1 | بسم الله | In the name | اللہ کے نام سے
2 | الحمد | Praise | تعریف

SURAH 112 | Al-Ikhlas | الإخلاص | makki
1 | قل هو الله | Say He is Allah | کہو
`
    const { surahs } = parseQuranPlainText(text)
    expect(surahs).toHaveLength(2)
    expect(surahs[0].number).toBe(1)
    expect(surahs[0].ayahs).toHaveLength(2)
    expect(surahs[0].ayahs[0].text_ar).toContain('بسم')
    expect(surahs[1].number).toBe(112)
    expect(surahs[1].ayahs[0].translation_en).toMatch(/Say/)
  })
})
