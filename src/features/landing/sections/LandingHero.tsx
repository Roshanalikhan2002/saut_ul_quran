import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { publicAssetUrl } from '@/lib/utils'
import type { JamiaAbout } from '@/features/about/aboutService'
import { pickLocaleText } from '@/features/about/aboutService'

type LandingHeroProps = {
  jamia: JamiaAbout
}

function LandingHero({ jamia }: LandingHeroProps) {
  const { t, i18n } = useTranslation()
  const brand = pickLocaleText(jamia.nameEn, jamia.nameUr, i18n.language)
  const logo = publicAssetUrl(jamia.logoUrl)

  return (
    <section
      className="landing-hero relative flex min-h-[100svh] flex-col justify-center overflow-hidden text-white"
      aria-labelledby="landing-brand"
    >
      <div className="landing-hero-bg absolute inset-0" aria-hidden="true" />
      <div className="landing-hero-pattern absolute inset-0" aria-hidden="true" />
      <div className="landing-hero-glow absolute inset-0" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-4 pb-20 pt-10 text-center sm:px-6">
        <img
          src={logo}
          alt=""
          className="mb-8 h-20 w-20 animate-fade-in sm:h-24 sm:w-24"
          width={96}
          height={96}
        />

        <p
          id="landing-brand"
          className="animate-fade-in font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl"
          style={{ animationDelay: '80ms' }}
        >
          {brand}
        </p>

        <h1
          className="animate-fade-up mt-6 max-w-2xl font-display text-xl font-medium text-gold-soft sm:text-2xl"
          style={{ animationDelay: '160ms' }}
        >
          {t('landing.headline')}
        </h1>

        <p
          className="animate-fade-up mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg"
          style={{ animationDelay: '240ms' }}
        >
          {t('landing.support')}
        </p>

        <div
          className="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: '320ms' }}
        >
          <Button asChild size="lg" variant="secondary">
            <Link to="/auth/sign-in">{t('nav.login')}</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Link to="/auth/sign-up">{t('nav.register')}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export { LandingHero }
