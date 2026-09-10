-- =============================================================================
-- Saut Ul Quran — 004_seed.sql
-- DEMO seed data (no auth.users inserts — safe to run with anon/service SQL)
-- =============================================================================
-- This seed inserts ONLY non-user-dependent rows:
--   about_jamia, courses + translations, badges, paras, surahs, ayahs,
--   tajweed_rules, daily_duas, sample library_resources (uploaded_by NULL)
--
-- After creating real Auth users, attach demo teacher/student with
--   supabase/migrations/005_seed_demo_users.sql (optional).
-- =============================================================================

-- Stable DEMO UUIDs for reference data (not auth users)
-- Course IDs
-- 11111111-0001-4000-8000-00000000000N

INSERT INTO public.about_jamia (
  id,
  name_en,
  name_ur,
  location_en,
  location_ur,
  head_ustazah_en,
  head_ustazah_ur,
  mission_en,
  mission_ur,
  email,
  extra
)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'Jamia Saut-ul-Quran',
  'جامعہ صوت القرآن',
  'Mandi Yala Tega, Tehsil Kamoke, District Gujranwala',
  'منڈی یالہ تیگہ، تحصیل کامونکی، ضلع گوجرانوالہ',
  'Hafiza Wajiha',
  'حافظہ وجیہہ',
  'Teaching the Quran with correct Tajweed, translation and Tafseer, Hifz, Hadith Shareef, and guidance on Namaz and Umrah.',
  'قرآن کریم کی درست تجوید، ترجمہ و تفسیر، حفظ، حدیث شریف، اور نماز و عمرہ کی رہنمائی کے ساتھ تعلیم۔',
  'info@sautulquran.demo',
  jsonb_build_object(
    'demo', true,
    'label', 'DEMO',
    'note', 'Seeded demo about_jamia row for Saut Ul Quran'
  )
)
ON CONFLICT (id) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_ur = EXCLUDED.name_ur,
  location_en = EXCLUDED.location_en,
  location_ur = EXCLUDED.location_ur,
  head_ustazah_en = EXCLUDED.head_ustazah_en,
  head_ustazah_ur = EXCLUDED.head_ustazah_ur,
  mission_en = EXCLUDED.mission_en,
  mission_ur = EXCLUDED.mission_ur,
  extra = EXCLUDED.extra,
  updated_at = timezone('utc', now());

-- -----------------------------------------------------------------------------
-- DEMO courses (9) — published for catalog browsing
-- -----------------------------------------------------------------------------

INSERT INTO public.courses (id, slug, difficulty, estimated_hours, is_published, sort_order, cover_image_url)
VALUES
  ('11111111-0001-4000-8000-000000000001', 'dua-e-noor-series', 'beginner', 12, TRUE, 1, NULL),
  ('11111111-0001-4000-8000-000000000002', 'ibad-ur-rahman-hifz-series', 'advanced', 120, TRUE, 2, NULL),
  ('11111111-0001-4000-8000-000000000003', 'tarteel-ul-quran-course', 'intermediate', 40, TRUE, 3, NULL),
  ('11111111-0001-4000-8000-000000000004', 'tajweed-ul-quran-course', 'intermediate', 36, TRUE, 4, NULL),
  ('11111111-0001-4000-8000-000000000005', 'yassarna-ul-quran-course', 'beginner', 24, TRUE, 5, NULL),
  ('11111111-0001-4000-8000-000000000006', 'hadith-shareef-course', 'intermediate', 30, TRUE, 6, NULL),
  ('11111111-0001-4000-8000-000000000007', 'tafseer-ul-quran-course', 'advanced', 60, TRUE, 7, NULL),
  ('11111111-0001-4000-8000-000000000008', 'namaz-course', 'beginner', 16, TRUE, 8, NULL),
  ('11111111-0001-4000-8000-000000000009', 'umrah-guide-course', 'beginner', 10, TRUE, 9, NULL)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  difficulty = EXCLUDED.difficulty,
  estimated_hours = EXCLUDED.estimated_hours,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  updated_at = timezone('utc', now());

