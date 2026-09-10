import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { ModuleShell } from '@/components/shared/ModuleShell'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { StatCard } from '@/components/shared/StatCard'
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
  getAttendancePercentage,
  getStudentAttendanceHistory,
  type AttendanceRecordWithSession,
} from '@/services/attendance'
import {
  listCourses,
  pickCourseTitle,
  type CourseWithTranslations,
} from '@/services/courses'
import { toError } from '@/lib/errors'

export function StudentAttendancePage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ur' ? 'ur' : 'en'
  const { user } = useAuth()
  const isMobile = useMediaQuery('(max-width: 768px)')

  const [courses, setCourses] = useState<CourseWithTranslations[]>([])
  const [courseFilter, setCourseFilter] = useState('all')
  const [history, setHistory] = useState<AttendanceRecordWithSession[]>([])
  const [stats, setStats] = useState({
    percentage: 0,
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    try {
      const courseId = courseFilter === 'all' ? undefined : courseFilter
      const [courseList, rows, pct] = await Promise.all([
        listCourses({ publishedOnly: true }),
        getStudentAttendanceHistory(user.id, { courseId }),
        getAttendancePercentage(user.id, courseId),
      ])
      setCourses(courseList)
      setHistory(rows)
      setStats(pct)
    } catch (err) {
      setError(toError(err))
    } finally {
      setLoading(false)
    }
  }, [user?.id, courseFilter])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <ModuleShell
      title={t('attendance.title')}
      description={t('attendance.history')}
      loading={loading}
      error={error}
      onRetry={() => void load()}
      empty={!loading && !error && history.length === 0}
      emptyTitle={t('attendance.noRecords')}
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('attendance.rate')}
          value={`${stats.percentage}%`}
        />
        <StatCard title={t('attendance.daysPresent')} value={stats.present} />
        <StatCard title={t('attendance.daysAbsent')} value={stats.absent} />
        <StatCard
          title={t('attendance.summary')}
          value={stats.total}
          description={`${stats.late} ${t('attendance.late')}`}
        />
      </div>

      <div className="mb-4 max-w-xs">
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger>
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
      </div>

      {isMobile ? (
        <ul className="space-y-3">
          {history.map((row) => (
            <li
              key={row.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-navy">
                    {row.attendance_sessions?.courses
                      ? pickCourseTitle(row.attendance_sessions.courses, locale)
                      : t('common.na')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.attendance_sessions?.session_date}
                    {row.attendance_sessions?.title
                      ? ` · ${row.attendance_sessions.title}`
                      : ''}
                  </p>
                </div>
                <StatusBadge status={row.status} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('attendance.date')}</TableHead>
              <TableHead>{t('attendance.class')}</TableHead>
              <TableHead>{t('attendance.session')}</TableHead>
              <TableHead>{t('attendance.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  {row.attendance_sessions?.session_date ?? t('common.na')}
                </TableCell>
                <TableCell>
                  {row.attendance_sessions?.courses
                    ? pickCourseTitle(row.attendance_sessions.courses, locale)
                    : t('common.na')}
                </TableCell>
                <TableCell>
                  {row.attendance_sessions?.title || t('common.na')}
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ModuleShell>
  )
}
