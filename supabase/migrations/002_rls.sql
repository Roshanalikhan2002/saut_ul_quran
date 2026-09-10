-- =============================================================================
-- Saut Ul Quran — 002_rls.sql
-- Complete Row Level Security policies
-- =============================================================================
-- Rules summary:
--   Admin  → full access
--   Teacher → manage assigned courses / enrolled students / staff writes
--   Student → own profile, enrolled courses (read), own progress/tests/etc.
--   Students CANNOT: self-enroll, modify hifz/attendance, create tests, edit courses
--   Announcement groups: staff post only; students read
--   Chat groups: members can post
-- =============================================================================

-- Enable RLS on all public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ayahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tajweed_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ayah_audio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ayah_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hifz_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hifz_daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recorded_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_duas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_jamia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "profiles_select_own_or_staff" ON public.profiles;
CREATE POLICY "profiles_select_own_or_staff"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.is_staff()
  );

DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_insert_own_or_admin"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- user_roles
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "user_roles_select_own_or_staff" ON public.user_roles;
CREATE POLICY "user_roles_select_own_or_staff"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "user_roles_admin_write" ON public.user_roles;
CREATE POLICY "user_roles_admin_write"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- students / teachers extension tables
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "students_select_own_or_staff" ON public.students;
CREATE POLICY "students_select_own_or_staff"
  ON public.students FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "students_staff_write" ON public.students;
CREATE POLICY "students_staff_write"
  ON public.students FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "teachers_select_authenticated" ON public.teachers;
CREATE POLICY "teachers_select_authenticated"
  ON public.teachers FOR SELECT TO authenticated
  USING (is_active = TRUE OR profile_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "teachers_admin_write" ON public.teachers;
CREATE POLICY "teachers_admin_write"
  ON public.teachers FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- courses & translations
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "courses_select_published_or_access" ON public.courses;
CREATE POLICY "courses_select_published_or_access"
  ON public.courses FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR public.teacher_manages_course(id)
    OR (is_published = TRUE AND (
      public.student_enrolled(id) OR public.is_staff()
    ))
    OR (is_published = TRUE AND public.has_role('student'))
  );

-- Published catalog visible to authenticated students (browse); content deeper gated elsewhere.
-- Staff always see all.
DROP POLICY IF EXISTS "courses_select_catalog" ON public.courses;
CREATE POLICY "courses_select_catalog"
  ON public.courses FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR public.teacher_manages_course(id)
    OR is_published = TRUE
  );

DROP POLICY IF EXISTS "courses_staff_insert" ON public.courses;
CREATE POLICY "courses_staff_insert"
  ON public.courses FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.is_teacher());

DROP POLICY IF EXISTS "courses_manage" ON public.courses;
CREATE POLICY "courses_manage"
  ON public.courses FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR public.teacher_manages_course(id)
    OR created_by = auth.uid()
  )
  WITH CHECK (
    public.is_admin()
    OR public.teacher_manages_course(id)
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS "courses_admin_delete" ON public.courses;
CREATE POLICY "courses_admin_delete"
  ON public.courses FOR DELETE TO authenticated
  USING (public.is_admin());

-- Drop the overlapping first course select policy to avoid confusion
DROP POLICY IF EXISTS "courses_select_published_or_access" ON public.courses;

DROP POLICY IF EXISTS "course_translations_select" ON public.course_translations;
CREATE POLICY "course_translations_select"
  ON public.course_translations FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id
        AND (c.is_published = TRUE OR public.teacher_manages_course(c.id))
    )
  );

DROP POLICY IF EXISTS "course_translations_write" ON public.course_translations;
CREATE POLICY "course_translations_write"
  ON public.course_translations FOR ALL TO authenticated
  USING (public.is_admin() OR public.teacher_manages_course(course_id))
  WITH CHECK (public.is_admin() OR public.teacher_manages_course(course_id));

-- -----------------------------------------------------------------------------
-- lessons, translations, content
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "lessons_select" ON public.lessons;
CREATE POLICY "lessons_select"
  ON public.lessons FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR public.teacher_manages_course(course_id)
    OR (
      is_published = TRUE
      AND (
        public.student_enrolled(course_id)
        OR public.is_staff()
      )
    )
  );

DROP POLICY IF EXISTS "lessons_write" ON public.lessons;
CREATE POLICY "lessons_write"
  ON public.lessons FOR ALL TO authenticated
  USING (public.is_admin() OR public.teacher_manages_course(course_id))
  WITH CHECK (public.is_admin() OR public.teacher_manages_course(course_id));