INSERT INTO public.course_translations (course_id, locale, title, description)
VALUES
  -- 1 Dua-e-Noor
  ('11111111-0001-4000-8000-000000000001', 'en',
   'Dua-e-Noor Series',
   'DEMO — Learn selected prophetic and Quranic duas with meaning and practice.'),
  ('11111111-0001-4000-8000-000000000001', 'ur',
   'دعائے نور سیریز',
   'ڈیمو — منتخب قرآنی و نبوی دعائیں مع ترجمہ و مشق۔'),
  -- 2 Hifz
  ('11111111-0001-4000-8000-000000000002', 'en',
   'Ibad-ur-Rahman Hifz Series',
   'DEMO — Structured Quran memorization program with daily revision tracking.'),
  ('11111111-0001-4000-8000-000000000002', 'ur',
   'عباد الرحمن حفظ سیریز',
   'ڈیمو — روزانہ دوہرائی کے ساتھ منظم حفظ القرآن پروگرام۔'),
  -- 3 Tarteel
  ('11111111-0001-4000-8000-000000000003', 'en',
   'Tarteel-ul-Quran Course',
   'DEMO — Slow, measured Quran recitation with beauty and clarity.'),
  ('11111111-0001-4000-8000-000000000003', 'ur',
   'ترتیل القرآن کورس',
   'ڈیمو — خوبصورتی اور وضاحت کے ساتھ آہستہ ترتیل۔'),
  -- 4 Tajweed
  ('11111111-0001-4000-8000-000000000004', 'en',
   'Tajweed-ul-Quran Course',
   'DEMO — Rules of tajweed with color-coded ayah practice.'),
  ('11111111-0001-4000-8000-000000000004', 'ur',
   'تجوید القرآن کورس',
   'ڈیمو — رنگین آیات کے ساتھ قواعدِ تجوید۔'),
  -- 5 Yassarna
  ('11111111-0001-4000-8000-000000000005', 'en',
   'Yassarna-ul-Quran Course',
   'DEMO — Beginner-friendly reading course to make Quran easy.'),
  ('11111111-0001-4000-8000-000000000005', 'ur',
   'یسّرنا القرآن کورس',
   'ڈیمو — مبتدیوں کے لیے آسان قرآنی خواندگی۔'),
  -- 6 Hadith
  ('11111111-0001-4000-8000-000000000006', 'en',
   'Hadith Shareef Course',
   'DEMO — Selected ahadith with explanation and manners of learning.'),
  ('11111111-0001-4000-8000-000000000006', 'ur',
   'حدیث شریف کورس',
   'ڈیمو — منتخب احادیث مع تشریح و آدابِ طلب۔'),
  -- 7 Tafseer
  ('11111111-0001-4000-8000-000000000007', 'en',
   'Tafseer-ul-Quran Course',
   'DEMO — Meaning and context of selected surahs for deeper understanding.'),
  ('11111111-0001-4000-8000-000000000007', 'ur',
   'تفسیر القرآن کورس',
   'ڈیمو — منتخب سورتوں کے معانی و پسِ منظر۔'),
  -- 8 Namaz
  ('11111111-0001-4000-8000-000000000008', 'en',
   'Namaz Course',
   'DEMO — Prayer steps, duas, and common mistakes corrected.'),
  ('11111111-0001-4000-8000-000000000008', 'ur',
   'نماز کورس',
   'ڈیمو — نماز کے ارکان، دعائیں اور عام غلطیوں کی اصلاح۔'),
  -- 9 Umrah
  ('11111111-0001-4000-8000-000000000009', 'en',
   'Umrah Guide Course',
   'DEMO — Practical guide to Umrah rituals, duas, and etiquette.'),
  ('11111111-0001-4000-8000-000000000009', 'ur',
   'عمرہ گائیڈ کورس',
   'ڈیمو — عمرہ کے مناسک، دعائیں اور آداب کی عملی رہنمائی۔')
ON CONFLICT (course_id, locale) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Sample lessons for Tajweed course (DEMO)
INSERT INTO public.lessons (id, course_id, slug, sort_order, duration_minutes, is_published)
VALUES
  ('22222222-0001-4000-8000-000000000001',
   '11111111-0001-4000-8000-000000000004',
   'intro-to-tajweed', 1, 25, TRUE),
  ('22222222-0001-4000-8000-000000000002',
   '11111111-0001-4000-8000-000000000004',
   'noon-sakinah-rules', 2, 35, TRUE)
