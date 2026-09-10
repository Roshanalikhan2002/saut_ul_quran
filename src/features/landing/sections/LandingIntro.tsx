import { useTranslation } from 'react-i18next'
import { Reveal } from '@/components/shared/Reveal'

function LandingIntro() {
  const { t } = useTranslation()

  return (
    <section className="bg-surface py-20 sm:py-24" aria-labelledby="intro-title">
      <Reveal className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <p className="font-script text-3xl text-gold-deep sm:text-4xl">
          {t('landing.introScript')}
        </p>
        <h2
          id="intro-title"
          className="mt-4 font-display text-3xl font-semibold tracking-tight text-navy sm:text-4xl"
        >
          {t('landing.introTitle')}
        </h2>
        <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
          {t('landing.introBody')}
        </p>
      </Reveal>
    </section>
  )
}

export { LandingIntro }
