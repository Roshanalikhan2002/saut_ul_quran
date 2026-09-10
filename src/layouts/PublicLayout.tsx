import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PublicFooter } from '@/components/layout/PublicFooter'
import { PublicHeader } from '@/components/layout/PublicHeader'
import {
  fetchAboutJamia,
  pickLocaleText,
} from '@/features/about/aboutService'

export function PublicLayout() {
  const { i18n } = useTranslation()
  const [location, setLocation] = useState<string | undefined>()

  useEffect(() => {
    let cancelled = false
    void fetchAboutJamia().then((jamia) => {
      if (cancelled) return
      setLocation(
        pickLocaleText(jamia.locationEn, jamia.locationUr, i18n.language),
      )
    })
    return () => {
      cancelled = true
    }
  }, [i18n.language])

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <PublicHeader />
      <div className="flex-1">
        <Outlet />
      </div>
      <PublicFooter location={location} />
    </div>
  )
}
