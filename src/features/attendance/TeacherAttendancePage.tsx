import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ModuleShell } from '@/components/shared/ModuleShell'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  createSession,
  listSessions,
  markRecords,
  updateRecord,
  type AttendanceSessionDetail,
  type MarkRecordInput,
} from '@/services/attendance'
import {
  listCourses,
  pickCourseTitle,
  type CourseWithTranslations,
} from '@/services/courses'
import { listEnrollments } from '@/services/enrollments'
import { listStudents, type StudentWithProfile } from '@/services/students'
import type { AttendanceStatus } from '@/types/database'
import { toError } from '@/lib/errors'

const STATUSES: AttendanceStatus[] = [
  'present',
  'absent',
  'late',
  'excused',
]

type DraftMap = Record<string, AttendanceStatus>

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

export function TeacherAttendancePage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ur' ? 'ur' : 'en'
  const { user } = useAuth()
  const isMobile = useMediaQuery('(max-width: 768px)')

  const [courses, setCourses] = useState<CourseWithTranslations[]>([])
  const [students, setStudents] = useState<StudentWithProfile[]>([])
  const [sessions, setSessions] = useState<AttendanceSessionDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const [filterCourse, setFilterCourse] = useState<string>('all')
  const [filterDate, setFilterDate] = useState('')
  const [filterStudent, setFilterStudent] = useState<string>('all')

  const [markOpen, setMarkOpen] = useState(false)
  const [markCourseId, setMarkCourseId] = useState('')
  const [markDate, setMarkDate] = useState(todayIsoDate())
  const [markTitle, setMarkTitle] = useState('')
  const [enrolledIds, setEnrolledIds] = useState<string[]>([])
  const [draft, setDraft] = useState<DraftMap>({})
  const [saving, setSaving] = useState(false)
  const [loadingRoster, setLoadingRoster] = useState(false)

  const [editRecordId, setEditRecordId] = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('present')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [courseList, studentList, sessionList] = await Promise.all([
        listCourses(),
        listStudents(),
        listSessions({
          courseId: filterCourse === 'all' ? undefined : filterCourse,
          dateFrom: filterDate || undefined,
          dateTo: filterDate || undefined,
          studentId: filterStudent === 'all' ? undefined : filterStudent,
        }),
      ])
      setCourses(courseList)
      setStudents(studentList)
      setSessions(sessionList)
    } catch (err) {
      setError(toError(err))
    } finally {
      setLoading(false)
    }
  }, [filterCourse, filterDate, filterStudent])

  useEffect(() => {
    void load()
  }, [load])

  const studentNameByProfileId = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of students) {
      map.set(s.profile_id, s.profiles?.full_name || t('common.unknown'))
    }
    return map
  }, [students, t])

  async function openMarkDialog() {
    setMarkCourseId(courses[0]?.id ?? '')
    setMarkDate(todayIsoDate())
    setMarkTitle('')
    setDraft({})
    setEnrolledIds([])
    setMarkOpen(true)
  }

  useEffect(() => {
    if (!markOpen || !markCourseId) return
    let cancelled = false
    setLoadingRoster(true)
    void listEnrollments({ courseId: markCourseId, status: 'active' })
      .then((enrollments) => {
        if (cancelled) return
        const ids = enrollments.map((e) => e.student_id)
        setEnrolledIds(ids)
        const next: DraftMap = {}
        for (const id of ids) next[id] = 'present'
        setDraft(next)
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (!cancelled) setLoadingRoster(false)
      })
    return () => {
      cancelled = true
    }
  }, [markOpen, markCourseId])

  async function saveAttendance() {
    if (!markCourseId) {
      toast.error(t('attendance.filterByClass'))
      return
    }
    setSaving(true)
    try {
      const session = await createSession({
        courseId: markCourseId,
        teacherId: user?.id ?? null,
        sessionDate: markDate,
        title: markTitle.trim() || null,
      })
      const records: MarkRecordInput[] = Object.entries(draft).map(
        ([studentId, status]) => ({ studentId, status }),
      )
      await markRecords(session.id, records, user?.id ?? null)
      toast.success(t('attendance.saved'))
      setMarkOpen(false)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  function markAllPresent() {
    setDraft((prev) => {
      const next: DraftMap = {}
      for (const id of Object.keys(prev)) next[id] = 'present'
      return next
    })
  }

  async function saveEdit() {
    if (!editRecordId) return
    try {
      await updateRecord(editRecordId, {
        status: editStatus,
        marked_by: user?.id ?? null,
      })
      toast.success(t('common.successUpdated'))
      setEditRecordId(null)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  const flatRows = useMemo(() => {
    const rows: Array<{
      key: string
      sessionId: string
      recordId: string
      date: string
      title: string | null
      courseTitle: string
      studentName: string
      status: AttendanceStatus
    }> = []
    for (const session of sessions) {
      const courseTitle = session.courses
        ? pickCourseTitle(session.courses, locale)
        : t('common.na')
      for (const rec of session.attendance_records) {
        rows.push({
          key: rec.id,
          sessionId: session.id,
          recordId: rec.id,
          date: session.session_date,
          title: session.title,
          courseTitle,
          studentName:
            rec.profiles?.full_name ||
            studentNameByProfileId.get(rec.student_id) ||
            t('common.unknown'),
          status: rec.status,
        })
      }
    }
    return rows
  }, [sessions, locale, studentNameByProfileId, t])

  return (
    <ModuleShell
      title={t('attendance.title')}
      description={t('attendance.subtitle')}
      loading={loading}
      error={error}
      onRetry={() => void load()}
      empty={false}
      emptyTitle={t('attendance.noRecords')}
      emptyDescription={t('attendance.subtitle')}
      actions={
        <Button type="button" onClick={() => void openMarkDialog()}>
          <Plus className="me-2 h-4 w-4" />
          {t('attendance.newSession')}
        </Button>
      }
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Select value={filterCourse} onValueChange={setFilterCourse}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t('attendance.filterByClass')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('library.all')}</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {pickCourseTitle(c, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-full sm:w-44"
          aria-label={t('attendance.date')}
        />
        <Select value={filterStudent} onValueChange={setFilterStudent}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder={t('attendance.student')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('library.all')}</SelectItem>
            {students.map((s) => (
              <SelectItem key={s.profile_id} value={s.profile_id}>
                {s.profiles?.full_name || t('common.unknown')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(filterCourse !== 'all' || filterDate || filterStudent !== 'all') && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFilterCourse('all')
              setFilterDate('')
              setFilterStudent('all')
            }}
          >
            {t('common.actions.clearFilters')}
          </Button>
        )}
      </div>

      {flatRows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('attendance.noRecords')}</p>
      ) : isMobile ? (
        <ul className="space-y-3">
          {flatRows.map((row) => (
            <li
              key={row.key}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-navy">{row.studentName}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.courseTitle} · {row.date}
                  </p>
                  {row.title ? (
                    <p className="text-xs text-muted-foreground">{row.title}</p>
                  ) : null}
                </div>
                <StatusBadge status={row.status} />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setEditRecordId(row.recordId)
                  setEditStatus(row.status)
                }}
              >
                {t('common.actions.edit')}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('attendance.date')}</TableHead>
              <TableHead>{t('attendance.class')}</TableHead>
              <TableHead>{t('attendance.student')}</TableHead>
              <TableHead>{t('attendance.session')}</TableHead>
              <TableHead>{t('attendance.status')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {flatRows.map((row) => (
              <TableRow key={row.key}>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.courseTitle}</TableCell>
                <TableCell>{row.studentName}</TableCell>
                <TableCell>{row.title || t('common.na')}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditRecordId(row.recordId)
                      setEditStatus(row.status)
                    }}
                  >
                    {t('common.actions.edit')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={markOpen} onOpenChange={setMarkOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('attendance.save')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('attendance.class')}</Label>
              <Select value={markCourseId} onValueChange={setMarkCourseId}>
                <SelectTrigger>
                  <SelectValue />
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
            <div className="space-y-2">
              <Label>{t('attendance.date')}</Label>
              <Input
                type="date"
                value={markDate}
                onChange={(e) => setMarkDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t('attendance.session')}</Label>
              <Input
                value={markTitle}
                onChange={(e) => setMarkTitle(e.target.value)}
                placeholder={t('live.topic')}
              />
            </div>
          </div>

          <div className="mt-2 flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={markAllPresent}>
              {t('attendance.bulkMark')}
            </Button>
          </div>

          {loadingRoster ? (
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : enrolledIds.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
          ) : (
            <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto">
              {enrolledIds.map((id) => (
                <li
                  key={id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                >
                  <span className="text-sm font-medium">
                    {studentNameByProfileId.get(id) || t('common.unknown')}
                  </span>
                  <Select
                    value={draft[id] ?? 'present'}
                    onValueChange={(v) =>
                      setDraft((prev) => ({
                        ...prev,
                        [id]: v as AttendanceStatus,
                      }))
                    }
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {t(`attendance.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </li>
              ))}
            </ul>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMarkOpen(false)}>
              {t('common.actions.cancel')}
            </Button>
            <Button type="button" disabled={saving} onClick={() => void saveAttendance()}>
              {saving ? t('common.pleaseWait') : t('attendance.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editRecordId)}
        onOpenChange={(open) => !open && setEditRecordId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.actions.edit')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{t('attendance.student')}</Label>
            <Select
              value={editStatus}
              onValueChange={(v) => setEditStatus(v as AttendanceStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`attendance.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditRecordId(null)}>
              {t('common.actions.cancel')}
            </Button>
            <Button type="button" onClick={() => void saveEdit()}>
              {t('common.actions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleShell>
  )
}
