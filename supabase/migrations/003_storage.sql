-- =============================================================================
-- Saut Ul Quran — 003_storage.sql
-- Storage buckets + RLS policies on storage.objects
-- =============================================================================

-- Buckets (private where media may contain student/course content)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('course-videos', 'course-videos', FALSE, 524288000, ARRAY['video/mp4', 'video/webm', 'video/quicktime']),
  ('course-audio', 'course-audio', FALSE, 104857600, ARRAY['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm']),
  ('course-notes', 'course-notes', FALSE, 52428800, ARRAY['application/pdf', 'text/plain', 'text/markdown', 'image/png', 'image/jpeg', 'image/webp']),
  ('recorded-classes', 'recorded-classes', FALSE, 1073741824, ARRAY['video/mp4', 'video/webm', 'video/quicktime']),
  ('dua-audio', 'dua-audio', TRUE, 20971520, ARRAY['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg']),
  ('ayah-audio', 'ayah-audio', TRUE, 20971520, ARRAY['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg']),
  ('logos', 'logos', TRUE, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('certificates', 'certificates', FALSE, 20971520, ARRAY['application/pdf', 'image/png', 'image/jpeg']),
  ('chat-media', 'chat-media', FALSE, 20971520, ARRAY['image/png', 'image/jpeg', 'image/webp', 'audio/mpeg', 'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/wav', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- Helper: folder convention
--   course-* / recorded-classes : {course_id}/...
--   certificates                : {student_id}/...
--   chat-media                  : {group_id}/...
--   logos / dua-audio / ayah-audio : free path under bucket
-- -----------------------------------------------------------------------------

-- Drop existing policies for idempotency (namespaced)
DO $$
DECLARE
  pol TEXT;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname LIKE 'suq_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol);
  END LOOP;
END $$;

-- logos: public read; staff write
CREATE POLICY "suq_logos_public_read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'logos');

CREATE POLICY "suq_logos_staff_write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos' AND public.is_staff());

CREATE POLICY "suq_logos_staff_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'logos' AND public.is_staff())
  WITH CHECK (bucket_id = 'logos' AND public.is_staff());

CREATE POLICY "suq_logos_staff_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'logos' AND public.is_admin());

-- dua-audio / ayah-audio: public read; staff write
CREATE POLICY "suq_dua_audio_public_read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'dua-audio');

CREATE POLICY "suq_dua_audio_staff_write"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'dua-audio' AND public.is_staff())
  WITH CHECK (bucket_id = 'dua-audio' AND public.is_staff());

CREATE POLICY "suq_ayah_audio_public_read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'ayah-audio');

CREATE POLICY "suq_ayah_audio_staff_write"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'ayah-audio' AND public.is_staff())
  WITH CHECK (bucket_id = 'ayah-audio' AND public.is_staff());

-- course-videos / course-audio / course-notes: enrolled students or staff
CREATE POLICY "suq_course_videos_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'course-videos'
    AND (
      public.is_staff()
      OR public.student_enrolled((storage.foldername(name))[1]::uuid)
      OR public.teacher_manages_course((storage.foldername(name))[1]::uuid)
    )
  );

CREATE POLICY "suq_course_videos_staff_write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'course-videos'
    AND (
      public.is_admin()
      OR public.teacher_manages_course((storage.foldername(name))[1]::uuid)
    )
  );

CREATE POLICY "suq_course_videos_staff_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'course-videos'
    AND (
      public.is_admin()
      OR public.teacher_manages_course((storage.foldername(name))[1]::uuid)
    )
  )
  WITH CHECK (
    bucket_id = 'course-videos'
    AND (
      public.is_admin()
      OR public.teacher_manages_course((storage.foldername(name))[1]::uuid)
    )
  );

CREATE POLICY "suq_course_videos_staff_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'course-videos'
    AND (
      public.is_admin()
      OR public.teacher_manages_course((storage.foldername(name))[1]::uuid)
    )
  );

CREATE POLICY "suq_course_audio_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'course-audio'
    AND (
      public.is_staff()
      OR public.student_enrolled((storage.foldername(name))[1]::uuid)
      OR public.teacher_manages_course((storage.foldername(name))[1]::uuid)
    )
  );

CREATE POLICY "suq_course_audio_staff_write"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'course-audio'
    AND (
      public.is_admin()
      OR public.teacher_manages_course((storage.foldername(name))[1]::uuid)
    )
  )
  WITH CHECK (
    bucket_id = 'course-audio'
    AND (
      public.is_admin()
      OR public.teacher_manages_course((storage.foldername(name))[1]::uuid)
    )
  );

CREATE POLICY "suq_course_notes_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'course-notes'
    AND (
      public.is_staff()
      OR public.student_enrolled((storage.foldername(name))[1]::uuid)
      OR public.teacher_manages_course((storage.foldername(name))[1]::uuid)
    )
  );

CREATE POLICY "suq_course_notes_staff_write"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'course-notes'
    AND (
      public.is_admin()
      OR public.teacher_manages_course((storage.foldername(name))[1]::uuid)
    )
  )
  WITH CHECK (
    bucket_id = 'course-notes'
    AND (
      public.is_admin()
      OR public.teacher_manages_course((storage.foldername(name))[1]::uuid)
    )
  );

-- recorded-classes
CREATE POLICY "suq_recorded_classes_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'recorded-classes'
    AND (
      public.is_staff()
      OR public.student_enrolled((storage.foldername(name))[1]::uuid)
      OR public.teacher_manages_course((storage.foldername(name))[1]::uuid)
    )
  );

CREATE POLICY "suq_recorded_classes_staff_write"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'recorded-classes'
    AND (
      public.is_admin()
      OR public.teacher_manages_course((storage.foldername(name))[1]::uuid)
    )
  )
  WITH CHECK (
    bucket_id = 'recorded-classes'
    AND (
      public.is_admin()
      OR public.teacher_manages_course((storage.foldername(name))[1]::uuid)
    )
  );

-- certificates: student owns folder {student_id}/...
CREATE POLICY "suq_certificates_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'certificates'
    AND (
      public.is_staff()
      OR (storage.foldername(name))[1] = auth.uid()::text
    )
  );

CREATE POLICY "suq_certificates_staff_write"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'certificates' AND public.is_staff())
  WITH CHECK (bucket_id = 'certificates' AND public.is_staff());

-- chat-media: group members; path {group_id}/...
CREATE POLICY "suq_chat_media_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-media'
    AND (
      public.is_admin()
      OR public.is_group_member((storage.foldername(name))[1]::uuid)
    )
  );

CREATE POLICY "suq_chat_media_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-media'
    AND public.is_group_member((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "suq_chat_media_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'chat-media'
    AND (
      public.is_staff()
      OR owner = auth.uid()
    )
  );
