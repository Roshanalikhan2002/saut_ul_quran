-- =============================================================================
-- Saut Ul Quran — 007_security_hardening.sql
-- Test integrity, certificate public verify, mute, profile/notif locks,
-- teacher_manages_course includes course creator.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. teacher_manages_course: include course creator
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.teacher_manages_course(p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.course_teachers ct
      WHERE ct.course_id = p_course_id
        AND ct.teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.courses c
      WHERE c.id = p_course_id
        AND c.created_by = auth.uid()
    );
$$;

-- -----------------------------------------------------------------------------
-- 2. Group mute helpers + harden message insert
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_group_muted(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = p_group_id
      AND gm.user_id = auth.uid()
      AND gm.role_in_group = 'muted'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_group_muted(UUID) TO authenticated;

DROP POLICY IF EXISTS "group_messages_insert" ON public.group_messages;
CREATE POLICY "group_messages_insert"
  ON public.group_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_group_member(group_id)
    AND NOT public.is_group_muted(group_id)
    AND (
      public.is_staff()
      OR EXISTS (
        SELECT 1 FROM public.groups g
        WHERE g.id = group_id AND g.group_type = 'chat'
      )
    )
  );

-- Groups select: members or staff only (not all course enrollees)
DROP POLICY IF EXISTS "groups_select" ON public.groups;
CREATE POLICY "groups_select"
  ON public.groups FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR public.is_group_member(id)
  );

-- -----------------------------------------------------------------------------
-- 3. Notifications: students may only flip is_read
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_notification_student_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_staff() THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.title_en IS DISTINCT FROM OLD.title_en
     OR NEW.title_ur IS DISTINCT FROM OLD.title_ur
     OR NEW.body_en IS DISTINCT FROM OLD.body_en
     OR NEW.body_ur IS DISTINCT FROM OLD.body_ur
     OR NEW.type IS DISTINCT FROM OLD.type
     OR NEW.link IS DISTINCT FROM OLD.link
     OR NEW.metadata IS DISTINCT FROM OLD.metadata
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'Students may only update notification read state';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_notification_student_update ON public.notifications;
CREATE TRIGGER trg_guard_notification_student_update
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.guard_notification_student_update();

-- -----------------------------------------------------------------------------
-- 4. Profiles: lock sensitive fields for non-admins
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Staff cannot deactivate others via this path either unless admin
  IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    RAISE EXCEPTION 'Only admins can change is_active';
  END IF;

  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'Email is managed by Auth; contact an admin';
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Cannot change profile id';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_update ON public.profiles;
CREATE TRIGGER trg_guard_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_update();

-- -----------------------------------------------------------------------------
-- 5. Test attempts: server sets expires_at; students cannot forge scores
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_test_attempt_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_duration INT;
  v_max INT;
  v_count INT;
BEGIN
  IF public.is_staff() THEN
    RETURN NEW;
  END IF;

  IF NEW.student_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Cannot create attempt for another student';
  END IF;

  NEW.status := 'in_progress';
  NEW.score := NULL;
  NEW.submitted_at := NULL;
  NEW.graded_at := NULL;
  NEW.graded_by := NULL;
  NEW.started_at := COALESCE(NEW.started_at, timezone('utc', now()));

  SELECT duration_minutes, max_attempts
    INTO v_duration, v_max
  FROM public.tests
  WHERE id = NEW.test_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Test not found';
  END IF;

  IF v_max IS NOT NULL THEN
    SELECT COUNT(*)::INT INTO v_count
    FROM public.test_attempts
    WHERE test_id = NEW.test_id AND student_id = NEW.student_id;
    IF v_count >= v_max THEN
      RAISE EXCEPTION 'Maximum attempts reached';
    END IF;
  END IF;

  IF v_duration IS NOT NULL AND v_duration > 0 THEN
    NEW.expires_at := NEW.started_at + make_interval(mins => v_duration);
  ELSE
    NEW.expires_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_test_attempt_insert ON public.test_attempts;
CREATE TRIGGER trg_guard_test_attempt_insert
  BEFORE INSERT ON public.test_attempts
  FOR EACH ROW EXECUTE FUNCTION public.guard_test_attempt_insert();

