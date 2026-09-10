import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ModuleShell } from '@/components/shared/ModuleShell'
import { FileUpload } from '@/components/shared/FileUpload'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import {
  listCourses,
  pickCourseTitle,
  type CourseWithTranslations,
} from '@/services/courses'
import {
  createResource,
  deleteResource,
  listResources,
  updateResource,
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

const emptyForm = {
  titleEn: '',
  titleUr: '',
  descriptionEn: '',
  descriptionUr: '',
  resourceType: 'pdf' as ResourceType,
  courseId: 'none',
  externalUrl: '',
  isPublic: false,
}

export function TeacherLibraryPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ur' ? 'ur' : 'en'
  const { user } = useAuth()
  const isMobile = useMediaQuery('(max-width: 768px)')

  const [courses, setCourses] = useState<CourseWithTranslations[]>([])
  const [resources, setResources] = useState<LibraryResourceWithCourse[]>([])
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [courseList, resourceList] = await Promise.all([
        listCourses(),
        listResources({
          resourceType:
            typeFilter === 'all' ? undefined : (typeFilter as ResourceType),
        }),
      ])
      setCourses(courseList)
      setResources(resourceList)
    } catch (err) {
      setError(toError(err))
    } finally {
      setLoading(false)
    }
  }, [typeFilter])

  useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setEditId(null)
    setForm(emptyForm)
    setFile(null)
    setFormOpen(true)
  }

  function openEdit(row: LibraryResourceWithCourse) {
    setEditId(row.id)
    setForm({
      titleEn: row.title_en,
      titleUr: row.title_ur ?? '',
      descriptionEn: row.description_en ?? '',
      descriptionUr: row.description_ur ?? '',
      resourceType: row.resource_type,
      courseId: row.course_id ?? 'none',
      externalUrl: row.external_url ?? '',
      isPublic: row.is_public,
    })
    setFile(null)
    setFormOpen(true)
  }

  async function handleSave() {
    if (!form.titleEn.trim()) {
      toast.error(t('common.required'))
      return
    }
    if (!editId && form.resourceType !== 'link' && !file && !form.externalUrl.trim()) {
      toast.error(t('common.required'))
      return
    }
    setSaving(true)
    try {
      if (editId) {
        await updateResource(editId, {
          title_en: form.titleEn.trim(),
          title_ur: form.titleUr.trim() || null,
          description_en: form.descriptionEn.trim() || null,
          description_ur: form.descriptionUr.trim() || null,
          resource_type: form.resourceType,
          course_id: form.courseId === 'none' ? null : form.courseId,
          external_url: form.externalUrl.trim() || null,
          is_public: form.isPublic,
        })
        toast.success(t('common.successUpdated'))
      } else {
        await createResource({
          titleEn: form.titleEn.trim(),
          titleUr: form.titleUr.trim() || null,
          descriptionEn: form.descriptionEn.trim() || null,
          descriptionUr: form.descriptionUr.trim() || null,
          resourceType: form.resourceType,
          courseId: form.courseId === 'none' ? null : form.courseId,
          externalUrl: form.externalUrl.trim() || null,
          isPublic: form.isPublic,
          uploadedBy: user?.id ?? null,
          file,
        })
        toast.success(t('common.successCreated'))
      }
      setFormOpen(false)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteResource(deleteId)
      toast.success(t('common.successDeleted'))
      setDeleteId(null)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setDeleting(false)
    }
  }

  function resourceTitle(row: LibraryResourceWithCourse) {
    return locale === 'ur' && row.title_ur ? row.title_ur : row.title_en
  }

  return (
    <ModuleShell
      title={t('library.title')}
      description={t('library.subtitle')}
      loading={loading}
      error={error}
      onRetry={() => void load()}
      empty={!loading && !error && resources.length === 0}
      emptyTitle={t('library.noItems')}
      actions={
        <Button type="button" onClick={openCreate}>
          <Plus className="me-2 h-4 w-4" />
          {t('library.upload')}
        </Button>
      }
    >
      <div className="mb-4 max-w-xs">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
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

      {isMobile ? (
        <ul className="space-y-3">
          {resources.map((row) => (
            <li
              key={row.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-navy">{resourceTitle(row)}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.resource_type}
                    {row.courses
                      ? ` · ${pickCourseTitle(row.courses, locale)}`
                      : ''}
                  </p>
                </div>
                <Badge variant="secondary">{row.resource_type}</Badge>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => openEdit(row)}
                >
                  <Pencil className="me-1 h-3.5 w-3.5" />
                  {t('common.actions.edit')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleteId(row.id)}
                >
                  <Trash2 className="me-1 h-3.5 w-3.5" />
                  {t('common.actions.delete')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('common.name')}</TableHead>
              <TableHead>{t('library.resourceType')}</TableHead>
              <TableHead>{t('attendance.class')}</TableHead>
              <TableHead>{t('library.isPublic')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  {resourceTitle(row)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{row.resource_type}</Badge>
                </TableCell>
                <TableCell>
                  {row.courses
                    ? pickCourseTitle(row.courses, locale)
                    : t('common.na')}
                </TableCell>
                <TableCell>
                  {row.is_public ? t('common.actions.yes') : t('common.actions.no')}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(row)}
                    >
                      {t('common.actions.edit')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteId(row.id)}
                    >
                      {t('common.actions.delete')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editId ? t('library.editMaterial') : t('library.upload')}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>{t('library.titleEn')}</Label>
              <Input
                value={form.titleEn}
                onChange={(e) =>
                  setForm((f) => ({ ...f, titleEn: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t('library.titleUr')}</Label>
              <Input
                value={form.titleUr}
                onChange={(e) =>
                  setForm((f) => ({ ...f, titleUr: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t('library.resourceType')}</Label>
              <Select
                value={form.resourceType}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, resourceType: v as ResourceType }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('attendance.class')}</Label>
              <Select
                value={form.courseId}
                onValueChange={(v) => setForm((f) => ({ ...f, courseId: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('common.optional')}</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {pickCourseTitle(c, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('library.externalUrl')}</Label>
              <Input
                value={form.externalUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, externalUrl: e.target.value }))
                }
              />
            </div>
            {!editId ? (
              <div className="space-y-2">
                <Label>{t('common.actions.upload')}</Label>
                <FileUpload
                  accept={
                    form.resourceType === 'audio'
                      ? 'audio/*'
                      : form.resourceType === 'video'
                        ? 'video/*'
                        : '.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp'
                  }
                  onUpload={(f) => setFile(f)}
                  onRemove={() => setFile(null)}
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label>{t('common.description')}</Label>
              <Textarea
                value={form.descriptionEn}
                onChange={(e) =>
                  setForm((f) => ({ ...f, descriptionEn: e.target.value }))
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isPublic}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, isPublic: v }))
                }
              />
              <Label>{t('library.isPublic')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              {t('common.actions.cancel')}
            </Button>
            <Button type="button" disabled={saving} onClick={() => void handleSave()}>
              {saving ? t('common.pleaseWait') : t('common.actions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        destructive
        loading={deleting}
        onConfirm={() => void handleDelete()}
      />
    </ModuleShell>
  )
}
