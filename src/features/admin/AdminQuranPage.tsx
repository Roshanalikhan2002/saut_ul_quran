import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Circle } from 'lucide-react'
import { ModuleShell } from '@/components/shared/ModuleShell'
import { StatCard } from '@/components/shared/StatCard'
import {
  getQuranImportStatus,
  QURAN_IMPORT_STEPS,
  type QuranImportStatus,
} from '@/services/quranImport'
import { BookOpen, BookMarked } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toError } from '@/lib/errors'

export function AdminQuranPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ur' ? 'ur' : 'en'
  const [status, setStatus] = useState<QuranImportStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setStatus(await getQuranImportStatus())
    } catch (err) {
      setError(toError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <ModuleShell
      title={t('admin.quranImport')}
      description={t('admin.quranSubtitle')}
      loading={loading}
      error={error}
      onRetry={() => void load()}
      actions={
        <Button type="button" variant="outline" onClick={() => void load()}>
          {t('common.actions.refresh')}
        </Button>
      }
    >
      {status ? (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard
            title={t('admin.surahCount')}
            value={`${status.surahCount} / ${status.expectedSurahs}`}
            icon={BookOpen}
          />
          <StatCard
            title={t('admin.ayahCount')}
            value={status.ayahCount}
            icon={BookMarked}
          />
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
            {status.isComplete ? (
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            ) : (
              <Circle className="h-8 w-8 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.importStatus')}</p>
              <Badge variant={status.isComplete ? 'secondary' : 'outline'}>
                {status.isComplete
                  ? t('admin.importComplete')
                  : status.sampleOnly
                    ? t('admin.importSample')
                    : t('admin.importEmpty')}
              </Badge>
            </div>
          </div>
        </div>
      ) : null}

      <h2 className="mb-3 font-display text-lg font-semibold text-navy">
        {t('admin.importSteps')}
      </h2>
      <ol className="space-y-3">
        {QURAN_IMPORT_STEPS.map((step, index) => (
          <li
            key={step.id}
            className="rounded-xl border border-border bg-card px-4 py-3"
          >
            <p className="font-medium text-navy">
              {index + 1}.{' '}
              {locale === 'ur' ? step.titleUr : step.titleEn}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {locale === 'ur' ? step.detailUr : step.detailEn}
            </p>
          </li>
        ))}
      </ol>
    </ModuleShell>
  )
}