ON CONFLICT (id) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc', now());

INSERT INTO public.lesson_translations (lesson_id, locale, title, summary)
VALUES
  ('22222222-0001-4000-8000-000000000001', 'en', 'Introduction to Tajweed', 'DEMO — Why tajweed matters and core terminology.'),
  ('22222222-0001-4000-8000-000000000001', 'ur', 'تجوید کا تعارف', 'ڈیمو — تجوید کی اہمیت اور بنیادی اصطلاحات۔'),
  ('22222222-0001-4000-8000-000000000002', 'en', 'Noon Sakinah Rules', 'DEMO — Izhar, Idgham, Iqlab, and Ikhfa.'),
  ('22222222-0001-4000-8000-000000000002', 'ur', 'نون ساکنہ کے قواعد', 'ڈیمو — اظهار، ادغام، اقلاب اور اخفا۔')
ON CONFLICT (lesson_id, locale) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary;

-- -----------------------------------------------------------------------------
-- DEMO badges
-- -----------------------------------------------------------------------------

INSERT INTO public.badges (id, code, name_en, name_ur, description_en, description_ur, points_required, is_active)
VALUES
  ('b0000000-0000-4000-8000-000000000001', 'first_lesson',
   'First Lesson', 'پہلا سبق',
   'DEMO — Completed your first lesson.', 'ڈیمو — اپنا پہلا سبق مکمل کیا۔', 10, TRUE),
  ('b0000000-0000-4000-8000-000000000002', 'consistent_week',
   'Consistent Week', 'مستقل ہفتہ',
   'DEMO — Studied 7 days in a row.', 'ڈیمو — لگاتار سات دن مطالعہ۔', 50, TRUE),
  ('b0000000-0000-4000-8000-000000000003', 'hifz_starter',
   'Hifz Starter', 'حفظ کا آغاز',
   'DEMO — Memorized Al-Fatiha.', 'ڈیمو — سورۃ الفاتحہ حفظ کی۔', 100, TRUE),
  ('b0000000-0000-4000-8000-000000000004', 'tajweed_ace',
   'Tajweed Ace', 'تجوید ماہر',
   'DEMO — Passed a tajweed assessment.', 'ڈیمو — تجوید ٹیسٹ پاس کیا۔', 75, TRUE),
  ('b0000000-0000-4000-8000-000000000005', 'umrah_ready',
   'Umrah Ready', 'عمرہ کے لیے تیار',
   'DEMO — Completed the Umrah Guide course.', 'ڈیمو — عمرہ گائیڈ کورس مکمل۔', 80, TRUE)
ON CONFLICT (code) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_ur = EXCLUDED.name_ur,
  description_en = EXCLUDED.description_en,
  description_ur = EXCLUDED.description_ur,
  points_required = EXCLUDED.points_required,
  is_active = EXCLUDED.is_active;

-- -----------------------------------------------------------------------------
-- DEMO Quran reference: Para 1, Al-Fatiha + sample tajweed
-- -----------------------------------------------------------------------------

INSERT INTO public.paras (id, number, name_ar, name_en, name_ur)
VALUES (
  'c1000000-0000-4000-8000-000000000001',
  1,
  'الم',
  'Alif Lam Meem',
  'الم'
)
ON CONFLICT (number) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  name_ur = EXCLUDED.name_ur;

INSERT INTO public.surahs (id, number, name_ar, name_en, name_ur, revelation_type, ayah_count)
VALUES (
  'e1000000-0000-4000-8000-000000000001',
  1,
  'الفاتحة',
  'Al-Fatiha',
  'الفاتحہ',
  'makki',
  7
)
ON CONFLICT (number) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  name_ur = EXCLUDED.name_ur,
  revelation_type = EXCLUDED.revelation_type,
  ayah_count = EXCLUDED.ayah_count;

