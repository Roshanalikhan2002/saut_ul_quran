import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { getDashboardPath, getPrimaryRole } from '@/lib/auth'
import { APP_NAME } from '@/lib/constants'
import { PRIMARY_ADMIN_EMAIL } from '@/lib/loginId'
import { isDemoAuthMode } from '@/lib/demoAuth'
import { supabase } from '@/lib/supabase'
import type { AppRole } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LanguageSwitcher } from '@/components/ui/language-switcher'

export function SignInPage() {
  const { t } = useTranslation()
  const { signIn, signInDemo, isDemoMode } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? null
  const demo = isDemoMode || isDemoAuthMode()

  const [loginId, setLoginId] = useState(demo ? PRIMARY_ADMIN_EMAIL : '')
  const [password, setPassword] = useState(demo ? 'demo1234' : '')
  const [submitting, setSubmitting] = useState(false)

  async function resolveDashboard(): Promise<string> {
    if (demo) {
      const lower = loginId.toLowerCase()
      if (lower.includes('teacher') || lower.includes('tch')) return '/teacher'
      if (lower.includes('student') || lower.includes('stu')) return '/student'
      return '/admin'
    }
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const userId = session?.user?.id
    if (!userId) return '/student'
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
    const roles = (data ?? []).map((r) => r.role as AppRole)
    return getDashboardPath(getPrimaryRole(roles))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!loginId.trim()) {
      toast.error(t('auth.loginIdRequired'))
      return
    }
    if (!password) {
      toast.error(t('auth.passwordRequired'))
      return
    }

    setSubmitting(true)
    try {
      await signIn(loginId.trim(), password)
      toast.success(t('auth.loginSuccess'))
      const dest = from || (await resolveDashboard())
      navigate(dest, { replace: true })
    } catch {
      /* toasted in context */
    } finally {
      setSubmitting(false)
    }
  }

  async function enterAs(role: AppRole) {
    setSubmitting(true)
    try {
      await signInDemo(role)
      toast.success(t('auth.loginSuccess'))
      navigate(getDashboardPath(role), { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-gold-soft)_0%,_transparent_55%)] opacity-70"
        aria-hidden
      />
      <div className="relative w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="" className="h-8 w-8" />
            <span className="font-display font-semibold text-navy">
              {APP_NAME}
            </span>
          </Link>
          <LanguageSwitcher size="sm" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('auth.loginTitle')}</CardTitle>
            <CardDescription>{t('auth.loginIdSubtitle')}</CardDescription>
          </CardHeader>
          <form onSubmit={(e) => void onSubmit(e)}>
            <CardContent className="space-y-4">
              <p className="rounded-md border border-gold/40 bg-gold-soft/50 px-3 py-2 text-sm text-navy">
                {t('auth.adminAssignsCredentials')}
              </p>
              {demo ? (
                <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  {t('auth.demoModeNotice')}
                </p>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="loginId">{t('auth.loginId')}</Label>
                <Input
                  id="loginId"
                  autoComplete="username"
                  placeholder={t('auth.loginIdPlaceholder')}
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? t('auth.signingIn') : t('auth.signIn')}
              </Button>

              {demo ? (
                <div className="w-full space-y-2">
                  <p className="text-center text-xs text-muted-foreground">
                    {t('auth.demoQuickLogin')}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={submitting}
                      onClick={() => void enterAs('admin')}
                    >
                      {t('roles.admin')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={submitting}
                      onClick={() => void enterAs('teacher')}
                    >
                      {t('roles.teacher')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={submitting}
                      onClick={() => void enterAs('student')}
                    >
                      {t('roles.student')}
                    </Button>
                  </div>
                </div>
              ) : null}

              <p className="text-center text-sm text-muted-foreground">
                {t('auth.passwordResetAdminOnly')}
              </p>
              <Link
                to="/"
                className="text-center text-sm text-muted-foreground hover:text-navy"
              >
                {t('nav.home')}
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
