# Admin user provisioning (login ID + password)

**One admin only:** `fehmidataj27@gmail.com`  
Teachers/students **do not need personal emails**.

## Model

| Who | How they log in |
|-----|-----------------|
| Admin (only 1) | `fehmidataj27@gmail.com` + password |
| Teacher / Student | Admin-assigned **User ID** (e.g. `STU-001`, `TCH-02`) + password |

Behind the scenes, User IDs map to `userid@suq.local` in Supabase Auth.

Only **that admin** can:
- Create teacher/student accounts (User ID + password)
- Reset passwords
- See the user list in Admin → Users & roles

Public self-signup is closed. Password reset by email is closed.

## 1. SQL migrations (new project)

In Supabase SQL Editor, run **in order** (skip `005`):

1. `001_schema.sql`
2. `002_rls.sql`
3. `003_storage.sql`
4. `004_seed.sql` (optional sample courses)
5. `006_test_attempt_expires.sql`
6. `007_security_hardening.sql`
7. `008_auth_helpers.sql`
8. `009_login_id_admin_provisioning.sql`
9. `010_single_admin.sql`

## 2. Create primary admin (once)

1. Supabase → Authentication → Users → **Add user**
   - Email: `fehmidataj27@gmail.com`
   - Password: (secure)
   - Auto-confirm: **ON**
2. Run `supabase/sql/promote_primary_admin.sql`  
   (or re-run `010_single_admin.sql`)

## 3. Deploy Edge Function (create/reset users)

```bash
supabase login
supabase link --project-ref sgdohxojpjirwfnpyrpk
supabase functions deploy admin-manage-user
```

Never put the service role key in `VITE_*` / Vercel frontend env.

## 4. App + Vercel env (**Config** type, not Secret)

```env
VITE_DEMO_MODE=false
VITE_SUPABASE_URL=https://sgdohxojpjirwfnpyrpk.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_key_from_Settings_API
```

Redeploy with **Build Cache OFF**.

Auth → URL Configuration:
- Site URL: `https://saut-ul-quran.vercel.app`
- Redirect: `https://saut-ul-quran.vercel.app/**`

## 5. Daily admin workflow

1. Sign in as `fehmidataj27@gmail.com` → opens **Admin** panel
2. **Users & roles** → create teacher/student (User ID + password)
3. Share ID + password with that person
4. **Reset password** only from this list

## 6. Teacher/student login

Sign-in field: assigned User ID (`STU-001`) — not a personal Gmail.
