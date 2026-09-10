import { useTranslation } from 'react-i18next'
import { Reveal } from '@/components/shared/Reveal'
import type { JamiaAbout } from '@/features/about/aboutService'
import { pickLocaleText } from '@/features/about/aboutService'

type LandingMissionProps = {
  jamia: JamiaAbout
}

function LandingMission({ jamia }: LandingMissionProps) {
  const { t, i18n } = useTranslation()
  const mission = pickLocaleText(jamia.missionEn, jamia.missionUr, i18n.language)

  return (
    <section
      className="relative overflow-hidden bg-navy py-20 text-white sm:py-24"
      aria-labelledby="mission-title"
    >
      <div
        className="pointer-events-none absolute inset-y-0 end-0 w-1/2 opacity-30"
        style={{
          background:
            'radial-gradient(ellipse at 80% 40%, rgba(245,178,51,0.25), transparent 55%)',
        }}
        aria-hidden="true"
      />
      <Reveal className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <h2
          id="mission-title"
          className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          {t('landing.missionTitle')}
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-white/80 sm:text-xl">
          {mission || t('landing.missionBody')}
        </p>
      </Reveal>
    </section>
  )
}

export { LandingMission }