-- Al-Fatiha ayahs with sample tajweed_markup JSON
-- markup format: [{ "start": 0, "end": 3, "rule": "madd", "color": "#16A34A" }, ...]
INSERT INTO public.ayahs (
  id, surah_id, ayah_number, text_ar, text_uthmani,
  translation_en, translation_ur, tajweed_markup, para_id, page_number, juz_number
)
VALUES
  (
    'a1111111-0000-4000-8000-000000000001',
    'e1000000-0000-4000-8000-000000000001', 1,
    'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
    'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
    'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
    'اللہ کے نام سے جو بے حد مہربان، نہایت رحم والا ہے۔',
    '[
      {"start": 8, "end": 14, "rule": "ghunnah", "color": "#16A34A", "label": "غنة"},
      {"start": 16, "end": 24, "rule": "madd", "color": "#2563EB", "label": "مد"}
    ]'::jsonb,
    'c1000000-0000-4000-8000-000000000001', 1, 1
  ),
  (
    'a1111111-0000-4000-8000-000000000002',
    'e1000000-0000-4000-8000-000000000001', 2,
    'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ',
    'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ',
    'All praise is due to Allah, Lord of the worlds.',
    'سب تعریف اللہ کے لیے ہے جو تمام جہانوں کا رب ہے۔',
    '[
      {"start": 18, "end": 28, "rule": "madd", "color": "#2563EB", "label": "مد لازم"}
    ]'::jsonb,
    'c1000000-0000-4000-8000-000000000001', 1, 1
  ),
  (
    'a1111111-0000-4000-8000-000000000003',
    'e1000000-0000-4000-8000-000000000001', 3,
    'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
    'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
    'The Entirely Merciful, the Especially Merciful.',
    'بے حد مہربان، نہایت رحم والا۔',
    '[
      {"start": 0, "end": 10, "rule": "madd", "color": "#2563EB", "label": "مد"},
      {"start": 12, "end": 20, "rule": "madd", "color": "#2563EB", "label": "مد"}
    ]'::jsonb,
    'c1000000-0000-4000-8000-000000000001', 1, 1
  ),
  (
    'a1111111-0000-4000-8000-000000000004',
    'e1000000-0000-4000-8000-000000000001', 4,
    'مَٰلِكِ يَوْمِ ٱلدِّينِ',
    'مَٰلِكِ يَوْمِ ٱلدِّينِ',
    'Sovereign of the Day of Recompense.',
    'جزا کے دن کا مالک۔',
    '[
      {"start": 0, "end": 5, "rule": "madd", "color": "#2563EB", "label": "مد"}
    ]'::jsonb,
    'c1000000-0000-4000-8000-000000000001', 1, 1
  ),
  (
    'a1111111-0000-4000-8000-000000000005',
    'e1000000-0000-4000-8000-000000000001', 5,
    'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
    'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
    'It is You we worship and You we ask for help.',
    'ہم صرف تیری عبادت کرتے ہیں اور تجھی سے مدد مانگتے ہیں۔',
    '[
      {"start": 0, "end": 6, "rule": "shaddah", "color": "#DC2626", "label": "شدة"},
      {"start": 18, "end": 24, "rule": "shaddah", "color": "#DC2626", "label": "شدة"}
    ]'::jsonb,
    'c1000000-0000-4000-8000-000000000001', 1, 1
  ),
  (
    'a1111111-0000-4000-8000-000000000006',
    'e1000000-0000-4000-8000-000000000001', 6,
    'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ',
    'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ',
    'Guide us to the straight path.',
    'ہمیں سیدھا راستہ دکھا۔',
    '[
      {"start": 8, "end": 18, "rule": "madd", "color": "#2563EB", "label": "مد"},
      {"start": 7, "end": 9, "rule": "qalqalah", "color": "#CA8A04", "label": "قلقلة"}
    ]'::jsonb,
    'c1000000-0000-4000-8000-000000000001', 1, 1
  ),
  (
    'a1111111-0000-4000-8000-000000000007',
    'e1000000-0000-4000-8000-000000000001', 7,
    'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ',
    'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ',
    'The path of those upon whom You have bestowed favor, not of those who have earned anger or of those who are astray.',
    'ان لوگوں کا راستہ جن پر تو نے انعام کیا، نہ کہ جن پر غضب ہوا اور نہ گمراہوں کا۔',
    '[
      {"start": 0, "end": 6, "rule": "madd", "color": "#2563EB", "label": "مد"},
      {"start": 20, "end": 24, "rule": "ikhfa", "color": "#7C3AED", "label": "اخفاء"},
      {"start": 55, "end": 68, "rule": "madd", "color": "#2563EB", "label": "مد لازم"}
    ]'::jsonb,
    'c1000000-0000-4000-8000-000000000001', 1, 1
  )
