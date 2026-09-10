import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Award, Printer, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { ModuleShell } from '@/components/shared/ModuleShell'
import {
  CertificateView,
  printCertificate,
} from '@/features/certificates/CertificateView'
import {
  getById,
  issueCertificate,
  listCertificates,
  type CertificateWithDetails,
} from '@/services/certificates'
import { listCourses, pickCourseTitle, type CourseWithTranslations } from '@/services/courses'
import { listStudents, type StudentWithProfile } from '@/services/students'
import { Button } from '@/components/ui/button'
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
import { Label } from '@/components/ui/label'
import { JAMIA_NAME } from '@/lib/constants'
import { toError } from '@/lib/errors'

export function TeacherCertificatesPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ur' ? 'ur' : 'en'
  const { user } = useAuth()
  const [items, setItems] = useState<CertificateWithDetails[]>([])
  const [courses, setCourses] = useState<CourseWithTranslations[]>([])
  const [students, setStudents] = useState<StudentWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<CertificateWithDetails | null>(null)
  const [studentId, setStudentId] = useState('')
  const [courseId, setCourseId] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [certs, c, s] = await Promise.all([
        listCertificates(),
        listCourses(),
        listStudents(),
      ])
      setItems(certs)
      setCourses(c)
      setStudents(s)
    } catch (err) {
      setError(toError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleIssue(e: FormEvent) {
    e.preventDefault()
    if (!studentId || !courseId) return
    try {
      const cert = await issueCertificate({
        studentId,
        courseId,
        issuedBy: user?.id ?? null,
      })
      toast.success(t('common.successCreated'))
      setOpen(false)
      const full = await getById(cert.id)
      setPreview(full)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.errorRetry'))
    }
  }

  return (
    <ModuleShell
      title={t('certificates.title')}
      description={t('certificates.subtitle')}
      loading={loading}
      error={error}
      onRetry={() => void load()}
      actions={
        <Button type="button" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          {t('certificates.issue')}
        </Button>
      }
      empty={!loading && !error && items.length === 0 && !preview}
      emptyTitle={t('certificates.noCertificates')}
    >
      <ul className="mb-6 divide-y divide-border rounded-xl border border-border bg-card">
        {items.map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <div>
              <p className="font-medium text-navy">
                {c.profiles?.full_name || c.student_id.slice(0, 8)}
              </p>
              <p className="text-xs text-muted-foreground">
                {c.courses
                  ? pickCourseTitle(
                      {
                        ...c.courses,
                        course_translations: c.courses.course_translations ?? [],
                      },
                      locale,
                    )
                  : c.course_id}
                {' · '}
                {c.certificate_number}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  c.status === 'issued'
                    ? 'success'
                    : c.status === 'revoked'
                      ? 'destructive'
                      : 'secondary'
                }
              >
                {c.status}
              </Badge>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPreview(c)}
              >
                <Award className="h-4 w-4" />
                {t('certificates.view')}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {preview ? (
        <div className="space-y-3">
          <div className="no-print flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => printCertificate()}
            >
              <Printer className="h-4 w-4" />
              {t('certificates.print')}
            </Button>
          </div>
          <CertificateView
            certificate={preview}
            locale={locale}
            jamiaName={JAMIA_NAME}
          />
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('certificates.issue')}</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={(e) => void handleIssue(e)}>
            <div className="space-y-1.5">
              <Label>Student</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.profile_id} value={s.profile_id}>
                      {s.profiles?.full_name || s.profile_id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Course</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {pickCourseTitle(c, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!studentId || !courseId}>
                {t('certificates.issue')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ModuleShell>
  )
}

export function StudentCertificatesPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ur' ? 'ur' : 'en'
  const { user } = useAuth()
  const [items, setItems] = useState<CertificateWithDetails[]>([])
  const [selected, setSelected] = useState<CertificateWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const data = await listCertificates({ studentId: user.id })
      setItems(data)
      if (data[0]) setSelected(data[0])
    } catch (err) {
      setError(toError(err))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <ModuleShell
      title={t('certificates.title')}
      description={t('certificates.subtitle')}
      loading={loading}
      error={error}
      onRetry={() => void load()}
      empty={!loading && !error && items.length === 0}
      emptyTitle={t('certificates.noCertificates')}
    >
      <ul className="mb-6 flex flex-wrap gap-2">
        {items.map((c) => (
          <li key={c.id}>
            <Button
              type="button"
              size="sm"
              variant={selected?.id === c.id ? 'default' : 'outline'}
              onClick={() => setSelected(c)}
            >
              {c.courses
                ? pickCourseTitle(
                    {
                      ...c.courses,
                      course_translations:
                        c.courses.course_translations ?? [],
                    },
                    locale,
                  )
                : c.certificate_number}
            </Button>
          </li>
        ))}
      </ul>

      {selected ? (
        <div className="space-y-3">
          <div className="no-print flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => printCertificate()}
            >
              <Printer className="h-4 w-4" />
              {t('certificates.print')}
            </Button>
          </div>
          <CertificateView
            certificate={selected}
            locale={locale}
            jamiaName={JAMIA_NAME}
          />
        </div>
      ) : null}
    </ModuleShell>
  )
}
