import { listEnrollments } from '@/services/enrollments'
import { isDemoAuthMode } from '@/lib/demoAuth'
import { demoListTestAssignments, demoListTests } from '@/lib/demoStore'
import { supabase } from '@/lib/supabase'
import type {
  AttemptStatus,
  QuestionType,
  Tables,
  TablesInsert,
  TablesUpdate,
  TestLifecycle,
} from '@/types/database'

export type Test = Tables<'tests'>
export type TestQuestion = Tables<'test_questions'>
export type TestOption = Tables<'test_options'>
export type TestAssignment = Tables<'test_assignments'>
export type TestAttempt = Tables<'test_attempts'>
export type TestAnswer = Tables<'test_answers'>

export type TestQuestionWithOptions = TestQuestion & {
  test_options: TestOption[]
}

export type TestWithQuestions = Test & {
  test_questions: TestQuestionWithOptions[]
}

export type AssignmentWithTest = TestAssignment & {
  tests: Test | null
}

export type AttemptWithTest = TestAttempt & {
  tests: Test | null
}

export interface CreateTestInput {
  titleEn: string
  titleUr?: string | null
  descriptionEn?: string | null
  descriptionUr?: string | null
  courseId?: string | null
  durationMinutes?: number | null
  passingScore?: number
  maxAttempts?: number | null
  status?: TestLifecycle
  isPublished?: boolean
  createdBy?: string | null
}

export interface QuestionInput {
  promptEn: string
  promptUr?: string | null
  questionType?: QuestionType
  points?: number
  sortOrder?: number
  options?: Array<{
    labelEn: string
    labelUr?: string | null
    isCorrect?: boolean
    sortOrder?: number
  }>
}

export function computeExpiresAt(
  startedAtIso: string,
  durationMinutes: number | null | undefined,
): string | null {
  if (durationMinutes == null || durationMinutes <= 0) return null
  const started = new Date(startedAtIso).getTime()
  return new Date(started + durationMinutes * 60_000).toISOString()
}

/** Percent score rounded to one decimal (matches server grading RPC). */
export function computeScorePercent(earned: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((earned / total) * 1000) / 10
}

export function isAttemptExpired(
  attempt: Pick<TestAttempt, 'expires_at' | 'started_at'>,
  durationMinutes?: number | null,
  nowMs = Date.now(),
): boolean {
  if (attempt.expires_at) {
    return nowMs > new Date(attempt.expires_at).getTime()
  }
  if (durationMinutes != null && durationMinutes > 0) {
    const deadline =
      new Date(attempt.started_at).getTime() + durationMinutes * 60_000
    return nowMs > deadline
  }
  return false
}

/** Strip answer-key flags before showing options to students. */
export function sanitizeOptionsForStudent(
  options: TestOption[],
): Array<Omit<TestOption, 'is_correct'> & { is_correct?: undefined }> {
  return options.map((opt) => {
    const { is_correct: _correct, ...rest } = opt
    return rest
  })
}

function isRpcMissingError(error: { code?: string; message?: string }): boolean {
  const msg = (error.message ?? '').toLowerCase()
  return (
    error.code === 'PGRST202' ||
    error.code === '42883' ||
    msg.includes('could not find the function') ||
    msg.includes('does not exist')
  )
}

// ---------------------------------------------------------------------------
// Staff CRUD
// ---------------------------------------------------------------------------

