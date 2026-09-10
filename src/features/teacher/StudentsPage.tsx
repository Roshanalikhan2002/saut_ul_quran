import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Medal, UserPlus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { listStudents, type StudentWithProfile } from '@/services/students'
import {
  listCourses,
  pickCourseTitle,
  type CourseWithTranslations,
} from '@/services/courses'
import { createEnrollment, listEnrollments } from '@/services/enrollments'
import {
  awardBadge,
  awardPoints,
  listBadges,
  type Badge,
} from '@/services/gamification'
import { ModuleShell } from '@/components/shared/ModuleShell'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { toError } from '@/lib/errors'

export function TeacherStudentsPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ur' ? 'ur' : 'en'
  const { user } = useAuth()
  const [students, setStudents] = useState<StudentWithProfile[]>([])
  const [courses, setCourses] = useState<CourseWithTranslations[]>([])
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [awardOpen, setAwardOpen] = useState(false)
  const [studentProfileId, setStudentProfileId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [saving, setSaving] = useState(false)

  const [awardStudentId, setAwardStudentId] = useState('')
  const [awardPointsValue, setAwardPointsValue] = useState('10')
  const [awardReason, setAwardReason] = useState('')
  const [awardBadgeId, setAwardBadgeId] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [s, c, b] = await Promise.all([
        listStudents(),
        listCourses(),
        listBadges().catch(() => [] as Badge[]),
      ])
      setStudents(s)
      setCourses(c)
      setBadges(b)
    } catch (err) {
      setError(toError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleEnroll(e: FormEvent) {
    e.preventDefault()
    if (!studentProfileId || !courseId) return
    setSaving(true)
    try {
      const existing = await listEnrollments({
        studentId: studentProfileId,
        courseId,
      })
      if (existing.length > 0) {
        toast.error(t('courses.alreadyEnrolled'))
        return
      }
      await createEnrollment({
        student_id: studentProfileId,
        course_id: courseId,
        status: 'active',
        enrolled_by: user?.id ?? null,
      })
      toast.success(t('courses.enrollmentSuccess'))
      setEnrollOpen(false)
      setStudentProfileId('')
      setCourseId('')
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('courses.enrollmentError'),
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleAward(e: FormEvent) {
    e.preventDefault()
    if (!awardStudentId) return
    const points = Number(awardPointsValue)
    setSaving(true)
    try {
      if (Number.isFinite(points) && points !== 0 && awardReason.trim()) {
        await awardPoints({
          studentId: awardStudentId,
          points,
          reason: awardReason.trim(),
          createdBy: user?.id ?? null,
        })
      }
      if (awardBadgeId) {
        await awardBadge({
          studentId: awardStudentId,
          badgeId: awardBadgeId,
          awardedBy: user?.id ?? null,
        })
      }
      if (
        !(Number.isFinite(points) && points !== 0 && awardReason.trim()) &&
        !awardBadgeId
      ) {
        toast.error(t('gamification.awardNeedInput'))
        return
      }
      toast.success(t('gamification.awardSuccess'))
      setAwardOpen(false)
      setAwardPointsValue('10')
      setAwardReason('')
      setAwardBadgeId('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.errorRetry'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModuleShell
      title={t('nav.students')}
      description={t('dashboard.teacherSubtitle')}
      loading={loading}
      error={error}
      onRetry={() => void load()}
      empty={!loading && !error && students.length === 0}
      emptyTitle={t('common.noData')}
      emptyDescription={t('auth.studentsGetCredentials')}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setAwardOpen(true)}
          >
            <Medal className="h-4 w-4" />
            {t('gamification.award')}
          </Button>
          <Button type="button" onClick={() => setEnrollOpen(true)}>
            <UserPlus className="h-4 w-4" />
            {t('courses.enrollStudent')}
          </Button>
        </div>
      }
    >
      <p className="mb-4 rounded-lg border border-border bg-surface/60 px-4 py-3 text-sm text-muted-foreground">
        {t('auth.studentsGetCredentials')}
      </p>

      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {students.map((student) => {
          const name = student.profiles?.full_name || t('common.unknown')
          const initials = name
            .split(' ')
            .map((p) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()
          return (
            <li
              key={student.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-9 w-9">
                  {student.profiles?.avatar_url ? (
                    <AvatarImage src={student.profiles.avatar_url} alt="" />
                  ) : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium text-navy">{name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {student.profiles?.email ||
                      student.student_code ||
                      student.id.slice(0, 8)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setAwardStudentId(student.profile_id)
                    setAwardOpen(true)
                  }}
                >
                  <Medal className="h-4 w-4" />
                  {t('gamification.award')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setStudentProfileId(student.profile_id)
                    setEnrollOpen(true)
                  }}
                >
                  {t('courses.enroll')}
                </Button>
              </div>
            </li>
          )
        })}
      </ul>

      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('courses.enrollStudent')}</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={(e) => void handleEnroll(e)}>
            <div className="space-y-1.5">
              <Label>{t('nav.students')}</Label>
              <Select
                value={studentProfileId}
                onValueChange={setStudentProfileId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('common.actions.select')} />
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
              <Label>{t('nav.courses')}</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('common.actions.select')} />
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
            <p className="text-xs text-muted-foreground">
              {t('auth.studentsGetCredentials')}
            </p>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEnrollOpen(false)}
              >
                {t('common.actions.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={saving || !studentProfileId || !courseId}
              >
                {t('courses.enroll')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={awardOpen} onOpenChange={setAwardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('gamification.award')}</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={(e) => void handleAward(e)}>
            <div className="space-y-1.5">
              <Label>{t('nav.students')}</Label>
              <Select value={awardStudentId} onValueChange={setAwardStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('common.actions.select')} />
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
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="award-points">{t('gamification.points')}</Label>
                <Input
                  id="award-points"
                  type="number"
                  value={awardPointsValue}
                  onChange={(e) => setAwardPointsValue(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('gamification.badges')}</Label>
                <Select
                  value={awardBadgeId || undefined}
                  onValueChange={setAwardBadgeId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.optional')} />
                  </SelectTrigger>
                  <SelectContent>
                    {badges.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {locale === 'ur'
                          ? b.name_ur || b.name_en
                          : b.name_en || b.name_ur}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="award-reason">{t('gamification.reason')}</Label>
              <Input
                id="award-reason"
                value={awardReason}
                onChange={(e) => setAwardReason(e.target.value)}
                placeholder={t('gamification.reasonPlaceholder')}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAwardOpen(false)}
              >
                {t('common.actions.cancel')}
              </Button>
              <Button type="submit" disabled={saving || !awardStudentId}>
                {t('gamification.award')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ModuleShell>
  )
}