DROP POLICY IF EXISTS "lesson_translations_select" ON public.lesson_translations;
CREATE POLICY "lesson_translations_select"
  ON public.lesson_translations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      WHERE l.id = lesson_id
        AND (
          public.is_admin()
          OR public.teacher_manages_course(l.course_id)
          OR (l.is_published AND public.student_enrolled(l.course_id))
        )
    )
  );

DROP POLICY IF EXISTS "lesson_translations_write" ON public.lesson_translations;
CREATE POLICY "lesson_translations_write"
  ON public.lesson_translations FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      WHERE l.id = lesson_id
        AND (public.is_admin() OR public.teacher_manages_course(l.course_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons l
      WHERE l.id = lesson_id
        AND (public.is_admin() OR public.teacher_manages_course(l.course_id))
    )
  );

DROP POLICY IF EXISTS "lesson_content_select" ON public.lesson_content;
CREATE POLICY "lesson_content_select"
  ON public.lesson_content FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      WHERE l.id = lesson_id
        AND (
          public.is_admin()
          OR public.teacher_manages_course(l.course_id)
          OR (l.is_published AND public.student_enrolled(l.course_id))
        )
    )
  );

DROP POLICY IF EXISTS "lesson_content_write" ON public.lesson_content;
CREATE POLICY "lesson_content_write"
  ON public.lesson_content FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      WHERE l.id = lesson_id
        AND (public.is_admin() OR public.teacher_manages_course(l.course_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons l
      WHERE l.id = lesson_id
        AND (public.is_admin() OR public.teacher_manages_course(l.course_id))
    )
  );

-- -----------------------------------------------------------------------------
-- course_teachers
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "course_teachers_select" ON public.course_teachers;
CREATE POLICY "course_teachers_select"
  ON public.course_teachers FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR teacher_id = auth.uid()
    OR public.student_enrolled(course_id)
  );

DROP POLICY IF EXISTS "course_teachers_admin_write" ON public.course_teachers;
CREATE POLICY "course_teachers_admin_write"
  ON public.course_teachers FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- enrollments — NO student self-insert
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "enrollments_select" ON public.enrollments;
CREATE POLICY "enrollments_select"
  ON public.enrollments FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR public.is_admin()
    OR public.teacher_manages_course(course_id)
  );

DROP POLICY IF EXISTS "enrollments_staff_insert" ON public.enrollments;
CREATE POLICY "enrollments_staff_insert"
  ON public.enrollments FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR public.teacher_manages_course(course_id)
  );

DROP POLICY IF EXISTS "enrollments_staff_update" ON public.enrollments;
CREATE POLICY "enrollments_staff_update"
  ON public.enrollments FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR public.teacher_manages_course(course_id)
  )
  WITH CHECK (
    public.is_admin()
    OR public.teacher_manages_course(course_id)
  );

DROP POLICY IF EXISTS "enrollments_admin_delete" ON public.enrollments;
CREATE POLICY "enrollments_admin_delete"
  ON public.enrollments FOR DELETE TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- lesson_progress — students manage own
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "lesson_progress_select" ON public.lesson_progress;
CREATE POLICY "lesson_progress_select"
  ON public.lesson_progress FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR public.is_staff()
  );

DROP POLICY IF EXISTS "lesson_progress_student_upsert" ON public.lesson_progress;
CREATE POLICY "lesson_progress_student_upsert"
  ON public.lesson_progress FOR INSERT TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.lessons l
      WHERE l.id = lesson_id
        AND public.student_enrolled(l.course_id)
    )
  );

