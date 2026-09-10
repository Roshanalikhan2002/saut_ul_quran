# Deployment — Saut Ul Quran

Brief guide for hosting the Vite SPA on **Vercel** (free) with **Supabase** as the backend.

## Prerequisites

1. Supabase project with migrations `001`–`004` applied (`005` optional).
2. Env values from Supabase **Project Settings → API**:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon` `public` key → `VITE_SUPABASE_ANON_KEY`
3. Realtime enabled for `group_messages` and `notifications` if you rely on live chat / badges.

## Vercel

1. Import the Git repository in Vercel.
2. **Framework Preset:** Vite  
   **Build Command:** `npm run build`  
   **Output Directory:** `dist`  
   **Install Command:** `npm install`
3. Set environment variables (Production + Preview as needed):

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

4. Deploy. SPA routes are handled by Vite’s static output; if deep links 404, add a Vercel rewrite:

   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

   Save as `vercel.json` at the repo root if not already present.

## Supabase Auth URLs

In **Authentication → URL Configuration**, add:

- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/**` and local `http://localhost:5173/**`

## Post-deploy admin

1. Sign up on the live site.
2. Promote to admin in SQL (`user_roles`).
3. Edit About content under Teacher → Settings (admin).
4. Create/enroll students (see root `README.md`).

## Do not

- Expose `SUPABASE_SERVICE_ROLE_KEY` to Vercel **Vite** env (`VITE_*`).
- Rely on client `signUp` for mass student provisioning without re-auth handling.

## Alternatives

Netlify, Cloudflare Pages, or any static host works the same way: build `dist`, inject the two `VITE_` vars at build time.
