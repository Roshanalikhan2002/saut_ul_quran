import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useAuth } from '@/contexts/AuthContext'
import { getDashboardPath } from '@/lib/auth'
import { APP_NAME, JAMIA_NAME } from '@/lib/constants'
import { cn, publicAssetUrl } from '@/lib/utils'
import {
  fetchAboutJamia,
  pickLocaleText,
} from '@/features/about/aboutService'

const navItems = [
  { to: '/', labelKey: 'nav.home', end: true },
  { to: '/about', labelKey: 'nav.about', end: false },
  { to: '/#courses', labelKey: 'nav.courses', end: false },
  { to: '/verify', labelKey: 'verify.title', end: false },
] as const

function PublicHeader({ className }: { className?: string }) {
  const { t, i18n } = useTranslation()
  const { user, primaryRole } = useAuth()
  const [open, setOpen] = useState(false)
  const [brand, setBrand] = useState(JAMIA_NAME)

  useEffect(() => {
    let cancelled = false
    void fetchAboutJamia().then((jamia) => {
      if (cancelled) return
      setBrand(pickLocaleText(jamia.nameEn, jamia.nameUr, i18n.language))
    })
    return () => {
      cancelled = true
    }
  }, [i18n.language])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-white/10 bg-navy/90 text-white backdrop-blur-md',
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to="/"
          className="flex min-w-0 items-center gap-3 text-white no-underline"
        >
          <img
            src={publicAssetUrl('/logo.svg')}
            alt=""
            className="h-9 w-9 shrink-0"
            width={36}
            height={36}
          />
          <span className="truncate font-display text-sm font-semibold tracking-wide sm:text-base">
            {brand}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label={APP_NAME}>
          {navItems.map((item) =>
            item.to.includes('#') ? (
              <a
                key={item.to}
                href={item.to}
                className="rounded-md px-3 py-2 text-sm text-white/85 transition-colors hover:bg-white/10 hover:text-white"
              >
                {t(item.labelKey)}
              </a>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-sm text-white/85 transition-colors hover:bg-white/10 hover:text-white',
                    isActive && 'bg-white/10 text-gold',
                  )
                }
              >
                {t(item.labelKey)}
              </NavLink>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher
            variant="ghost"
            size="sm"
            className="hidden border-white/20 text-white hover:bg-white/10 hover:text-white sm:inline-flex"
          />
          {user ? (
            <Button asChild size="sm" variant="secondary" className="hidden sm:inline-flex">
              <Link to={getDashboardPath(primaryRole)}>{t('nav.dashboard')}</Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden text-white hover:bg-white/10 hover:text-white sm:inline-flex"
              >
                <Link to="/auth/sign-in">{t('nav.login')}</Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="secondary"
                className="hidden sm:inline-flex"
              >
                <Link to="/auth/sign-up">{t('nav.register')}</Link>
              </Button>
            </>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 md:hidden"
                aria-label={t('nav.openMenu')}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-navy text-white">
              <SheetHeader>
                <SheetTitle className="font-display text-start text-white">
                  {brand}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-2">
                {navItems.map((item) =>
                  item.to.includes('#') ? (
                    <a
                      key={item.to}
                      href={item.to}
                      className="rounded-md px-3 py-2.5 text-sm hover:bg-white/10"
                      onClick={() => setOpen(false)}
                    >
                      {t(item.labelKey)}
                    </a>
                  ) : (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="rounded-md px-3 py-2.5 text-sm hover:bg-white/10"
                      onClick={() => setOpen(false)}
                    >
                      {t(item.labelKey)}
                    </Link>
                  ),
                )}
                <div className="my-3 h-px bg-white/15" />
                <LanguageSwitcher
                  variant="outline"
                  className="justify-start border-white/25 bg-transparent text-white hover:bg-white/10"
                />
                {user ? (
                  <Button asChild variant="secondary">
                    <Link
                      to={getDashboardPath(primaryRole)}
                      onClick={() => setOpen(false)}
                    >
                      {t('nav.dashboard')}
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button
                      asChild
                      variant="ghost"
                      className="justify-start text-white"
                    >
                      <Link to="/auth/sign-in" onClick={() => setOpen(false)}>
                        {t('nav.login')}
                      </Link>
                    </Button>
                    <Button asChild variant="secondary">
                      <Link to="/auth/sign-up" onClick={() => setOpen(false)}>
                        {t('nav.register')}
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

export { PublicHeader }
