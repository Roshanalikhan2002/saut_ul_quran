import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { ModuleShell } from '@/components/shared/ModuleShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { listSurahs, type Surah } from '@/services/tajweed'
import {
  approveProgress,
  getProgress,
  listDailyRecords,
  listStudentsForHifz,
  summarizeProgress,
  upsertDailyRecord,
  upsertProgress,
  type HifzDailyRecordParsed,
  type HifzLessonType,
  type HifzProgressWithSurah,
} from '@/services/hifz'
import type { StudentWithProfile } from '@/services/students'
import type { HifzStatus } from '@/types/database'
import { toError } from '@/lib/errors'

const LESSON_TYPES: HifzLessonType[] = ['sabaq', 'sabqi', 'manzil', 'para']

export function TeacherHifzPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [students, setStudents] = useState<StudentWithProfile[]>([])
  const [surahs, setSurahs] = useState<Surah[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState<string>('')
  const [progress, setProgress] = useState<HifzProgressWithSurah[]>([])
  const [daily, setDaily] = useState<HifzDailyRecordParsed[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const [lessonType, setLessonType] = useState<HifzLessonType>('sabaq')
  const [recordDate, setRecordDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  )
  const [surahId, setSurahId] = useState('')
  const [ayahFrom, setAyahFrom] = useState('1')
  const [ayahTo, setAyahTo] = useState('1')
  const [pages, setPages] = useState('')
  const [quality, setQuality] = useState('4')
  const [notes, setNotes] = useState('')

  const loadBase = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [studentRows, surahRows] = await Promise.all([
        listStudentsForHifz(),
        listSurahs(),
      ])
      setStudents(studentRows)
      setSurahs(surahRows)
      setSelectedProfileId((prev) => prev || studentRows[0]?.profile_id || '')
    } catch (err) {
      setError(toError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const loadStudentData = useCallback(async (profileId: string) => {
    if (!profileId) {
      setProgress([])
      setDaily([])
      return
    }
    try {
      const [p, d] = await Promise.all([
        getProgress(profileId),
        listDailyRecords(profileId),
      ])
      setProgress(p)
      setDaily(d)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }, [])

  useEffect(() => {
    void loadBase()
  }, [loadBase])

  useEffect(() => {
    if (selectedProfileId) void loadStudentData(selectedProfileId)
  }, [selectedProfileId, loadStudentData])

  const summary = useMemo(() => summarizeProgress(progress), [progress])

  const handleSaveDaily = async () => {
    if (!selectedProfileId) return
    setSaving(true)
    try {
      await upsertDailyRecord({
        studentId: selectedProfileId,
        recordDate,
        lessonType,
        surahId: surahId || null,
        ayahFrom: ayahFrom ? Number(ayahFrom) : null,
        ayahTo: ayahTo ? Number(ayahTo) : null,
        pagesRevised: pages ? Number(pages) : null,
        qualityRating: quality ? Number(quality) : null,
        notes,
        recordedBy: user?.id ?? null,
      })

      if (surahId && ayahFrom && ayahTo) {
        await upsertProgress({
          student_id: selectedProfileId,
          surah_id: surahId,
          ayah_from: Number(ayahFrom),
          ayah_to: Number(ayahTo),
          status:
            lessonType === 'sabaq'
              ? 'in_progress'
              : lessonType === 'sabqi' || lessonType === 'manzil'
                ? 'revised'
                : 'in_progress',
          assigned_by: user?.id ?? null,
          notes: notes || null,
        })
      }

      toast.success(t('hifz.logSuccess'))
      setNotes('')
      await loadStudentData(selectedProfileId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (row: HifzProgressWithSurah) => {
    try {
      await approveProgress(row.id, 'memorized')
      toast.success(t('hifz.approve'))
      await loadStudentData(selectedProfileId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  const handleNeedsWork = async (row: HifzProgressWithSurah) => {
    try {
      await approveProgress(row.id, 'weak' satisfies HifzStatus)
      toast.success(t('hifz.requestRevision'))
      await loadStudentData(selectedProfileId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <ModuleShell
      title={t('hifz.title')}
      description={t('hifz.subtitle')}
      loading={loading}
      error={error}
      onRetry={() => void loadBase()}
      empty={!loading && !error && students.length === 0}
      emptyTitle={t('hifz.noEntries')}
      emptyDescription={t('auth.studentsGetCredentials')}
    >
      <div className="mb-6 max-w-md space-y-2">
        <Label>{t('hifz.studentSelect')}</Label>
        <Select
          value={selectedProfileId}
          onValueChange={setSelectedProfileId}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('hifz.studentSelect')} />
          </SelectTrigger>
          <SelectContent>
            {students.map((s) => (
              <SelectItem key={s.id} value={s.profile_id}>
                {s.profiles?.full_name || s.student_code || s.profile_id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedProfileId ? (
        <div className="space-y-8">
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 font-display text-lg font-semibold text-navy">
              {t('hifz.summary')}
            </h2>
            <div className="mb-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>
                {t('hifz.totalMemorized')}: {summary.memorized}/
                {summary.totalRanges}
              </span>
              <span>
                {t('hifz.statusPending')}: {summary.inProgress}
              </span>
            </div>
            <Progress value={summary.percentComplete} className="h-3" />
            <p className="mt-1 text-xs text-muted-foreground">
              {summary.percentComplete}%
            </p>
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-4 font-display text-lg font-semibold text-navy">
              {t('hifz.addEntry')}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>{t('hifz.date')}</Label>
                <Input
                  type="date"
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('hifz.status')}</Label>
                <Select
                  value={lessonType}
                  onValueChange={(v) => setLessonType(v as HifzLessonType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LESSON_TYPES.map((lt) => (
                      <SelectItem key={lt} value={lt}>
                        {lt === 'sabaq'
                          ? t('hifz.newMemorization')
                          : lt === 'sabqi'
                            ? t('hifz.revision')
                            : lt.charAt(0).toUpperCase() + lt.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('hifz.surah')}</Label>
                <Select value={surahId || undefined} onValueChange={setSurahId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('hifz.surah')} />
                  </SelectTrigger>
                  <SelectContent>
                    {surahs.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.number}. {s.name_en} ({s.name_ar})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('hifz.ayahFrom')}</Label>
                <Input
                  type="number"
                  min={1}
                  value={ayahFrom}
                  onChange={(e) => setAyahFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('hifz.ayahTo')}</Label>
                <Input
                  type="number"
                  min={1}
                  value={ayahTo}
                  onChange={(e) => setAyahTo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('hifz.pages')}</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.25}
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('hifz.quality')}</Label>
                <Select value={quality} onValueChange={setQuality}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">{t('hifz.qualityExcellent')}</SelectItem>
                    <SelectItem value="4">{t('hifz.qualityGood')}</SelectItem>
                    <SelectItem value="3">{t('hifz.qualityFair')}</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t('hifz.teacherNotes')}</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <Button
              className="mt-4"
              disabled={saving || !selectedProfileId}
              onClick={() => void handleSaveDaily()}
            >
              {t('hifz.addEntry')}
            </Button>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold text-navy">
              {t('hifz.summary')}
            </h2>
            {progress.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('hifz.noEntries')}</p>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border bg-card">
                {progress.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-navy">
                        {row.surahs?.name_en ?? row.surah_id} · {row.ayah_from}–
                        {row.ayah_to}
                      </p>
                      <Badge variant="outline" className="mt-1 capitalize">
                        {row.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void handleApprove(row)}
                      >
                        {t('hifz.approve')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleNeedsWork(row)}
                      >
                        {t('hifz.requestRevision')}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
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
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-navy">
                        {row.record_date}
                      </span>
                      {row.lesson_type ? (
                        <Badge variant="secondary" className="capitalize">
                          {row.lesson_type}
                        </Badge>
                      ) : null}
                      {row.quality_rating != null ? (
                        <Badge variant="outline">
                          {t('hifz.quality')}: {row.quality_rating}/5
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {row.surahs
                        ? `${row.surahs.name_en} ${row.ayah_from ?? ''}–${row.ayah_to ?? ''}`
                        : null}
                      {row.notes_body ? ` — ${row.notes_body}` : null}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </ModuleShell>
  )
}
