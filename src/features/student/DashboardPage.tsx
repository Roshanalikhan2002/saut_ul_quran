import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Bell,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Flame,
  Medal,
  Video,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { listEnrollments, type EnrollmentWithCourse } from '@/services/enrollments'
import { pickCourseTitle } from '@/services/courses'
import { countPendingAssignments } from '@/services/tests'
import { getPointsTotal } from '@/services/gamification'
import { getAttendancePercentage } from '@/services/attendance'
import { listUpcoming } from '@/services/liveClasses'
import { unreadCount } from '@/services/notifications'
import { ModuleShell } from '@/components/shared/ModuleShell'
import { StatCard } from '@/components/shared/StatCard'
import { StudentGamification } from '@/features/gamification/StudentGamification'
import { Button } from '@/components/ui/button'
import { toError } from '@/lib/errors'

export function StudentDashboardPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ur' ? 'ur' : 'en'
  const { user, profile } = useAuth()
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([])
  const [pendingTests, setPendingTests] = useState(0)
  const [points, setPoints] = useState(0)
  const [attendancePct, setAttendancePct] = useState<number | null>(null)
  const [upcomingLive, setUpcomingLive] = useState(0)
  const [notifUnread, setNotifUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const [data, pending, pts, attendance, live, unread] = await Promise.all([
        listEnrollments({ studentId: user.id }),
        countPendingAssignments(user.id),
        getPointsTotal(user.id).catch(() => 0),
        getAttendancePercentage(user.id).catch(() => null),
        listUpcoming({ limit: 5 }).catch(() => []),
        unreadCount(user.id).catch(() => 0),
      ])
      setEnrollments(data)
      setPendingTests(pending)
      setPoints(pts)
      setAttendancePct(attendance?.percentage ?? null)
      setUpcomingLive(live.length)
      setNotifUnread(unread)
    } catch (err) {
      setError(toError(err))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  const active = enrollments.filter((e) => e.status === 'active').length

  return (
    <ModuleShell
      title={t('dashboard.studentTitle')}
      description={t('dashboard.studentSubtitle')}
      loading={loading}
      error={error}
      onRetry={() => void load()}
    >
      <p className="mb-6 text-muted-foreground">
        {t('dashboard.welcome', {
          name: profile?.full_name || t('dashboard.welcomeGuest'),
        })}
      </p>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title={t('dashboard.enrolledCourses')}
          value={enrollments.length}
          icon={BookOpen}
        />
        <StatCard
          title={t('common.status.active')}
          value={active}
          icon={Flame}
        />
        <StatCard
          title={t('dashboard.pendingTests')}
          value={pendingTests}
          icon={ClipboardList}
        />
        <StatCard
          title={t('gamification.points')}
          value={points}
          icon={Medal}
        />
        <StatCard
          title={t('dashboard.attendanceRate')}
          value={attendancePct == null ? '—' : `${attendancePct}%`}
          icon={CalendarCheck}
        />
      </div>

      <div className="mb-8">
        <h2 className="mb-3 font-display text-lg font-semibold text-navy">
          {t('dashboard.quickActions')}
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/student/tests">
              <ClipboardList className="h-4 w-4" />
              {t('dashboard.pendingTests')}
              {pendingTests > 0 ? ` (${pendingTests})` : ''}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/student/live-classes">
              <Video className="h-4 w-4" />
              {t('nav.live')}
              {upcomingLive > 0 ? ` (${upcomingLive})` : ''}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/student/notifications">
              <Bell className="h-4 w-4" />
              {t('nav.notifications')}
              {notifUnread > 0 ? ` (${notifUnread})` : ''}
            </Link>
          </Button>
        </div>
      </div>

      {user ? (
        <div className="mb-8 max-w-xl">
          <h2 className="mb-3 font-display text-lg font-semibold text-navy">
            {t('gamification.title')}
          </h2>
          <StudentGamification studentId={user.id} compact />
        </div>
      ) : null}

      <h2 className="mb-3 font-display text-lg font-semibold text-navy">
        {t('courses.myCourses')}
      </h2>
      {enrollments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('courses.noCourses')}</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {enrollments.map((enrollment) => (
            <li key={enrollment.id}>
              <Link
                to={`/student/courses/${enrollment.course_id}`}
                className="block px-4 py-3 transition-colors hover:bg-surface/80"
              >
                <p className="font-medium text-navy">
                  {enrollment.courses
                    ? pickCourseTitle(
                        {
                          ...enrollment.courses,
                          course_translations:
                            enrollment.courses.course_translations ?? [],
                        },
                        locale,
                      )
                    : enrollment.course_id}
                </p>
                <p className="text-xs capitalize text-muted-foreground">
                  {enrollment.status}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ModuleShell>
  )
}
