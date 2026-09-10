import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Plus, Pencil } from 'lucide-react'
import {
  listCourses,
  pickCourseTitle,
  upsertCourse,
  type CourseWithTranslations,
} from '@/services/courses'
import { ModuleShell } from '@/components/shared/ModuleShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toError } from '@/lib/errors'

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

const emptyForm = {
  titleEn: '',
  titleUr: '',
  descriptionEn: '',
  descriptionUr: '',
  slug: '',
  difficulty: '',
  estimatedHours: '',
  isPublished: false,
}

export function TeacherCoursesPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ur' ? 'ur' : 'en'
  const [courses, setCourses] = useState<CourseWithTranslations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CourseWithTranslations | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setCourses(await listCourses())
    } catch (err) {
      setError(toError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(course: CourseWithTranslations) {
    const en = course.course_translations.find((tr) => tr.locale === 'en')
    const ur = course.course_translations.find((tr) => tr.locale === 'ur')
    setEditing(course)
    setForm({
      titleEn: en?.title ?? '',
      titleUr: ur?.title ?? '',
      descriptionEn: en?.description ?? '',
      descriptionUr: ur?.description ?? '',
      slug: course.slug,
      difficulty: course.difficulty ?? '',
      estimatedHours: course.estimated_hours?.toString() ?? '',
      isPublished: course.is_published,
    })
    setOpen(true)
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!form.titleEn.trim()) {
      toast.error(t('common.required'))
      return
    }
    setSaving(true)
    try {
      const slug =
        form.slug.trim() || slugify(form.titleEn) || `course-${Date.now()}`
      await upsertCourse({
        id: editing?.id,
        slug,
        difficulty: form.difficulty.trim() || null,
        estimated_hours: form.estimatedHours
          ? Number(form.estimatedHours)
          : null,
        is_published: form.isPublished,
        sort_order: editing?.sort_order ?? courses.length,
        translations: [
          {
            locale: 'en',
            title: form.titleEn.trim(),
            description: form.descriptionEn.trim() || null,
          },
          {
            locale: 'ur',
            title: form.titleUr.trim() || form.titleEn.trim(),
            description: form.descriptionUr.trim() || null,
          },
        ],
      })
      toast.success(
        editing ? t('common.successUpdated') : t('common.successCreated'),
      )
      setOpen(false)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModuleShell
      title={t('courses.title')}
      description={t('courses.subtitle')}
      loading={loading}
      error={error}
      onRetry={() => void load()}
      empty={!loading && !error && courses.length === 0}
      emptyTitle={t('courses.noCourses')}
      actions={
        <Button type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('courses.createCourse')}
        </Button>
      }
    >
      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {courses.map((course) => (
          <li
            key={course.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"
          >
            <div className="min-w-0">
              <Link
                to={`/teacher/courses/${course.id}`}
                className="font-medium text-navy hover:underline"
              >
                {pickCourseTitle(course, locale)}
              </Link>
              <p className="text-xs text-muted-foreground">{course.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={course.is_published ? 'default' : 'secondary'}>
                {course.is_published
                  ? t('common.status.published')
                  : t('common.status.draft')}
              </Badge>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => openEdit(course)}
              >
                <Pencil className="h-4 w-4" />
                {t('common.actions.edit')}
              </Button>
              <Button type="button" size="sm" asChild>
                <Link to={`/teacher/courses/${course.id}`}>
                  {t('courses.manageLessons')}
                </Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t('courses.editCourse') : t('courses.createCourse')}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={(e) => void handleSave(e)}>
            <div className="space-y-1.5">
              <Label>{t('courses.titleEn')}</Label>
              <Input
                value={form.titleEn}
                onChange={(e) =>
                  setForm((f) => ({ ...f, titleEn: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('courses.titleUr')}</Label>
              <Input
                value={form.titleUr}
                onChange={(e) =>
                  setForm((f) => ({ ...f, titleUr: e.target.value }))
                }
                dir="rtl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('courses.descriptionEn')}</Label>
              <Textarea
                value={form.descriptionEn}
                onChange={(e) =>
                  setForm((f) => ({ ...f, descriptionEn: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('courses.descriptionUr')}</Label>
              <Textarea
                value={form.descriptionUr}
                onChange={(e) =>
                  setForm((f) => ({ ...f, descriptionUr: e.target.value }))
                }
                dir="rtl"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slug: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('courses.level')}</Label>
                <Input
                  value={form.difficulty}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, difficulty: e.target.value }))
                  }
                  placeholder={t('courses.levelBeginner')}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t('courses.duration')}</Label>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={form.estimatedHours}
                onChange={(e) =>
                  setForm((f) => ({ ...f, estimatedHours: e.target.value }))
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isPublished}
                onCheckedChange={(isPublished) =>
                  setForm((f) => ({ ...f, isPublished }))
                }
              />
              <Label>{t('common.status.published')}</Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {t('common.actions.cancel')}
              </Button>
              <Button type="submit" disabled={saving}>
                {t('common.actions.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ModuleShell>
  )
}