export async function listTests(): Promise<Test[]> {
  if (isDemoAuthMode()) {
    return demoListTests()
  }

  const { data, error } = await supabase
    .from('tests')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getTest(
  testId: string,
  options?: { forStudent?: boolean },
): Promise<TestWithQuestions | null> {
  const { data, error } = await supabase
    .from('tests')
    .select('*, test_questions(*, test_options(*))')
    .eq('id', testId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const questions = (
    (data.test_questions ?? []) as TestQuestionWithOptions[]
  ).slice().sort((a, b) => a.sort_order - b.sort_order)
  for (const q of questions) {
    const sorted = (q.test_options ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
    q.test_options = options?.forStudent
      ? (sanitizeOptionsForStudent(sorted) as unknown as TestOption[])
      : sorted
  }
  return { ...data, test_questions: questions } as TestWithQuestions
}

export async function createTest(input: CreateTestInput): Promise<Test> {
  const payload: TablesInsert<'tests'> = {
    title_en: input.titleEn,
    title_ur: input.titleUr ?? null,
    description_en: input.descriptionEn ?? null,
    description_ur: input.descriptionUr ?? null,
    course_id: input.courseId ?? null,
    duration_minutes: input.durationMinutes ?? null,
    passing_score: input.passingScore ?? 50,
    max_attempts: input.maxAttempts ?? 1,
    status: input.status ?? 'draft',
    is_published: input.isPublished ?? false,
    created_by: input.createdBy ?? null,
  }
  const { data, error } = await supabase
    .from('tests')
    .insert(payload)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateTest(
  testId: string,
  patch: TablesUpdate<'tests'>,
): Promise<Test> {
  const { data, error } = await supabase
    .from('tests')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', testId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deleteTest(testId: string): Promise<void> {
  const { error } = await supabase.from('tests').delete().eq('id', testId)
  if (error) throw error
}

export async function addQuestion(
  testId: string,
  input: QuestionInput,
): Promise<TestQuestionWithOptions> {
  const { data: question, error } = await supabase
    .from('test_questions')
    .insert({
      test_id: testId,
      prompt_en: input.promptEn,
      prompt_ur: input.promptUr ?? null,
      question_type: input.questionType ?? 'multiple_choice',
      points: input.points ?? 1,
      sort_order: input.sortOrder ?? 0,
    } satisfies TablesInsert<'test_questions'>)
    .select('*')
    .single()
  if (error) throw error

  const options = input.options ?? []
  let createdOptions: TestOption[] = []
  if (options.length > 0) {
    const { data: opts, error: optError } = await supabase
      .from('test_options')
      .insert(
        options.map((opt, index) => ({
          question_id: question.id,
          label_en: opt.labelEn,
          label_ur: opt.labelUr ?? null,
          is_correct: opt.isCorrect ?? false,
          sort_order: opt.sortOrder ?? index,
        })) satisfies TablesInsert<'test_options'>[],
      )
      .select('*')
    if (optError) throw optError
    createdOptions = opts ?? []
  }

  return { ...question, test_options: createdOptions }
}

export async function updateQuestion(
  questionId: string,
  patch: TablesUpdate<'test_questions'>,
): Promise<TestQuestion> {
  const { data, error } = await supabase
    .from('test_questions')
    .update(patch)
    .eq('id', questionId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deleteQuestion(questionId: string): Promise<void> {
  const { error } = await supabase
    .from('test_questions')
    .delete()
    .eq('id', questionId)
  if (error) throw error
}

export async function addOption(
  questionId: string,
  input: {
    labelEn: string
    labelUr?: string | null
    isCorrect?: boolean
    sortOrder?: number
  },
): Promise<TestOption> {
  const { data, error } = await supabase
    .from('test_options')
    .insert({
      question_id: questionId,
      label_en: input.labelEn,
      label_ur: input.labelUr ?? null,
      is_correct: input.isCorrect ?? false,
      sort_order: input.sortOrder ?? 0,
    } satisfies TablesInsert<'test_options'>)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateOption(
  optionId: string,
  patch: TablesUpdate<'test_options'>,
): Promise<TestOption> {
  const { data, error } = await supabase
    .from('test_options')
    .update(patch)
    .eq('id', optionId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deleteOption(optionId: string): Promise<void> {
  const { error } = await supabase
    .from('test_options')
    .delete()
    .eq('id', optionId)
  if (error) throw error
}

/** Assign a test to one student (profile id) or every active enrollee of a course. */
export async function assignTest(input: {
  testId: string
  studentId?: string
  courseId?: string
  assignedBy?: string | null
  dueAt?: string | null
}): Promise<TestAssignment[]> {
  const studentIds = new Set<string>()

  if (input.studentId) studentIds.add(input.studentId)

  if (input.courseId) {
    const enrollments = await listEnrollments({
      courseId: input.courseId,
      status: 'active',
    })
    for (const e of enrollments) studentIds.add(e.student_id)
  }

  if (studentIds.size === 0) {
    throw new Error('No students to assign')
  }

  const rows: TablesInsert<'test_assignments'>[] = [...studentIds].map(
    (studentId) => ({
      test_id: input.testId,
      student_id: studentId,
      assigned_by: input.assignedBy ?? null,
      due_at: input.dueAt ?? null,
    }),
  )

  const { data, error } = await supabase
    .from('test_assignments')
    .upsert(rows, { onConflict: 'test_id,student_id' })
    .select('*')
  if (error) throw error
  return data ?? []
}

export async function listAssignmentsForTest(
  testId: string,
): Promise<AssignmentWithTest[]> {
  const { data, error } = await supabase
    .from('test_assignments')
    .select('*, tests(*)')
    .eq('test_id', testId)
    .order('assigned_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as AssignmentWithTest[]
}

export async function listResults(filters?: {
  testId?: string
  studentId?: string
}): Promise<AttemptWithTest[]> {
  if (isDemoAuthMode()) {
    void filters
    return []
  }

  let query = supabase
    .from('test_attempts')
    .select('*, tests(*)')
    .in('status', ['submitted', 'graded'] satisfies AttemptStatus[])
    .order('submitted_at', { ascending: false })

  if (filters?.testId) query = query.eq('test_id', filters.testId)
  if (filters?.studentId) query = query.eq('student_id', filters.studentId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as AttemptWithTest[]
}

export async function countPendingAssignments(
  studentProfileId: string,
): Promise<number> {
  const assignments = await listAssignments(studentProfileId)
  const attempts = await listStudentAttempts(studentProfileId)
  const finished = new Set(
    attempts
      .filter((a) => a.status === 'submitted' || a.status === 'graded')
      .map((a) => a.assignment_id ?? a.test_id),
  )
  return assignments.filter((a) => {
    if (finished.has(a.id) || finished.has(a.test_id)) return false
    return true
  }).length
}

// ---------------------------------------------------------------------------
// Student flows
// ---------------------------------------------------------------------------

export async function listAssignments(
  studentProfileId: string,
): Promise<AssignmentWithTest[]> {
  if (isDemoAuthMode()) {
    return demoListTestAssignments(studentProfileId) as AssignmentWithTest[]
  }

  const { data, error } = await supabase
    .from('test_assignments')
    .select('*, tests(*)')
    .eq('student_id', studentProfileId)
    .order('assigned_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as AssignmentWithTest[]
}

export async function listStudentAttempts(
  studentProfileId: string,
): Promise<AttemptWithTest[]> {
  if (isDemoAuthMode()) {
    void studentProfileId
    return []
  }

  const { data, error } = await supabase
    .from('test_attempts')
    .select('*, tests(*)')
    .eq('student_id', studentProfileId)
    .order('started_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as AttemptWithTest[]
}

export async function startAttempt(input: {
  testId: string
  studentId: string
  assignmentId?: string | null
}): Promise<TestAttempt> {
  const { data: existing, error: existingError } = await supabase
    .from('test_attempts')
    .select('*')
    .eq('test_id', input.testId)
    .eq('student_id', input.studentId)
    .eq('status', 'in_progress')
    .maybeSingle()
  if (existingError) throw existingError
  if (existing) return existing

  const { data: test, error: testError } = await supabase
    .from('tests')
    .select('duration_minutes, max_attempts')
    .eq('id', input.testId)
    .single()
  if (testError) throw testError

  if (test.max_attempts != null) {
    const { count, error: countError } = await supabase
      .from('test_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('test_id', input.testId)
      .eq('student_id', input.studentId)
    if (countError) throw countError
    if ((count ?? 0) >= test.max_attempts) {
      throw new Error('Maximum attempts reached')
    }
  }

  const startedAt = new Date().toISOString()
  const expiresAt = computeExpiresAt(startedAt, test.duration_minutes)

  const { data, error } = await supabase
    .from('test_attempts')
    .insert({
      test_id: input.testId,
      student_id: input.studentId,
      assignment_id: input.assignmentId ?? null,
      status: 'in_progress',
      started_at: startedAt,
      expires_at: expiresAt,
    } satisfies TablesInsert<'test_attempts'>)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function saveAnswer(input: {
  attemptId: string
  questionId: string
  selectedOptionId?: string | null
  answerText?: string | null
}): Promise<TestAnswer> {
  const { data: attempt, error: attemptError } = await supabase
    .from('test_attempts')
    .select('*, tests(duration_minutes)')
    .eq('id', input.attemptId)
    .single()
  if (attemptError) throw attemptError
  if (attempt.status !== 'in_progress') {
    throw new Error('Attempt is locked')
  }

  const duration =
    (attempt.tests as { duration_minutes: number | null } | null)
      ?.duration_minutes ?? null
  if (isAttemptExpired(attempt, duration)) {
    throw new Error('Time limit exceeded')
  }

  const { data: existing, error: findError } = await supabase
    .from('test_answers')
    .select('id')
    .eq('attempt_id', input.attemptId)
    .eq('question_id', input.questionId)
    .maybeSingle()
  if (findError) throw findError

  if (existing) {
    const { data, error } = await supabase
      .from('test_answers')
      .update({
        selected_option_id: input.selectedOptionId ?? null,
        answer_text: input.answerText ?? null,
      } satisfies TablesUpdate<'test_answers'>)
      .eq('id', existing.id)
      .select('*')
      .single()
    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('test_answers')
    .insert({
      attempt_id: input.attemptId,
      question_id: input.questionId,
      selected_option_id: input.selectedOptionId ?? null,
      answer_text: input.answerText ?? null,
    } satisfies TablesInsert<'test_answers'>)
    .select('*')
    .single()
  if (error) throw error
  return data
}

/** Prefer server RPC; client scoring is fallback only if RPC is missing. */
export async function submitAttempt(attemptId: string): Promise<TestAttempt> {
  const { data, error } = await supabase.rpc('submit_and_grade_attempt', {
    p_attempt_id: attemptId,
  })

  if (!error && data) {
    return data as TestAttempt
  }

  if (error && !isRpcMissingError(error)) {
    throw error
  }

  return submitAttemptClientFallback(attemptId)
}

/** @internal Fallback when submit_and_grade_attempt RPC is not deployed. */
async function submitAttemptClientFallback(
  attemptId: string,
): Promise<TestAttempt> {
  const { data: attempt, error: attemptError } = await supabase
    .from('test_attempts')
    .select('*, tests(duration_minutes, passing_score)')
    .eq('id', attemptId)
    .single()
  if (attemptError) throw attemptError

  if (attempt.status !== 'in_progress') {
    return attempt as TestAttempt
  }

  const { data: answers, error: answersError } = await supabase
    .from('test_answers')
    .select('*')
    .eq('attempt_id', attemptId)
  if (answersError) throw answersError

  const { data: questions, error: questionsError } = await supabase
    .from('test_questions')
    .select('*, test_options(*)')
    .eq('test_id', attempt.test_id)
  if (questionsError) throw questionsError

  let earned = 0
  let total = 0

  for (const question of questions ?? []) {
    total += Number(question.points) || 0
    const answer = (answers ?? []).find((a) => a.question_id === question.id)
    if (!answer) continue

    const options = (question.test_options ?? []) as TestOption[]
    let isCorrect: boolean | null = null
    let pointsAwarded = 0

    if (
      question.question_type === 'multiple_choice' ||
      question.question_type === 'true_false'
    ) {
      const selected = options.find((o) => o.id === answer.selected_option_id)
      isCorrect = Boolean(selected?.is_correct)
      pointsAwarded = isCorrect ? Number(question.points) || 0 : 0
    }

    earned += pointsAwarded

    await supabase
      .from('test_answers')
      .update({
        is_correct: isCorrect,
        points_awarded: pointsAwarded,
      } satisfies TablesUpdate<'test_answers'>)
      .eq('id', answer.id)
  }

  const scorePercent = computeScorePercent(earned, total)

  const { data, error } = await supabase
    .from('test_attempts')
    .update({
      status: 'submitted',
      score: scorePercent,
      submitted_at: new Date().toISOString(),
    } satisfies TablesUpdate<'test_attempts'>)
    .eq('id', attemptId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function getAttemptAnswers(
  attemptId: string,
): Promise<TestAnswer[]> {
  const { data, error } = await supabase
    .from('test_answers')
    .select('*')
    .eq('attempt_id', attemptId)
  if (error) throw error
  return data ?? []
}
