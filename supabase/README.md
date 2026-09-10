# Saut Ul Quran — Supabase Backend

PostgreSQL schema, RLS, storage, and DEMO seed for **Jamia Saut-ul-Quran** (Mandi Yala Tega, Tehsil Kamoke, District Gujranwala).

## Migrations

| File | Purpose |
|------|---------|
| `migrations/001_schema.sql` | Enums, tables, FKs, indexes, `updated_at` triggers, helper RPCs |
| `migrations/002_rls.sql` | Row Level Security policies |
| `migrations/003_storage.sql` | Storage buckets + `storage.objects` policies |
| `migrations/004_seed.sql` | DEMO data (courses, about, Quran samples, badges) — **no auth users** |
| `migrations/005_seed_demo_users.sql` | **Optional** — attach DEMO teacher/student after Auth users exist |
| `migrations/006_test_attempt_expires.sql` | Adds `test_attempts.expires_at` for timed attempts |
| `migrations/007_security_hardening.sql` | Server-side grading RPC, public `verify_certificate`, mute hardening, course-creator teacher access |
| `migrations/008_auth_helpers.sql` | Auth notes; optional profile email sync (commented). Password reset = Supabase Auth only |

Apply in order **001 → 008**.

## Prerequisites

1. A Supabase project ([dashboard](https://supabase.com/dashboard))
2. Project URL + anon key in `.env` (see `.env.example`)
3. Either **Supabase CLI** or the SQL Editor

```bash
# .env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

For Quran bulk import (optional), also set `SUPABASE_SERVICE_ROLE_KEY` (never in Vite). See [`docs/QURAN_IMPORT.md`](../docs/QURAN_IMPORT.md).

## Apply with Supabase CLI (recommended)

```bash
# From repo root
npm i -g supabase   # if needed
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Push all migrations in order
supabase db push
```

If you keep migrations only as raw SQL (this repo style), you can also run:

```bash
supabase db execute -f supabase/migrations/001_schema.sql
supabase db execute -f supabase/migrations/002_rls.sql
supabase db execute -f supabase/migrations/003_storage.sql
supabase db execute -f supabase/migrations/004_seed.sql
# optional:
# supabase db execute -f supabase/migrations/005_seed_demo_users.sql
supabase db execute -f supabase/migrations/006_test_attempt_expires.sql
supabase db execute -f supabase/migrations/007_security_hardening.sql
supabase db execute -f supabase/migrations/008_auth_helpers.sql
```

## Apply via SQL Editor

1. Open **SQL Editor** in the Supabase dashboard  
2. Paste and run `001` → `002` → `003` → `004` → (`005` optional) → `006` → `007` → `008`  
3. Confirm buckets under **Storage**  
4. (Optional) Create Auth users, edit UUIDs in `005_seed_demo_users.sql`, run it  

Migrations use `IF NOT EXISTS` / `DROP POLICY IF EXISTS` / `ON CONFLICT` where helpful so re-runs are safer (still prefer a fresh project for first install).

Go-live checklist: [`docs/SUPABASE_GO_LIVE.md`](../docs/SUPABASE_GO_LIVE.md).

## Roles & enrollment

| Role | Capability (high level) |
|------|-------------------------|
| `admin` | Full access |
| `teacher` | Manage assigned courses, enroll students, hifz/attendance/tests |
| `student` | Own profile, enrolled content, own progress/tests/notifications |

**Students cannot self-enroll.** Inserts into `enrollments` require `is_admin()` or `teacher_manages_course(course_id)`.

New Auth signups get a `profiles` row and default `student` role via `handle_new_user`.

### Helper functions

```sql
public.is_admin()
public.is_teacher()
public.is_staff()                 -- admin OR teacher
public.has_role(role)
public.teacher_manages_course(course_id)  -- includes course creator (007)
public.student_enrolled(course_id)
public.is_group_member(group_id)
public.verify_certificate(p_number)       -- public verify (007)
public.submit_and_grade_attempt(attempt_id) -- server grading (007)
```

## Storage buckets

| Bucket | Public | Path convention |
|--------|--------|-----------------|
| `course-videos` | private | `{course_id}/...` |
| `course-audio` | private | `{course_id}/...` |
| `course-notes` | private | `{course_id}/...` |
| `recorded-classes` | private | `{course_id}/...` |
| `dua-audio` | public | free |
| `ayah-audio` | public | free |
| `logos` | public | free |
| `certificates` | private | `{student_id}/...` |
| `chat-media` | private | `{group_id}/...` |

## DEMO seed (`004`)

Seeds (clearly marked DEMO):

- `about_jamia` — Jamia Saut-ul-Quran, Head Ustazah Hafiza Wajiha, bilingual mission  
- **9 courses** with `en` / `ur` translations  
- Sample lessons (Tajweed)  
- Badges, tajweed rules, daily duas, library metadata  
- Surahs **Al-Fatiha** + **Al-Ikhlas** with `tajweed_markup` JSON  

Does **not** insert `auth.users`. See comments at the bottom of `004_seed.sql` and the optional `005` script.

Sample JSON mirror for the Node importer: `supabase/data/quran.sample.json`.

### Attach DEMO users (`005`)

1. Create Auth users (Dashboard or Admin API).  
2. Optionally use fixed IDs:

   - Admin `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa0`  
   - Teacher `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1`  
   - Student `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2`  

3. Run `005_seed_demo_users.sql` (update UUIDs if different).

Admin API sketch:

```ts
await supabaseAdmin.auth.admin.createUser({
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  email: 'teacher@demo.sautulquran.local',
  password: 'CHANGE_ME',
  email_confirm: true,
  user_metadata: { full_name: 'DEMO Teacher' },
})
```

## TypeScript types

App types live at `src/types/database.ts` and match this schema for `@supabase/supabase-js`:

```ts
import type { Database } from '@/types/database'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient<Database>(url, anonKey)
```

Regenerate later with:

```bash
supabase gen types typescript --linked > src/types/database.ts
```

## Verification checklist

- [ ] `select * from about_jamia` returns Jamia row  
- [ ] `select slug from courses order by sort_order` returns 9 DEMO courses  
- [ ] Sign in as student → cannot `insert` into `enrollments`  
- [ ] Teacher assigned via `course_teachers` can enroll that student  
- [ ] Announcement group: student can read messages, cannot insert  
- [ ] Chat group: member can insert messages  
- [ ] Storage buckets visible; public ones serve without auth  
- [ ] `select verify_certificate('SUQ-…')` works for anon after `007`  
- [ ] Timed attempts have `expires_at` after `006`  

## Reset (dev only)

```bash
supabase db reset   # if using CLI migrations history
# or drop public tables carefully in a disposable project
```

Never run destructive resets against production.
