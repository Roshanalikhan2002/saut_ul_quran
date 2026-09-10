import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Plus,
  Trash2,
  Pencil,
  Eye,
} from 'lucide-react'
import { ModuleShell } from '@/components/shared/ModuleShell'
import { FileUpload } from '@/components/shared/FileUpload'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getSignedUrl, type StorageBucket } from '@/services/storage'
import {
  assignCourseTeacher,
  deleteLesson,
  deleteLessonContent,
  getCourse,
  listLessonContent,
  listLessons,
  pickCourseTitle,
  pickLessonTitle,
  reorderLessons,
  upsertLesson,
  upsertLessonContent,
  uploadLessonFile,
  type CourseWithTranslations,
  type LessonContent,
  type LessonWithTranslations,
} from '@/services/courses'
import type { ContentType } from '@/types/database'
import { useAuth } from '@/contexts/AuthContext'
import { toError } from '@/lib/errors'

const CONTENT_TYPES: ContentType[] = [
  'video',
  'audio',
  'text',
  'pdf',
  'link',
]

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60)
}

function bucketForType(type: ContentType): StorageBucket | null {
  if (type === 'video') return 'course-videos'
  if (type === 'audio') return 'course-audio'
  if (type === 'pdf' || type === 'image') return 'course-notes'
  return null
}

