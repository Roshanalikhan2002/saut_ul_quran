import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { APP_NAME } from '@/lib/constants'
import { Button } from '@/components/ui/button'
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
 * Public self-service password reset is disabled for teachers/students.
 * Only admin can reset passwords from Admin → Users.
 */
export function ForgotPasswordPage() {
  const { t } = useTranslation()

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
            <CardDescription>{t('auth.passwordResetAdminOnly')}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>{t('auth.adminAssignsCredentials')}</p>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link to="/auth/sign-in">{t('auth.signIn')}</Link>
            </Button>
            <Link
              to="/"
              className="text-center text-sm text-muted-foreground hover:text-navy"
            >
              {t('nav.home')}
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