DROP POLICY IF EXISTS "lesson_progress_student_update" ON public.lesson_progress;
CREATE POLICY "lesson_progress_student_update"
  ON public.lesson_progress FOR UPDATE TO authenticated
  USING (student_id = auth.uid() OR public.is_staff())
  WITH CHECK (student_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "lesson_progress_staff_delete" ON public.lesson_progress;
CREATE POLICY "lesson_progress_staff_delete"
  ON public.lesson_progress FOR DELETE TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- Quran reference (read-all authenticated; write staff/admin)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "paras_select" ON public.paras;
CREATE POLICY "paras_select"
  ON public.paras FOR SELECT TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "paras_admin_write" ON public.paras;
CREATE POLICY "paras_admin_write"
  ON public.paras FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "surahs_select" ON public.surahs;
CREATE POLICY "surahs_select"
  ON public.surahs FOR SELECT TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "surahs_admin_write" ON public.surahs;
CREATE POLICY "surahs_admin_write"
  ON public.surahs FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "ayahs_select" ON public.ayahs;
CREATE POLICY "ayahs_select"
  ON public.ayahs FOR SELECT TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "ayahs_admin_write" ON public.ayahs;
CREATE POLICY "ayahs_admin_write"
  ON public.ayahs FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "tajweed_rules_select" ON public.tajweed_rules;
CREATE POLICY "tajweed_rules_select"
  ON public.tajweed_rules FOR SELECT TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "tajweed_rules_admin_write" ON public.tajweed_rules;
CREATE POLICY "tajweed_rules_admin_write"
  ON public.tajweed_rules FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "ayah_audio_select" ON public.ayah_audio;
CREATE POLICY "ayah_audio_select"
  ON public.ayah_audio FOR SELECT TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "ayah_audio_staff_write" ON public.ayah_audio;
CREATE POLICY "ayah_audio_staff_write"
  ON public.ayah_audio FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ayah_knowledge: students read own; staff write
DROP POLICY IF EXISTS "ayah_knowledge_select" ON public.ayah_knowledge;
CREATE POLICY "ayah_knowledge_select"
  ON public.ayah_knowledge FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "ayah_knowledge_staff_write" ON public.ayah_knowledge;
CREATE POLICY "ayah_knowledge_staff_write"
  ON public.ayah_knowledge FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- -----------------------------------------------------------------------------
-- Hifz — students READ only; staff WRITE
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "hifz_progress_select" ON public.hifz_progress;
CREATE POLICY "hifz_progress_select"
  ON public.hifz_progress FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "hifz_progress_staff_write" ON public.hifz_progress;
CREATE POLICY "hifz_progress_staff_write"
  ON public.hifz_progress FOR INSERT TO authenticated
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "hifz_progress_staff_update" ON public.hifz_progress;
CREATE POLICY "hifz_progress_staff_update"
  ON public.hifz_progress FOR UPDATE TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "hifz_progress_staff_delete" ON public.hifz_progress;
CREATE POLICY "hifz_progress_staff_delete"
  ON public.hifz_progress FOR DELETE TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS "hifz_daily_select" ON public.hifz_daily_records;
CREATE POLICY "hifz_daily_select"
  ON public.hifz_daily_records FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "hifz_daily_staff_insert" ON public.hifz_daily_records;
CREATE POLICY "hifz_daily_staff_insert"
  ON public.hifz_daily_records FOR INSERT TO authenticated
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "hifz_daily_staff_update" ON public.hifz_daily_records;
CREATE POLICY "hifz_daily_staff_update"
  ON public.hifz_daily_records FOR UPDATE TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "hifz_daily_staff_delete" ON public.hifz_daily_records;
CREATE POLICY "hifz_daily_staff_delete"
  ON public.hifz_daily_records FOR DELETE TO authenticated
  USING (public.is_staff());

-- -----------------------------------------------------------------------------
-- Tests — students cannot create/modify tests; can take assigned ones
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "tests_select" ON public.tests;
CREATE POLICY "tests_select"
  ON public.tests FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (course_id IS NOT NULL AND public.teacher_manages_course(course_id))
    OR (
      is_published = TRUE
      AND (
        EXISTS (
          SELECT 1 FROM public.test_assignments ta
          WHERE ta.test_id = id AND ta.student_id = auth.uid()
        )
        OR (course_id IS NOT NULL AND public.student_enrolled(course_id))
      )
    )
  );

DROP POLICY IF EXISTS "tests_staff_write" ON public.tests;
CREATE POLICY "tests_staff_write"
  ON public.tests FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR (course_id IS NOT NULL AND public.teacher_manages_course(course_id))
  )
  WITH CHECK (
    public.is_admin()
    OR (course_id IS NOT NULL AND public.teacher_manages_course(course_id))
  );

