import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Award, Medal } from 'lucide-react'
import {
  getStudentGamification,
  type Badge,
  type StudentBadgeWithBadge,
} from '@/services/gamification'
import { Badge as UiBadge } from '@/components/ui/badge'
import { LoadingState } from '@/components/ui/loading-state'
import { ErrorState } from '@/components/ui/error-state'
import { cn } from '@/lib/utils'
import { toError } from '@/lib/errors'

interface StudentGamificationProps {
  studentId: string
  className?: string
  compact?: boolean
}

export function StudentGamification({
  studentId,
  className,
  compact,
}: StudentGamificationProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ur' ? 'ur' : 'en'
  const [points, setPoints] = useState(0)
  const [earned, setEarned] = useState<StudentBadgeWithBadge[]>([])
  const [allBadges, setAllBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getStudentGamification(studentId)
      setPoints(data.points)
      setEarned(data.badges)
      setAllBadges(data.allBadges)
    } catch (err) {
      setError(toError(err))
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) return <LoadingState className={className} />
  if (error) {
    return (
      <ErrorState
        className={className}
        description={error.message}
        onRetry={() => void load()}
      />
    )
  }

  const earnedIds = new Set(earned.map((e) => e.badge_id))

  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-soft text-navy">
            <Medal className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t('gamification.points')}
            </p>
            <p className="font-display text-2xl font-semibold text-navy">
              {points}
            </p>
          </div>
        </div>
        {!compact ? (
          <p className="max-w-[12rem] text-right text-xs text-muted-foreground">
            {t('gamification.keepGoing')}
          </p>
        ) : null}
      </div>

      <div>
        <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold text-navy">
          <Award className="h-4 w-4 text-gold" aria-hidden />
          {t('gamification.earnedBadges')}
        </h3>
        {earned.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('gamification.noBadges')}
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {earned.map((row) => {
              const name =
                locale === 'ur' && row.badges?.name_ur
                  ? row.badges.name_ur
                  : row.badges?.name_en ?? 'Badge'
              return (
                <li key={row.id}>
                  <UiBadge variant="default" className="bg-navy text-gold">
                    {name}
                  </UiBadge>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {!compact ? (
        <div>
          <h3 className="mb-2 font-display text-sm font-semibold text-navy">
            {t('gamification.lockedBadges')}
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {allBadges
              .filter((b) => !earnedIds.has(b.id))
              .map((b) => {
                const name =
                  locale === 'ur' && b.name_ur ? b.name_ur : b.name_en
                return (
                  <li
                    key={b.id}
                    className="rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground"
                  >
                    <span className="font-medium text-navy/70">{name}</span>
                    {b.points_required != null ? (
                      <span className="ml-2 text-xs">
                        ({b.points_required} {t('gamification.points')})
                      </span>
                    ) : null}
                  </li>
                )
              })}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
