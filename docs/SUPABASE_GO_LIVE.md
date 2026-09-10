# Supabase go-live checklist

Exact steps to switch **Saut Ul Quran** from local demo mode to a real Supabase project. The same UI and `src/services/*` layer are used in both modes; only `VITE_DEMO_MODE` (and credentials) change the backend.

## 1. Create a Supabase project

1. Open [supabase.com/dashboard](https://supabase.com/dashboard) and create a project.
2. Wait until the database is ready.
3. Open **Project Settings → API** and copy:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon` `public` key → `VITE_SUPABASE_ANON_KEY`

## 2. Set environment variables

In `.env` (local) and in your host’s env (Vercel):

```bash
VITE_DEMO_MODE=false
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

| Flag | Behavior |
|------|----------|
| `VITE_DEMO_MODE=true` | Always local demo data (even if URL/key are set) — **dev fallback** |
| `VITE_DEMO_MODE=false` | Always Supabase (requires valid URL + anon key) |
| omit | Auto: demo if URL/key missing, else Supabase |

**Never** put `SUPABASE_SERVICE_ROLE_KEY` in Vite / frontend / Vercel SPA env.

## 3. Run migrations in order

Apply `001` → `008` (SQL Editor or CLI):

| File | Purpose |
|------|---------|
| `001_schema.sql` | Tables, enums, `handle_new_user` |
| `002_rls.sql` | Row Level Security |
| `003_storage.sql` | Storage buckets + policies |
| `004_seed.sql` | DEMO catalog seed |
| `005_seed_demo_users.sql` | Optional — after Auth users exist |
| `006_test_attempt_expires.sql` | Test attempt timer |
| `007_security_hardening.sql` | Grading RPC, verify certificate, hardening |
| `008_auth_helpers.sql` | Auth notes / optional email sync (comment-only by default) |

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Or paste each file into **SQL Editor** in order.

## 4. Storage buckets (003)

Confirm under **Storage** that buckets from `003_storage.sql` exist (`course-videos`, `course-audio`, `course-notes`, `recorded-classes`, `dua-audio`, `ayah-audio`, `logos`, `certificates`, `chat-media`).

## 5. Enable Realtime

**Database → Replication** (or Realtime settings): enable for:

- `group_messages`
- `notifications`

## 6. Auth URL configuration

**Authentication → URL Configuration**:

| Setting | Example |
|---------|---------|
| Site URL | `http://localhost:5173` (dev) or your Vercel URL (prod) |
| Redirect URLs | `http://localhost:5173/**`, `https://YOUR_APP.vercel.app/**` |

Password recovery redirects to `/auth/update-password` — that origin must be allowed.

## 7. First user + promote admin

1. Sign up in the app (`/auth/sign-up`) — trigger assigns **student**.
2. In SQL Editor:

```sql
insert into public.user_roles (user_id, role)
values ('YOUR_USER_UUID', 'admin')
on conflict (user_id, role) do nothing;
```

3. Sign out and back in → `/admin`.

Promote teachers with role `'teacher'`.

## 8. Optional Quran import (service role in shell only)

```bash
# In shell / CI secret — never Vite
export SUPABASE_SERVICE_ROLE_KEY=...
npm run import:quran -- supabase/data/quran.sample.json
```

See [`docs/QURAN_IMPORT.md`](./QURAN_IMPORT.md).

## 9. Run locally

```bash
npm run dev
npm run build
npm run test
```

With `VITE_DEMO_MODE=false` and real credentials, auth (including forgot/update password) hits Supabase Auth.

## 10. Deploy on Vercel

1. Import the repo; framework **Vite**.
2. Set **only** `VITE_*` vars: `VITE_DEMO_MODE=false`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
3. Do **not** set `SUPABASE_SERVICE_ROLE_KEY` on Vercel for the SPA.
4. Build: `npm run build`, output `dist`.
5. Add the production URL to Supabase Auth redirect allow-list.

## Demo mode (development fallback)

Keep `VITE_DEMO_MODE=true` for local UI work without a project. Forgot-password shows a toast and does not call the API. The same screens and services switch to live data when the flag is `false` and credentials are set.
