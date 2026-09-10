import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { ModuleShell } from '@/components/shared/ModuleShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { listCourses, pickCourseTitle, type CourseWithTranslations } from '@/services/courses'
import { listStudents, type StudentWithProfile } from '@/services/students'
import {
  addQuestion,
  assignTest,
  createTest,
  getTest,
  listResults,
  listTests,
  updateTest,
  type AttemptWithTest,
  type Test,
  type TestWithQuestions,
} from '@/services/tests'
import { toError } from '@/lib/errors'

export function TeacherTestsPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ur' ? 'ur' : 'en'
  const { user } = useAuth()

  const [tests, setTests] = useState<Test[]>([])
  const [courses, setCourses] = useState<CourseWithTranslations[]>([])
  const [students, setStudents] = useState<StudentWithProfile[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<TestWithQuestions | null>(null)
  const [results, setResults] = useState<AttemptWithTest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const [titleEn, setTitleEn] = useState('')
  const [titleUr, setTitleUr] = useState('')
  const [duration, setDuration] = useState('30')
  const [passing, setPassing] = useState('50')

  const [promptEn, setPromptEn] = useState('')
  const [optA, setOptA] = useState('')
  const [optB, setOptB] = useState('')
  const [optC, setOptC] = useState('')
  const [optD, setOptD] = useState('')
  const [correctIndex, setCorrectIndex] = useState('0')

  const [assignStudentId, setAssignStudentId] = useState('')
  const [assignCourseId, setAssignCourseId] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [testRows, courseRows, studentRows] = await Promise.all([
        listTests(),
        listCourses(),
        listStudents(),
      ])
      setTests(testRows)
      setCourses(courseRows)
      setStudents(studentRows)
    } catch (err) {
      setError(toError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDetail = useCallback(async (testId: string) => {
    try {
      const [test, res] = await Promise.all([
        getTest(testId),
        listResults({ testId }),
      ])
      setDetail(test)
      setResults(res)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId)
    else {
      setDetail(null)
      setResults([])
    }
  }, [selectedId, loadDetail])

  const handleCreate = async () => {
    if (!titleEn.trim()) {
      toast.error(t('tests.title'))
      return
    }
    try {
      const created = await createTest({
        titleEn: titleEn.trim(),
        titleUr: titleUr.trim() || null,
        durationMinutes: duration ? Number(duration) : null,
        passingScore: passing ? Number(passing) : 50,
        createdBy: user?.id ?? null,
        status: 'published',
        isPublished: true,
      })
      toast.success(t('tests.submitSuccess'))
      setTitleEn('')
      setTitleUr('')
      await load()
      setSelectedId(created.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  const handleAddQuestion = async () => {
    if (!selectedId || !promptEn.trim()) return
    const labels = [optA, optB, optC, optD].filter((x) => x.trim())
    if (labels.length < 2) {
      toast.error('Add at least two options')
      return
    }
    try {
      await addQuestion(selectedId, {
        promptEn: promptEn.trim(),
        sortOrder: detail?.test_questions.length ?? 0,
        options: labels.map((label, index) => ({
          labelEn: label.trim(),
          isCorrect: String(index) === correctIndex,
          sortOrder: index,
        })),
      })
      setPromptEn('')
      setOptA('')
      setOptB('')
      setOptC('')
      setOptD('')
      setCorrectIndex('0')
      toast.success(t('tests.submitSuccess'))
      await loadDetail(selectedId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  const handleAssign = async () => {
    if (!selectedId) return
    if (!assignStudentId && !assignCourseId) {
      toast.error(t('hifz.studentSelect'))
      return
    }
    try {
      await assignTest({
        testId: selectedId,
        studentId: assignStudentId || undefined,
        courseId: assignCourseId || undefined,
        assignedBy: user?.id ?? null,
      })
      toast.success(t('tests.submitSuccess'))
      setAssignStudentId('')
      setAssignCourseId('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  const togglePublish = async (test: Test) => {
    try {
      await updateTest(test.id, {
        is_published: !test.is_published,
        status: !test.is_published ? 'published' : 'draft',
      })
      await load()
      if (selectedId === test.id) await loadDetail(test.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <ModuleShell
      title={t('tests.title')}
      description={t('tests.subtitle')}
      loading={loading}
      error={error}
      onRetry={() => void load()}
    >
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">{t('tests.upcoming')}</TabsTrigger>
          <TabsTrigger value="create">{t('common.actions.create')}</TabsTrigger>
          <TabsTrigger value="detail" disabled={!selectedId}>
            {t('tests.question')}
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!selectedId}>
            {t('tests.results')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-3">
          {tests.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('tests.noTests')}</p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {tests.map((test) => (
                <li
                  key={test.id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <button
                    type="button"
                    className="text-start"
                    onClick={() => setSelectedId(test.id)}
                  >
                    <p className="font-medium text-navy">{test.title_en}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('tests.duration')}:{' '}
                      {test.duration_minutes
                        ? t('tests.minutes', { count: test.duration_minutes })
                        : '—'}{' '}
                      · {t('tests.passMark')}: {test.passing_score}%
                    </p>
                  </button>
                  <div className="flex items-center gap-2">
                    <Badge variant={test.is_published ? 'success' : 'outline'}>
                      {test.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void togglePublish(test)}
                    >
                      {test.is_published ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button size="sm" onClick={() => setSelectedId(test.id)}>
                      {t('common.actions.edit')}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="create">
          <div className="grid max-w-xl gap-4 rounded-xl border border-border bg-card p-4">
            <div className="space-y-2">
              <Label>Title (EN)</Label>
              <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Title (UR)</Label>
              <Input value={titleUr} onChange={(e) => setTitleUr(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('tests.duration')}</Label>
                <Input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('tests.passMark')}</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={passing}
                  onChange={(e) => setPassing(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={() => void handleCreate()}>
              {t('common.actions.create')}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="detail" className="space-y-6">
          {detail ? (
            <>
              <div>
                <h2 className="font-display text-lg font-semibold text-navy">
                  {detail.title_en}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {detail.test_questions.length} {t('tests.question').toLowerCase()}s
                </p>
              </div>

              <ul className="space-y-3">
                {detail.test_questions.map((q, index) => (
                  <li
                    key={q.id}
                    className="rounded-xl border border-border bg-card p-4 text-sm"
                  >
                    <p className="font-medium text-navy">
                      {index + 1}. {q.prompt_en}
                    </p>
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                      {q.test_options.map((opt) => (
                        <li key={opt.id} className="flex items-center gap-2">
                          <Checkbox checked={opt.is_correct} disabled />
                          {opt.label_en}
                          {opt.is_correct ? (
                            <Badge variant="success">{t('tests.correct')}</Badge>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>

              <div className="grid max-w-xl gap-3 rounded-xl border border-border bg-card p-4">
                <h3 className="font-medium text-navy">{t('tests.question')}</h3>
                <Textarea
                  value={promptEn}
                  onChange={(e) => setPromptEn(e.target.value)}
                  placeholder={t('tests.question')}
                />
                <Input
                  value={optA}
                  onChange={(e) => setOptA(e.target.value)}
                  placeholder="Option A"
                />
                <Input
                  value={optB}
                  onChange={(e) => setOptB(e.target.value)}
                  placeholder="Option B"
                />
                <Input
                  value={optC}
                  onChange={(e) => setOptC(e.target.value)}
                  placeholder="Option C"
                />
                <Input
                  value={optD}
                  onChange={(e) => setOptD(e.target.value)}
                  placeholder="Option D"
                />
                <div className="space-y-2">
                  <Label>{t('tests.correct')}</Label>
                  <Select value={correctIndex} onValueChange={setCorrectIndex}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">A</SelectItem>
                      <SelectItem value="1">B</SelectItem>
                      <SelectItem value="2">C</SelectItem>
                      <SelectItem value="3">D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => void handleAddQuestion()}>
                  {t('common.actions.add')}
                </Button>
              </div>

              <div className="grid max-w-xl gap-3 rounded-xl border border-border bg-card p-4">
                <h3 className="font-medium text-navy">
                  Assign
                </h3>
                <div className="space-y-2">
                  <Label>{t('hifz.studentSelect')}</Label>
                  <Select
                    value={assignStudentId || undefined}
                    onValueChange={setAssignStudentId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('hifz.studentSelect')} />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.profile_id}>
                          {s.profiles?.full_name || s.profile_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('nav.courses')}</Label>
                  <Select
                    value={assignCourseId || undefined}
                    onValueChange={setAssignCourseId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('nav.courses')} />
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
                <Button onClick={() => void handleAssign()}>
                  Assign test
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t('tests.noTests')}</p>
          )}
        </TabsContent>

        <TabsContent value="results">
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('tests.noTests')}</p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {results.map((row) => (
                <li key={row.id} className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-navy">
                      {row.student_id.slice(0, 8)}…
                    </span>
                    <Badge
                      variant={
                        (row.score ?? 0) >= (row.tests?.passing_score ?? 50)
                          ? 'success'
                          : 'destructive'
                      }
                    >
                      {t('tests.score')}: {row.score ?? '—'}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {row.submitted_at
                      ? new Date(row.submitted_at).toLocaleString()
                      : row.status}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </ModuleShell>
  )
}
