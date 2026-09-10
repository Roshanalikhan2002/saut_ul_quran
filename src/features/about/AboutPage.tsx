import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { MapPin, UserRound } from 'lucide-react'
import { Reveal } from '@/components/shared/Reveal'
import { Button } from '@/components/ui/button'
import {
  fetchAboutJamia,
  getDefaultJamiaAbout,
  pickLocaleText,
  type JamiaAbout,
} from '@/features/about/aboutService'
import { publicAssetUrl } from '@/lib/utils'

/** Public About Jamia page body. Header/footer come from `PublicLayout`. */
function AboutPage() {
  const { t, i18n } = useTranslation()
  const [jamia, setJamia] = useState<JamiaAbout>(getDefaultJamiaAbout)

  useEffect(() => {
    let cancelled = false
    void fetchAboutJamia().then((data) => {
      if (!cancelled) setJamia(data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const name = pickLocaleText(jamia.nameEn, jamia.nameUr, i18n.language)
  const mission = pickLocaleText(jamia.missionEn, jamia.missionUr, i18n.language)
  const location = pickLocaleText(
    jamia.locationEn,
    jamia.locationUr,
    i18n.language,
  )
  const head = pickLocaleText(
    jamia.headUstazahEn,
    jamia.headUstazahUr,
    i18n.language,
  )

  return (
    <main>
      <section className="relative overflow-hidden bg-navy py-20 text-white sm:py-28">
        <div
          className="landing-hero-pattern absolute inset-0 opacity-40"
          aria-hidden
        />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 text-center sm:px-6">
          <img
            src={publicAssetUrl(jamia.logoUrl)}
            alt=""
            className="mb-6 h-16 w-16 animate-fade-in"
            width={64}
            height={64}
          />
          <h1 className="animate-fade-up font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            {name}
          </h1>
          <p className="animate-fade-up mt-4 max-w-xl text-base text-white/75 sm:text-lg">
            {t('about.subtitle')}
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-5xl gap-14 px-4 sm:px-6 lg:grid-cols-2">
          <Reveal>
            <h2 className="font-display text-2xl font-semibold text-navy">
              {t('about.mission')}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              {mission}
            </p>
          </Reveal>

          <Reveal delay={80}>
            <h2 className="font-display text-2xl font-semibold text-navy">
              {t('about.vision')}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              {t('about.visionBody')}
            </p>
          </Reveal>

          <Reveal>
            <h2 className="font-display text-2xl font-semibold text-navy">
              {t('about.programs')}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              {t('about.programsBody')}
            </p>
          </Reveal>

          <Reveal delay={80} className="space-y-8">
            <div>
              <h2 className="font-display text-2xl font-semibold text-navy">
                {t('about.headUstazah')}
              </h2>
              <div className="mt-4 flex items-start gap-3 text-muted">
                <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" />
                <p className="text-base sm:text-lg">{head}</p>
              </div>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-navy">
                {t('about.location')}
              </h2>
              <div className="mt-4 flex items-start gap-3 text-muted">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" />
                <p className="text-base leading-relaxed sm:text-lg">{location}</p>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal className="mx-auto mt-14 flex max-w-5xl justify-center gap-3 px-4 sm:px-6">
          <Button asChild variant="secondary">
            <Link to="/auth/sign-up">{t('landing.ctaButton')}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">{t('nav.home')}</Link>
          </Button>
        </Reveal>
      </section>
    </main>
  )
}

export default AboutPage
export { AboutPage }
