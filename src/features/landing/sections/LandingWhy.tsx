import { useTranslation } from 'react-i18next'
import { BookMarked, HeartHandshake, Sparkles } from 'lucide-react'
import { Reveal } from '@/components/shared/Reveal'

const reasons = [
  {
    icon: Sparkles,
    titleKey: 'landing.why1Title',
    bodyKey: 'landing.why1Body',
  },
  {
    icon: BookMarked,
    titleKey: 'landing.why2Title',
    bodyKey: 'landing.why2Body',
  },
  {
    icon: HeartHandshake,
    titleKey: 'landing.why3Title',
    bodyKey: 'landing.why3Body',
  },
] as const

function LandingWhy() {
  const { t } = useTranslation()

  return (
    <section className="bg-surface py-20 sm:py-24" aria-labelledby="why-title">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="max-w-2xl">
          <h2
            id="why-title"
            className="font-display text-3xl font-semibold tracking-tight text-navy sm:text-4xl"
          >
            {t('landing.featuresTitle')}
          </h2>
          <p className="mt-3 text-base text-muted sm:text-lg">
            {t('landing.featuresSubtitle')}
          </p>
        </Reveal>

        <ul className="mt-14 grid gap-12 md:grid-cols-3 md:gap-10">
          {reasons.map((item, index) => {
            const Icon = item.icon
            return (
              <Reveal key={item.titleKey} as="li" delay={index * 80}>
                <Icon className="h-8 w-8 text-gold-deep" aria-hidden />
                <h3 className="mt-4 font-display text-xl font-semibold text-navy">
                  {t(item.titleKey)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                  {t(item.bodyKey)}
                </p>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export { LandingWhy }
