import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Award,
  BookOpen,
  GraduationCap,
  Users,
  UserCheck,
} from 'lucide-react'
import { ModuleShell } from '@/components/shared/ModuleShell'
import { StatCard } from '@/components/shared/StatCard'
import { listStudents } from '@/services/students'
import { listCourses } from '@/services/courses'
import { listEnrollments } from '@/services/enrollments'
import { listCertificates } from '@/services/certificates'
import { isDemoAuthMode } from '@/lib/demoAuth'
import { demoCountTeachers } from '@/lib/demoStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { toError } from '@/lib/errors'

export function AdminDashboardPage() {
  const { t } = useTranslation()
  const [students, setStudents] = useState(0)
  const [teachers, setTeachers] = useState(0)
  const [courses, setCourses] = useState(0)
  const [enrollments, setEnrollments] = useState(0)
  const [certificates, setCertificates] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [studentRows, courseRows, enrollmentRows, certRows] =
        await Promise.all([
          listStudents(),
          listCourses(),
          listEnrollments(),
          listCertificates(),
        ])

      let teacherCount = 0
      if (isDemoAuthMode()) {
        teacherCount = demoCountTeachers()
      } else {
        const teacherRoles = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'teacher')
        if (teacherRoles.error) throw teacherRoles.error
        teacherCount = new Set(
          (teacherRoles.data ?? []).map((r) => r.user_id),
        ).size
      }

      setStudents(studentRows.length)
      setTeachers(teacherCount)
      setCourses(courseRows.length)
      setEnrollments(enrollmentRows.length)
      setCertificates(certRows.filter((c) => c.status === 'issued').length)
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
      title={t('dashboard.adminTitle')}
      description={t('dashboard.adminSubtitle')}
      loading={loading}
      error={error}
      onRetry={() => void load()}
    >
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title={t('dashboard.totalStudents')}
          value={students}
          icon={GraduationCap}
        />
        <StatCard
          title={t('dashboard.totalTeachers')}
          value={teachers}
          icon={UserCheck}
        />
        <StatCard
          title={t('dashboard.activeCourses')}
          value={courses}
          icon={BookOpen}
        />
        <StatCard
          title={t('admin.enrollments')}
          value={enrollments}
          icon={Users}
        />
        <StatCard
          title={t('nav.certificates')}
          value={certificates}
          icon={Award}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link to="/admin/users">{t('admin.users')}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/admin/courses">{t('nav.courses')}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/admin/quran">{t('admin.quranImport')}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/teacher">{t('nav.teacher')}</Link>
        </Button>
      </div>
    </ModuleShell>
  )
}
