import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Megaphone, Pin, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { ModuleShell } from '@/components/shared/ModuleShell'
import {
  createAnnouncement,
  listAnnouncements,
  setPinned,
  type AnnouncementWithCourse,
} from '@/services/announcements'
import { listCourses, pickCourseTitle, type CourseWithTranslations } from '@/services/courses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
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
import { toError } from '@/lib/errors'

export function TeacherAnnouncementsPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ur' ? 'ur' : 'en'
  const { user } = useAuth()
  const [items, setItems] = useState<AnnouncementWithCourse[]>([])
  const [courses, setCourses] = useState<CourseWithTranslations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [courseId, setCourseId] = useState<string>('__all__')
  const [mirror, setMirror] = useState(false)
  const [pin, setPin] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [a, c] = await Promise.all([listAnnouncements(), listCourses()])
      setItems(a)
      setCourses(c)
    } catch (err) {
      setError(toError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!user || !title.trim() || !body.trim()) return
    try {
      await createAnnouncement({
        title_en: title.trim(),
        body_en: body.trim(),
        course_id: courseId === '__all__' ? null : courseId,
        published_by: user.id,
        is_pinned: pin,
        is_published: true,
        mirrorToGroup: mirror && courseId !== '__all__',
      })
      toast.success(t('common.successCreated'))
      setOpen(false)
      setTitle('')
      setBody('')
      setPin(false)
      setMirror(false)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.errorRetry'))
    }
  }

  async function handlePin(id: string, currently: boolean) {
    try {
      await setPinned(id, !currently)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.errorRetry'))
    }
  }

  return (
    <ModuleShell
      title={t('announcements.title')}
      description={t('announcements.subtitle')}
      loading={loading}
      error={error}
      onRetry={() => void load()}
      actions={
        <Button type="button" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          {t('announcements.create')}
        </Button>
      }
      empty={!loading && !error && items.length === 0}
      emptyTitle={t('announcements.noAnnouncements')}
    >
      <ul className="space-y-3">
        {items.map((a) => {
          const courseTitle = a.courses
            ? pickCourseTitle(
                {
                  ...a.courses,
                  course_translations: a.courses.course_translations ?? [],
                },
                locale,
              )
            : t('announcements.audienceAll')
          return (
            <li
              key={a.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    {a.is_pinned ? (
                      <Badge variant="warning">{t('announcements.pinned')}</Badge>
                    ) : null}
                    <Badge variant="secondary">{courseTitle}</Badge>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-navy">
                    {locale === 'ur' && a.title_ur ? a.title_ur : a.title_en}
                  </h3>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => void handlePin(a.id, a.is_pinned)}
                >
                  <Pin className="h-4 w-4" />
                  {a.is_pinned
                    ? t('announcements.unpin')
                    : t('announcements.pin')}
                </Button>
              </div>
              <p className="whitespace-pre-wrap text-sm text-foreground/90">
                {locale === 'ur' && a.body_ur ? a.body_ur : a.body_en}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {t('announcements.postedOn')}{' '}
                {new Date(a.published_at).toLocaleString()}
                {a.profiles?.full_name
                  ? ` · ${t('announcements.by')} ${a.profiles.full_name}`
                  : ''}
              </p>
            </li>
          )
        })}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('announcements.create')}</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={(e) => void handleCreate(e)}>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Body</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('announcements.audience')}</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">
                    {t('announcements.audienceAll')}
                  </SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {pickCourseTitle(c, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={pin}
                onCheckedChange={(v) => setPin(v === true)}
              />
              {t('announcements.pin')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={mirror}
                onCheckedChange={(v) => setMirror(v === true)}
                disabled={courseId === '__all__'}
              />
              Also post to course announcement group
            </label>
            <DialogFooter>
              <Button type="submit">
                <Megaphone className="h-4 w-4" />
                {t('announcements.publish')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ModuleShell>
  )
}

export function StudentAnnouncementsPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ur' ? 'ur' : 'en'
  const [items, setItems] = useState<AnnouncementWithCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await listAnnouncements({ publishedOnly: true }))
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
      title={t('announcements.title')}
      description={t('announcements.subtitle')}
      loading={loading}
      error={error}
      onRetry={() => void load()}
      empty={!loading && !error && items.length === 0}
      emptyTitle={t('announcements.noAnnouncements')}
    >
      <ul className="space-y-3">
        {items.map((a) => (
          <li
            key={a.id}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="mb-1 flex flex-wrap gap-2">
              {a.is_pinned ? (
                <Badge variant="warning">{t('announcements.pinned')}</Badge>
              ) : null}
            </div>
            <h3 className="font-display text-lg font-semibold text-navy">
              {locale === 'ur' && a.title_ur ? a.title_ur : a.title_en}
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm">
              {locale === 'ur' && a.body_ur ? a.body_ur : a.body_en}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              {t('announcements.postedOn')}{' '}
              {new Date(a.published_at).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </ModuleShell>
  )
}
