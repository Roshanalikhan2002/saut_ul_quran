#!/usr/bin/env node
/**
 * Import Quran corpus JSON into Supabase (surahs + ayahs).
 *
 * Usage:
 *   node scripts/import-quran.mjs <path-to-json>
 *   npm run import:quran -- supabase/data/quran.sample.json
 *
 * Required env (server-only — never use Vite prefixes for the service role):
 *   SUPABASE_URL                  Project URL (falls back to VITE_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY     Service role key (required; refuses without it)
 *
 * Expected JSON shape:
 * {
 *   "surahs": [
 *     {
 *       "number": 1,
 *       "name_ar": "...",
 *       "name_en": "Al-Fatihah",
 *       "name_ur": "...",
 *       "revelation_type": "makki",
 *       "ayahs": [
 *         {
 *           "number": 1,
 *           "text_ar": "...",
 *           "translation_en": "...",
 *           "translation_ur": "...",
 *           "tajweed_html": null,
 *           "tajweed_markup": [],
 *           "juz": 1
 *         }
 *       ]
 *     }
 *   ]
 * }
 *
 * Notes:
 * - Does NOT invent Quran text — you must supply authentic corpus JSON.
 * - Service role bypasses RLS (admin write). Prefer this script over client upserts.
 * - Optional `tajweed_markup` maps to ayahs.tajweed_markup (JSONB).
 * - `tajweed_html` is accepted in the file format but not stored (no HTML column).
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const FULL_SURAH_COUNT = 114

function loadDotEnv() {
  const envPath = resolve(process.cwd(), '.env')
  if (!existsSync(envPath)) return
  const text = readFileSync(envPath, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

function die(message, code = 1) {
  console.error(`\n❌ ${message}\n`)
  process.exit(code)
}

function labelImportMode(filePath, surahCount) {
  const name = basename(filePath).toLowerCase()
  const isSampleName = name.includes('sample') || name.includes('demo')
  const isPartial = surahCount < FULL_SURAH_COUNT
  if (isSampleName || isPartial) {
    return {
      mode: 'DEMO',
      reason: isSampleName
        ? 'filename indicates sample/demo'
        : `only ${surahCount} of ${FULL_SURAH_COUNT} surahs`,
    }
  }
  return {
    mode: 'PRODUCTION',
    reason: `full corpus (${surahCount} surahs)`,
  }
}

async function main() {
  loadDotEnv()

  const jsonPathArg = process.argv[2]
  if (!jsonPathArg) {
    die(
      'Missing JSON path.\nUsage: node scripts/import-quran.mjs <path-to-json>\nExample: npm run import:quran -- supabase/data/quran.sample.json',
    )
  }

  const jsonPath = resolve(process.cwd(), jsonPathArg)
  if (!existsSync(jsonPath)) {
    die(`File not found: ${jsonPath}`)
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey) {
    die(
      'Refusing to run: SUPABASE_SERVICE_ROLE_KEY is required.\n' +
        'Set it in the environment (or .env). Do NOT put the service role in VITE_* vars.',
    )
  }
  if (!url) {
    die('Missing SUPABASE_URL (or VITE_SUPABASE_URL fallback).')
  }

  let payload
  try {
    payload = JSON.parse(readFileSync(jsonPath, 'utf8'))
  } catch (err) {
    die(`Invalid JSON: ${err.message}`)
  }

  if (!payload || !Array.isArray(payload.surahs) || payload.surahs.length === 0) {
    die('JSON must contain a non-empty "surahs" array.')
  }

  const { mode, reason } = labelImportMode(jsonPath, payload.surahs.length)
  console.log('═══════════════════════════════════════════')
  console.log(`  Quran import — ${mode}`)
  console.log(`  Reason: ${reason}`)
  console.log(`  File: ${jsonPath}`)
  console.log('═══════════════════════════════════════════')

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let surahUpserts = 0
  let ayahUpserts = 0
  let ayahTotalInFile = 0

  for (const surah of payload.surahs) {
    if (
      typeof surah.number !== 'number' ||
      !surah.name_ar ||
      !surah.name_en ||
      !Array.isArray(surah.ayahs)
    ) {
      die(
        `Invalid surah entry (need number, name_ar, name_en, ayahs[]): ${JSON.stringify(surah?.number)}`,
      )
    }

    const revelation =
      surah.revelation_type === 'makki' || surah.revelation_type === 'madani'
        ? surah.revelation_type
        : null

    const ayahCount = surah.ayahs.length
    ayahTotalInFile += ayahCount

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

    if (surahError) {
      die(`Surah ${surah.number} upsert failed: ${surahError.message}`)
    }
    surahUpserts += 1

    const ayahRows = surah.ayahs.map((ayah) => {
      if (typeof ayah.number !== 'number' || !ayah.text_ar) {
        throw new Error(
          `Invalid ayah under surah ${surah.number}: need number + text_ar`,
        )
      }
      let markup = []
      if (Array.isArray(ayah.tajweed_markup)) {
        markup = ayah.tajweed_markup
      }
      // tajweed_html is format-compatible but not stored (no HTML column)
      void ayah.tajweed_html

      return {
        surah_id: surahRow.id,
        ayah_number: ayah.number,
        text_ar: ayah.text_ar,
        text_uthmani: ayah.text_uthmani ?? null,
        translation_en: ayah.translation_en ?? null,
        translation_ur: ayah.translation_ur ?? null,
        tajweed_markup: markup,
        juz_number: typeof ayah.juz === 'number' ? ayah.juz : null,
        page_number: typeof ayah.page === 'number' ? ayah.page : null,
      }
    })

    // Upsert in chunks to stay within payload limits
    const chunkSize = 50
    for (let i = 0; i < ayahRows.length; i += chunkSize) {
      const chunk = ayahRows.slice(i, i + chunkSize)
      const { error: ayahError } = await supabase
        .from('ayahs')
        .upsert(chunk, { onConflict: 'surah_id,ayah_number' })
      if (ayahError) {
        die(
          `Ayahs for surah ${surah.number} upsert failed: ${ayahError.message}`,
        )
      }
      ayahUpserts += chunk.length
    }

    console.log(
      `  ✓ Surah ${surah.number} (${surah.name_en}) — ${ayahCount} ayahs`,
    )
  }

  console.log('')
  console.log(`Mode:           ${mode}`)
  console.log(`Surahs upserted: ${surahUpserts}`)
  console.log(`Ayahs upserted:  ${ayahUpserts}`)
  console.log(`Ayahs in file:   ${ayahTotalInFile}`)
  if (mode === 'DEMO') {
    console.log(
      '\n⚠ DEMO import complete — this is NOT a full authentic corpus.',
    )
    console.log('  Obtain a licensed/authentic JSON and re-run for production.')
  } else {
    console.log('\n✓ PRODUCTION import complete.')
  }
}

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))

if (isMain) {
  main().catch((err) => {
    die(err?.message || String(err))
  })
}
