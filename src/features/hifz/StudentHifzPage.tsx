import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { ModuleShell } from '@/components/shared/ModuleShell'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  getStudentOwnProgress,
  summarizeProgress,
  type HifzDailyRecordParsed,
  type HifzProgressWithSurah,
} from '@/services/hifz'
import { toError } from '@/lib/errors'

export function StudentHifzPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [progress, setProgress] = useState<HifzProgressWithSurah[]>([])
  const [daily, setDaily] = useState<HifzDailyRecordParsed[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const data = await getStudentOwnProgress(user.id)
      setProgress(data.progress)
      setDaily(data.daily)
    } catch (err) {
      setError(toError(err))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  const summary = useMemo(() => summarizeProgress(progress), [progress])

  return (
    <ModuleShell
      title={t('hifz.title')}
      description={t('hifz.subtitle')}
      loading={loading}
      error={error}
      onRetry={() => void load()}
      empty={
        !loading && !error && progress.length === 0 && daily.length === 0
      }
      emptyTitle={t('hifz.noEntries')}
      emptyDescription={t('hifz.subtitle')}
    >
      <div className="space-y-8">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 font-display text-lg font-semibold text-navy">
            {t('hifz.summary')}
          </h2>
          <p className="mb-2 text-sm text-muted-foreground">
            {t('hifz.totalMemorized')}: {summary.memorized}/{summary.totalRanges}
          </p>
          <Progress value={summary.percentComplete} className="h-3" />
          <p className="mt-1 text-xs text-muted-foreground">
            {summary.percentComplete}%
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg bg-surface px-3 py-2 text-sm">
              <p className="text-muted-foreground">{t('hifz.statusApproved')}</p>
              <p className="text-lg font-semibold text-navy">{summary.memorized}</p>
            </div>
            <div className="rounded-lg bg-surface px-3 py-2 text-sm">
              <p className="text-muted-foreground">{t('hifz.statusPending')}</p>
              <p className="text-lg font-semibold text-navy">
                {summary.inProgress}
              </p>
            </div>
            <div className="rounded-lg bg-surface px-3 py-2 text-sm">
              <p className="text-muted-foreground">{t('hifz.statusNeedsWork')}</p>
              <p className="text-lg font-semibold text-navy">{summary.weak}</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-navy">
            {t('hifz.summary')}
          </h2>
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {progress.map((row) => {
              const rangeSize = Math.max(1, row.ayah_to - row.ayah_from + 1)
              const done =
                row.status === 'memorized' || row.status === 'revised' ? 100 : 40
              return (
                <li key={row.id} className="px-4 py-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-navy">
                      {row.surahs?.name_ar ? (
                        <span className="font-arabic me-2">
                          {row.surahs.name_ar}
                        </span>
                      ) : null}
                      {row.surahs?.name_en ?? row.surah_id} · {row.ayah_from}–
                      {row.ayah_to}
                      <span className="ms-2 text-xs text-muted-foreground">
                        ({rangeSize} ayahs)
                      </span>
                    </p>
                    <Badge variant="outline" className="capitalize">
                      {row.status}
                    </Badge>
                  </div>
                  <Progress value={done} />
                </li>
              )
            })}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-navy">
            {t('hifz.history')}
          </h2>
          {daily.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('hifz.noEntries')}</p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {daily.map((row) => (
                <li key={row.id} className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <span className="font-medium text-navy">{row.record_date}</span>
                    {row.lesson_type ? (
                      <Badge variant="secondary" className="capitalize">
                        {row.lesson_type}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {row.surahs?.name_en}
                    {row.ayah_from != null
                      ? ` ${row.ayah_from}–${row.ayah_to}`
                      : ''}
                    {row.notes_body ? ` — ${row.notes_body}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </ModuleShell>
  )
}
