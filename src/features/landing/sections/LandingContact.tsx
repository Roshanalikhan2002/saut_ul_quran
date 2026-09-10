import { useTranslation } from 'react-i18next'
import { MapPin, MessageCircle } from 'lucide-react'
import { Reveal } from '@/components/shared/Reveal'
import { Button } from '@/components/ui/button'
import type { JamiaAbout } from '@/features/about/aboutService'
import { pickLocaleText, whatsappUrl } from '@/features/about/aboutService'

type LandingContactProps = {
  jamia: JamiaAbout
}

function LandingContact({ jamia }: LandingContactProps) {
  const { t, i18n } = useTranslation()
  const location = pickLocaleText(
    jamia.locationEn,
    jamia.locationUr,
    i18n.language,
  )
  const wa = whatsappUrl(jamia.phone)

  return (
    <section
      className="bg-navy-soft py-20 text-white sm:py-24"
      aria-labelledby="contact-title"
    >
      <Reveal className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2
          id="contact-title"
          className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          {t('landing.contactTitle')}
        </h2>
        <p className="mt-3 text-base text-white/70 sm:text-lg">
          {t('landing.contactBody')}
        </p>

        <div className="mt-10 flex flex-col gap-6">
          <div className="flex gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
            <div>
              <p className="text-sm font-medium text-gold-soft">
                {t('landing.locationLabel')}
              </p>
              <p className="mt-1 text-base leading-relaxed text-white/85">
                {location}
              </p>
            </div>
          </div>

          {wa ? (
            <div>
              <Button asChild variant="secondary" size="lg">
                <a href={wa} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  {t('landing.whatsapp')}
                </a>
              </Button>
            </div>
          ) : jamia.email ? (
            <div>
              <Button asChild variant="secondary" size="lg">
                <a href={`mailto:${jamia.email}`}>{t('about.contact')}</a>
              </Button>
            </div>
          ) : null}
        </div>
      </Reveal>
    </section>
  )
}

export { LandingContact }
