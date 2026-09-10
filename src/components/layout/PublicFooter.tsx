import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { JAMIA_NAME } from '@/lib/constants'
import { cn, publicAssetUrl } from '@/lib/utils'

type PublicFooterProps = {
  className?: string
  location?: string
}

function PublicFooter({ className, location }: PublicFooterProps) {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer
      className={cn(
        'border-t border-navy/10 bg-navy text-white',
        className,
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-3">
            <img
              src={publicAssetUrl('/logo.svg')}
              alt=""
              className="h-10 w-10"
              width={40}
              height={40}
            />
            <div>
              <p className="font-display text-base font-semibold tracking-wide">
                {t('app.jamia', { defaultValue: JAMIA_NAME })}
              </p>
              <p className="mt-1 text-sm text-white/65">{t('app.tagline')}</p>
            </div>
          </div>
          {location ? (
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              {location}
            </p>
          ) : null}
        </div>

        <nav
          className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80"
          aria-label="Footer"
        >
          <Link to="/" className="transition-colors hover:text-gold">
            {t('nav.home')}
          </Link>
          <Link to="/about" className="transition-colors hover:text-gold">
            {t('nav.about')}
          </Link>
          <Link to="/verify" className="transition-colors hover:text-gold">
            {t('verify.title')}
          </Link>
          <a href="/#courses" className="transition-colors hover:text-gold">
            {t('nav.courses')}
          </a>
          <Link to="/auth/sign-in" className="transition-colors hover:text-gold">
            {t('nav.login')}
          </Link>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-white/50 sm:px-6 sm:text-start">
          © {year} {t('app.jamia')}. {t('landing.footerRights')}
        </p>
      </div>
    </footer>
  )
}

export { PublicFooter }
