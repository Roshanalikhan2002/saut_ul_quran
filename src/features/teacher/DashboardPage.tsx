import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { listCourses } from '@/services/courses'
import { listStudents } from '@/services/students'
import { listResults } from '@/services/tests'
import { ModuleShell } from '@/components/shared/ModuleShell'
import { StatCard } from '@/components/shared/StatCard'
import { BookOpen, ClipboardList, GraduationCap, Users } from 'lucide-react'
import { toError } from '@/lib/errors'

export function TeacherDashboardPage() {
  const { t } = useTranslation()
  const { profile, primaryRole } = useAuth()
  const [courseCount, setCourseCount] = useState(0)
  const [studentCount, setStudentCount] = useState(0)
  const [submissionCount, setSubmissionCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [courses, students, results] = await Promise.all([
        listCourses(),
        listStudents(),
        listResults(),
      ])
      setCourseCount(courses.length)
      setStudentCount(students.length)
      setSubmissionCount(results.length)
    } catch (err) {
      setError(toError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const title =
    primaryRole === 'admin'
      ? t('dashboard.adminTitle')
      : t('dashboard.teacherTitle')
  const subtitle =
    primaryRole === 'admin'
      ? t('dashboard.adminSubtitle')
      : t('dashboard.teacherSubtitle')

  return (
    <ModuleShell
      title={title}
      description={subtitle}
      loading={loading}
      error={error}
      onRetry={() => void load()}
    >
      <p className="mb-6 text-muted-foreground">
        {t('dashboard.welcome', {
          name: profile?.full_name || t('dashboard.welcomeGuest'),
        })}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('dashboard.activeCourses')}
          value={courseCount}
          icon={BookOpen}
        />
        <StatCard
          title={t('dashboard.totalStudents')}
          value={studentCount}
          icon={GraduationCap}
        />
        <StatCard
          title={t('tests.results')}
          value={submissionCount}
          icon={ClipboardList}
        />
        <StatCard
          title={t('dashboard.overview')}
          value={t(`roles.${primaryRole ?? 'teacher'}`)}
          icon={Users}
        />
      </div>
    </ModuleShell>
  )
}
