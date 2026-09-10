import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type SyntheticEvent,
} from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ArrowLeft, Download } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ModuleShell } from '@/components/shared/ModuleShell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatPercent } from '@/lib/utils'
import { listEnrollments } from '@/services/enrollments'
import {
  getCourse,
  listLessonContent,
  listLessons,
  pickCourseTitle,
  pickLessonTitle,
  type CourseWithTranslations,
  type LessonContent,
  type LessonWithTranslations,
} from '@/services/courses'
import {
  getProgress,
  listCourseProgress,
  saveProgress,
  type LessonProgress,
} from '@/services/lessonProgress'
import { issueIfCourseComplete } from '@/services/certificates'
import { getSignedUrl, type StorageBucket } from '@/services/storage'
import { toError } from '@/lib/errors'

const SAVE_THROTTLE_MS = 4000

function bucketForType(type: LessonContent['content_type']): StorageBucket | null {
  if (type === 'video') return 'course-videos'
  if (type === 'audio') return 'course-audio'
  if (type === 'pdf' || type === 'image') return 'course-notes'
  return null
}

export function StudentCourseDetailPage() {
  const { courseId = '' } = useParams()
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ur' ? 'ur' : 'en'
  const { user } = useAuth()

  const [course, setCourse] = useState<CourseWithTranslations | null>(null)
  const [lessons, setLessons] = useState<LessonWithTranslations[]>([])
  const [progressMap, setProgressMap] = useState<Record<string, LessonProgress>>(
    {},
  )
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [contents, setContents] = useState<LessonContent[]>([])
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [enrolled, setEnrolled] = useState(false)

  const lastSaveRef = useRef(0)
  const resumeAppliedRef = useRef<string | null>(null)

  const selectedLesson = useMemo(
    () => lessons.find((l) => l.id === selectedLessonId) ?? null,
    [lessons, selectedLessonId],
  )

  const overallPercent = useMemo(() => {
    if (lessons.length === 0) return 0
    const sum = lessons.reduce((acc, lesson) => {
      return acc + (progressMap[lesson.id]?.progress_percent ?? 0)
    }, 0)
    return sum / lessons.length
  }, [lessons, progressMap])

  const load = useCallback(async () => {
    if (!courseId || !user) return
    setLoading(true)
    setError(null)
    try {
      const [c, enrollments] = await Promise.all([
        getCourse(courseId),
        listEnrollments({ studentId: user.id, courseId }),
      ])
      if (!c) throw new Error(t('common.errorNotFound'))

      const active = enrollments.some(
        (e) => e.status === 'active' || e.status === 'completed',
      )
      setEnrolled(active)
      if (!active) {
        setCourse(c)
        setLessons([])
        setError(new Error(t('courses.notEnrolled')))
        return
      }

      const [lessonList, progressList] = await Promise.all([
        listLessons(c.id),
        listCourseProgress(user.id, c.id),
      ])
      const published = lessonList.filter((l) => l.is_published)
      const map: Record<string, LessonProgress> = {}
      for (const row of progressList) map[row.lesson_id] = row

      setCourse(c)
      setLessons(published)
      setProgressMap(map)
      setSelectedLessonId((prev) => {
        if (prev && published.some((l) => l.id === prev)) return prev
        const resume = published.find(
          (l) => map[l.id] && map[l.id]!.status !== 'completed',
        )
        return resume?.id ?? published[0]?.id ?? null
      })
    } catch (err) {
      setError(toError(err))
    } finally {
      setLoading(false)
    }
  }, [courseId, user, t])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!selectedLessonId || !user) {
      setContents([])
      setMediaUrls({})
      return
    }
    resumeAppliedRef.current = null
    void (async () => {
      try {
        const rows = await listLessonContent(selectedLessonId)
        setContents(rows)
        const urls: Record<string, string> = {}
        await Promise.all(
          rows.map(async (row) => {
            if (row.external_url) {
              urls[row.id] = row.external_url
              return
            }
            if (!row.storage_path) return
            const bucket = bucketForType(row.content_type)
            if (!bucket) return
            urls[row.id] = await getSignedUrl(bucket, row.storage_path)
          }),
        )
        setMediaUrls(urls)

        const progress = await getProgress(user.id, selectedLessonId)
        if (progress) {
          setProgressMap((prev) => ({ ...prev, [selectedLessonId]: progress }))
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err))
      }
    })()
  }, [selectedLessonId, user])

  async function persistProgress(
    lessonId: string,
    positionSeconds: number,
    duration: number,
    force = false,
  ) {
    if (!user) return
    const now = Date.now()
    if (!force && now - lastSaveRef.current < SAVE_THROTTLE_MS) return
    lastSaveRef.current = now

    const percent =
      duration > 0
        ? Math.min(100, Math.round((positionSeconds / duration) * 100))
        : progressMap[lessonId]?.progress_percent ?? 0

    try {
      const saved = await saveProgress({
        studentId: user.id,
        lessonId,
        positionSeconds: Math.floor(positionSeconds),
        percent,
        status: percent >= 95 ? 'completed' : 'in_progress',
      })
      setProgressMap((prev) => ({ ...prev, [lessonId]: saved }))

      if (saved.status === 'completed' && course) {
        void issueIfCourseComplete(user.id, course.id).catch(() => undefined)
      }
    } catch {
      // Silent — progress saves should not interrupt playback.
    }
  }

  function onMediaTimeUpdate(
    lessonId: string,
    event: SyntheticEvent<HTMLMediaElement>,
  ) {
    const el = event.currentTarget
    void persistProgress(lessonId, el.currentTime, el.duration || 0)
  }

  function onMediaLoaded(
    lessonId: string,
    event: SyntheticEvent<HTMLMediaElement>,
  ) {
    if (resumeAppliedRef.current === lessonId) return
    const pos = progressMap[lessonId]?.last_position_seconds ?? 0
    if (pos > 2) {
      event.currentTarget.currentTime = pos
    }
    resumeAppliedRef.current = lessonId
  }

  async function markLessonComplete(lessonId: string) {
    if (!user || !course) return
    try {
      const saved = await saveProgress({
        studentId: user.id,
        lessonId,
        percent: 100,
        status: 'completed',
      })
      setProgressMap((prev) => ({ ...prev, [lessonId]: saved }))
      toast.success(t('courses.markComplete'))
      await issueIfCourseComplete(user.id, course.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  async function downloadNotes(item: LessonContent) {
    const url = mediaUrls[item.id]
    if (!url) {
      toast.error(t('common.error'))
      return
    }
    const a = document.createElement('a')
    a.href = url
    a.download = item.storage_path?.split('/').pop() || 'notes'
    a.target = '_blank'
    a.rel = 'noreferrer'
    a.click()
  }

  return (
    <ModuleShell
      title={course ? pickCourseTitle(course, locale) : t('courses.myCourses')}
      description={t('courses.subtitle')}
      loading={loading}
      error={error}
      onRetry={() => void load()}
      actions={
        <Button variant="outline" asChild>
          <Link to="/student/courses">
            <ArrowLeft className="h-4 w-4" />
            {t('nav.back')}
          </Link>
        </Button>
      }
    >
      {enrolled ? (
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('courses.progress')}</span>
            <span className="font-medium">{formatPercent(overallPercent)}</span>
          </div>
          <Progress value={overallPercent} />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('courses.lessons')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lessons.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('courses.noLessons')}
              </p>
            ) : (
              lessons.map((lesson) => {
                const prog = progressMap[lesson.id]
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => setSelectedLessonId(lesson.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-start ${
                      lesson.id === selectedLessonId
                        ? 'border-primary bg-surface'
                        : 'border-border'
                    }`}
                  >
                    <p className="text-sm font-medium text-navy">
                      {pickLessonTitle(lesson, locale)}
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatPercent(prog?.progress_percent ?? 0)}
                      </span>
                      {prog?.status === 'completed' ? (
                        <Badge variant="secondary">{t('courses.completed')}</Badge>
                      ) : null}
                    </div>
                  </button>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-3">
            <CardTitle className="text-base">
              {selectedLesson
                ? pickLessonTitle(selectedLesson, locale)
                : t('courses.lesson')}
            </CardTitle>
            {selectedLesson ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => void markLessonComplete(selectedLesson.id)}
              >
                {t('courses.markComplete')}
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedLesson ? (
              <p className="text-sm text-muted-foreground">
                {t('courses.selectLesson')}
              </p>
            ) : contents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('courses.noContent')}
              </p>
            ) : (
              contents.map((item) => (
                <div key={item.id} className="space-y-2 rounded-lg border border-border p-3">
                  <p className="text-sm font-medium capitalize">
                    {item.content_type}
                  </p>
                  {item.content_type === 'video' && mediaUrls[item.id] ? (
                    <video
                      className="w-full rounded-lg bg-black"
                      controls
                      src={mediaUrls[item.id]}
                      onLoadedMetadata={(e) =>
                        onMediaLoaded(selectedLesson.id, e)
                      }
                      onTimeUpdate={(e) =>
                        onMediaTimeUpdate(selectedLesson.id, e)
                      }
                      onPause={(e) =>
                        void persistProgress(
                          selectedLesson.id,
                          e.currentTarget.currentTime,
                          e.currentTarget.duration || 0,
                          true,
                        )
                      }
                      onEnded={(e) =>
                        void persistProgress(
                          selectedLesson.id,
                          e.currentTarget.duration || 0,
                          e.currentTarget.duration || 0,
                          true,
                        )
                      }
                    />
                  ) : null}
                  {item.content_type === 'audio' && mediaUrls[item.id] ? (
                    <audio
                      className="w-full"
                      controls
                      src={mediaUrls[item.id]}
                      onLoadedMetadata={(e) =>
                        onMediaLoaded(selectedLesson.id, e)
                      }
                      onTimeUpdate={(e) =>
                        onMediaTimeUpdate(selectedLesson.id, e)
                      }
                      onPause={(e) =>
                        void persistProgress(
                          selectedLesson.id,
                          e.currentTarget.currentTime,
                          e.currentTarget.duration || 0,
                          true,
                        )
                      }
                      onEnded={(e) =>
                        void persistProgress(
                          selectedLesson.id,
                          e.currentTarget.duration || 0,
                          e.currentTarget.duration || 0,
                          true,
                        )
                      }
                    />
                  ) : null}
                  {item.content_type === 'text' && item.body_markdown ? (
                    <pre className="whitespace-pre-wrap rounded-md bg-surface p-3 text-sm">
                      {item.body_markdown}
                    </pre>
                  ) : null}
                  {(item.content_type === 'pdf' ||
                    item.content_type === 'link' ||
                    item.content_type === 'image') &&
                  mediaUrls[item.id] ? (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={mediaUrls[item.id]}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {t('common.actions.view')}
                        </a>
                      </Button>
                      {item.content_type === 'pdf' ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => void downloadNotes(item)}
                        >
                          <Download className="h-4 w-4" />
                          {t('common.actions.download')}
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </ModuleShell>
  )
}