export function TeacherCourseDetailPage() {
  const { courseId = '' } = useParams()
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ur' ? 'ur' : 'en'
  const { user } = useAuth()

  const [course, setCourse] = useState<CourseWithTranslations | null>(null)
  const [lessons, setLessons] = useState<LessonWithTranslations[]>([])
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [contents, setContents] = useState<LessonContent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const [lessonOpen, setLessonOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<LessonWithTranslations | null>(
    null,
  )
  const [lessonForm, setLessonForm] = useState({
    titleEn: '',
    titleUr: '',
    summaryEn: '',
    summaryUr: '',
    slug: '',
    duration: '',
    published: true,
  })
  const [savingLesson, setSavingLesson] = useState(false)
  const [deleteLessonId, setDeleteLessonId] = useState<string | null>(null)

  const [contentOpen, setContentOpen] = useState(false)
  const [contentType, setContentType] = useState<ContentType>('video')
  const [contentBody, setContentBody] = useState('')
  const [contentUrl, setContentUrl] = useState('')
  const [savingContent, setSavingContent] = useState(false)
  const [deleteContentId, setDeleteContentId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewKind, setPreviewKind] = useState<'video' | 'audio' | 'link' | null>(
    null,
  )

  const selectedLesson = useMemo(
    () => lessons.find((l) => l.id === selectedLessonId) ?? null,
    [lessons, selectedLessonId],
  )

  const load = useCallback(async () => {
    if (!courseId) return
    setLoading(true)
    setError(null)
    try {
      const c = await getCourse(courseId)
      if (!c) throw new Error(t('common.errorNotFound'))
      const lessonList = await listLessons(c.id)
      setCourse(c)
      setLessons(lessonList)
      setSelectedLessonId((prev) => {
        if (prev && lessonList.some((l) => l.id === prev)) return prev
        return lessonList[0]?.id ?? null
      })
    } catch (err) {
      setError(toError(err))
    } finally {
      setLoading(false)
    }
  }, [courseId, t])

  const loadContents = useCallback(async (lessonId: string) => {
    const rows = await listLessonContent(lessonId)
    setContents(rows)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!selectedLessonId) {
      setContents([])
      return
    }
    void loadContents(selectedLessonId).catch((err) => {
      toast.error(err instanceof Error ? err.message : String(err))
    })
  }, [selectedLessonId, loadContents])

  function openCreateLesson() {
    setEditingLesson(null)
    setLessonForm({
      titleEn: '',
      titleUr: '',
      summaryEn: '',
      summaryUr: '',
      slug: '',
      duration: '',
      published: true,
    })
    setLessonOpen(true)
  }

  function openEditLesson(lesson: LessonWithTranslations) {
    const en = lesson.lesson_translations.find((tr) => tr.locale === 'en')
    const ur = lesson.lesson_translations.find((tr) => tr.locale === 'ur')
    setEditingLesson(lesson)
    setLessonForm({
      titleEn: en?.title ?? '',
      titleUr: ur?.title ?? '',
      summaryEn: en?.summary ?? '',
      summaryUr: ur?.summary ?? '',
      slug: lesson.slug,
      duration: lesson.duration_minutes?.toString() ?? '',
      published: lesson.is_published,
    })
    setLessonOpen(true)
  }

  async function handleSaveLesson() {
    if (!course || !lessonForm.titleEn.trim()) {
      toast.error(t('common.required'))
      return
    }
    setSavingLesson(true)
    try {
      const slug =
        lessonForm.slug.trim() ||
        slugify(lessonForm.titleEn) ||
        `lesson-${Date.now()}`
      const saved = await upsertLesson({
        id: editingLesson?.id,
        course_id: course.id,
        slug,
        sort_order: editingLesson?.sort_order ?? lessons.length,
        duration_minutes: lessonForm.duration
          ? Number(lessonForm.duration)
          : null,
        is_published: lessonForm.published,
        translations: [
          {
            locale: 'en',
            title: lessonForm.titleEn.trim(),
            summary: lessonForm.summaryEn.trim() || null,
          },
          {
            locale: 'ur',
            title: lessonForm.titleUr.trim() || lessonForm.titleEn.trim(),
            summary: lessonForm.summaryUr.trim() || null,
          },
        ],
      })
      toast.success(
        editingLesson ? t('common.successUpdated') : t('common.successCreated'),
      )
      setLessonOpen(false)
      await load()
      setSelectedLessonId(saved.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setSavingLesson(false)
    }
  }

  async function handleDeleteLesson() {
    if (!deleteLessonId) return
    try {
      await deleteLesson(deleteLessonId)
      toast.success(t('common.successDeleted'))
      setDeleteLessonId(null)
      if (selectedLessonId === deleteLessonId) setSelectedLessonId(null)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  async function moveLesson(lessonId: string, direction: -1 | 1) {
    if (!course) return
    const idx = lessons.findIndex((l) => l.id === lessonId)
    const next = idx + direction
    if (idx < 0 || next < 0 || next >= lessons.length) return
    const ordered = lessons.map((l) => l.id)
    const tmp = ordered[idx]!
    ordered[idx] = ordered[next]!
    ordered[next] = tmp
    try {
      await reorderLessons(course.id, ordered)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  async function handleAddContent() {
    if (!course || !selectedLessonId) return
    setSavingContent(true)
    try {
      if (contentType === 'text' && !contentBody.trim()) {
        toast.error(t('common.required'))
        return
      }
      if (contentType === 'link' && !contentUrl.trim()) {
        toast.error(t('common.required'))
        return
      }
      await upsertLessonContent({
        lesson_id: selectedLessonId,
        content_type: contentType,
        sort_order: contents.length,
        body_markdown: contentType === 'text' ? contentBody.trim() : null,
        external_url: contentType === 'link' ? contentUrl.trim() : null,
        storage_path: null,
      })
      toast.success(t('common.successCreated'))
      setContentOpen(false)
      setContentBody('')
      setContentUrl('')
      await loadContents(selectedLessonId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setSavingContent(false)
    }
  }

  async function handleUploadContent(file: File) {
    if (!course || !selectedLessonId) return
    const type =
      contentType === 'video' || contentType === 'audio' || contentType === 'pdf'
        ? contentType
        : file.type.startsWith('video')
          ? 'video'
          : file.type.startsWith('audio')
            ? 'audio'
            : 'pdf'
    const { path } = await uploadLessonFile({
      courseId: course.id,
      lessonId: selectedLessonId,
      contentType: type,
      file,
    })
    await upsertLessonContent({
      lesson_id: selectedLessonId,
      content_type: type,
      sort_order: contents.length,
      storage_path: path,
    })
    toast.success(t('common.successCreated'))
    setContentOpen(false)
    await loadContents(selectedLessonId)
  }

  async function handleDeleteContent() {
    if (!deleteContentId || !selectedLessonId) return
    try {
      await deleteLessonContent(deleteContentId)
      toast.success(t('common.successDeleted'))
      setDeleteContentId(null)
      await loadContents(selectedLessonId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  async function handlePreview(item: LessonContent) {
    try {
      if (item.external_url) {
        setPreviewKind('link')
        setPreviewUrl(item.external_url)
        return
      }
      if (!item.storage_path) {
        if (item.body_markdown) {
          setPreviewKind(null)
          setPreviewUrl(item.body_markdown)
          return
        }
        toast.error(t('common.empty'))
        return
      }
      const bucket = bucketForType(item.content_type)
      if (!bucket) {
        toast.error(t('common.error'))
        return
      }
      const url = await getSignedUrl(bucket, item.storage_path)
      setPreviewUrl(url)
      setPreviewKind(
        item.content_type === 'audio'
          ? 'audio'
          : item.content_type === 'video'
            ? 'video'
            : 'link',
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  async function handleAssignSelf() {
    if (!course || !user) return
    try {
      await assignCourseTeacher({
        courseId: course.id,
        teacherId: user.id,
        isPrimary: true,
        assignedBy: user.id,
      })
      toast.success(t('common.successSaved'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <ModuleShell
      title={
        course ? pickCourseTitle(course, locale) : t('courses.title')
      }
      description={t('courses.manageLessons')}
      loading={loading}
      error={error}
      onRetry={() => void load()}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/teacher/courses">
              <ArrowLeft className="h-4 w-4" />
              {t('nav.back')}
            </Link>
          </Button>
          <Button type="button" variant="secondary" onClick={() => void handleAssignSelf()}>
            {t('courses.assignMe')}
          </Button>
          <Button type="button" onClick={openCreateLesson}>
            <Plus className="h-4 w-4" />
            {t('courses.addLesson')}
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('courses.lessons')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lessons.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('courses.noLessons')}</p>
            ) : (
              lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className={`rounded-lg border px-3 py-2 ${
                    lesson.id === selectedLessonId
                      ? 'border-primary bg-surface'
                      : 'border-border'
                  }`}
                >
                  <button
                    type="button"
                    className="w-full text-start"
                    onClick={() => setSelectedLessonId(lesson.id)}
                  >
                    <p className="text-sm font-medium text-navy">
                      {pickLessonTitle(lesson, locale)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      #{index + 1} · {lesson.slug}
                    </p>
                  </button>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={index === 0}
                      onClick={() => void moveLesson(lesson.id, -1)}
                      aria-label="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={index === lessons.length - 1}
                      onClick={() => void moveLesson(lesson.id, 1)}
                      aria-label="Move down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditLesson(lesson)}
                      aria-label={t('common.actions.edit')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeleteLessonId(lesson.id)}
                      aria-label={t('common.actions.delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <div>
              <CardTitle className="text-base">
                {selectedLesson
                  ? pickLessonTitle(selectedLesson, locale)
                  : t('courses.lesson')}
              </CardTitle>
              {selectedLesson ? (
                <Badge
                  className="mt-2"
                  variant={selectedLesson.is_published ? 'default' : 'secondary'}
                >
                  {selectedLesson.is_published
                    ? t('common.status.published')
                    : t('common.status.draft')}
                </Badge>
              ) : null}
            </div>
            <Button
              type="button"
              size="sm"
              disabled={!selectedLesson}
              onClick={() => {
                setContentType('video')
                setContentBody('')
                setContentUrl('')
                setContentOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />
              {t('courses.addContent')}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
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
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {item.content_type}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-md">
                      {item.storage_path ||
                        item.external_url ||
                        item.body_markdown?.slice(0, 80) ||
                        '—'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void handlePreview(item)}
                    >
                      <Eye className="h-4 w-4" />
                      {t('common.actions.view')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteContentId(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={lessonOpen} onOpenChange={setLessonOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? t('courses.editLesson') : t('courses.addLesson')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t('courses.titleEn')}</Label>
              <Input
                value={lessonForm.titleEn}
                onChange={(e) =>
                  setLessonForm((f) => ({ ...f, titleEn: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('courses.titleUr')}</Label>
              <Input
                value={lessonForm.titleUr}
                onChange={(e) =>
                  setLessonForm((f) => ({ ...f, titleUr: e.target.value }))
                }
                dir="rtl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('courses.summaryEn')}</Label>
              <Textarea
                value={lessonForm.summaryEn}
                onChange={(e) =>
                  setLessonForm((f) => ({ ...f, summaryEn: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('courses.summaryUr')}</Label>
              <Textarea
                value={lessonForm.summaryUr}
                onChange={(e) =>
                  setLessonForm((f) => ({ ...f, summaryUr: e.target.value }))
                }
                dir="rtl"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input
                  value={lessonForm.slug}
                  onChange={(e) =>
                    setLessonForm((f) => ({ ...f, slug: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('courses.duration')}</Label>
                <Input
                  type="number"
                  min={0}
                  value={lessonForm.duration}
                  onChange={(e) =>
                    setLessonForm((f) => ({ ...f, duration: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={lessonForm.published}
                onCheckedChange={(published) =>
                  setLessonForm((f) => ({ ...f, published }))
                }
              />
              <Label>{t('common.status.published')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLessonOpen(false)}
            >
              {t('common.actions.cancel')}
            </Button>
            <Button
              type="button"
              disabled={savingLesson}
              onClick={() => void handleSaveLesson()}
            >
              {t('common.actions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={contentOpen} onOpenChange={setContentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('courses.addContent')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t('courses.contentType')}</Label>
              <Select
                value={contentType}
                onValueChange={(v) => setContentType(v as ContentType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {contentType === 'text' ? (
              <div className="space-y-1.5">
                <Label>{t('courses.textBody')}</Label>
                <Textarea
                  rows={6}
                  value={contentBody}
                  onChange={(e) => setContentBody(e.target.value)}
                />
              </div>
            ) : null}
            {contentType === 'link' ? (
              <div className="space-y-1.5">
                <Label>URL</Label>
                <Input
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  placeholder="https://"
                />
              </div>
            ) : null}
            {contentType === 'video' ||
            contentType === 'audio' ||
            contentType === 'pdf' ? (
              <FileUpload
                accept={
                  contentType === 'video'
                    ? 'video/*'
                    : contentType === 'audio'
                      ? 'audio/*'
                      : '.pdf,application/pdf'
                }
                onUpload={handleUploadContent}
              />
            ) : (
              <DialogFooter>
                <Button
                  type="button"
                  disabled={savingContent}
                  onClick={() => void handleAddContent()}
                >
                  {t('common.actions.save')}
                </Button>
              </DialogFooter>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(previewUrl)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewUrl(null)
            setPreviewKind(null)
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('common.actions.view')}</DialogTitle>
          </DialogHeader>
          {previewKind === 'video' && previewUrl ? (
            <video src={previewUrl} controls className="w-full rounded-lg" />
          ) : null}
          {previewKind === 'audio' && previewUrl ? (
            <audio src={previewUrl} controls className="w-full" />
          ) : null}
          {previewKind === 'link' && previewUrl ? (
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline break-all"
            >
              {previewUrl}
            </a>
          ) : null}
          {previewKind === null && previewUrl ? (
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-surface p-3 text-sm">
              {previewUrl}
            </pre>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteLessonId)}
        onOpenChange={(open) => {
          if (!open) setDeleteLessonId(null)
        }}
        destructive
        onConfirm={() => void handleDeleteLesson()}
      />
      <ConfirmDialog
        open={Boolean(deleteContentId)}
        onOpenChange={(open) => {
          if (!open) setDeleteContentId(null)
        }}
        destructive
        onConfirm={() => void handleDeleteContent()}
      />
    </ModuleShell>
  )
}