ON CONFLICT (surah_id, ayah_number) DO UPDATE SET
  text_ar = EXCLUDED.text_ar,
  text_uthmani = EXCLUDED.text_uthmani,
  translation_en = EXCLUDED.translation_en,
  translation_ur = EXCLUDED.translation_ur,
  tajweed_markup = EXCLUDED.tajweed_markup,
  para_id = EXCLUDED.para_id;

-- Also seed Surah Al-Ikhlas as a short second sample
INSERT INTO public.surahs (id, number, name_ar, name_en, name_ur, revelation_type, ayah_count)
VALUES (
  'e1000000-0000-4000-8000-000000000112',
  112,
  'الإخلاص',
  'Al-Ikhlas',
  'الاخلاص',
  'makki',
  4
)
ON CONFLICT (number) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  name_ur = EXCLUDED.name_ur,
  ayah_count = EXCLUDED.ayah_count;

INSERT INTO public.ayahs (
  id, surah_id, ayah_number, text_ar, translation_en, translation_ur, tajweed_markup, para_id, juz_number
)
VALUES
  (
    'a1111112-0000-4000-8000-000000000001',
    'e1000000-0000-4000-8000-000000000112', 1,
    'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
    'Say, He is Allah, [who is] One.',
    'کہو وہ اللہ ایک ہے۔',
    '[{"start": 12, "end": 16, "rule": "qalqalah", "color": "#CA8A04", "label": "قلقلة"}]'::jsonb,
    'c1000000-0000-4000-8000-000000000001', 30
  ),
  (
    'a1111112-0000-4000-8000-000000000002',
    'e1000000-0000-4000-8000-000000000112', 2,
    'ٱللَّهُ ٱلصَّمَدُ',
    'Allah, the Eternal Refuge.',
    'اللہ بے نیاز ہے۔',
    '[]'::jsonb,
    'c1000000-0000-4000-8000-000000000001', 30
  ),
  (
    'a1111112-0000-4000-8000-000000000003',
    'e1000000-0000-4000-8000-000000000112', 3,
    'لَمْ يَلِدْ وَلَمْ يُولَدْ',
    'He neither begets nor is born.',
    'نہ اس کی کوئی اولاد ہے اور نہ وہ کسی کی اولاد۔',
    '[{"start": 6, "end": 10, "rule": "qalqalah", "color": "#CA8A04", "label": "قلقلة"}]'::jsonb,
    'c1000000-0000-4000-8000-000000000001', 30
  ),
  (
    'a1111112-0000-4000-8000-000000000004',
    'e1000000-0000-4000-8000-000000000112', 4,
    'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ',
    'Nor is there to Him any equivalent.',
    'اور اس کے برابر کوئی نہیں۔',
    '[{"start": 28, "end": 32, "rule": "ikhfa", "color": "#7C3AED", "label": "اخفاء"}]'::jsonb,
    'c1000000-0000-4000-8000-000000000001', 30
  )
ON CONFLICT (surah_id, ayah_number) DO UPDATE SET
  text_ar = EXCLUDED.text_ar,
  translation_en = EXCLUDED.translation_en,
  translation_ur = EXCLUDED.translation_ur,
  tajweed_markup = EXCLUDED.tajweed_markup;

-- -----------------------------------------------------------------------------
-- DEMO tajweed rules catalog
-- -----------------------------------------------------------------------------

