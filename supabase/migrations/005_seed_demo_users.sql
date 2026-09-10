-- =============================================================================
-- Saut Ul Quran — 005_seed_demo_users.sql  (OPTIONAL)
-- =============================================================================
-- PURPOSE
--   Wire DEMO teacher/student rows to real auth.users after you create them.
--   This script does NOT insert into auth.users (requires Auth Admin / Dashboard).
--
-- INSTRUCTIONS
--   1. Apply 001–004 first.
--   2. In Supabase Dashboard → Authentication → Users, create:
--        Email: teacher@demo.sautulquran.local   Password: (choose securely)
--        Email: student@demo.sautulquran.local   Password: (choose securely)
--        Optional admin: admin@demo.sautulquran.local
--      Or use Auth Admin API / supabase.auth.admin.createUser().
--   3. Copy each user's UUID from the dashboard.
--   4. Replace the three placeholders below (KEEP the same UUIDs if you recreate
--      demo users with fixed IDs via Admin API — see "Fixed UUID option").
--   5. Run this file in SQL Editor (service role / postgres).
--
-- FIXED UUID OPTION (Admin API example)
--   When creating users via service role you may set:
--     id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'  -- teacher
--     id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'  -- student
--     id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa0'  -- admin
--   Then this script works as-is without edits.
--
-- DEMO label: all rows below are for local/demo environments only.
-- =============================================================================

-- >>> REPLACE these if your Auth user IDs differ <<<
DO $$
DECLARE
  v_admin   UUID := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa0';
  v_teacher UUID := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
  v_student UUID := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2';
