# Admin user provisioning (login ID + password)

Teachers and students **do not need personal emails**.

## Model

| Who | How they log in |
|-----|-----------------|
| Admin | Real email: `fehmidataj27@gmail.com` + password |
| Teacher / Student | Admin-assigned **User ID** (e.g. `STU-001`, `TCH-02`) + password |

Behind the scenes, User IDs map to `userid@suq.local` in Supabase Auth.

Only **admin** can:
- Create teacher/student accounts (User ID + password)
- Reset passwords

## 1. SQL migration

Run in Supabase SQL Editor:

`supabase/migrations/009_login_id_admin_provisioning.sql`

## 2. Create primary admin (once)

1. Supabase → Authentication → Users → **Add user**
   - Email: `fehmidataj27@gmail.com`
   - Password: (choose securely)
   - Auto-confirm: **ON**
2. Copy user UUID
3. SQL:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('PASTE_ADMIN_UUID', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- optional: remove default student role
DELETE FROM public.user_roles
WHERE user_id = 'PASTE_ADMIN_UUID' AND role = 'student';
```

## 3. Deploy Edge Function (required for create/reset on production)

```bash
# Install Supabase CLI, then from project root:
supabase login
supabase link --project-ref hvxgfgrsukulvirfnfpp
supabase functions deploy admin-manage-user
```

Service role is injected automatically by Supabase for Edge Functions — **never** put it in Vite/`VITE_*` env.

## 4. App env

```env
VITE_DEMO_MODE=false
VITE_SUPABASE_URL=https://hvxgfgrsukulvirfnfpp.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_key
```

Same vars on Vercel.

## 5. Admin workflow in the app

1. Sign in as `fehmidataj27@gmail.com`
2. **Admin → Users & roles**
3. Create user: name + User ID + role (teacher/student) + password
4. Share **User ID + password** with that person (WhatsApp/print)
5. Use **Reset password** on any user when needed

## 6. User login

Sign-in field accepts:
- Admin email, or
- Assigned User ID (`STU-001`)

No public self-signup for teachers/students.