INSERT INTO public.tajweed_rules (id, code, name_en, name_ur, description_en, description_ur, color_hex, example_ar, sort_order)
VALUES
  ('f1000000-0000-4000-8000-000000000001', 'madd', 'Madd', 'مد',
   'DEMO — Prolongation of a vowel sound.', 'ڈیمو — حرفِ مد کی لمبائی۔', '#2563EB', 'ٱلرَّحْمَٰنِ', 1),
  ('f1000000-0000-4000-8000-000000000002', 'ghunnah', 'Ghunnah', 'غنة',
   'DEMO — Nasalization lasting two counts.', 'ڈیمو — دو حرکت کی ناک کی آواز۔', '#16A34A', 'إِنَّ', 2),
  ('f1000000-0000-4000-8000-000000000003', 'ikhfa', 'Ikhfa', 'اخفاء',
   'DEMO — Concealment of noon sakinah or tanween.', 'ڈیمو — نون ساکنہ یا تنوین کا اخفا۔', '#7C3AED', 'مِن شَرِّ', 3),
  ('f1000000-0000-4000-8000-000000000004', 'idgham', 'Idgham', 'ادغام',
   'DEMO — Merging of noon into following letter.', 'ڈیمو — نون کا اگلے حرف میں ادغام۔', '#EA580C', 'مِن رَّبِّهِمْ', 4),
  ('f1000000-0000-4000-8000-000000000005', 'iqlab', 'Iqlab', 'اقلاب',
   'DEMO — Conversion of noon to meem before ba.', 'ڈیمو — باء سے پہلے نون کو میم میں بدلنا۔', '#DB2777', 'مِنۢ بَعْدِ', 5),
  ('f1000000-0000-4000-8000-000000000006', 'izhar', 'Izhar', 'اظهار',
   'DEMO — Clear pronunciation of noon before throat letters.', 'ڈیمو — حلقی حروف سے پہلے نون کا واضح ادا۔', '#64748B', 'مِنْ خَوْفٍ', 6),
  ('f1000000-0000-4000-8000-000000000007', 'qalqalah', 'Qalqalah', 'قلقلة',
   'DEMO — Echoing bounce on ق ط ب ج د when sakin.', 'ڈیمو — ق ط ب ج د ساکن پر گونج۔', '#CA8A04', 'أَحَدٌ', 7),
  ('f1000000-0000-4000-8000-000000000008', 'shaddah', 'Shaddah', 'شدة',
   'DEMO — Doubled consonant with emphasis.', 'ڈیمو — مشدد حرف پر زور۔', '#DC2626', 'إِيَّاكَ', 8)
ON CONFLICT (code) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_ur = EXCLUDED.name_ur,
  description_en = EXCLUDED.description_en,
  description_ur = EXCLUDED.description_ur,
  color_hex = EXCLUDED.color_hex,
  example_ar = EXCLUDED.example_ar,
  sort_order = EXCLUDED.sort_order;

-- -----------------------------------------------------------------------------
-- DEMO daily duas
-- -----------------------------------------------------------------------------

INSERT INTO public.daily_duas (
  id, slug, title_en, title_ur, arabic_text, transliteration,
  translation_en, translation_ur, category, sort_order, is_published
)
VALUES
  (
    'd0000000-0000-4000-8000-000000000001',
    'before-sleep',
    'Dua Before Sleep',
    'سونے سے پہلے کی دعا',
    'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    'Bismika Allahumma amutu wa ahya',
    'DEMO — In Your name, O Allah, I die and I live.',
    'ڈیمو — اے اللہ! تیرے نام سے میں مرتا ہوں اور جیتا ہوں۔',
    'evening', 1, TRUE
  ),
  (
    'd0000000-0000-4000-8000-000000000002',
    'upon-waking',
    'Dua Upon Waking',
    'بیدار ہونے کی دعا',
    'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
    'Alhamdu lillahil-ladhi ahyana ba''da ma amatana wa ilayhin-nushur',
    'DEMO — All praise is for Allah who gave us life after causing us to die, and unto Him is the resurrection.',
    'ڈیمو — تمام تعریف اس اللہ کے لیے جس نے ہمیں موت کے بعد زندگی بخشی اور اسی کی طرف اٹھنا ہے۔',
    'morning', 2, TRUE
  ),
  (
    'd0000000-0000-4000-8000-000000000003',
    'entering-masjid',
    'Entering the Masjid',
    'مسجد میں داخلے کی دعا',
    'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
    'Allahumma iftah li abwaba rahmatik',
    'DEMO — O Allah, open for me the doors of Your mercy.',
    'ڈیمو — اے اللہ! میرے لیے اپنی رحمت کے دروازے کھول دے۔',
    'masjid', 3, TRUE
  )
ON CONFLICT (slug) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  title_ur = EXCLUDED.title_ur,
  arabic_text = EXCLUDED.arabic_text,
  translation_en = EXCLUDED.translation_en,
  translation_ur = EXCLUDED.translation_ur,
  is_published = EXCLUDED.is_published;