DROP POLICY IF EXISTS "test_questions_select" ON public.test_questions;
CREATE POLICY "test_questions_select"
  ON public.test_questions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = test_id
        AND (
          public.is_admin()
          OR (t.course_id IS NOT NULL AND public.teacher_manages_course(t.course_id))
          OR (
            t.is_published
            AND EXISTS (
              SELECT 1 FROM public.test_assignments ta
              WHERE ta.test_id = t.id AND ta.student_id = auth.uid()
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS "test_questions_staff_write" ON public.test_questions;
CREATE POLICY "test_questions_staff_write"
  ON public.test_questions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = test_id
        AND (
          public.is_admin()
          OR (t.course_id IS NOT NULL AND public.teacher_manages_course(t.course_id))
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = test_id
        AND (
          public.is_admin()
          OR (t.course_id IS NOT NULL AND public.teacher_manages_course(t.course_id))
        )
    )
  );

-- Options: hide is_correct from students via view ideally; policy allows select for assigned
-- (clients must not rely on is_correct until graded — consider a secure view in future)
DROP POLICY IF EXISTS "test_options_select" ON public.test_options;
CREATE POLICY "test_options_select"
  ON public.test_options FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.test_questions q
      JOIN public.tests t ON t.id = q.test_id
      WHERE q.id = question_id
        AND (
          public.is_admin()
          OR (t.course_id IS NOT NULL AND public.teacher_manages_course(t.course_id))
          OR (
            t.is_published
            AND EXISTS (
              SELECT 1 FROM public.test_assignments ta
              WHERE ta.test_id = t.id AND ta.student_id = auth.uid()
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS "test_options_staff_write" ON public.test_options;
CREATE POLICY "test_options_staff_write"
  ON public.test_options FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.test_questions q
      JOIN public.tests t ON t.id = q.test_id
      WHERE q.id = question_id
        AND (
          public.is_admin()
          OR (t.course_id IS NOT NULL AND public.teacher_manages_course(t.course_id))
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.test_questions q
      JOIN public.tests t ON t.id = q.test_id
      WHERE q.id = question_id
        AND (
          public.is_admin()
          OR (t.course_id IS NOT NULL AND public.teacher_manages_course(t.course_id))
        )
    )
  );

DROP POLICY IF EXISTS "test_assignments_select" ON public.test_assignments;
CREATE POLICY "test_assignments_select"
  ON public.test_assignments FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR public.is_staff()
  );

DROP POLICY IF EXISTS "test_assignments_staff_write" ON public.test_assignments;
CREATE POLICY "test_assignments_staff_write"
  ON public.test_assignments FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "test_attempts_select" ON public.test_attempts;
CREATE POLICY "test_attempts_select"
  ON public.test_attempts FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "test_attempts_student_insert" ON public.test_attempts;
CREATE POLICY "test_attempts_student_insert"
  ON public.test_attempts FOR INSERT TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.test_assignments ta
      WHERE ta.test_id = test_attempts.test_id
        AND ta.student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "test_attempts_student_update" ON public.test_attempts;
CREATE POLICY "test_attempts_student_update"
  ON public.test_attempts FOR UPDATE TO authenticated
  USING (
    (student_id = auth.uid() AND status = 'in_progress')
    OR public.is_staff()
  )
  WITH CHECK (
    (student_id = auth.uid())
    OR public.is_staff()
  );

DROP POLICY IF EXISTS "test_answers_select" ON public.test_answers;
CREATE POLICY "test_answers_select"
  ON public.test_answers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.test_attempts a
      WHERE a.id = attempt_id
        AND (a.student_id = auth.uid() OR public.is_staff())
    )
  );

DROP POLICY IF EXISTS "test_answers_student_write" ON public.test_answers;
CREATE POLICY "test_answers_student_write"
  ON public.test_answers FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.test_attempts a
      WHERE a.id = attempt_id
        AND a.student_id = auth.uid()
        AND a.status = 'in_progress'
    )
  );

DROP POLICY IF EXISTS "test_answers_student_update" ON public.test_answers;
CREATE POLICY "test_answers_student_update"
  ON public.test_answers FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.test_attempts a
      WHERE a.id = attempt_id
        AND (
          (a.student_id = auth.uid() AND a.status = 'in_progress')
          OR public.is_staff()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.test_attempts a
      WHERE a.id = attempt_id
        AND (
          (a.student_id = auth.uid() AND a.status = 'in_progress')
          OR public.is_staff()
        )
    )
  );

-- -----------------------------------------------------------------------------
-- Attendance — students read own; staff write
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "attendance_sessions_select" ON public.attendance_sessions;
CREATE POLICY "attendance_sessions_select"
  ON public.attendance_sessions FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR public.teacher_manages_course(course_id)
    OR public.student_enrolled(course_id)
  );

