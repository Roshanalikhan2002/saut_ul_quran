-- =============================================================================
-- Saut Ul Quran — 001_schema.sql
-- Full normalized PostgreSQL schema for Jamia Saut-ul-Quran learning platform
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.app_locale AS ENUM ('en', 'ur');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.content_type AS ENUM (
    'video', 'audio', 'text', 'pdf', 'html', 'quiz', 'image', 'link'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.enrollment_status AS ENUM (
    'pending', 'active', 'completed', 'withdrawn', 'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.attendance_status AS ENUM (
    'present', 'absent', 'late', 'excused'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.test_lifecycle AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.question_type AS ENUM (
    'multiple_choice', 'true_false', 'short_answer', 'recitation'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.attempt_status AS ENUM (
    'in_progress', 'submitted', 'graded'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.group_type AS ENUM ('chat', 'announcement');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM (
    'info', 'announcement', 'test', 'attendance', 'certificate',
    'badge', 'enrollment', 'live_class', 'system'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.hifz_status AS ENUM (
    'not_started', 'in_progress', 'memorized', 'revised', 'weak'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.live_class_status AS ENUM (
    'scheduled', 'live', 'ended', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.resource_type AS ENUM (
    'pdf', 'audio', 'video', 'link', 'document', 'image'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.certificate_status AS ENUM (
    'pending', 'issued', 'revoked'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.lesson_progress_status AS ENUM (
    'not_started', 'in_progress', 'completed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.revelation_type AS ENUM ('makki', 'madani');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- Utility: updated_at trigger
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- Profiles (linked to auth.users)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email         TEXT,
  full_name     TEXT,
  full_name_ur  TEXT,
  avatar_url    TEXT,
  phone         TEXT,
  locale        public.app_locale NOT NULL DEFAULT 'en',
  bio           TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles (is_active);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role       public.app_role NOT NULL,
  granted_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles (role);

-- Auto-create profile + default student role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, locale)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'locale')::public.app_locale, 'en')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Students & Teachers (role-specific extensions)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.students (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL UNIQUE REFERENCES public.profiles (id) ON DELETE CASCADE,
  student_code    TEXT UNIQUE,
  guardian_name   TEXT,
  guardian_phone  TEXT,
  date_of_birth   DATE,
  gender          TEXT,
  address         TEXT,
  notes           TEXT,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_students_profile_id ON public.students (profile_id);
CREATE INDEX IF NOT EXISTS idx_students_code ON public.students (student_code);

DROP TRIGGER IF EXISTS trg_students_updated_at ON public.students;
CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.teachers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL UNIQUE REFERENCES public.profiles (id) ON DELETE CASCADE,
  title           TEXT,
  specialization  TEXT,
  bio_en          TEXT,
  bio_ur          TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  hired_at        TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_teachers_profile_id ON public.teachers (profile_id);
CREATE INDEX IF NOT EXISTS idx_teachers_is_active ON public.teachers (is_active);

DROP TRIGGER IF EXISTS trg_teachers_updated_at ON public.teachers;
CREATE TRIGGER trg_teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Courses, lessons, content
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.courses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT NOT NULL UNIQUE,
  cover_image_url  TEXT,
  difficulty       TEXT DEFAULT 'beginner',
  estimated_hours  NUMERIC(6, 1),
  is_published     BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_by       UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_courses_published ON public.courses (is_published);
CREATE INDEX IF NOT EXISTS idx_courses_sort ON public.courses (sort_order);

DROP TRIGGER IF EXISTS trg_courses_updated_at ON public.courses;
CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.course_translations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  locale      public.app_locale NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  UNIQUE (course_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_course_translations_course ON public.course_translations (course_id);

CREATE TABLE IF NOT EXISTS public.lessons (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id        UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  slug             TEXT NOT NULL,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER,
  is_published     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (course_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_lessons_course ON public.lessons (course_id, sort_order);

DROP TRIGGER IF EXISTS trg_lessons_updated_at ON public.lessons;
CREATE TRIGGER trg_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.lesson_translations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id  UUID NOT NULL REFERENCES public.lessons (id) ON DELETE CASCADE,
  locale     public.app_locale NOT NULL,
  title      TEXT NOT NULL,
  summary    TEXT,
  UNIQUE (lesson_id, locale)
);

CREATE TABLE IF NOT EXISTS public.lesson_content (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id       UUID NOT NULL REFERENCES public.lessons (id) ON DELETE CASCADE,
  content_type    public.content_type NOT NULL,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  storage_path    TEXT,
  external_url    TEXT,
  body_markdown   TEXT,
  body_html       TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_lesson_content_lesson ON public.lesson_content (lesson_id, sort_order);

DROP TRIGGER IF EXISTS trg_lesson_content_updated_at ON public.lesson_content;
CREATE TRIGGER trg_lesson_content_updated_at
  BEFORE UPDATE ON public.lesson_content
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.course_teachers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  teacher_id  UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  assigned_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  UNIQUE (course_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS idx_course_teachers_teacher ON public.course_teachers (teacher_id);
CREATE INDEX IF NOT EXISTS idx_course_teachers_course ON public.course_teachers (course_id);

-- Students cannot self-enroll; enrolled_by must be staff in application logic / RLS
CREATE TABLE IF NOT EXISTS public.enrollments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  student_id   UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status       public.enrollment_status NOT NULL DEFAULT 'active',
  enrolled_by  UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  enrolled_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  completed_at TIMESTAMPTZ,
  notes        TEXT,
  UNIQUE (course_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments (student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments (course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments (status);

CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id             UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  lesson_id              UUID NOT NULL REFERENCES public.lessons (id) ON DELETE CASCADE,
  status                 public.lesson_progress_status NOT NULL DEFAULT 'not_started',
  progress_percent       NUMERIC(5, 2) NOT NULL DEFAULT 0
                           CHECK (progress_percent >= 0 AND progress_percent <= 100),
  last_position_seconds  INTEGER NOT NULL DEFAULT 0,
  completed_at           TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (student_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_student ON public.lesson_progress (student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON public.lesson_progress (lesson_id);

DROP TRIGGER IF EXISTS trg_lesson_progress_updated_at ON public.lesson_progress;
CREATE TRIGGER trg_lesson_progress_updated_at
  BEFORE UPDATE ON public.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Quran reference data
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.paras (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number   SMALLINT NOT NULL UNIQUE CHECK (number BETWEEN 1 AND 30),
  name_ar  TEXT,
  name_en  TEXT,
  name_ur  TEXT
);

CREATE TABLE IF NOT EXISTS public.surahs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number          SMALLINT NOT NULL UNIQUE CHECK (number BETWEEN 1 AND 114),
  name_ar         TEXT NOT NULL,
  name_en         TEXT NOT NULL,
  name_ur         TEXT,
  revelation_type public.revelation_type,
  ayah_count      SMALLINT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.ayahs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surah_id        UUID NOT NULL REFERENCES public.surahs (id) ON DELETE CASCADE,
  ayah_number     SMALLINT NOT NULL,
  text_ar         TEXT NOT NULL,
  text_uthmani    TEXT,
  translation_en  TEXT,
  translation_ur  TEXT,
  tajweed_markup  JSONB NOT NULL DEFAULT '[]'::jsonb,
  para_id         UUID REFERENCES public.paras (id) ON DELETE SET NULL,
  page_number     SMALLINT,
  juz_number      SMALLINT,
  UNIQUE (surah_id, ayah_number)
);

CREATE INDEX IF NOT EXISTS idx_ayahs_surah ON public.ayahs (surah_id, ayah_number);
CREATE INDEX IF NOT EXISTS idx_ayahs_para ON public.ayahs (para_id);
CREATE INDEX IF NOT EXISTS idx_ayahs_tajweed_gin ON public.ayahs USING GIN (tajweed_markup);

CREATE TABLE IF NOT EXISTS public.tajweed_rules (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code           TEXT NOT NULL UNIQUE,
  name_en        TEXT NOT NULL,
  name_ur        TEXT,
  description_en TEXT,
  description_ur TEXT,
  color_hex      TEXT,
  example_ar     TEXT,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.ayah_audio (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ayah_id          UUID NOT NULL REFERENCES public.ayahs (id) ON DELETE CASCADE,
  reciter          TEXT NOT NULL DEFAULT 'default',
  storage_path     TEXT,
  external_url     TEXT,
  duration_seconds NUMERIC(8, 2),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (ayah_id, reciter)
);

CREATE INDEX IF NOT EXISTS idx_ayah_audio_ayah ON public.ayah_audio (ayah_id);

CREATE TABLE IF NOT EXISTS public.ayah_knowledge (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  ayah_id          UUID NOT NULL REFERENCES public.ayahs (id) ON DELETE CASCADE,
  mastery_level    SMALLINT NOT NULL DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 5),
  last_reviewed_at TIMESTAMPTZ,
  notes            TEXT,
  updated_by       UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (student_id, ayah_id)
);

CREATE INDEX IF NOT EXISTS idx_ayah_knowledge_student ON public.ayah_knowledge (student_id);

DROP TRIGGER IF EXISTS trg_ayah_knowledge_updated_at ON public.ayah_knowledge;
CREATE TRIGGER trg_ayah_knowledge_updated_at
  BEFORE UPDATE ON public.ayah_knowledge
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Hifz tracking (teacher/admin write; students read own)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.hifz_progress (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  surah_id    UUID NOT NULL REFERENCES public.surahs (id) ON DELETE CASCADE,
  ayah_from   SMALLINT NOT NULL,
  ayah_to     SMALLINT NOT NULL,
  status      public.hifz_status NOT NULL DEFAULT 'not_started',
  assigned_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CHECK (ayah_to >= ayah_from)
);

CREATE INDEX IF NOT EXISTS idx_hifz_progress_student ON public.hifz_progress (student_id);
CREATE INDEX IF NOT EXISTS idx_hifz_progress_surah ON public.hifz_progress (surah_id);

DROP TRIGGER IF EXISTS trg_hifz_progress_updated_at ON public.hifz_progress;
CREATE TRIGGER trg_hifz_progress_updated_at
  BEFORE UPDATE ON public.hifz_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.hifz_daily_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  record_date     DATE NOT NULL DEFAULT (timezone('utc', now()))::date,
  surah_id        UUID REFERENCES public.surahs (id) ON DELETE SET NULL,
  ayah_from       SMALLINT,
  ayah_to         SMALLINT,
  pages_revised   NUMERIC(6, 2) DEFAULT 0,
  quality_rating  SMALLINT CHECK (quality_rating IS NULL OR quality_rating BETWEEN 1 AND 5),
  teacher_notes   TEXT,
  recorded_by     UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_hifz_daily_student_date
  ON public.hifz_daily_records (student_id, record_date DESC);

DROP TRIGGER IF EXISTS trg_hifz_daily_updated_at ON public.hifz_daily_records;
CREATE TRIGGER trg_hifz_daily_updated_at
  BEFORE UPDATE ON public.hifz_daily_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Tests & assessments
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.tests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id        UUID REFERENCES public.courses (id) ON DELETE SET NULL,
  created_by       UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  title_en         TEXT NOT NULL,
  title_ur         TEXT,
  description_en   TEXT,
  description_ur   TEXT,
  duration_minutes INTEGER,
  passing_score    NUMERIC(5, 2) NOT NULL DEFAULT 50,
  max_attempts     INTEGER DEFAULT 1,
  status           public.test_lifecycle NOT NULL DEFAULT 'draft',
  is_published     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_tests_course ON public.tests (course_id);
CREATE INDEX IF NOT EXISTS idx_tests_status ON public.tests (status);

DROP TRIGGER IF EXISTS trg_tests_updated_at ON public.tests;
CREATE TRIGGER trg_tests_updated_at
  BEFORE UPDATE ON public.tests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.test_questions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id      UUID NOT NULL REFERENCES public.tests (id) ON DELETE CASCADE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  question_type public.question_type NOT NULL DEFAULT 'multiple_choice',
  prompt_en    TEXT NOT NULL,
  prompt_ur    TEXT,
  points       NUMERIC(6, 2) NOT NULL DEFAULT 1,
  metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_test_questions_test ON public.test_questions (test_id, sort_order);

CREATE TABLE IF NOT EXISTS public.test_options (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id  UUID NOT NULL REFERENCES public.test_questions (id) ON DELETE CASCADE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  label_en     TEXT NOT NULL,
  label_ur     TEXT,
  is_correct   BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_test_options_question ON public.test_options (question_id);

CREATE TABLE IF NOT EXISTS public.test_assignments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id      UUID NOT NULL REFERENCES public.tests (id) ON DELETE CASCADE,
  student_id   UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  assigned_by  UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  due_at       TIMESTAMPTZ,
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (test_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_test_assignments_student ON public.test_assignments (student_id);

CREATE TABLE IF NOT EXISTS public.test_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.test_assignments (id) ON DELETE SET NULL,
  test_id       UUID NOT NULL REFERENCES public.tests (id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status        public.attempt_status NOT NULL DEFAULT 'in_progress',
  score         NUMERIC(6, 2),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  submitted_at  TIMESTAMPTZ,
  graded_by     UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  graded_at     TIMESTAMPTZ,
  feedback      TEXT
);

CREATE INDEX IF NOT EXISTS idx_test_attempts_student ON public.test_attempts (student_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_test ON public.test_attempts (test_id);

CREATE TABLE IF NOT EXISTS public.test_answers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id         UUID NOT NULL REFERENCES public.test_attempts (id) ON DELETE CASCADE,
  question_id        UUID NOT NULL REFERENCES public.test_questions (id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES public.test_options (id) ON DELETE SET NULL,
  answer_text        TEXT,
  is_correct         BOOLEAN,
  points_awarded     NUMERIC(6, 2),
  UNIQUE (attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_test_answers_attempt ON public.test_answers (attempt_id);

-- -----------------------------------------------------------------------------
-- Attendance
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  teacher_id   UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  session_date DATE NOT NULL DEFAULT (timezone('utc', now()))::date,
  title        TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_course
  ON public.attendance_sessions (course_id, session_date DESC);

DROP TRIGGER IF EXISTS trg_attendance_sessions_updated_at ON public.attendance_sessions;
CREATE TRIGGER trg_attendance_sessions_updated_at
  BEFORE UPDATE ON public.attendance_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES public.attendance_sessions (id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status      public.attendance_status NOT NULL DEFAULT 'present',
  notes       TEXT,
  marked_by   UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  marked_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON public.attendance_records (student_id);

-- -----------------------------------------------------------------------------
-- Live & recorded classes
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.recorded_classes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id        UUID REFERENCES public.courses (id) ON DELETE SET NULL,
  title_en         TEXT NOT NULL,
  title_ur         TEXT,
  description_en   TEXT,
  description_ur   TEXT,
  storage_path     TEXT,
  external_url     TEXT,
  duration_seconds INTEGER,
  recorded_at      TIMESTAMPTZ,
  uploaded_by      UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  is_published     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_recorded_classes_course ON public.recorded_classes (course_id);

DROP TRIGGER IF EXISTS trg_recorded_classes_updated_at ON public.recorded_classes;
CREATE TRIGGER trg_recorded_classes_updated_at
  BEFORE UPDATE ON public.recorded_classes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.live_classes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     UUID REFERENCES public.courses (id) ON DELETE SET NULL,
  title_en      TEXT NOT NULL,
  title_ur      TEXT,
  description_en TEXT,
  description_ur TEXT,
  scheduled_at  TIMESTAMPTZ NOT NULL,
  ends_at       TIMESTAMPTZ,
  meeting_url   TEXT,
  status        public.live_class_status NOT NULL DEFAULT 'scheduled',
  host_id       UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_live_classes_course ON public.live_classes (course_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_scheduled ON public.live_classes (scheduled_at);

DROP TRIGGER IF EXISTS trg_live_classes_updated_at ON public.live_classes;
CREATE TRIGGER trg_live_classes_updated_at
  BEFORE UPDATE ON public.live_classes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Library & daily duas
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.library_resources (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id      UUID REFERENCES public.courses (id) ON DELETE SET NULL,
  title_en       TEXT NOT NULL,
  title_ur       TEXT,
  description_en TEXT,
  description_ur TEXT,
  resource_type  public.resource_type NOT NULL DEFAULT 'pdf',
  storage_path   TEXT,
  external_url   TEXT,
  is_public      BOOLEAN NOT NULL DEFAULT FALSE,
  uploaded_by    UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_library_resources_course ON public.library_resources (course_id);
CREATE INDEX IF NOT EXISTS idx_library_resources_public ON public.library_resources (is_public);

DROP TRIGGER IF EXISTS trg_library_resources_updated_at ON public.library_resources;
CREATE TRIGGER trg_library_resources_updated_at
  BEFORE UPDATE ON public.library_resources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.daily_duas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE,
  title_en        TEXT NOT NULL,
  title_ur        TEXT,
  arabic_text     TEXT NOT NULL,
  transliteration TEXT,
  translation_en  TEXT,
  translation_ur  TEXT,
  audio_path      TEXT,
  category        TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_published    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_daily_duas_sort ON public.daily_duas (sort_order);

DROP TRIGGER IF EXISTS trg_daily_duas_updated_at ON public.daily_duas;
CREATE TRIGGER trg_daily_duas_updated_at
  BEFORE UPDATE ON public.daily_duas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Certificates, gamification
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.certificates (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id         UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  course_id          UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL UNIQUE,
  status             public.certificate_status NOT NULL DEFAULT 'pending',
  issued_at          TIMESTAMPTZ,
  issued_by          UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  storage_path       TEXT,
  metadata           JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (student_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_certificates_student ON public.certificates (student_id);

DROP TRIGGER IF EXISTS trg_certificates_updated_at ON public.certificates;
CREATE TRIGGER trg_certificates_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.points_ledger (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  points         INTEGER NOT NULL,
  reason         TEXT NOT NULL,
  reference_type TEXT,
  reference_id   UUID,
  created_by     UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_points_ledger_student
  ON public.points_ledger (student_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.badges (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT NOT NULL UNIQUE,
  name_en          TEXT NOT NULL,
  name_ur          TEXT,
  description_en   TEXT,
  description_ur   TEXT,
  icon_url         TEXT,
  points_required  INTEGER DEFAULT 0,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.student_badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  badge_id    UUID NOT NULL REFERENCES public.badges (id) ON DELETE CASCADE,
  awarded_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  awarded_by  UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  UNIQUE (student_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_student_badges_student ON public.student_badges (student_id);

-- -----------------------------------------------------------------------------
-- Notifications
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  type       public.notification_type NOT NULL DEFAULT 'info',
  title_en   TEXT NOT NULL,
  title_ur   TEXT,
  body_en    TEXT,
  body_ur    TEXT,
  link       TEXT,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  metadata   JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON public.notifications (user_id) WHERE is_read = FALSE;

-- -----------------------------------------------------------------------------
-- Groups & messaging
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  name_ur     TEXT,
  group_type  public.group_type NOT NULL DEFAULT 'chat',
  course_id   UUID REFERENCES public.courses (id) ON DELETE SET NULL,
  description TEXT,
  created_by  UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_groups_course ON public.groups (course_id);
CREATE INDEX IF NOT EXISTS idx_groups_type ON public.groups (group_type);

DROP TRIGGER IF EXISTS trg_groups_updated_at ON public.groups;
CREATE TRIGGER trg_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.group_members (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id       UUID NOT NULL REFERENCES public.groups (id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role_in_group  TEXT NOT NULL DEFAULT 'member',
  joined_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members (user_id);

CREATE TABLE IF NOT EXISTS public.group_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES public.groups (id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  body        TEXT,
  media_path  TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  edited_at   TIMESTAMPTZ,
  CHECK (body IS NOT NULL OR media_path IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_group_messages_group
  ON public.group_messages (group_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- Announcements & about
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.announcements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     UUID REFERENCES public.courses (id) ON DELETE CASCADE,
  group_id      UUID REFERENCES public.groups (id) ON DELETE SET NULL,
  title_en      TEXT NOT NULL,
  title_ur      TEXT,
  body_en       TEXT NOT NULL,
  body_ur       TEXT,
  published_by  UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  published_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  is_pinned     BOOLEAN NOT NULL DEFAULT FALSE,
  is_published  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_announcements_course ON public.announcements (course_id);
CREATE INDEX IF NOT EXISTS idx_announcements_published
  ON public.announcements (is_published, published_at DESC);

DROP TRIGGER IF EXISTS trg_announcements_updated_at ON public.announcements;
CREATE TRIGGER trg_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.about_jamia (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en         TEXT NOT NULL,
  name_ur         TEXT,
  location_en     TEXT,
  location_ur     TEXT,
  head_ustazah_en TEXT,
  head_ustazah_ur TEXT,
  mission_en      TEXT,
  mission_ur      TEXT,
  phone           TEXT,
  email           TEXT,
  website         TEXT,
  logo_url        TEXT,
  extra           JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS trg_about_jamia_updated_at ON public.about_jamia;
CREATE TRIGGER trg_about_jamia_updated_at
  BEFORE UPDATE ON public.about_jamia
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id             UUID PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  locale              public.app_locale NOT NULL DEFAULT 'en',
  theme               TEXT NOT NULL DEFAULT 'system',
  notification_email  BOOLEAN NOT NULL DEFAULT TRUE,
  notification_push   BOOLEAN NOT NULL DEFAULT TRUE,
  settings            JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS trg_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Helper role / access functions (SECURITY DEFINER — used by RLS)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.has_role(check_role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = check_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role('admin');
$$;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role('teacher');
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role('admin') OR public.has_role('teacher');
$$;

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
    );
$$;

CREATE OR REPLACE FUNCTION public.student_enrolled(p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.enrollments e
    WHERE e.course_id = p_course_id
      AND e.student_id = auth.uid()
      AND e.status IN ('active', 'completed')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.group_members gm
      WHERE gm.group_id = p_group_id
        AND gm.user_id = auth.uid()
    );
$$;

-- Grant execute on helpers to authenticated users
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_teacher() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.teacher_manages_course(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.student_enrolled(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_member(UUID) TO authenticated;

COMMENT ON TABLE public.profiles IS 'User profiles linked 1:1 with auth.users';
COMMENT ON TABLE public.enrollments IS 'Course enrollments — students cannot self-insert; staff only';
COMMENT ON TABLE public.hifz_daily_records IS 'Daily hifz logs — writable by staff only';
COMMENT ON FUNCTION public.is_staff() IS 'True if current user is admin or teacher';
