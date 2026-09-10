import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { listEnrollments, type EnrollmentWithCourse } from '@/services/enrollments'
import { pickCourseTitle } from '@/services/courses'
import { ModuleShell } from '@/components/shared/ModuleShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toError } from '@/lib/errors'

export function StudentCoursesPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ur' ? 'ur' : 'en'
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      setEnrollments(await listEnrollments({ studentId: user.id }))
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
      title={t('courses.myCourses')}
      description={t('courses.subtitle')}
      loading={loading}
      error={error}
      onRetry={() => void load()}
      empty={!loading && !error && enrollments.length === 0}
      emptyTitle={t('courses.noCourses')}
    >
      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {enrollments.map((enrollment) => (
          <li
            key={enrollment.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"
          >
            <div className="min-w-0">
              <Link
                to={`/student/courses/${enrollment.course_id}`}
                className="font-medium text-navy hover:underline"
              >
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
              </Link>
              <p className="text-xs text-muted-foreground">
                {new Date(enrollment.enrolled_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{enrollment.status}</Badge>
              <Button type="button" size="sm" asChild>
                <Link to={`/student/courses/${enrollment.course_id}`}>
                  {enrollment.status === 'completed'
                    ? t('common.actions.view')
                    : t('courses.continue')}
                </Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </ModuleShell>
  )
}