BEGIN
  -- Abort clearly if profiles were never created (auth users missing)
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_teacher) THEN
    RAISE EXCEPTION
      'DEMO teacher profile % not found. Create the Auth user first (or fix UUID).',
      v_teacher;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_student) THEN
    RAISE EXCEPTION
      'DEMO student profile % not found. Create the Auth user first (or fix UUID).',
      v_student;
  END IF;

  -- Profiles polish (DEMO)
  UPDATE public.profiles
  SET
    full_name = 'DEMO Teacher — Hafiza Demo',
    full_name_ur = 'ڈیمو استاذہ',
    locale = 'en',
    is_active = TRUE
  WHERE id = v_teacher;

  UPDATE public.profiles
  SET
    full_name = 'DEMO Student — Fatima Demo',
    full_name_ur = 'ڈیمو طالبہ',
    locale = 'ur',
    is_active = TRUE
  WHERE id = v_student;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_admin) THEN
    UPDATE public.profiles
    SET full_name = 'DEMO Admin', locale = 'en', is_active = TRUE
    WHERE id = v_admin;

    INSERT INTO public.user_roles (user_id, role, granted_by)
    VALUES (v_admin, 'admin', v_admin)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_teacher, 'teacher')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Keep student role on student; teacher may keep or drop student role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_student, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Extension rows
  INSERT INTO public.teachers (profile_id, title, specialization, bio_en, bio_ur, is_active)
  VALUES (
    v_teacher,
    'Ustazah',
    'Tajweed & Hifz',
    'DEMO teacher account for Saut Ul Quran.',
    'ڈیمو استاذہ اکاؤنٹ۔',
    TRUE
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    title = EXCLUDED.title,
    specialization = EXCLUDED.specialization,
    is_active = TRUE;

  INSERT INTO public.students (profile_id, student_code, guardian_name, notes)
  VALUES (
    v_student,
    'DEMO-STU-001',
    'DEMO Guardian',
    'DEMO seed student'
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    student_code = EXCLUDED.student_code,
    notes = EXCLUDED.notes;

  -- Assign teacher to Tajweed + Hifz courses
  INSERT INTO public.course_teachers (course_id, teacher_id, is_primary, assigned_by)
  VALUES
    ('11111111-0001-4000-8000-000000000004', v_teacher, TRUE, COALESCE(v_admin, v_teacher)),
    ('11111111-0001-4000-8000-000000000002', v_teacher, TRUE, COALESCE(v_admin, v_teacher)),
    ('11111111-0001-4000-8000-000000000001', v_teacher, FALSE, COALESCE(v_admin, v_teacher))
  ON CONFLICT (course_id, teacher_id) DO UPDATE SET is_primary = EXCLUDED.is_primary;

  -- Staff-created enrollments (students cannot self-enroll)
  INSERT INTO public.enrollments (course_id, student_id, status, enrolled_by, notes)
  VALUES
    ('11111111-0001-4000-8000-000000000004', v_student, 'active', v_teacher, 'DEMO enrollment'),
    ('11111111-0001-4000-8000-000000000001', v_student, 'active', v_teacher, 'DEMO enrollment'),
    ('11111111-0001-4000-8000-000000000008', v_student, 'active', v_teacher, 'DEMO enrollment')
  ON CONFLICT (course_id, student_id) DO UPDATE SET
    status = 'active',
    enrolled_by = EXCLUDED.enrolled_by;

  -- Preferences
  INSERT INTO public.user_preferences (user_id, locale, theme)
  VALUES
    (v_teacher, 'en', 'system'),
    (v_student, 'ur', 'system')
  ON CONFLICT (user_id) DO UPDATE SET locale = EXCLUDED.locale;

  -- Course announcement + chat groups
  INSERT INTO public.groups (id, name, name_ur, group_type, course_id, created_by, description)
  VALUES
    (
      'a3000000-0000-4000-8000-000000000001',
      'Tajweed Announcements (DEMO)',
      'تجوید اعلانات (ڈیمو)',
      'announcement',
      '11111111-0001-4000-8000-000000000004',
      v_teacher,
      'DEMO — Staff posts only; students read.'
    ),
    (
      'a3000000-0000-4000-8000-000000000002',
      'Tajweed Class Chat (DEMO)',
      'تجوید کلاس چیٹ (ڈیمو)',
      'chat',
      '11111111-0001-4000-8000-000000000004',
      v_teacher,
      'DEMO — Members may post.'
    )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    group_type = EXCLUDED.group_type,
    is_active = TRUE;

  INSERT INTO public.group_members (group_id, user_id, role_in_group)
  VALUES
    ('a3000000-0000-4000-8000-000000000001', v_teacher, 'moderator'),
    ('a3000000-0000-4000-8000-000000000001', v_student, 'member'),
    ('a3000000-0000-4000-8000-000000000002', v_teacher, 'moderator'),
    ('a3000000-0000-4000-8000-000000000002', v_student, 'member')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  -- Staff announcement message (announcement group)
  INSERT INTO public.group_messages (group_id, sender_id, body)
  SELECT
    'a3000000-0000-4000-8000-000000000001',
    v_teacher,
    'DEMO: Welcome to Tajweed class. Please revise Al-Fatiha with tajweed colors.'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.group_messages
    WHERE group_id = 'a3000000-0000-4000-8000-000000000001'
      AND body LIKE 'DEMO: Welcome to Tajweed%'
  );

  INSERT INTO public.announcements (
    course_id, group_id, title_en, title_ur, body_en, body_ur,
    published_by, is_pinned, is_published
  )
  SELECT
    '11111111-0001-4000-8000-000000000004',
    'a3000000-0000-4000-8000-000000000001',
    'Welcome (DEMO)',
    'خوش آمدید (ڈیمو)',
    'DEMO announcement for enrolled Tajweed students.',
    'ڈیمو اعلان برائے تجوید کے طلبہ۔',
    v_teacher,
    TRUE,
    TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM public.announcements
    WHERE title_en = 'Welcome (DEMO)'
      AND course_id = '11111111-0001-4000-8000-000000000004'
  );

  -- Sample hifz progress (staff-written)
  INSERT INTO public.hifz_progress (
    student_id, surah_id, ayah_from, ayah_to, status, assigned_by, notes
  )
  SELECT
    v_student,
    'e1000000-0000-4000-8000-000000000001',
    1, 7, 'in_progress', v_teacher,
    'DEMO — Memorizing Al-Fatiha'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.hifz_progress
    WHERE student_id = v_student
      AND surah_id = 'e1000000-0000-4000-8000-000000000001'
  );

  RAISE NOTICE 'DEMO user seed applied for teacher %, student %', v_teacher, v_student;
END $$;
