/**
 * Supabase Edge Function: admin-manage-user
 *
 * Actions (JSON body):
 *   { action: "create", loginId, password, fullName, role: "teacher"|"student" }
 *   { action: "resetPassword", userId, password }
 *
 * Deploy:
 *   supabase functions deploy admin-manage-user
 * Secrets: SUPABASE_SERVICE_ROLE_KEY (auto), SUPABASE_URL (auto)
 *
 * Requires caller JWT with admin role in public.user_roles.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const INTERNAL_DOMAIN = 'suq.local'
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

function loginIdToEmail(loginId: string) {
  const id = loginId.trim().toLowerCase()
  if (id.includes('@')) return id
  return `${id}@${INTERNAL_DOMAIN}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing Authorization' }, 401)

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const adminClient = createClient(supabaseUrl, serviceKey)

    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser()
    if (userErr || !user) return json({ error: 'Unauthorized' }, 401)

    const { data: roles, error: roleErr } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (roleErr || !roles) {
      return json({ error: 'Admin only' }, 403)
    }

    const body = await req.json()
    const action = body.action as string

    if (action === 'create') {
      const loginId = String(body.loginId ?? '').trim().toLowerCase()
      const password = String(body.password ?? '')
      const fullName = String(body.fullName ?? '').trim()
      const role = body.role as 'teacher' | 'student'

      if (!loginId || loginId.includes('@')) {
        return json(
          { error: 'loginId required (no @). Example: STU-001 or TCH-01' },
          400,
        )
      }
      if (password.length < 8) {
        return json({ error: 'Password must be at least 8 characters' }, 400)
      }
      if (role !== 'teacher' && role !== 'student') {
        return json({ error: 'role must be teacher or student' }, 400)
      }

      const email = loginIdToEmail(loginId)

      const { data: created, error: createErr } =
        await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            login_id: loginId,
            provisioned_by: user.id,
          },
        })

      if (createErr || !created.user) {
        return json({ error: createErr?.message ?? 'Create failed' }, 400)
      }

      const userId = created.user.id

      await adminClient.from('profiles').upsert({
        id: userId,
        email,
        full_name: fullName || loginId,
        login_id: loginId,
        is_active: true,
      })

      // Replace default student-only if teacher
      if (role === 'teacher') {
        await adminClient.from('user_roles').delete().eq('user_id', userId)
        await adminClient.from('user_roles').insert({
          user_id: userId,
          role: 'teacher',
          granted_by: user.id,
        })
        await adminClient.from('teachers').upsert(
          {
            profile_id: userId,
            title: 'Ustazah / Teacher',
            is_active: true,
          },
          { onConflict: 'profile_id' },
        )
      } else {
        await adminClient.from('user_roles').upsert(
          { user_id: userId, role: 'student', granted_by: user.id },
          { onConflict: 'user_id,role' },
        )
        await adminClient.from('students').upsert(
          {
            profile_id: userId,
            student_code: loginId.toUpperCase(),
            notes: 'Provisioned by admin',
          },
          { onConflict: 'profile_id' },
        )
      }

      return json({
        ok: true,
        userId,
        loginId,
        email,
        role,
      })
    }

    if (action === 'resetPassword') {
      const userId = String(body.userId ?? '')
      const password = String(body.password ?? '')
      if (!userId || password.length < 8) {
        return json({ error: 'userId and password (min 8) required' }, 400)
      }

      const { error: updErr } = await adminClient.auth.admin.updateUserById(
        userId,
        { password },
      )
      if (updErr) return json({ error: updErr.message }, 400)
      return json({ ok: true })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error'
    return json({ error: message }, 500)
  }
})
