# Saut Ul Quran

Islamic learning platform for **Jamia Saut-ul-Quran** (Mandi Yala Tega, Tehsil Kamoke, District Gujranwala). Stack: React 19, TypeScript, Vite, Tailwind CSS, and Supabase (Auth, Postgres, Storage, Realtime).

## Requirements

- **Node.js 20+** (recommended)
- npm (comes with Node)
- Optional: a free [Supabase](https://supabase.com) project for production data

## Install

```bash
npm install
cp .env.example .env
```

Default `.env` keeps **`VITE_DEMO_MODE=true`** so local UX uses in-memory demo data without a Supabase project.

## Demo mode vs Supabase

The **same UI** and **same `src/services/*`** layer switch backends via env:

| `VITE_DEMO_MODE` | Behavior |
|------------------|----------|
| `true` | Always demo repositories / local auth (development fallback) |
| `false` | Always Supabase (requires `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`) |
| omit | Auto: demo if credentials missing, else Supabase |

Forgot-password and other Auth APIs are no-ops in demo mode (toast explains that Supabase is required).

## Environment variables

| Variable | Client? | Purpose |
|----------|---------|---------|
| `VITE_DEMO_MODE` | Yes | Demo / Supabase switch (see above) |
| `VITE_SUPABASE_URL` | Yes | Project URL for the SPA |
| `VITE_SUPABASE_ANON_KEY` | Yes | Anon/public key (RLS-protected) |
| `SUPABASE_URL` | **No** | Optional alias for the import script |
| `SUPABASE_SERVICE_ROLE_KEY` | **No — scripts only** | Bulk Quran import; **never** in Vite / frontend |

See `.env.example`.

---

## Real Supabase (go-live)

Full checklist: [`docs/SUPABASE_GO_LIVE.md`](docs/SUPABASE_GO_LIVE.md).

### 1. Create a Supabase project

Create a project at [supabase.com/dashboard](https://supabase.com/dashboard). Copy **Project URL** and **anon public** key from **Project Settings → API**.

### 2. Set env vars and disable demo mode

```bash
VITE_DEMO_MODE=false
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Run migrations `001` → `008` in order

| File | Purpose |
|------|---------|
| `supabase/migrations/001_schema.sql` | Tables, enums, helpers, `handle_new_user` |
| `supabase/migrations/002_rls.sql` | Row Level Security |
| `supabase/migrations/003_storage.sql` | Storage buckets + policies |
| `supabase/migrations/004_seed.sql` | DEMO courses, about, badges, sample Quran |
| `supabase/migrations/005_seed_demo_users.sql` | Optional — after Auth users exist |
| `supabase/migrations/006_test_attempt_expires.sql` | Test attempt `expires_at` |
| `supabase/migrations/007_security_hardening.sql` | Server grading, public verify RPC, hardening |
| `supabase/migrations/008_auth_helpers.sql` | Auth notes / optional profile email sync |

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Or paste each file into **SQL Editor** in order `001` → `008`. Details: [`supabase/README.md`](supabase/README.md).

### 4. Storage buckets (003)

Confirm buckets from `003_storage.sql` under **Storage** (course media, duas, certificates, chat-media, etc.).

### 5. Enable Realtime

**Database → Replication**: enable Realtime for `group_messages` and `notifications`.

### 6. Auth URL config

**Authentication → URL Configuration**:

- **Site URL** — `http://localhost:5173` (dev) or production URL
- **Redirect URLs** — include app origins and paths used by Auth (password recovery → `/auth/update-password`)

### 7. Create first user + SQL promote admin

1. Sign up in the app (default role: **student** via `handle_new_user`).
2. SQL Editor:

```sql
insert into public.user_roles (user_id, role)
values ('YOUR_USER_UUID', 'admin')
on conflict (user_id, role) do nothing;
```

3. Sign out / in → `/admin`. Promote teachers with `'teacher'`.

### 8. Optional Quran import (service role in shell only)

```bash
# Shell / CI secret only — never Vite
export SUPABASE_SERVICE_ROLE_KEY=...
npm run import:quran -- supabase/data/quran.sample.json
```

Guide: [`docs/QURAN_IMPORT.md`](docs/QURAN_IMPORT.md).

### 9. Run locally

```bash
npm run dev      # http://localhost:5173 (typical)
npm run build
npm run test
```

### 10. Deploy Vercel with `VITE_*` only

1. Import repo in [Vercel](https://vercel.com) — framework **Vite**.
2. Set `VITE_DEMO_MODE=false`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` only.
3. **Do not** set `SUPABASE_SERVICE_ROLE_KEY` on Vercel for the SPA.
4. Build: `npm run build`, output: `dist`.
5. Add the production URL to Supabase Auth redirect allow-list.

Also: [`DEPLOYMENT.md`](DEPLOYMENT.md), `vercel.json` for SPA rewrites.

---

## RLS overview

- New Auth signups get a `profiles` row and default **`student`** role via `handle_new_user`.
- Students **cannot self-enroll**; staff insert `enrollments`.
- Quran `surahs` / `ayahs`: authenticated **SELECT**; **writes** require `is_admin()` (or service role for the import script).
- Certificates: public verify uses `verify_certificate` RPC (anon-safe).
- Password reset: Supabase Auth only (`resetPasswordForEmail` / `updateUser`) — no custom RPC.

## Storage

Buckets from `003_storage.sql`:

| Bucket | Notes |
|--------|--------|
| `course-videos`, `course-audio`, `course-notes` | Private course media |
| `recorded-classes` | Private |
| `dua-audio`, `ayah-audio`, `logos` | Public |
| `certificates` | Private `{student_id}/...` |
| `chat-media` | Private `{group_id}/...` |

Helpers: `src/services/storage.ts`.

## Seed data

`004_seed.sql` loads DEMO catalog content. It does **not** create Auth users. Optional `005_seed_demo_users.sql` attaches demo teacher/student after you create users in Auth.

## Roles

| Role | Access |
|------|--------|
| `admin` | Full staff UI + admin console + About editor + role promotion (SQL) |
| `teacher` | Courses, students, hifz, tests, attendance, live, library, groups, announcements, certificates |
| `student` | Enrolled content, chat, announcements (read), certificates, notifications, gamification |

## Live meetings

`live_classes.meeting_url` stores an **external** Zoom / Google Meet / Jitsi link. There is no built-in WebRTC hosting on the free tier.

## Known limitations

- **Free tier:** projects may pause; Auth email rate limits; storage/bandwidth caps.
- **Live class:** external meeting URLs only.
- **Service role:** only for `import:quran` (and similar server scripts) — never in the frontend.
- **Public signup** creates a **student** role; elevate admin/teacher via SQL.
- **Student creation from staff UI:** browser `signUp` switches session — prefer Dashboard invites or an Edge Function with the service role for bulk users.
- **Quran corpus:** DEMO sample only in-repo; production needs your licensed JSON.

## Stack map

- `src/services/*` — Supabase / demo data access
- `src/features/*` — Feature UI
- `src/contexts/AuthContext.tsx` — Session, profile, roles (`isDemoMode` from `dataMode`)
- `src/lib/dataMode.ts` — `VITE_DEMO_MODE` switch
- `src/layouts/DashboardLayout.tsx` — Staff/student shell
- `src/types/database.ts` — Typed schema
- `scripts/import-quran.mjs` — Quran upsert (service role)

## License

Private / educational use for Jamia Saut-ul-Quran unless otherwise stated.
