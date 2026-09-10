import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { APP_NAME } from '@/lib/constants'
import { isDemoMode } from '@/lib/dataMode'
import { supabase } from '@/lib/supabase'
import { toError } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const { isDemoMode: authDemo } = useAuth()
  const demo = authDemo || isDemoMode()

  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      toast.error(t('auth.emailRequired'))
      return
    }

    if (demo) {
      toast.message(t('auth.resetNeedsSupabase'))
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })
      if (error) throw error
      setSent(true)
      toast.success(t('auth.resetLinkSent'))
    } catch (err) {
      toast.error(toError(err).message || t('auth.resetFailed'))
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
            <CardTitle>{t('auth.resetPassword')}</CardTitle>
            <CardDescription>{t('auth.resetPasswordSubtitle')}</CardDescription>
          </CardHeader>
          <form onSubmit={(e) => void onSubmit(e)}>
            <CardContent className="space-y-4">
              {demo ? (
                <p className="rounded-md border border-gold/40 bg-gold-soft/50 px-3 py-2 text-sm text-navy">
                  {t('auth.resetNeedsSupabase')}
                </p>
              ) : null}
              {sent ? (
                <p className="text-sm text-muted-foreground">
                  {t('auth.resetLinkSentDetail')}
                </p>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={demo}
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              {!sent ? (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || demo}
                >
                  {submitting ? t('auth.sendingReset') : t('auth.sendResetLink')}
                </Button>
              ) : null}
              <Link
                to="/auth/sign-in"
                className="text-center text-sm font-medium text-navy underline-offset-4 hover:underline"
              >
                {t('auth.backToLogin')}
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
