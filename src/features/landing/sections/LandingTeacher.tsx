import { useTranslation } from 'react-i18next'
import { Reveal } from '@/components/shared/Reveal'
import type { JamiaAbout } from '@/features/about/aboutService'
import { pickLocaleText } from '@/features/about/aboutService'

type LandingTeacherProps = {
  jamia: JamiaAbout
}

function LandingTeacher({ jamia }: LandingTeacherProps) {
  const { t, i18n } = useTranslation()
  const name = pickLocaleText(
    jamia.headUstazahEn,
    jamia.headUstazahUr,
    i18n.language,
  )

  return (
    <section
      className="bg-background py-20 sm:py-24"
      aria-labelledby="teacher-title"
    >
      <Reveal className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-gold-deep">
          {t('landing.headLabel')}
        </p>
        <h2
          id="teacher-title"
          className="mt-3 font-display text-3xl font-semibold tracking-tight text-navy sm:text-4xl"
        >
          {name}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          {t('landing.teacherBody')}
        </p>
      </Reveal>
    </section>
  )
}

export { LandingTeacher }
