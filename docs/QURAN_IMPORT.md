# Quran corpus import

This app stores Quran text in `public.surahs` and `public.ayahs`. The repo ships **DEMO samples only** (Al-Fatiha + Al-Ikhlas from `004_seed.sql`). It does **not** invent or redistribute a full Quran corpus.

## 1. Obtain an authentic corpus

1. Source text and translations from a **licensed / authorized** provider (publisher, Islamic org, or API you have rights to use).
2. Verify Arabic orthography (Uthmani vs simple) matches your teaching needs.
3. Do **not** paste random web scrapes into production.

## 2. Map to the import schema

Create a JSON file:

```json
{
  "surahs": [
    {
      "number": 1,
      "name_ar": "...",
      "name_en": "Al-Fatihah",
      "name_ur": "...",
      "revelation_type": "makki",
      "ayahs": [
        {
          "number": 1,
          "text_ar": "...",
          "translation_en": "...",
          "translation_ur": "...",
          "tajweed_html": null,
          "tajweed_markup": [],
          "juz": 1
        }
      ]
    }
  ]
}
```

| Field | Maps to |
|-------|---------|
| `surahs[].number` | `surahs.number` (unique 1–114) |
| `name_ar` / `name_en` / `name_ur` | same columns |
| `revelation_type` | `makki` \| `madani` |
| `ayahs[].number` | `ayahs.ayah_number` |
| `text_ar` | `ayahs.text_ar` |
| `translation_*` | `ayahs.translation_*` |
| `juz` | `ayahs.juz_number` |
| `tajweed_markup` (optional) | `ayahs.tajweed_markup` JSONB |
| `tajweed_html` | Accepted for format compatibility; **not stored** (no HTML column) |

`ayah_count` on each surah is set from the length of `ayahs`.

Sample file (DEMO only): [`supabase/data/quran.sample.json`](../supabase/data/quran.sample.json).

## 3. Run the import script

Requires **service role** (bypasses RLS). Never expose it to Vite / the browser.

```bash
# .env (server-side only)
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# DEMO sample
npm run import:quran -- supabase/data/quran.sample.json

# Production corpus (your authenticated JSON)
npm run import:quran -- path/to/quran.full.json
```

The script prints surah/ayah counts and labels the run as **DEMO** (sample filename or fewer than 114 surahs) or **PRODUCTION**.

## 4. RLS note (admin write)

- **SELECT** on `surahs` / `ayahs`: authenticated users (see `002_rls.sql`).
- **INSERT / UPDATE / DELETE**: `is_admin()` only (`surahs_admin_write` / `ayahs_admin_write`).
- The Node importer uses `SUPABASE_SERVICE_ROLE_KEY`, which **bypasses RLS** — that is intentional for bulk load. Do not put the service role in `VITE_*` env vars or frontend code.

After import, staff can check counts in the admin UI via `getCorpusStats()` in `src/services/quranImport.ts` (anon key + signed-in session).
