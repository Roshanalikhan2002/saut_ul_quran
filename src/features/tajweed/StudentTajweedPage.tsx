import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Pause, Play } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { ModuleShell } from '@/components/shared/ModuleShell'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getAyahsBySurah,
  getKnowledgeForStudent,
  getRecordingProgressPercent,
  listAyahAudioForSurah,
  listSurahs,
  listTajweedRules,
  markAyahKnown,
  parseTajweedMarkup,
  resolveAyahAudioUrl,
  type Ayah,
  type AyahAudio,
  type Surah,
  type TajweedRule,
  type TajweedSegment,
} from '@/services/tajweed'
import { toError, getErrorMessage } from '@/lib/errors'

function renderColoredAyah(text: string, segments: TajweedSegment[]) {
  if (!segments.length) {
    return <span>{text}</span>
  }
  const sorted = [...segments].sort((a, b) => a.start - b.start)
  const nodes: ReactNode[] = []
  let cursor = 0
  sorted.forEach((seg, i) => {
    const start = Math.max(0, Math.min(text.length, seg.start))
    const end = Math.max(start, Math.min(text.length, seg.end))
    if (start > cursor) {
      nodes.push(<span key={`t-${i}`}>{text.slice(cursor, start)}</span>)
    }
    nodes.push(
      <span
        key={`s-${i}`}
        style={{ color: seg.color || undefined }}
        title={seg.label || seg.rule}
        className="font-semibold"
      >
        {text.slice(start, end)}
      </span>,
    )
    cursor = end
  })
  if (cursor < text.length) {
    nodes.push(<span key="tail">{text.slice(cursor)}</span>)
  }
  return <>{nodes}</>
}

