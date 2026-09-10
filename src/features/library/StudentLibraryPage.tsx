import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Download, ExternalLink } from 'lucide-react'
import { ModuleShell } from '@/components/shared/ModuleShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { pickCourseTitle } from '@/services/courses'
import {
  getResourceDownloadUrl,
  listResources,
  type LibraryResourceWithCourse,
} from '@/services/library'
import type { ResourceType } from '@/types/database'
import { toError } from '@/lib/errors'

const RESOURCE_TYPES: ResourceType[] = [
  'pdf',
  'audio',
  'video',
  'document',
  'image',
  'link',
]

export function StudentLibraryPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ur' ? 'ur' : 'en'

  const [resources, setResources] = useState<LibraryResourceWithCourse[]>([])
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setResources(
        await listResources({
          resourceType:
            typeFilter === 'all' ? undefined : (typeFilter as ResourceType),
        }),
      )
    } catch (err) {
      setError(toError(err))
    } finally {
      setLoading(false)
    }
  }, [typeFilter])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return resources
    return resources.filter((r) => {
      const hay = `${r.title_en} ${r.title_ur ?? ''} ${r.description_en ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [resources, search])

  function resourceTitle(row: LibraryResourceWithCourse) {
    return locale === 'ur' && row.title_ur ? row.title_ur : row.title_en
  }

  async function openResource(row: LibraryResourceWithCourse) {
    setOpeningId(row.id)
    try {
      const url = await getResourceDownloadUrl(row)
      if (!url) {
        toast.error(t('common.errorNotFound'))
        return
      }
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <ModuleShell
      title={t('library.title')}
      description={t('library.subtitle')}
      loading={loading}
      error={error}
      onRetry={() => void load()}
      empty={!loading && !error && filtered.length === 0}
      emptyTitle={t('library.noItems')}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('library.search')}
          className="sm:max-w-sm"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder={t('library.categories')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('library.all')}</SelectItem>
            {RESOURCE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((row) => (
          <li
            key={row.id}
            className="flex flex-col justify-between rounded-xl border border-border bg-card p-4"
          >
            <div>
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className="font-medium text-navy">{resourceTitle(row)}</p>
                <Badge variant="secondary">{row.resource_type}</Badge>
              </div>
              {row.courses ? (
                <p className="text-xs text-muted-foreground">
                  {pickCourseTitle(row.courses, locale)}
                </p>
              ) : null}
              {(locale === 'ur'
                ? row.description_ur || row.description_en
                : row.description_en) && (
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                  {locale === 'ur'
                    ? row.description_ur || row.description_en
                    : row.description_en}
                </p>
              )}
            </div>
            <Button
              type="button"
              className="mt-4"
              size="sm"
              disabled={openingId === row.id}
              onClick={() => void openResource(row)}
            >
              {row.resource_type === 'link' ? (
                <ExternalLink className="me-1 h-3.5 w-3.5" />
              ) : (
                <Download className="me-1 h-3.5 w-3.5" />
              )}
              {row.resource_type === 'link'
                ? t('library.open')
                : t('library.download')}
            </Button>
          </li>
        ))}
      </ul>
    </ModuleShell>
  )
}