DROP POLICY IF EXISTS "attendance_sessions_staff_write" ON public.attendance_sessions;
CREATE POLICY "attendance_sessions_staff_write"
  ON public.attendance_sessions FOR ALL TO authenticated
  USING (
    public.is_admin() OR public.teacher_manages_course(course_id)
  )
  WITH CHECK (
    public.is_admin() OR public.teacher_manages_course(course_id)
  );

DROP POLICY IF EXISTS "attendance_records_select" ON public.attendance_records;
CREATE POLICY "attendance_records_select"
  ON public.attendance_records FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR public.is_staff()
  );

DROP POLICY IF EXISTS "attendance_records_staff_write" ON public.attendance_records;
CREATE POLICY "attendance_records_staff_write"
  ON public.attendance_records FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- -----------------------------------------------------------------------------
-- Recorded / live classes
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "recorded_classes_select" ON public.recorded_classes;
CREATE POLICY "recorded_classes_select"
  ON public.recorded_classes FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (course_id IS NOT NULL AND public.teacher_manages_course(course_id))
    OR (
      is_published = TRUE
      AND course_id IS NOT NULL
      AND public.student_enrolled(course_id)
    )
  );

DROP POLICY IF EXISTS "recorded_classes_staff_write" ON public.recorded_classes;
CREATE POLICY "recorded_classes_staff_write"
  ON public.recorded_classes FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR (course_id IS NOT NULL AND public.teacher_manages_course(course_id))
  )
  WITH CHECK (
    public.is_admin()
    OR (course_id IS NOT NULL AND public.teacher_manages_course(course_id))
  );

DROP POLICY IF EXISTS "live_classes_select" ON public.live_classes;
CREATE POLICY "live_classes_select"
  ON public.live_classes FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (course_id IS NOT NULL AND public.teacher_manages_course(course_id))
    OR (course_id IS NOT NULL AND public.student_enrolled(course_id))
    OR host_id = auth.uid()
  );

DROP POLICY IF EXISTS "live_classes_staff_write" ON public.live_classes;
CREATE POLICY "live_classes_staff_write"
  ON public.live_classes FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR (course_id IS NOT NULL AND public.teacher_manages_course(course_id))
  )
  WITH CHECK (
    public.is_admin()
    OR (course_id IS NOT NULL AND public.teacher_manages_course(course_id))
  );

-- -----------------------------------------------------------------------------
-- Library & duas
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "library_select" ON public.library_resources;
CREATE POLICY "library_select"
  ON public.library_resources FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR is_public = TRUE
    OR (course_id IS NOT NULL AND public.student_enrolled(course_id))
  );

DROP POLICY IF EXISTS "library_staff_write" ON public.library_resources;
CREATE POLICY "library_staff_write"
  ON public.library_resources FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "daily_duas_select" ON public.daily_duas;
CREATE POLICY "daily_duas_select"
  ON public.daily_duas FOR SELECT TO authenticated
  USING (is_published = TRUE OR public.is_staff());

DROP POLICY IF EXISTS "daily_duas_staff_write" ON public.daily_duas;
CREATE POLICY "daily_duas_staff_write"
  ON public.daily_duas FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- -----------------------------------------------------------------------------
-- Certificates, points, badges
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "certificates_select" ON public.certificates;
CREATE POLICY "certificates_select"
  ON public.certificates FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "certificates_staff_write" ON public.certificates;
CREATE POLICY "certificates_staff_write"
  ON public.certificates FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "points_select" ON public.points_ledger;
CREATE POLICY "points_select"
  ON public.points_ledger FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "points_staff_write" ON public.points_ledger;
CREATE POLICY "points_staff_write"
  ON public.points_ledger FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "badges_select" ON public.badges;
CREATE POLICY "badges_select"
  ON public.badges FOR SELECT TO authenticated
  USING (is_active = TRUE OR public.is_staff());

DROP POLICY IF EXISTS "badges_admin_write" ON public.badges;
CREATE POLICY "badges_admin_write"
  ON public.badges FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "student_badges_select" ON public.student_badges;
CREATE POLICY "student_badges_select"
  ON public.student_badges FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "student_badges_staff_write" ON public.student_badges;
CREATE POLICY "student_badges_staff_write"
  ON public.student_badges FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- -----------------------------------------------------------------------------
-- Notifications
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_staff_insert" ON public.notifications;
CREATE POLICY "notifications_staff_insert"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "notifications_delete_own_or_admin" ON public.notifications;
CREATE POLICY "notifications_delete_own_or_admin"
  ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- -----------------------------------------------------------------------------
