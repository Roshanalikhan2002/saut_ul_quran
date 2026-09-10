import { PublicFooter } from '@/components/layout/PublicFooter'
import type { JamiaAbout } from '@/features/about/aboutService'
import { pickLocaleText } from '@/features/about/aboutService'
import { useTranslation } from 'react-i18next'

type LandingFooterProps = {
  jamia: JamiaAbout
}

function LandingFooter({ jamia }: LandingFooterProps) {
  const { i18n } = useTranslation()
  const location = pickLocaleText(
    jamia.locationEn,
    jamia.locationUr,
    i18n.language,
  )

  return <PublicFooter location={location} />
}

export { LandingFooter }
