import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { getDashboardPath, getPrimaryRole } from '@/lib/auth'
import { APP_NAME } from '@/lib/constants'
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

/**
 * Staff (Admin/Teacher) account creation.
 * DB trigger assigns default `student` role — admin must promote via SQL/panel.
 * Students receive credentials from admin; they should not use this form.
 * When Supabase is not configured, signup becomes local demo admin login.
 */
export function SignUpPage() {
  const { t } = useTranslation()
  const { signUp, isDemoMode } = useAuth()
  const navigate = useNavigate()
  const demo = isDemoMode || isDemoAuthMode()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      toast.error(t('auth.emailRequired'))
      return
    }
    if (password.length < 8) {
      toast.error(t('auth.weakPassword'))
      return
    }
    if (password !== confirm) {
      toast.error(t('auth.passwordMismatch'))
      return
    }

    setSubmitting(true)
    try {
      await signUp(email.trim(), password, fullName.trim())
      toast.success(
        demo ? t('auth.loginSuccess') : t('auth.registerSuccess'),
      )
      if (!demo) toast.message(t('auth.promoteNote'))

      if (demo) {
        navigate('/admin', { replace: true })
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      let dest = '/student'
      if (session?.user?.id) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
        const roles = (data ?? []).map((r) => r.role as AppRole)
        dest = getDashboardPath(getPrimaryRole(roles))
      }
      navigate(dest, { replace: true })
    } catch {
      /* toasted in context */
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
            <CardTitle>{t('auth.registerTitle')}</CardTitle>
            <CardDescription>
              {demo ? t('auth.demoModeNotice') : t('auth.staffOnlySubtitle')}
            </CardDescription>
          </CardHeader>
          <form onSubmit={(e) => void onSubmit(e)}>
            <CardContent className="space-y-4">
              {!demo ? (
                <p className="rounded-md border border-gold/40 bg-gold-soft/50 px-3 py-2 text-sm text-navy">
                  {t('auth.studentsGetCredentials')}
                </p>
              ) : (
                <p className="rounded-md border border-gold/40 bg-gold-soft/50 px-3 py-2 text-sm text-navy">
                  {t('auth.demoSignupHint')}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="fullName">{t('auth.fullName')}</Label>
                <Input
                  id="fullName"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">{t('auth.confirmPassword')}</Label>
                <PasswordInput
                  id="confirm"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting
                  ? demo
                    ? t('auth.signingIn')
                    : t('auth.signingUp')
                  : demo
                    ? t('auth.signIn')
                    : t('auth.signUp')}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {t('auth.hasAccount')}{' '}
                <Link
                  to="/auth/sign-in"
                  className="font-medium text-navy underline-offset-4 hover:underline"
                >
                  {t('auth.signIn')}
                </Link>
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
