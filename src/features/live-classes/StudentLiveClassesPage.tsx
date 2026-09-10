import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink } from 'lucide-react'
import { ModuleShell } from '@/components/shared/ModuleShell'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { pickCourseTitle } from '@/services/courses'
import {
  listRecordings,
  listUpcoming,
  parseGroupFromNotes,
  type LiveClassWithCourse,
  type RecordedClass,
} from '@/services/liveClasses'
import type { LiveClassStatus } from '@/types/database'
import { toError } from '@/lib/errors'

function statusBadgeKey(status: LiveClassStatus) {
  if (status === 'live') return 'liveNow'
  return status
}

export function StudentLiveClassesPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ur' ? 'ur' : 'en'
  const isMobile = useMediaQuery('(max-width: 768px)')

  const [classes, setClasses] = useState<LiveClassWithCourse[]>([])
  const [recordings, setRecordings] = useState<RecordedClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [upcoming, recs] = await Promise.all([
        listUpcoming({ includePast: true }),
        listRecordings(),
      ])
      setClasses(
        upcoming.filter((c) =>
          ['scheduled', 'live', 'ended'].includes(c.status),
        ),
      )
      setRecordings(recs)
    } catch (err) {
      setError(toError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function classTitle(row: LiveClassWithCourse) {
    return locale === 'ur' && row.title_ur ? row.title_ur : row.title_en
  }

  function joinButton(url: string | null) {
    if (!url) {
      return (
        <span className="text-xs text-muted-foreground">
          {t('live.noMeetingUrl')}
        </span>
      )
    }
    return (
      <Button type="button" size="sm" asChild>
        <a href={url} target="_blank" rel="noreferrer">
          <ExternalLink className="me-1 h-3.5 w-3.5" />
          {t('live.join')}
        </a>
      </Button>
    )
  }

  return (
    <ModuleShell
      title={t('live.title')}
      description={t('live.subtitle')}
      loading={loading}
      error={error}
      onRetry={() => void load()}
      empty={!loading && !error && classes.length === 0}
      emptyTitle={t('live.noSessions')}
    >
      <h2 className="mb-3 text-sm font-semibold text-navy">{t('live.upcoming')}</h2>
      {isMobile ? (
        <ul className="mb-8 space-y-3">
          {classes.map((row) => {
            const group = parseGroupFromNotes(row.notes)
            return (
              <li
                key={row.id}
                className="space-y-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-navy">{classTitle(row)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(row.scheduled_at).toLocaleString()}
                    </p>
                    {row.courses ? (
                      <p className="text-xs text-muted-foreground">
                        {pickCourseTitle(row.courses, locale)}
                      </p>
                    ) : null}
                    {group.groupName ? (
                      <p className="text-xs text-muted-foreground">
                        {t('live.group')}: {group.groupName}
                      </p>
                    ) : null}
                  </div>
                  <StatusBadge status={statusBadgeKey(row.status)} />
                </div>
                {row.status !== 'ended' ? joinButton(row.meeting_url) : null}
              </li>
            )
          })}
        </ul>
      ) : (
        <Table className="mb-8">
          <TableHeader>
            <TableRow>
              <TableHead>{t('live.topic')}</TableHead>
              <TableHead>{t('attendance.class')}</TableHead>
              <TableHead>{t('live.startTime')}</TableHead>
              <TableHead>{t('attendance.status')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{classTitle(row)}</TableCell>
                <TableCell>
                  {row.courses
                    ? pickCourseTitle(row.courses, locale)
                    : t('common.na')}
                </TableCell>
                <TableCell>
                  {new Date(row.scheduled_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  <StatusBadge status={statusBadgeKey(row.status)} />
                </TableCell>
                <TableCell>
                  {row.status !== 'ended' ? joinButton(row.meeting_url) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {recordings.length > 0 ? (
        <>
          <h2 className="mb-3 text-sm font-semibold text-navy">
            {t('live.past')}
          </h2>
          <ul className="space-y-2">
            {recordings.map((rec) => {
              const title =
                locale === 'ur' && rec.title_ur ? rec.title_ur : rec.title_en
              const href = rec.external_url
              return (
                <li
                  key={rec.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3"
                >
                  <span className="font-medium text-navy">{title}</span>
                  {href ? (
                    <Button type="button" size="sm" variant="outline" asChild>
                      <a href={href} target="_blank" rel="noreferrer">
                        {t('live.watchRecording')}
                      </a>
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t('live.recording')}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      ) : null}
    </ModuleShell>
  )
}
