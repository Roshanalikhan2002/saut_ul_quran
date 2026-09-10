import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import {
  deleteDua,
  getDuaAudioUrl,
  listDuas,
  upsertDua,
  type DailyDua,
} from '@/services/duas'
import { toError } from '@/lib/errors'

const emptyForm = {
  titleEn: '',
  titleUr: '',
  arabicText: '',
  transliteration: '',
  translationEn: '',
  translationUr: '',
  category: '',
  sortOrder: 0,
  isPublished: true,
  slug: '',
}

export function TeacherDuasPage() {
  const { t } = useTranslation()
  const isMobile = useMediaQuery('(max-width: 768px)')

  const [duas, setDuas] = useState<DailyDua[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setDuas(await listDuas())
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
    setEditId(null)
    setForm(emptyForm)
    setAudioFile(null)
    setFormOpen(true)
  }

  function openEdit(dua: DailyDua) {
    setEditId(dua.id)
    setForm({
      titleEn: dua.title_en,
      titleUr: dua.title_ur ?? '',
      arabicText: dua.arabic_text,
      transliteration: dua.transliteration ?? '',
      translationEn: dua.translation_en ?? '',
      translationUr: dua.translation_ur ?? '',
      category: dua.category ?? '',
      sortOrder: dua.sort_order,
      isPublished: dua.is_published,
      slug: dua.slug ?? '',
    })
    setAudioFile(null)
    setFormOpen(true)
  }

  async function handleSave() {
    if (!form.titleEn.trim() || !form.arabicText.trim()) {
      toast.error(t('common.required'))
      return
    }
    setSaving(true)
    try {
      await upsertDua({
        id: editId ?? undefined,
        slug: form.slug.trim() || null,
        titleEn: form.titleEn.trim(),
        titleUr: form.titleUr.trim() || null,
        arabicText: form.arabicText.trim(),
        transliteration: form.transliteration.trim() || null,
        translationEn: form.translationEn.trim() || null,
        translationUr: form.translationUr.trim() || null,
        category: form.category.trim() || null,
        sortOrder: form.sortOrder,
        isPublished: form.isPublished,
        audioFile,
      })
      toast.success(
        editId ? t('common.successUpdated') : t('common.successCreated'),
      )
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
      await deleteDua(deleteId)
      toast.success(t('common.successDeleted'))
      setDeleteId(null)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <ModuleShell
      title={t('duas.title')}
      description={t('duas.subtitle')}
      loading={loading}
      error={error}
      onRetry={() => void load()}
      empty={!loading && !error && duas.length === 0}
      emptyTitle={t('duas.noDuas')}
      actions={
        <Button type="button" onClick={openCreate}>
          <Plus className="me-2 h-4 w-4" />
          {t('duas.create')}
        </Button>
      }
    >
      {isMobile ? (
        <ul className="space-y-3">
          {duas.map((dua) => (
            <li
              key={dua.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-navy">{dua.title_en}</p>
                  {dua.title_ur ? (
                    <p className="text-sm text-muted-foreground" dir="rtl">
                      {dua.title_ur}
                    </p>
                  ) : null}
                  <p className="mt-1 font-arabic text-lg" dir="rtl">
                    {dua.arabic_text.slice(0, 80)}
                    {dua.arabic_text.length > 80 ? '…' : ''}
                  </p>
                </div>
                {dua.category ? (
                  <Badge variant="secondary">{dua.category}</Badge>
                ) : null}
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => openEdit(dua)}
                >
                  <Pencil className="me-1 h-3.5 w-3.5" />
                  {t('common.actions.edit')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleteId(dua.id)}
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
              <TableHead>{t('duas.titleEn')}</TableHead>
              <TableHead>{t('duas.category')}</TableHead>
              <TableHead>{t('duas.publish')}</TableHead>
              <TableHead>{t('duas.audio')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {duas.map((dua) => (
              <TableRow key={dua.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{dua.title_en}</p>
                    {dua.title_ur ? (
                      <p className="text-xs text-muted-foreground" dir="rtl">
                        {dua.title_ur}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>{dua.category || t('common.na')}</TableCell>
                <TableCell>
                  {dua.is_published
                    ? t('common.actions.yes')
                    : t('common.actions.no')}
                </TableCell>
                <TableCell>
                  {getDuaAudioUrl(dua) ? t('common.actions.yes') : t('common.na')}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(dua)}
                    >
                      {t('common.actions.edit')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteId(dua.id)}
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
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editId ? t('duas.edit') : t('duas.create')}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('duas.titleEn')}</Label>
              <Input
                value={form.titleEn}
                onChange={(e) =>
                  setForm((f) => ({ ...f, titleEn: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t('duas.titleUr')}</Label>
              <Input
                value={form.titleUr}
                onChange={(e) =>
                  setForm((f) => ({ ...f, titleUr: e.target.value }))
                }
                dir="rtl"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t('duas.arabic')}</Label>
              <Textarea
                value={form.arabicText}
                onChange={(e) =>
                  setForm((f) => ({ ...f, arabicText: e.target.value }))
                }
                dir="rtl"
                className="font-arabic text-lg"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t('duas.transliteration')}</Label>
              <Input
                value={form.transliteration}
                onChange={(e) =>
                  setForm((f) => ({ ...f, transliteration: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t('duas.translationEn')}</Label>
              <Textarea
                value={form.translationEn}
                onChange={(e) =>
                  setForm((f) => ({ ...f, translationEn: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t('duas.translationUr')}</Label>
              <Textarea
                value={form.translationUr}
                onChange={(e) =>
                  setForm((f) => ({ ...f, translationUr: e.target.value }))
                }
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('duas.category')}</Label>
              <Input
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                placeholder="morning, evening, ..."
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t('duas.audio')}</Label>
              <FileUpload
                accept="audio/mpeg,audio/mp4,audio/wav,audio/ogg"
                onUpload={(f) => setAudioFile(f)}
                onRemove={() => setAudioFile(null)}
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Switch
                checked={form.isPublished}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, isPublished: v }))
                }
              />
              <Label>{t('duas.publish')}</Label>
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
