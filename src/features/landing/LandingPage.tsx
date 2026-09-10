import { useEffect, useState } from 'react'
import {
  fetchAboutJamia,
  getDefaultJamiaAbout,
  type JamiaAbout,
} from '@/features/about/aboutService'
import { LandingContact } from '@/features/landing/sections/LandingContact'
import { LandingCourses } from '@/features/landing/sections/LandingCourses'
import { LandingHero } from '@/features/landing/sections/LandingHero'
import { LandingIntro } from '@/features/landing/sections/LandingIntro'
import { LandingMission } from '@/features/landing/sections/LandingMission'
import { LandingTeacher } from '@/features/landing/sections/LandingTeacher'
import { LandingWhy } from '@/features/landing/sections/LandingWhy'

/**
 * Public landing page body. Header/footer come from `PublicLayout`.
 * Section components live under `sections/` for easy restyling.
 */
function LandingPage() {
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

  return (
    <main>
      <LandingHero jamia={jamia} />
      <LandingIntro />
      <LandingMission jamia={jamia} />
      <LandingCourses />
      <LandingWhy />
      <LandingTeacher jamia={jamia} />
      <LandingContact jamia={jamia} />
    </main>
  )
}

export default LandingPage
export { LandingPage }