CREATE OR REPLACE FUNCTION public.guard_test_attempt_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(current_setting('app.suq_grading', true), '') = 'on' THEN
    RETURN NEW;
  END IF;

  IF public.is_staff() THEN
    RETURN NEW;
  END IF;

  IF OLD.student_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Cannot update another student attempt';
  END IF;

  IF OLD.status IS DISTINCT FROM 'in_progress' THEN
    RAISE EXCEPTION 'Attempt is locked';
  END IF;

  -- Students may only transition to submitted (grading via RPC preferred)
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IS DISTINCT FROM 'submitted' THEN
    RAISE EXCEPTION 'Invalid attempt status transition';
  END IF;

  -- Lock scoring / timer fields from client forgery
  NEW.score := OLD.score;
  NEW.started_at := OLD.started_at;
  NEW.expires_at := OLD.expires_at;
  NEW.graded_at := OLD.graded_at;
  NEW.graded_by := OLD.graded_by;
  NEW.student_id := OLD.student_id;
  NEW.test_id := OLD.test_id;
  NEW.assignment_id := OLD.assignment_id;

  IF NEW.status = 'submitted' AND OLD.status = 'in_progress' THEN
    NEW.submitted_at := COALESCE(NEW.submitted_at, timezone('utc', now()));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_test_attempt_update ON public.test_attempts;
CREATE TRIGGER trg_guard_test_attempt_update
  BEFORE UPDATE ON public.test_attempts
  FOR EACH ROW EXECUTE FUNCTION public.guard_test_attempt_update();

-- Narrow student UPDATE policy (staff still full via OR)
DROP POLICY IF EXISTS "test_attempts_student_update" ON public.test_attempts;
CREATE POLICY "test_attempts_student_update"
  ON public.test_attempts FOR UPDATE TO authenticated
  USING (
    public.is_staff()
    OR (student_id = auth.uid() AND status = 'in_progress')
  )
  WITH CHECK (
    public.is_staff()
    OR (student_id = auth.uid() AND status IN ('in_progress', 'submitted'))
  );

-- -----------------------------------------------------------------------------
-- 6. Test answers: students cannot set is_correct / points_awarded
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_test_answer_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt public.test_attempts%ROWTYPE;
BEGIN
  -- Allow server-side grading RPC to set is_correct / points_awarded
  IF COALESCE(current_setting('app.suq_grading', true), '') = 'on' THEN
    RETURN NEW;
  END IF;

  IF public.is_staff() THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_attempt FROM public.test_attempts WHERE id = NEW.attempt_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attempt not found';
  END IF;

  IF v_attempt.student_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not your attempt';
  END IF;

  IF v_attempt.status IS DISTINCT FROM 'in_progress' THEN
    RAISE EXCEPTION 'Attempt is locked';
  END IF;

  IF v_attempt.expires_at IS NOT NULL AND timezone('utc', now()) > v_attempt.expires_at THEN
    RAISE EXCEPTION 'Time limit exceeded';
  END IF;

  NEW.is_correct := NULL;
  NEW.points_awarded := 0;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_test_answer_insert ON public.test_answers;
CREATE TRIGGER trg_guard_test_answer_insert
  BEFORE INSERT ON public.test_answers
  FOR EACH ROW EXECUTE FUNCTION public.guard_test_answer_write();

DROP TRIGGER IF EXISTS trg_guard_test_answer_update ON public.test_answers;
CREATE TRIGGER trg_guard_test_answer_update
  BEFORE UPDATE ON public.test_answers
  FOR EACH ROW EXECUTE FUNCTION public.guard_test_answer_write();

-- -----------------------------------------------------------------------------
-- 7. Secure submit + grade RPC (server-side scoring)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.submit_and_grade_attempt(p_attempt_id UUID)
RETURNS public.test_attempts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt public.test_attempts%ROWTYPE;
  v_passing NUMERIC;
  v_earned NUMERIC := 0;
  v_total NUMERIC := 0;
  v_q RECORD;
  v_ans RECORD;
  v_correct BOOLEAN;
  v_points NUMERIC;
  v_score NUMERIC;