-- Groups / members / messages
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "groups_select" ON public.groups;
CREATE POLICY "groups_select"
  ON public.groups FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR public.is_group_member(id)
    OR (
      course_id IS NOT NULL
      AND (
        public.teacher_manages_course(course_id)
        OR public.student_enrolled(course_id)
      )
    )
  );

DROP POLICY IF EXISTS "groups_staff_write" ON public.groups;
CREATE POLICY "groups_staff_write"
  ON public.groups FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "group_members_select" ON public.group_members;
CREATE POLICY "group_members_select"
  ON public.group_members FOR SELECT TO authenticated
  USING (
    public.is_group_member(group_id)
    OR public.is_staff()
  );

DROP POLICY IF EXISTS "group_members_staff_write" ON public.group_members;
CREATE POLICY "group_members_staff_write"
  ON public.group_members FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Messages: members can read; posting rules depend on group_type
DROP POLICY IF EXISTS "group_messages_select" ON public.group_messages;
CREATE POLICY "group_messages_select"
  ON public.group_messages FOR SELECT TO authenticated
  USING (public.is_group_member(group_id) OR public.is_admin());

DROP POLICY IF EXISTS "group_messages_insert" ON public.group_messages;
CREATE POLICY "group_messages_insert"
  ON public.group_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_group_member(group_id)
    AND (
      -- Chat: any member may post
      EXISTS (
        SELECT 1 FROM public.groups g
        WHERE g.id = group_id AND g.group_type = 'chat'
      )
      -- Announcement: staff only
      OR (
        public.is_staff()
        AND EXISTS (
          SELECT 1 FROM public.groups g
          WHERE g.id = group_id AND g.group_type = 'announcement'
        )
      )
    )
  );

DROP POLICY IF EXISTS "group_messages_update_own_or_staff" ON public.group_messages;
CREATE POLICY "group_messages_update_own_or_staff"
  ON public.group_messages FOR UPDATE TO authenticated
  USING (sender_id = auth.uid() OR public.is_staff())
  WITH CHECK (sender_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "group_messages_delete_own_or_staff" ON public.group_messages;
CREATE POLICY "group_messages_delete_own_or_staff"
  ON public.group_messages FOR DELETE TO authenticated
  USING (sender_id = auth.uid() OR public.is_staff());

-- -----------------------------------------------------------------------------
-- Announcements
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "announcements_select" ON public.announcements;
CREATE POLICY "announcements_select"
  ON public.announcements FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR (
      is_published = TRUE
      AND (
        course_id IS NULL
        OR public.student_enrolled(course_id)
        OR (group_id IS NOT NULL AND public.is_group_member(group_id))
      )
    )
  );

DROP POLICY IF EXISTS "announcements_staff_write" ON public.announcements;
CREATE POLICY "announcements_staff_write"
  ON public.announcements FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- -----------------------------------------------------------------------------
-- about_jamia & preferences
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "about_jamia_select" ON public.about_jamia;
CREATE POLICY "about_jamia_select"
  ON public.about_jamia FOR SELECT TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "about_jamia_select_anon" ON public.about_jamia;
CREATE POLICY "about_jamia_select_anon"
  ON public.about_jamia FOR SELECT TO anon
  USING (TRUE);

DROP POLICY IF EXISTS "about_jamia_admin_write" ON public.about_jamia;
CREATE POLICY "about_jamia_admin_write"
  ON public.about_jamia FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "user_preferences_own" ON public.user_preferences;
CREATE POLICY "user_preferences_own"
  ON public.user_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Allow public read of published course catalog metadata for marketing pages
DROP POLICY IF EXISTS "courses_select_anon_published" ON public.courses;
CREATE POLICY "courses_select_anon_published"
  ON public.courses FOR SELECT TO anon
  USING (is_published = TRUE);

DROP POLICY IF EXISTS "course_translations_select_anon" ON public.course_translations;
CREATE POLICY "course_translations_select_anon"
  ON public.course_translations FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.is_published = TRUE
    )
  );

DROP POLICY IF EXISTS "daily_duas_select_anon" ON public.daily_duas;
CREATE POLICY "daily_duas_select_anon"
  ON public.daily_duas FOR SELECT TO anon
  USING (is_published = TRUE);

DROP POLICY IF EXISTS "badges_select_anon" ON public.badges;
CREATE POLICY "badges_select_anon"
  ON public.badges FOR SELECT TO anon
  USING (is_active = TRUE);
