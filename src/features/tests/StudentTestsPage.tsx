import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { ModuleShell } from '@/components/shared/ModuleShell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  getAttemptAnswers,
  getTest,
  isAttemptExpired,
  listAssignments,
  listStudentAttempts,
  saveAnswer,
  startAttempt,
  submitAttempt,
  type AssignmentWithTest,
  type AttemptWithTest,
  type TestAnswer,
  type TestAttempt,
  type TestWithQuestions,
} from '@/services/tests'
import { toError } from '@/lib/errors'

function formatRemaining(ms: number): string {
  if (ms <= 0) return '0:00'
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function StudentTestsPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ur' ? 'ur' : 'en'
  const { user } = useAuth()

  const [assignments, setAssignments] = useState<AssignmentWithTest[]>([])
  const [attempts, setAttempts] = useState<AttemptWithTest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const [activeAttempt, setActiveAttempt] = useState<TestAttempt | null>(null)
  const [activeTest, setActiveTest] = useState<TestWithQuestions | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [viewResult, setViewResult] = useState<AttemptWithTest | null>(null)
  const [resultAnswers, setResultAnswers] = useState<TestAnswer[]>([])
  const [now, setNow] = useState(() => Date.now())
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const [asg, att] = await Promise.all([
        listAssignments(user.id),
        listStudentAttempts(user.id),
      ])
      setAssignments(asg)
      setAttempts(att)
    } catch (err) {
      setError(toError(err))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!activeAttempt) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [activeAttempt])

  const remainingMs = useMemo(() => {
    if (!activeAttempt) return null
    if (activeAttempt.expires_at) {
      return new Date(activeAttempt.expires_at).getTime() - now
    }
    const mins = activeTest?.duration_minutes
    if (mins == null || mins <= 0) return null
    return (
      new Date(activeAttempt.started_at).getTime() + mins * 60_000 - now
    )
  }, [activeAttempt, activeTest, now])

  const lockAndSubmit = useCallback(async () => {
    if (!activeAttempt || submitting) return
    setSubmitting(true)
    try {
      const result = await submitAttempt(activeAttempt.id)
      toast.success(t('tests.submitSuccess'))
      setActiveAttempt(null)
      setActiveTest(null)
      setAnswers({})
      await load()
      setViewResult({ ...result, tests: activeTest })
      setResultAnswers(await getAttemptAnswers(result.id))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }, [activeAttempt, activeTest, load, submitting, t])

  useEffect(() => {
    if (
      activeAttempt &&
      remainingMs != null &&
      remainingMs <= 0 &&
      !submitting
    ) {
      void lockAndSubmit()
    }
  }, [activeAttempt, remainingMs, submitting, lockAndSubmit])

  const begin = async (assignment: AssignmentWithTest) => {
    if (!user || !assignment.tests) return
    try {
      const attempt = await startAttempt({
        testId: assignment.test_id,
        studentId: user.id,
        assignmentId: assignment.id,
      })
      const test = await getTest(assignment.test_id, { forStudent: true })
      if (!test) throw new Error('Test not found')
      const existing = await getAttemptAnswers(attempt.id)
      const map: Record<string, string> = {}
      for (const a of existing) {
        if (a.selected_option_id) map[a.question_id] = a.selected_option_id
      }
      setAnswers(map)
      setActiveAttempt(attempt)
      setActiveTest(test)
      setViewResult(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  const onSelectOption = async (questionId: string, optionId: string) => {
    if (!activeAttempt) return
    if (
      isAttemptExpired(
        activeAttempt,
        activeTest?.duration_minutes ?? null,
      )
    ) {
      toast.error(t('tests.locked'))
      void lockAndSubmit()
      return
    }
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }))
    try {
      await saveAnswer({
        attemptId: activeAttempt.id,
        questionId,
        selectedOptionId: optionId,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  const openResult = async (attempt: AttemptWithTest) => {
    setViewResult(attempt)
    setActiveAttempt(null)
    setActiveTest(null)
    try {
      setResultAnswers(await getAttemptAnswers(attempt.id))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  const finishedIds = useMemo(() => {
    const set = new Set<string>()
    for (const a of attempts) {
      if (a.status === 'submitted' || a.status === 'graded') {
        if (a.assignment_id) set.add(a.assignment_id)
        set.add(a.test_id)
      }
    }
    return set
  }, [attempts])

  if (activeAttempt && activeTest) {
    const locked =
      remainingMs != null && remainingMs <= 0
        ? true
        : isAttemptExpired(activeAttempt, activeTest.duration_minutes)

    return (
      <ModuleShell
        title={
          locale === 'ur' && activeTest.title_ur
            ? activeTest.title_ur
            : activeTest.title_en
        }
        description={t('tests.timeRemaining')}
        actions={
          remainingMs != null ? (
            <Badge variant={remainingMs < 60_000 ? 'destructive' : 'secondary'}>
              {formatRemaining(remainingMs)}
            </Badge>
          ) : null
        }
      >
        {locked ? (
          <p className="mb-4 text-sm text-destructive">{t('tests.locked')}</p>
        ) : null}
        <ol className="space-y-4">
          {activeTest.test_questions.map((q, index) => (
            <li
              key={q.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <p className="mb-3 font-medium text-navy">
                {t('tests.question')} {index + 1} {t('tests.of')}{' '}
                {activeTest.test_questions.length}: {q.prompt_en}
              </p>
              <ul className="space-y-2">
                {q.test_options.map((opt) => {
                  const selected = answers[q.id] === opt.id
                  return (
                    <li key={opt.id}>
                      <button
                        type="button"
                        disabled={locked || submitting}
                        onClick={() => void onSelectOption(q.id, opt.id)}
                        className={`w-full rounded-md border px-3 py-2 text-start text-sm transition-colors ${
                          selected
                            ? 'border-primary bg-primary/10 text-navy'
                            : 'border-border hover:bg-surface'
                        }`}
                      >
                        {opt.label_en}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex gap-2">
          <Button
            disabled={submitting || locked}
            onClick={() => {
              if (window.confirm(t('tests.confirmSubmit'))) {
                void lockAndSubmit()
              }
            }}
          >
            {t('tests.submitTest')}
          </Button>
        </div>
      </ModuleShell>
    )
  }

  if (viewResult) {
    const passed =
      (viewResult.score ?? 0) >= (viewResult.tests?.passing_score ?? 50)
    return (
      <ModuleShell
        title={t('tests.results')}
        description={
          locale === 'ur' && viewResult.tests?.title_ur
            ? viewResult.tests.title_ur
            : viewResult.tests?.title_en
        }
        actions={
          <Button variant="outline" onClick={() => setViewResult(null)}>
            {t('common.actions.back')}
          </Button>
        }
      >
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <p className="text-2xl font-semibold text-navy">
            {t('tests.score')}: {viewResult.score ?? '—'}%
          </p>
          <Badge variant={passed ? 'success' : 'destructive'} className="mt-2">
            {passed ? t('tests.passed') : t('tests.failed')}
          </Badge>
          <Progress value={viewResult.score ?? 0} className="mt-4" />
        </div>
        <p className="text-sm text-muted-foreground">
          {resultAnswers.filter((a) => a.is_correct).length}{' '}
          {t('tests.correct')} ·{' '}
          {resultAnswers.filter((a) => a.is_correct === false).length}{' '}
          {t('tests.incorrect')}
        </p>
      </ModuleShell>
    )
  }

  return (
    <ModuleShell
      title={t('tests.title')}
      description={t('tests.subtitle')}
      loading={loading}
      error={error}
      onRetry={() => void load()}
      empty={!loading && !error && assignments.length === 0}
      emptyTitle={t('tests.noTests')}
      emptyDescription={t('tests.subtitle')}
    >
      <section className="mb-8">
        <h2 className="mb-3 font-display text-lg font-semibold text-navy">
          {t('tests.upcoming')}
        </h2>
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {assignments.map((asg) => {
            const done = finishedIds.has(asg.id) || finishedIds.has(asg.test_id)
            const inProgress = attempts.find(
              (a) =>
                a.test_id === asg.test_id && a.status === 'in_progress',
            )
            return (
              <li
                key={asg.id}
                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-navy">
                    {asg.tests?.title_en ?? asg.test_id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {asg.tests?.duration_minutes
                      ? t('tests.minutes', {
                          count: asg.tests.duration_minutes,
                        })
                      : null}
                    {asg.due_at
                      ? ` · ${t('tests.availableFrom')} ${new Date(asg.due_at).toLocaleDateString()}`
                      : null}
                  </p>
                </div>
                {done ? (
                  <Badge variant="success">{t('tests.past')}</Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => void begin(asg)}
                  >
                    {inProgress
                      ? t('tests.continueTest')
                      : t('tests.startTest')}
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-navy">
          {t('tests.past')}
        </h2>
        {attempts.filter((a) => a.status !== 'in_progress').length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('tests.noTests')}</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {attempts
              .filter((a) => a.status !== 'in_progress')
              .map((att) => (
                <li
                  key={att.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-navy">
                      {att.tests?.title_en ?? att.test_id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('tests.score')}: {att.score ?? '—'}%
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void openResult(att)}
                  >
                    {t('tests.reviewAnswers')}
                  </Button>
                </li>
              ))}
          </ul>
        )}
      </section>
    </ModuleShell>
  )
}