export function StudentTajweedPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ur' ? 'ur' : 'en'
  const { user } = useAuth()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [surahs, setSurahs] = useState<Surah[]>([])
  const [rules, setRules] = useState<TajweedRule[]>([])
  const [surahId, setSurahId] = useState('')
  const [ayahs, setAyahs] = useState<Ayah[]>([])
  const [audioByAyah, setAudioByAyah] = useState<Record<string, AyahAudio>>({})
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set())
  const [recordingPct, setRecordingPct] = useState(0)
  const [loading, setLoading] = useState(true)
  const [ayahLoading, setAyahLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const [activeAyahId, setActiveAyahId] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const loadBase = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [surahRows, ruleRows] = await Promise.all([
        listSurahs(),
        listTajweedRules().catch(() => [] as TajweedRule[]),
      ])
      setSurahs(surahRows)
      setRules(ruleRows)
      if (!surahId && surahRows[0]) setSurahId(surahRows[0].id)
    } catch (err) {
      setError(toError(err))
      toast.error(getErrorMessage(err, t('common.errorRetry')))
    } finally {
      setLoading(false)
    }
  }, [surahId, t])

  const loadSurah = useCallback(
    async (id: string) => {
      if (!id || !user) {
        setAyahLoading(false)
        return
      }
      setAyahLoading(true)
      try {
        const ayahRows = await getAyahsBySurah(id).catch((err) => {
          toast.error(getErrorMessage(err, t('common.errorRetry')))
          return [] as Ayah[]
        })
        setAyahs(ayahRows)
        const ids = ayahRows.map((a) => a.id)
        const [audioRows, knowledge, pct] = await Promise.all([
          listAyahAudioForSurah(ids).catch(() => [] as AyahAudio[]),
          getKnowledgeForStudent(user.id, ids).catch(() => []),
          getRecordingProgressPercent(id).catch(() => 0),
        ])
        const map: Record<string, AyahAudio> = {}
        for (const row of audioRows) {
          if (!map[row.ayah_id] && (row.external_url || row.storage_path)) {
            map[row.ayah_id] = row
          }
        }
        setAudioByAyah(map)
        setKnownIds(
          new Set(
            knowledge.filter((k) => k.mastery_level >= 4).map((k) => k.ayah_id),
          ),
        )
        setRecordingPct(pct)
        setActiveAyahId(null)
        setPlaying(false)
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.src = ''
        }
      } catch (err) {
        toast.error(getErrorMessage(err, t('common.errorRetry')))
        setAyahs([])
      } finally {
        setAyahLoading(false)
      }
    },
    [user, t],
  )

  useEffect(() => {
    void loadBase()
  }, [loadBase])

  useEffect(() => {
    if (surahId) void loadSurah(surahId)
  }, [surahId, loadSurah])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onTime = () => setCurrentTime(el.currentTime)
    const onMeta = () => setDuration(el.duration || 0)
    const onEnd = () => setPlaying(false)
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('loadedmetadata', onMeta)
    el.addEventListener('ended', onEnd)
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('loadedmetadata', onMeta)
      el.removeEventListener('ended', onEnd)
    }
  }, [])

  const selectedSurah = useMemo(
    () => surahs.find((s) => s.id === surahId) ?? null,
    [surahs, surahId],
  )

  const playAyah = async (ayah: Ayah) => {
    const audio = audioByAyah[ayah.id]
    if (!audio) {
      toast.message(t('tajweed.recordingSoon'))
      return
    }
    try {
      const url = await resolveAyahAudioUrl(audio)
      if (!url || !audioRef.current) {
        toast.message(t('tajweed.recordingSoon'))
        return
      }
      if (activeAyahId === ayah.id && playing) {
        audioRef.current.pause()
        setPlaying(false)
        return
      }
      audioRef.current.src = url
      await audioRef.current.play()
      setActiveAyahId(ayah.id)
      setPlaying(true)
    } catch (err) {
      toast.error(getErrorMessage(err, t('common.errorRetry')))
    }
  }

  const seek = (value: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = value
    setCurrentTime(value)
  }

  const onKnow = async (ayahId: string) => {
    if (!user) return
    try {
      await markAyahKnown(user.id, ayahId)
      setKnownIds((prev) => new Set(prev).add(ayahId))
      toast.success(t('tajweed.markedKnown'))
    } catch (err) {
      toast.error(getErrorMessage(err, t('common.errorRetry')))
    }
  }

  return (
    <ModuleShell
      title={t('tajweed.title')}
      description={t('tajweed.subtitle')}
      loading={loading}
      error={error}
      onRetry={() => void loadBase()}
      empty={!loading && !error && surahs.length === 0}
      emptyTitle={t('tajweed.noDrills')}
      emptyDescription={t('tajweed.subtitle')}
    >
      <audio ref={audioRef} className="hidden" preload="metadata" />

      <div className="mb-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('hifz.surah')}</label>
          <Select value={surahId} onValueChange={setSurahId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {surahs.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.number}. {s.name_en} —{' '}
                  <span className="font-arabic">{s.name_ar}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[160px]">
          <p className="mb-1 text-xs text-muted-foreground">
            {t('tajweed.recordingProgress')}
          </p>
          <Progress value={recordingPct} />
          <p className="mt-1 text-xs text-muted-foreground">{recordingPct}%</p>
        </div>
      </div>

      {rules.length > 0 ? (
        <div className="mb-6 flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">{t('tajweed.legend')}:</span>
          {rules.slice(0, 8).map((rule) => (
            <Badge
              key={rule.id}
              variant="outline"
              style={{ borderColor: rule.color_hex ?? undefined, color: rule.color_hex ?? undefined }}
            >
              {locale === 'ur' && rule.name_ur ? rule.name_ur : rule.name_en}
            </Badge>
          ))}
        </div>
      ) : null}

      {selectedSurah ? (
        <h2 className="mb-3 text-center font-arabic text-2xl text-navy">
          {selectedSurah.name_ar}
        </h2>
      ) : null}

      {ayahLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : (
        <ul className="space-y-4">
          {ayahs.map((ayah) => {
            const hasAudio = Boolean(audioByAyah[ayah.id])
            const segments = parseTajweedMarkup(ayah.tajweed_markup)
            const translation =
              locale === 'ur'
                ? ayah.translation_ur || ayah.translation_en
                : ayah.translation_en || ayah.translation_ur
            const isActive = activeAyahId === ayah.id
            return (
              <li
                key={ayah.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Badge variant="outline">{ayah.ayah_number}</Badge>
                  {knownIds.has(ayah.id) ? (
                    <Badge variant="success">{t('common.actions.done')}</Badge>
                  ) : null}
                </div>
                <p
                  className="mb-3 text-right font-arabic text-2xl leading-[2.2] text-navy"
                  dir="rtl"
                  lang="ar"
                >
                  {renderColoredAyah(
                    ayah.text_uthmani || ayah.text_ar,
                    segments,
                  )}
                </p>
                {translation ? (
                  <p className="mb-3 text-sm text-muted-foreground">{translation}</p>
                ) : null}

                {isActive && hasAudio ? (
                  <div className="mb-3">
                    <input
                      type="range"
                      min={0}
                      max={duration || 0}
                      step={0.1}
                      value={currentTime}
                      onChange={(e) => seek(Number(e.target.value))}
                      className="w-full accent-secondary"
                      aria-label={t('tajweed.listen')}
                    />
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={hasAudio ? 'default' : 'outline'}
                    disabled={!hasAudio}
                    onClick={() => void playAyah(ayah)}
                  >
                    {hasAudio ? (
                      isActive && playing ? (
                        <>
                          <Pause /> Pause
                        </>
                      ) : (
                        <>
                          <Play /> {t('tajweed.listen')}
                        </>
                      )
                    ) : (
                      t('tajweed.recordingSoon')
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={knownIds.has(ayah.id)}
                    onClick={() => void onKnow(ayah.id)}
                  >
                    {t('tajweed.iKnow')}
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </ModuleShell>
  )
}