-- -----------------------------------------------------------------------------
-- DEMO library metadata (no user FKs)
-- -----------------------------------------------------------------------------

INSERT INTO public.library_resources (
  id, course_id, title_en, title_ur, description_en, description_ur,
  resource_type, external_url, is_public
)
VALUES
  (
    'a2000000-0000-4000-8000-000000000001',
    '11111111-0001-4000-8000-000000000004',
    'Tajweed Chart (DEMO)',
    'تجوید چارٹ (ڈیمو)',
    'DEMO — Printable color chart of common tajweed rules.',
    'ڈیمو — عام قواعدِ تجوید کا رنگین چارٹ۔',
    'pdf',
    'https://example.com/demo/tajweed-chart.pdf',
    TRUE
  ),
  (
    'a2000000-0000-4000-8000-000000000002',
    '11111111-0001-4000-8000-000000000009',
    'Umrah Checklist (DEMO)',
    'عمرہ چیک لسٹ (ڈیمو)',
    'DEMO — Step-by-step Umrah preparation checklist.',
    'ڈیمو — عمرہ کی تیاری کی مرحلہ وار فہرست۔',
    'document',
    'https://example.com/demo/umrah-checklist.pdf',
    TRUE
  ),
  (
    'a2000000-0000-4000-8000-000000000003',
    NULL,
    'Jamia Orientation Handbook (DEMO)',
    'جامعہ تعارفی ہینڈ بک (ڈیمو)',
    'DEMO — General orientation for new students.',
    'ڈیمو — نئے طلبہ کے لیے تعارفی رہنما۔',
    'pdf',
    'https://example.com/demo/orientation.pdf',
    TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  title_ur = EXCLUDED.title_ur,
  description_en = EXCLUDED.description_en,
  description_ur = EXCLUDED.description_ur,
  external_url = EXCLUDED.external_url,
  is_public = EXCLUDED.is_public,
  updated_at = timezone('utc', now());

-- =============================================================================
-- HOW TO ATTACH DEMO TEACHER / STUDENT AFTER CREATING AUTH USERS
-- =============================================================================
-- 1. Create users in Supabase Auth (Dashboard → Authentication → Users), e.g.:
--      teacher@demo.sautulquran.local  /  student@demo.sautulquran.local
-- 2. Copy their auth.users UUIDs.
-- 3. Run 005_seed_demo_users.sql after replacing the placeholder UUIDs,
--    OR run SQL like:
--
--    -- Elevate teacher (trigger already created profile + student role)
--    INSERT INTO public.user_roles (user_id, role)
--    VALUES ('<TEACHER_AUTH_UUID>', 'teacher')
--    ON CONFLICT DO NOTHING;
--    DELETE FROM public.user_roles
--    WHERE user_id = '<TEACHER_AUTH_UUID>' AND role = 'student'; -- optional
--
--    INSERT INTO public.teachers (profile_id, title, specialization)
--    VALUES ('<TEACHER_AUTH_UUID>', 'Ustazah', 'Tajweed & Hifz')
--    ON CONFLICT (profile_id) DO NOTHING;
--
--    INSERT INTO public.course_teachers (course_id, teacher_id, is_primary)
--    VALUES
--      ('11111111-0001-4000-8000-000000000004', '<TEACHER_AUTH_UUID>', TRUE),
--      ('11111111-0001-4000-8000-000000000002', '<TEACHER_AUTH_UUID>', TRUE);
--
--    INSERT INTO public.students (profile_id, student_code)
--    VALUES ('<STUDENT_AUTH_UUID>', 'DEMO-STU-001')
--    ON CONFLICT (profile_id) DO NOTHING;
--
--    INSERT INTO public.enrollments (course_id, student_id, status, enrolled_by)
--    VALUES
--      ('11111111-0001-4000-8000-000000000004', '<STUDENT_AUTH_UUID>', 'active', '<TEACHER_AUTH_UUID>'),
--      ('11111111-0001-4000-8000-000000000001', '<STUDENT_AUTH_UUID>', 'active', '<TEACHER_AUTH_UUID>');
--
-- NOTE: Do NOT insert into auth.users from SQL without the service role /
--       auth admin API. Prefer Dashboard or Auth Admin API.
-- =============================================================================
