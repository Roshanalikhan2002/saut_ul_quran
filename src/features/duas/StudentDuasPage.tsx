import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ModuleShell } from '@/components/shared/ModuleShell'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getDuaAudioUrl, listDuas, type DailyDua } from '@/services/duas'
import { toError } from '@/lib/errors'

export function StudentDuasPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ur' ? 'ur' : 'en'

  const [duas, setDuas] = useState<DailyDua[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setDuas(await listDuas({ publishedOnly: true }))
    } catch (err) {
      setError(toError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const d of duas) {
      if (d.category) set.add(d.category)
    }
    return Array.from(set).sort()
  }, [duas])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return duas.filter((d) => {
      if (category !== 'all' && d.category !== category) return false
      if (!q) return true
      const hay =
        `${d.title_en} ${d.title_ur ?? ''} ${d.arabic_text} ${d.translation_en ?? ''} ${d.translation_ur ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [duas, search, category])

  function title(dua: DailyDua) {
    return locale === 'ur' && dua.title_ur ? dua.title_ur : dua.title_en
  }

  return (
    <ModuleShell
      title={t('duas.title')}
      description={t('duas.subtitle')}
      loading={loading}
      error={error}
      onRetry={() => void load()}
      empty={!loading && !error && filtered.length === 0}
      emptyTitle={t('duas.noDuas')}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('duas.search')}
          className="sm:max-w-sm"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder={t('duas.categories')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('library.all')}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ul className="space-y-4">
        {filtered.map((dua) => {
          const audioUrl = getDuaAudioUrl(dua)
          return (
            <li
              key={dua.id}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-lg font-semibold text-navy">{title(dua)}</h3>
                {dua.category ? (
                  <Badge variant="secondary">{dua.category}</Badge>
                ) : null}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                    {t('duas.arabic')}
                  </p>
                  <p
                    className="font-arabic text-xl leading-relaxed text-foreground"
                    dir="rtl"
                  >
                    {dua.arabic_text}
                  </p>
                </div>

                {dua.transliteration ? (
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                      {t('duas.transliteration')}
                    </p>
                    <p className="text-sm italic text-muted-foreground">
                      {dua.transliteration}
                    </p>
                  </div>
                ) : null}

                {dua.translation_ur ? (
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                      {t('duas.translationUr')}
                    </p>
                    <p className="text-sm leading-relaxed" dir="rtl">
                      {dua.translation_ur}
                    </p>
                  </div>
                ) : null}

                {dua.translation_en ? (
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                      {t('duas.translationEn')}
                    </p>
                    <p className="text-sm leading-relaxed">
                      {dua.translation_en}
                    </p>
                  </div>
                ) : null}

                {audioUrl ? (
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                      {t('duas.listen')}
                    </p>
                    <audio controls className="w-full max-w-md" preload="none">
                      <source src={audioUrl} />
                    </audio>
                  </div>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </ModuleShell>
  )
}
