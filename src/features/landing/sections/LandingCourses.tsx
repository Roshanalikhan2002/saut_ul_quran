import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen } from 'lucide-react'
import { Reveal } from '@/components/shared/Reveal'
import { Button } from '@/components/ui/button'
import { COURSE_I18N_KEYS, COURSE_SLUGS } from '@/lib/constants'

function LandingCourses() {
  const { t } = useTranslation()

  return (
    <section
      id="courses"
      className="scroll-mt-20 bg-background py-20 sm:py-24"
      aria-labelledby="courses-title"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="max-w-2xl">
          <h2
            id="courses-title"
            className="font-display text-3xl font-semibold tracking-tight text-navy sm:text-4xl"
          >
            {t('landing.coursesPreview')}
          </h2>
          <p className="mt-3 text-base text-muted sm:text-lg">
            {t('landing.coursesPreviewSubtitle')}
          </p>
        </Reveal>

        <ul className="mt-12 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {COURSE_SLUGS.map((slug, index) => {
            const key = COURSE_I18N_KEYS[slug]
            return (
              <Reveal key={slug} as="li" delay={index * 40}>
                <div className="group flex gap-3 border-s-2 border-gold/70 ps-4">
                  <BookOpen
                    className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep transition-transform duration-300 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                  <div>
                    <p className="font-display text-base font-semibold text-navy">
                      {t(`courses.${key}`)}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {t(`landing.courseBlurb.${key}`)}
                    </p>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </ul>

        <Reveal className="mt-12">
          <Button asChild variant="outline">
            <Link to="/auth/sign-up">{t('landing.heroCta')}</Link>
          </Button>
        </Reveal>
      </div>
    </section>
  )
}

export { LandingCourses }