BEGIN
  SELECT * INTO v_attempt
  FROM public.test_attempts
  WHERE id = p_attempt_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attempt not found';
  END IF;

  IF NOT public.is_staff() AND v_attempt.student_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not your attempt';
  END IF;

  IF v_attempt.status IS DISTINCT FROM 'in_progress' THEN
    RETURN v_attempt;
  END IF;

  -- Allow grading updates through answer guard + attempt score write
  PERFORM set_config('app.suq_grading', 'on', true);

  SELECT COALESCE(passing_score, 50) INTO v_passing
  FROM public.tests WHERE id = v_attempt.test_id;

  FOR v_q IN
    SELECT q.*
    FROM public.test_questions q
    WHERE q.test_id = v_attempt.test_id
  LOOP
    v_total := v_total + COALESCE(v_q.points, 0);

    SELECT * INTO v_ans
    FROM public.test_answers
    WHERE attempt_id = p_attempt_id AND question_id = v_q.id;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    v_correct := NULL;
    v_points := 0;

    IF v_q.question_type IN ('multiple_choice', 'true_false') THEN
      SELECT COALESCE(o.is_correct, FALSE) INTO v_correct
      FROM public.test_options o
      WHERE o.id = v_ans.selected_option_id;

      IF COALESCE(v_correct, FALSE) THEN
        v_points := COALESCE(v_q.points, 0);
      ELSE
        v_correct := FALSE;
        v_points := 0;
      END IF;
    END IF;

    UPDATE public.test_answers
    SET is_correct = v_correct,
        points_awarded = v_points
    WHERE id = v_ans.id;

    v_earned := v_earned + v_points;
  END LOOP;

  IF v_total > 0 THEN
    v_score := ROUND((v_earned / v_total) * 1000) / 10;
  ELSE
    v_score := 0;
  END IF;

  -- Direct score write under grading flag (single update)
  UPDATE public.test_attempts
  SET status = 'submitted',
      score = v_score,
      submitted_at = timezone('utc', now())
  WHERE id = p_attempt_id
  RETURNING * INTO v_attempt;

  RETURN v_attempt;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_and_grade_attempt(UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- 8. Hide answer keys from students via secure options view pattern
--    Staff keep table access; students get view without is_correct
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.test_options_safe
WITH (security_invoker = true)
AS
SELECT
  id,
  question_id,
  label_en,
  label_ur,
  sort_order,
  CASE
    WHEN public.is_staff() THEN is_correct
    ELSE NULL
  END AS is_correct
FROM public.test_options;

GRANT SELECT ON public.test_options_safe TO authenticated;

-- Prefer narrowing student SELECT on options: drop broad student visibility of is_correct
-- by replacing select policy to allow reading options only when assigned, but
-- is_correct still visible at table level — clients MUST use test_options_safe / RPC grading.
-- Additional: revoke direct student benefit via column privilege is not available on all plans.
-- Document: app uses submit_and_grade_attempt + strips is_correct client-side for students.

-- -----------------------------------------------------------------------------
-- 9. Public certificate verification RPC
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.verify_certificate(p_number TEXT)
RETURNS TABLE (
  valid BOOLEAN,
  certificate_number TEXT,
  status public.certificate_status,
  student_name TEXT,
  student_name_ur TEXT,
  course_title_en TEXT,
  course_title_ur TEXT,
  issued_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (c.status = 'issued') AS valid,
    c.certificate_number,
    c.status,
    p.full_name AS student_name,
    p.full_name_ur AS student_name_ur,
    ct_en.title AS course_title_en,
    ct_ur.title AS course_title_ur,
    c.issued_at
  FROM public.certificates c
  JOIN public.profiles p ON p.id = c.student_id
  LEFT JOIN public.course_translations ct_en
    ON ct_en.course_id = c.course_id AND ct_en.locale = 'en'
  LEFT JOIN public.course_translations ct_ur
    ON ct_ur.course_id = c.course_id AND ct_ur.locale = 'ur'
  WHERE c.certificate_number = trim(p_number)
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_certificate(TEXT) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 10. Auto-assign course_teachers when staff creates a course
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.auto_assign_course_teacher()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NOT NULL AND public.has_role('teacher') THEN
    INSERT INTO public.course_teachers (course_id, teacher_id, is_primary, assigned_by)
    VALUES (NEW.id, NEW.created_by, TRUE, NEW.created_by)
    ON CONFLICT (course_id, teacher_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- course_teachers may not have UNIQUE(course_id, teacher_id) named — check schema
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'course_teachers_course_id_teacher_id_key'
  ) THEN
    ALTER TABLE public.course_teachers
      ADD CONSTRAINT course_teachers_course_id_teacher_id_key UNIQUE (course_id, teacher_id);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_auto_assign_course_teacher ON public.courses;
CREATE TRIGGER trg_auto_assign_course_teacher
  AFTER INSERT ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_course_teacher();

COMMENT ON FUNCTION public.submit_and_grade_attempt(UUID) IS
  'Server-side grade + lock attempt. Students cannot set scores via client.';
COMMENT ON FUNCTION public.verify_certificate(TEXT) IS
  'Public-safe certificate verification for anon + authenticated.';
