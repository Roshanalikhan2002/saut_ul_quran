/**
 * In-memory + localStorage demo dataset used when Supabase is not configured.
 * Services short-circuit via `isDemoAuthMode()` and call these helpers instead.
 */
import { COURSE_I18N_KEYS, COURSE_SLUGS } from '@/lib/constants'
import {
  buildDemoProfile,
  buildDemoUser,
  readDemoAuth,
  type DemoAuthState,
} from '@/lib/demoAuth'
import type {
  AppRole,
  Tables,
  TablesInsert,
} from '@/types/database'

export const DEMO_STORE_KEY = 'suq_demo_store_v1'
export const DEMO_CERT_NUMBER = 'SUQ-DEMO-0001'

const COURSE_TITLES: Record<
  (typeof COURSE_SLUGS)[number],
  { en: string; ur: string; descEn: string; descUr: string }
> = {
  'dua-e-noor-series': {
    en: 'Dua-e-Noor Series',
    ur: 'دعائے نور سیریز',
    descEn: 'Daily duas with meaning and practice.',
    descUr: 'روزانہ دعائیں مع ترجمہ اور مشق۔',
  },
  'ibad-ur-rahman-hifz-series': {
    en: 'Ibad-ur-Rahman Hifz Series',
    ur: 'عباد الرحمن حفظ سیریز',
    descEn: 'Structured Quran memorization pathway.',
    descUr: 'منظم حفظ القرآن کا راستہ۔',
  },
  'tarteel-ul-quran-course': {
    en: 'Tarteel-ul-Quran Course',
    ur: 'ترتیل القرآن کورس',
    descEn: 'Measured, beautiful Quranic recitation.',
    descUr: 'ٹھہر ٹھہر کر خوبصورت قرآتی تلاوت۔',
  },
  'tajweed-ul-quran-course': {
    en: 'Tajweed-ul-Quran Course',
    ur: 'تجوید القرآن کورس',
    descEn: 'Rules of correct pronunciation and recitation.',
    descUr: 'درست اداکاری اور تلاوت کے قواعد۔',
  },
  'yassarna-ul-quran-course': {
    en: 'Yassarna-ul-Quran Course',
    ur: 'یسّرنا القرآن کورس',
    descEn: 'Beginner-friendly Quran reading.',
    descUr: 'مبتدیوں کے لیے آسان قرآن خوانی۔',
  },
  'hadith-shareef-course': {
    en: 'Hadith Shareef Course',
    ur: 'حدیث شریف کورس',
    descEn: 'Selected prophetic traditions with explanation.',
    descUr: 'منتخب احادیث مع تشریح۔',
  },
  'tafseer-ul-quran-course': {
    en: 'Tafseer-ul-Quran Course',
    ur: 'تفسیر القرآن کورس',
    descEn: 'Meaning and context of selected surahs.',
    descUr: 'منتخب سورتوں کا مفہوم اور پس منظر۔',
  },
  'namaz-course': {
    en: 'Namaz Course',
    ur: 'نماز کورس',
    descEn: 'Prayer method, duas, and etiquette.',
    descUr: 'نماز کا طریقہ، دعائیں اور آداب۔',
  },
  'umrah-guide-course': {
    en: 'Umrah Guide Course',
    ur: 'عمرہ گائیڈ کورس',
    descEn: 'Step-by-step Umrah guidance.',
    descUr: 'عمرہ کی مرحلہ وار رہنمائی۔',
  },
}

void COURSE_I18N_KEYS

export type DemoCourse = Tables<'courses'> & {
  course_translations: Tables<'course_translations'>[]
}

export type DemoLesson = Tables<'lessons'> & {
  lesson_translations: Tables<'lesson_translations'>[]
}

export type DemoProfile = Tables<'profiles'>
export type DemoStudent = Tables<'students'> & { profiles: DemoProfile }
export type DemoEnrollment = Tables<'enrollments'>
export type DemoCertificate = Tables<'certificates'>
export type DemoNotification = Tables<'notifications'>
export type DemoLibraryResource = Tables<'library_resources'>
export type DemoDua = Tables<'daily_duas'>
export type DemoLiveClass = Tables<'live_classes'>
export type DemoGroup = Tables<'groups'>
export type DemoAnnouncement = Tables<'announcements'>
export type DemoLessonContent = Tables<'lesson_content'>
export type DemoSurah = Tables<'surahs'>
export type DemoAyah = Tables<'ayahs'>
export type DemoBadge = Tables<'badges'>
export type DemoStudentBadge = Tables<'student_badges'> & {
  badges: DemoBadge | null
}
export type DemoPointsEntry = Tables<'points_ledger'>
export type DemoUserRole = Tables<'user_roles'>
export type DemoTest = Tables<'tests'>
export type DemoTestAssignment = Tables<'test_assignments'>

export interface DemoStoreData {
  version: 1
  profiles: DemoProfile[]
  userRoles: DemoUserRole[]
  students: Tables<'students'>[]
  courses: Tables<'courses'>[]
  courseTranslations: Tables<'course_translations'>[]
  lessons: Tables<'lessons'>[]
  lessonTranslations: Tables<'lesson_translations'>[]
  lessonContent: DemoLessonContent[]
  enrollments: DemoEnrollment[]
  certificates: DemoCertificate[]
  notifications: DemoNotification[]
  libraryResources: DemoLibraryResource[]
  duas: DemoDua[]
  liveClasses: DemoLiveClass[]
  groups: DemoGroup[]
  groupMembers: Tables<'group_members'>[]
  announcements: DemoAnnouncement[]
  surahs: DemoSurah[]
  ayahs: DemoAyah[]
  badges: DemoBadge[]
  studentBadges: Tables<'student_badges'>[]
  pointsLedger: DemoPointsEntry[]
  tests: DemoTest[]
  testAssignments: DemoTestAssignment[]
  testQuestions: Tables<'test_questions'>[]
  testOptions: Tables<'test_options'>[]
  testAttempts: Tables<'test_attempts'>[]
  testAnswers: Tables<'test_answers'>[]
  hifzProgress: Tables<'hifz_progress'>[]
  hifzDaily: Tables<'hifz_daily_records'>[]
  attendanceSessions: Tables<'attendance_sessions'>[]
  attendanceRecords: Tables<'attendance_records'>[]
  groupMessages: Tables<'group_messages'>[]
  lessonProgress: Tables<'lesson_progress'>[]
  ayahKnowledge: Tables<'ayah_knowledge'>[]
  courseTeachers: Tables<'course_teachers'>[]
  preferences: Tables<'user_preferences'>[]
  aboutJamia: Tables<'about_jamia'> | null
  recordedClasses: Tables<'recorded_classes'>[]
  /** login_id (lowercase) → password (demo only) */
  credentials: Record<string, string>
}

const FIXED = {
  teacherProfileId: 'demo-teacher-0000-0000-000000000001',
  studentProfileId: 'demo-student-0000-0000-000000000001',
  adminProfileId: 'demo-admin-0000-0000-000000000001',
  studentRowId: 'demo-student-row-0001',
  teacherRoleId: 'demo-role-teacher-0001',
  studentRoleId: 'demo-role-student-0001',
  adminRoleId: 'demo-role-admin-0001',
  surahFatihaId: 'demo-surah-001',
  surahIkhlasId: 'demo-surah-112',
  badgeId: 'demo-badge-first-steps',
  groupId: 'demo-group-0001',
  liveClassId: 'demo-live-0001',
  announcementId: 'demo-announcement-0001',
  certId: 'demo-cert-0001',
  duaId: 'demo-dua-0001',
  libraryId1: 'demo-lib-0001',
  libraryId2: 'demo-lib-0002',
  notifId1: 'demo-notif-0001',
  notifId2: 'demo-notif-0002',
} as const

function nowIso() {
  return new Date().toISOString()
}

function id(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

function profileFromAuth(
  state: DemoAuthState,
  fixedId?: string,
): DemoProfile {
  const user = buildDemoUser(state)
  const profile = buildDemoProfile(user, state)
  if (fixedId) profile.id = fixedId
  return profile
}

function buildSeed(): DemoStoreData {
  const now = nowIso()
  const auth = readDemoAuth()

  const teacherProfile: DemoProfile = {
    id: FIXED.teacherProfileId,
    email: 'tch-001@suq.local',
    full_name: 'Demo Teacher',
    full_name_ur: 'ڈیمو استاد',
    avatar_url: null,
    phone: null,
    locale: 'en',
    bio: 'Sample teacher for local demo.',
    is_active: true,
    login_id: 'tch-001',
    created_at: now,
    updated_at: now,
  }

  const studentProfile: DemoProfile = {
    id: FIXED.studentProfileId,
    email: 'stu-001@suq.local',
    full_name: 'Demo Student',
    full_name_ur: 'ڈیمو طالب علم',
    avatar_url: null,
    phone: null,
    locale: 'en',
    bio: 'Sample student for local demo.',
    is_active: true,
    login_id: 'stu-001',
    created_at: now,
    updated_at: now,
  }

  const adminProfile: DemoProfile = {
    id: FIXED.adminProfileId,
    email: 'fehmidataj27@gmail.com',
    full_name: 'Jamia Admin',
    full_name_ur: 'جامعہ ایڈمن',
    avatar_url: null,
    phone: null,
    locale: 'en',
    bio: 'Primary admin account.',
    is_active: true,
    login_id: null,
    created_at: now,
    updated_at: now,
  }

  // Ensure current demo session user is present (may override one of the above).
  const profiles: DemoProfile[] = [adminProfile, teacherProfile, studentProfile]
  if (auth) {
    const current = profileFromAuth(auth)
    const idx = profiles.findIndex((p) => p.id === current.id)
    if (idx >= 0) profiles[idx] = { ...profiles[idx]!, ...current }
    else profiles.push(current)
  }

  const userRoles: DemoUserRole[] = [
    {
      id: FIXED.adminRoleId,
      user_id: FIXED.adminProfileId,
      role: 'admin',
      granted_by: null,
      granted_at: now,
    },
    {
      id: FIXED.teacherRoleId,
      user_id: FIXED.teacherProfileId,
      role: 'teacher',
      granted_by: FIXED.adminProfileId,
      granted_at: now,
    },
    {
      id: FIXED.studentRoleId,
      user_id: FIXED.studentProfileId,
      role: 'student',
      granted_by: FIXED.adminProfileId,
      granted_at: now,
    },
  ]

  if (auth) {
    const uid = profileFromAuth(auth).id
    if (!userRoles.some((r) => r.user_id === uid && r.role === auth.role)) {
      userRoles.push({
        id: id('demo-role'),
        user_id: uid,
        role: auth.role,
        granted_by: null,
        granted_at: now,
      })
    }
  }

  const courses: Tables<'courses'>[] = COURSE_SLUGS.map((slug, index) => ({
    id: `demo-course-${String(index + 1).padStart(4, '0')}`,
    slug,
    cover_image_url: null,
    difficulty: index < 3 ? 'beginner' : index < 6 ? 'intermediate' : 'advanced',
    estimated_hours: 8 + index * 2,
    is_published: true,
    sort_order: index,
    created_by: FIXED.teacherProfileId,
    created_at: now,
    updated_at: now,
  }))

  const courseTranslations: Tables<'course_translations'>[] = []
  for (const course of courses) {
    const titles = COURSE_TITLES[course.slug as (typeof COURSE_SLUGS)[number]]
    courseTranslations.push(
      {
        id: `${course.id}-tr-en`,
        course_id: course.id,
        locale: 'en',
        title: titles.en,
        description: titles.descEn,
      },
      {
        id: `${course.id}-tr-ur`,
        course_id: course.id,
        locale: 'ur',
        title: titles.ur,
        description: titles.descUr,
      },
    )
  }

  const lessons: Tables<'lessons'>[] = []
  const lessonTranslations: Tables<'lesson_translations'>[] = []
  const lessonContent: DemoLessonContent[] = []

  for (let c = 0; c < 3; c++) {
    const course = courses[c]!
    const lessonCount = c === 0 ? 2 : 1
    for (let l = 0; l < lessonCount; l++) {
      const lessonId = `demo-lesson-${course.id}-${l + 1}`
      lessons.push({
        id: lessonId,
        course_id: course.id,
        slug: `lesson-${l + 1}`,
        sort_order: l,
        duration_minutes: 20 + l * 5,
        is_published: true,
        created_at: now,
        updated_at: now,
      })
      lessonTranslations.push(
        {
          id: `${lessonId}-tr-en`,
          lesson_id: lessonId,
          locale: 'en',
          title: `Lesson ${l + 1}`,
          summary: 'Demo lesson overview.',
        },
        {
          id: `${lessonId}-tr-ur`,
          lesson_id: lessonId,
          locale: 'ur',
          title: `سبق ${l + 1}`,
          summary: 'ڈیمو سبق کا جائزہ۔',
        },
      )
      lessonContent.push({
        id: `${lessonId}-content-1`,
        lesson_id: lessonId,
        content_type: 'text',
        sort_order: 0,
        storage_path: null,
        external_url: null,
        body_markdown:
          'This is sample lesson content for local demo mode.',
        body_html: null,
        metadata: {},
        created_at: now,
        updated_at: now,
      })
    }
  }

  const firstCourse = courses[0]!
  const secondCourse = courses[1]!

  const students: Tables<'students'>[] = [
    {
      id: FIXED.studentRowId,
      profile_id: FIXED.studentProfileId,
      student_code: 'SUQ-STU-001',
      guardian_name: null,
      guardian_phone: null,
      date_of_birth: null,
      gender: null,
      address: null,
      notes: 'Demo student record',
      joined_at: now,
      created_at: now,
      updated_at: now,
    },
  ]

  const enrollments: DemoEnrollment[] = [
    {
      id: 'demo-enroll-0001',
      course_id: firstCourse.id,
      student_id: FIXED.studentProfileId,
      status: 'active',
      enrolled_by: FIXED.teacherProfileId,
      enrolled_at: now,
      completed_at: null,
      notes: null,
    },
    {
      id: 'demo-enroll-0002',
      course_id: secondCourse.id,
      student_id: FIXED.studentProfileId,
      status: 'active',
      enrolled_by: FIXED.teacherProfileId,
      enrolled_at: now,
      completed_at: null,
      notes: null,
    },
  ]

  // If current user is a student with a different id, enroll them too.
  if (auth?.role === 'student') {
    const uid = profileFromAuth(auth).id
    if (uid !== FIXED.studentProfileId) {
      enrollments.push({
        id: 'demo-enroll-current',
        course_id: firstCourse.id,
        student_id: uid,
        status: 'active',
        enrolled_by: FIXED.teacherProfileId,
        enrolled_at: now,
        completed_at: null,
        notes: null,
      })
    }
  }

  const certificates: DemoCertificate[] = [
    {
      id: FIXED.certId,
      student_id: FIXED.studentProfileId,
      course_id: firstCourse.id,
      certificate_number: DEMO_CERT_NUMBER,
      status: 'issued',
      issued_at: now,
      issued_by: FIXED.teacherProfileId,
      storage_path: null,
      metadata: { source: 'demo' },
      created_at: now,
      updated_at: now,
    },
  ]

  const currentUserId =
    auth != null ? profileFromAuth(auth).id : FIXED.studentProfileId

  const notifications: DemoNotification[] = [
    {
      id: FIXED.notifId1,
      user_id: currentUserId,
      type: 'announcement',
      title_en: 'Welcome to demo mode',
      title_ur: 'ڈیمو موڈ میں خوش آمدید',
      body_en: 'Browse modules with sample data — Supabase is not configured.',
      body_ur: 'نمونہ ڈیٹا کے ساتھ ماڈیولز دیکھیں — سپابیس ترتیب نہیں ہے۔',
      link: null,
      is_read: false,
      metadata: {},
      created_at: now,
    },
    {
      id: FIXED.notifId2,
      user_id: currentUserId,
      type: 'live_class',
      title_en: 'Upcoming live class',
      title_ur: 'آنے والی لائیو کلاس',
      body_en: 'Tajweed practice session is scheduled soon.',
      body_ur: 'تجوید مشق کی کلاس جلد شیڈول ہے۔',
      link: '/student/live',
      is_read: true,
      metadata: {},
      created_at: now,
    },
  ]

  const libraryResources: DemoLibraryResource[] = [
    {
      id: FIXED.libraryId1,
      course_id: firstCourse.id,
      title_en: 'Dua booklet (PDF)',
      title_ur: 'دعا کتابچہ (پی ڈی ایف)',
      description_en: 'Sample public library resource.',
      description_ur: 'نمونہ عوامی کتب خانہ وسیلہ۔',
      resource_type: 'pdf',
      storage_path: null,
      external_url: 'https://example.com/demo-dua.pdf',
      is_public: true,
      uploaded_by: FIXED.teacherProfileId,
      created_at: now,
      updated_at: now,
    },
    {
      id: FIXED.libraryId2,
      course_id: null,
      title_en: 'Tajweed chart',
      title_ur: 'تجوید چارٹ',
      description_en: 'Quick reference chart.',
      description_ur: 'فوری حوالہ چارٹ۔',
      resource_type: 'link',
      storage_path: null,
      external_url: 'https://example.com/tajweed-chart',
      is_public: true,
      uploaded_by: FIXED.teacherProfileId,
      created_at: now,
      updated_at: now,
    },
  ]

  const duas: DemoDua[] = [
    {
      id: FIXED.duaId,
      slug: 'before-sleep',
      title_en: 'Dua before sleep',
      title_ur: 'سونے سے پہلے کی دعا',
      arabic_text: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
      transliteration: "Bismika Allahumma amutu wa ahya",
      translation_en: 'In Your name, O Allah, I die and I live.',
      translation_ur: 'اے اللہ! تیرے نام کے ساتھ میں مرتا ہوں اور جیتا ہوں۔',
      audio_path: null,
      category: 'daily',
      sort_order: 0,
      is_published: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'demo-dua-0002',
      slug: 'entering-masjid',
      title_en: 'Entering the masjid',
      title_ur: 'مسجد میں داخلے کی دعا',
      arabic_text: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
      transliteration: "Allahumma iftah li abwaba rahmatik",
      translation_en: 'O Allah, open for me the doors of Your mercy.',
      translation_ur: 'اے اللہ! میرے لیے اپنی رحمت کے دروازے کھول دے۔',
      audio_path: null,
      category: 'daily',
      sort_order: 1,
      is_published: true,
      created_at: now,
      updated_at: now,
    },
  ]

  const scheduledAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
  const liveClasses: DemoLiveClass[] = [
    {
      id: FIXED.liveClassId,
      course_id: courses[3]?.id ?? firstCourse.id,
      title_en: 'Tajweed practice circle',
      title_ur: 'تجوید مشق حلقہ',
      description_en: 'Join via the meeting link (demo).',
      description_ur: 'میٹنگ لنک سے شامل ہوں (ڈیمو)۔',
      scheduled_at: scheduledAt,
      ends_at: null,
      meeting_url: 'https://meet.jit.si/saut-ul-quran-demo',
      status: 'scheduled',
      host_id: FIXED.teacherProfileId,
      notes: null,
      created_at: now,
      updated_at: now,
    },
  ]

  const groups: DemoGroup[] = [
    {
      id: FIXED.groupId,
      name: 'Dua-e-Noor Circle',
      name_ur: 'دعائے نور حلقہ',
      group_type: 'chat',
      course_id: firstCourse.id,
      description: 'Demo course chat group',
      created_by: FIXED.teacherProfileId,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
  ]

  const groupMembers: Tables<'group_members'>[] = [
    {
      id: 'demo-gm-0001',
      group_id: FIXED.groupId,
      user_id: FIXED.teacherProfileId,
      role_in_group: 'admin',
      joined_at: now,
    },
    {
      id: 'demo-gm-0002',
      group_id: FIXED.groupId,
      user_id: FIXED.studentProfileId,
      role_in_group: 'member',
      joined_at: now,
    },
  ]

  const announcements: DemoAnnouncement[] = [
    {
      id: FIXED.announcementId,
      course_id: firstCourse.id,
      group_id: FIXED.groupId,
      title_en: 'Demo term starts this week',
      title_ur: 'ڈیمو ٹرم اس ہفتے شروع',
      body_en:
        'Welcome! Explore courses, library, and live classes with sample data.',
      body_ur:
        'خوش آمدید! نمونہ ڈیٹا کے ساتھ کورسز، کتب خانہ اور لائیو کلاسز دیکھیں۔',
      published_by: FIXED.teacherProfileId,
      published_at: now,
      is_pinned: true,
      is_published: true,
      created_at: now,
      updated_at: now,
    },
  ]

  const surahs: DemoSurah[] = [
    {
      id: FIXED.surahFatihaId,
      number: 1,
      name_ar: 'الفاتحة',
      name_en: 'Al-Fatiha',
      name_ur: 'الفاتحہ',
      revelation_type: 'makki',
      ayah_count: 7,
      created_at: now,
    },
    {
      id: FIXED.surahIkhlasId,
      number: 112,
      name_ar: 'الإخلاص',
      name_en: 'Al-Ikhlas',
      name_ur: 'الاخلاص',
      revelation_type: 'makki',
      ayah_count: 7,
      created_at: now,
    },
  ]

  const fatihaAyahs: Array<{ n: number; ar: string; en: string; ur: string }> =
    [
      {
        n: 1,
        ar: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
        en: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
        ur: 'اللہ کے نام سے جو بے حد مہربان، نہایت رحم والا ہے۔',
      },
      {
        n: 2,
        ar: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ',
        en: 'All praise is due to Allah, Lord of the worlds.',
        ur: 'سب تعریف اللہ کے لیے ہے جو تمام جہانوں کا رب ہے۔',
      },
      {
        n: 3,
        ar: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
        en: 'The Entirely Merciful, the Especially Merciful.',
        ur: 'بے حد مہربان، نہایت رحم والا۔',
      },
      {
        n: 4,
        ar: 'مَٰلِكِ يَوْمِ ٱلدِّينِ',
        en: 'Sovereign of the Day of Recompense.',
        ur: 'جزا کے دن کا مالک۔',
      },
      {
        n: 5,
        ar: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
        en: 'It is You we worship and You we ask for help.',
        ur: 'ہم تیری ہی عبادت کرتے ہیں اور تجھ ہی سے مدد مانگتے ہیں۔',
      },
      {
        n: 6,
        ar: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ',
        en: 'Guide us to the straight path.',
        ur: 'ہمیں سیدھا راستہ دکھا۔',
      },
      {
        n: 7,
        ar: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ',
        en: 'The path of those upon whom You have bestowed favor, not of those who have earned anger or of those who are astray.',
        ur: 'ان لوگوں کا راستہ جن پر تو نے انعام کیا، نہ ان کا جن پر غضب ہوا اور نہ گمراہوں کا۔',
      },
    ]

  const ayahs: DemoAyah[] = fatihaAyahs.map((a) => ({
    id: `demo-ayah-001-${a.n}`,
    surah_id: FIXED.surahFatihaId,
    ayah_number: a.n,
    text_ar: a.ar,
    text_uthmani: a.ar,
    translation_en: a.en,
    translation_ur: a.ur,
    tajweed_markup: [],
    para_id: null,
    page_number: 1,
    juz_number: 1,
  }))

  // Pad second surah to reach 14 ayahs total for corpus stats.
  for (let n = 1; n <= 7; n++) {
    ayahs.push({
      id: `demo-ayah-112-${n}`,
      surah_id: FIXED.surahIkhlasId,
      ayah_number: n,
      text_ar: n <= 4 ? 'قُلْ هُوَ ٱللَّهُ أَحَدٌ' : '—',
      text_uthmani: null,
      translation_en: 'Demo ayah (sample corpus).',
      translation_ur: 'ڈیمو آیت (نمونہ کارپس)۔',
      tajweed_markup: [],
      para_id: null,
      page_number: 604,
      juz_number: 30,
    })
  }

  const badges: DemoBadge[] = [
    {
      id: FIXED.badgeId,
      code: 'first-steps',
      name_en: 'First Steps',
      name_ur: 'پہلا قدم',
      description_en: 'Started learning in Saut Ul Quran.',
      description_ur: 'صوت القرآن میں سیکھنا شروع کیا۔',
      icon_url: null,
      points_required: 50,
      is_active: true,
      created_at: now,
    },
  ]

  const studentBadges: Tables<'student_badges'>[] = [
    {
      id: 'demo-sb-0001',
      student_id: FIXED.studentProfileId,
      badge_id: FIXED.badgeId,
      awarded_at: now,
      awarded_by: FIXED.teacherProfileId,
    },
  ]

  const pointsLedger: DemoPointsEntry[] = [
    {
      id: 'demo-pts-0001',
      student_id: FIXED.studentProfileId,
      points: 100,
      reason: 'Completed first lesson',
      reference_type: 'lesson',
      reference_id: lessons[0]?.id ?? null,
      created_by: FIXED.teacherProfileId,
      created_at: now,
    },
    {
      id: 'demo-pts-0002',
      student_id: FIXED.studentProfileId,
      points: 50,
      reason: 'Attendance streak',
      reference_type: 'attendance',
      reference_id: null,
      created_by: FIXED.teacherProfileId,
      created_at: now,
    },
  ]

  // Mirror points for current demo student if different.
  if (auth?.role === 'student') {
    const uid = profileFromAuth(auth).id
    if (uid !== FIXED.studentProfileId) {
      pointsLedger.push({
        id: 'demo-pts-current',
        student_id: uid,
        points: 150,
        reason: 'Demo welcome points',
        reference_type: null,
        reference_id: null,
        created_by: null,
        created_at: now,
      })
      studentBadges.push({
        id: 'demo-sb-current',
        student_id: uid,
        badge_id: FIXED.badgeId,
        awarded_at: now,
        awarded_by: null,
      })
    }
  }

  return {
    version: 1,
    profiles,
    userRoles,
    students,
    courses,
    courseTranslations,
    lessons,
    lessonTranslations,
    lessonContent,
    enrollments,
    certificates,
    notifications,
    libraryResources,
    duas,
    liveClasses,
    groups,
    groupMembers,
    announcements,
    surahs,
    ayahs,
    badges,
    studentBadges,
    pointsLedger,
    tests: [],
    testAssignments: [],
    testQuestions: [],
    testOptions: [],
    testAttempts: [],
    testAnswers: [],
    hifzProgress: [],
    hifzDaily: [],
    attendanceSessions: [],
    attendanceRecords: [],
    groupMessages: [],
    lessonProgress: [],
    ayahKnowledge: [],
    courseTeachers: [],
    preferences: [],
    aboutJamia: null,
    recordedClasses: [],
    credentials: {
      'tch-001': 'demo1234',
      'stu-001': 'demo1234',
      'fehmidataj27@gmail.com': 'demo1234',
    },
  }
}

function emptyExtras(): Pick<
  DemoStoreData,
  | 'testQuestions'
  | 'testOptions'
  | 'testAttempts'
  | 'testAnswers'
  | 'attendanceSessions'
  | 'attendanceRecords'
  | 'groupMessages'
  | 'lessonProgress'
  | 'ayahKnowledge'
  | 'courseTeachers'
  | 'preferences'
  | 'aboutJamia'
  | 'recordedClasses'
> {
  return {
    testQuestions: [],
    testOptions: [],
    testAttempts: [],
    testAnswers: [],
    attendanceSessions: [],
    attendanceRecords: [],
    groupMessages: [],
    lessonProgress: [],
    ayahKnowledge: [],
    courseTeachers: [],
    preferences: [],
    aboutJamia: null,
    recordedClasses: [],
  }
}

/** Backfill fields added after v1 localStorage seeds. */
function normalizeStore(data: DemoStoreData): DemoStoreData {
  return {
    ...emptyExtras(),
    ...data,
    testQuestions: data.testQuestions ?? [],
    testOptions: data.testOptions ?? [],
    testAttempts: data.testAttempts ?? [],
    testAnswers: data.testAnswers ?? [],
    attendanceSessions: data.attendanceSessions ?? [],
    attendanceRecords: data.attendanceRecords ?? [],
    groupMessages: data.groupMessages ?? [],
    lessonProgress: data.lessonProgress ?? [],
    ayahKnowledge: data.ayahKnowledge ?? [],
    courseTeachers: data.courseTeachers ?? [],
    preferences: data.preferences ?? [],
    aboutJamia: data.aboutJamia ?? null,
    recordedClasses: data.recordedClasses ?? [],
    hifzProgress: data.hifzProgress ?? [],
    hifzDaily: data.hifzDaily ?? [],
    tests: data.tests ?? [],
    testAssignments: data.testAssignments ?? [],
    credentials: data.credentials ?? {},
  }
}

let memory: DemoStoreData | null = null

function persist(data: DemoStoreData) {
  memory = data
  try {
    localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(data))
  } catch {
    // Quota / private mode — keep in-memory only.
  }
}

function loadFromStorage(): DemoStoreData | null {
  try {
    const raw = localStorage.getItem(DEMO_STORE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DemoStoreData
    if (parsed?.version !== 1 || !Array.isArray(parsed.courses)) return null
    return parsed
  } catch {
    return null
  }
}

/** Ensure current demo auth user exists in profiles/roles. */
function syncCurrentUser(data: DemoStoreData): DemoStoreData {
  const auth = readDemoAuth()
  if (!auth) return data
  const profile = profileFromAuth(auth)
  const profiles = [...data.profiles]
  const idx = profiles.findIndex((p) => p.id === profile.id)
  if (idx >= 0) profiles[idx] = { ...profiles[idx]!, ...profile }
  else profiles.push(profile)

  const userRoles = [...data.userRoles]
  if (!userRoles.some((r) => r.user_id === profile.id && r.role === auth.role)) {
    userRoles.push({
      id: id('demo-role'),
      user_id: profile.id,
      role: auth.role,
      granted_by: null,
      granted_at: nowIso(),
    })
  }

  return { ...data, profiles, userRoles }
}

/** Get mutable demo store (creates seed + persists on first access). */
export function getDemoStore(): DemoStoreData {
  if (!memory) {
    memory = normalizeStore(syncCurrentUser(loadFromStorage() ?? buildSeed()))
  } else {
    memory = normalizeStore(syncCurrentUser(memory))
  }
  persist(memory)
  return memory
}

export function saveDemoStore(data: DemoStoreData): void {
  persist(data)
}

export function resetDemoStore(): DemoStoreData {
  memory = null
  try {
    localStorage.removeItem(DEMO_STORE_KEY)
  } catch {
    /* */
  }
  const fresh = buildSeed()
  persist(fresh)
  return fresh
}

export function mutateDemoStore(
  mutator: (draft: DemoStoreData) => void,
): DemoStoreData {
  const store = structuredClone(getDemoStore())
  mutator(store)
  persist(store)
  return store
}

// ---------------------------------------------------------------------------
// Query helpers used by services
// ---------------------------------------------------------------------------

export function demoListCourses(options?: {
  publishedOnly?: boolean
}): DemoCourse[] {
  const store = getDemoStore()
  let courses = store.courses.map((c) => ({
    ...c,
    course_translations: store.courseTranslations.filter(
      (t) => t.course_id === c.id,
    ),
  }))
  if (options?.publishedOnly) {
    courses = courses.filter((c) => c.is_published)
  }
  return courses.sort((a, b) => a.sort_order - b.sort_order)
}

export function demoGetCourse(idOrSlug: string): DemoCourse | null {
  const courses = demoListCourses()
  return (
    courses.find((c) => c.id === idOrSlug) ??
    courses.find((c) => c.slug === idOrSlug) ??
    null
  )
}

export function demoUpsertCourse(input: {
  id?: string
  slug: string
  cover_image_url?: string | null
  difficulty?: string | null
  estimated_hours?: number | null
  is_published?: boolean
  sort_order?: number
  translations: Array<{
    locale: 'en' | 'ur'
    title: string
    description?: string | null
  }>
}): DemoCourse {
  const now = nowIso()
  mutateDemoStore((store) => {
    let courseId = input.id
    if (courseId) {
      const idx = store.courses.findIndex((c) => c.id === courseId)
      if (idx >= 0) {
        store.courses[idx] = {
          ...store.courses[idx]!,
          slug: input.slug,
          cover_image_url: input.cover_image_url ?? null,
          difficulty: input.difficulty ?? null,
          estimated_hours: input.estimated_hours ?? null,
          is_published: input.is_published ?? false,
          sort_order: input.sort_order ?? 0,
          updated_at: now,
        }
      }
    } else {
      courseId = id('demo-course')
      store.courses.push({
        id: courseId,
        slug: input.slug,
        cover_image_url: input.cover_image_url ?? null,
        difficulty: input.difficulty ?? null,
        estimated_hours: input.estimated_hours ?? null,
        is_published: input.is_published ?? false,
        sort_order: input.sort_order ?? store.courses.length,
        created_by: FIXED.teacherProfileId,
        created_at: now,
        updated_at: now,
      })
    }

    for (const tr of input.translations) {
      const existing = store.courseTranslations.findIndex(
        (t) => t.course_id === courseId && t.locale === tr.locale,
      )
      if (existing >= 0) {
        store.courseTranslations[existing] = {
          ...store.courseTranslations[existing]!,
          title: tr.title,
          description: tr.description ?? null,
        }
      } else {
        store.courseTranslations.push({
          id: id('demo-ctr'),
          course_id: courseId!,
          locale: tr.locale,
          title: tr.title,
          description: tr.description ?? null,
        })
      }
    }
  })
  return demoGetCourse(input.id ?? input.slug)!
}

export function demoListLessons(courseId: string): DemoLesson[] {
  const store = getDemoStore()
  return store.lessons
    .filter((l) => l.course_id === courseId)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((l) => ({
      ...l,
      lesson_translations: store.lessonTranslations.filter(
        (t) => t.lesson_id === l.id,
      ),
    }))
}

export function demoGetLesson(lessonId: string): DemoLesson | null {
  const store = getDemoStore()
  const lesson = store.lessons.find((l) => l.id === lessonId)
  if (!lesson) return null
  return {
    ...lesson,
    lesson_translations: store.lessonTranslations.filter(
      (t) => t.lesson_id === lessonId,
    ),
  }
}

export function demoListLessonContent(lessonId: string): DemoLessonContent[] {
  return getDemoStore()
    .lessonContent.filter((c) => c.lesson_id === lessonId)
    .sort((a, b) => a.sort_order - b.sort_order)
}

export function demoListStudents(): DemoStudent[] {
  const store = getDemoStore()
  return store.students.map((s) => ({
    ...s,
    profiles:
      store.profiles.find((p) => p.id === s.profile_id) ??
      ({
        id: s.profile_id,
        email: null,
        full_name: 'Unknown',
        full_name_ur: null,
        avatar_url: null,
        phone: null,
        locale: 'en' as const,
        bio: null,
        is_active: true,
        login_id: null,
        created_at: s.created_at,
        updated_at: s.updated_at,
      } satisfies DemoProfile),
  }))
}

export function demoListProfilesWithRoles(): Array<
  DemoProfile & { roles: AppRole[] }
> {
  const store = getDemoStore()
  const byUser = new Map<string, AppRole[]>()
  for (const row of store.userRoles) {
    const list = byUser.get(row.user_id) ?? []
    list.push(row.role)
    byUser.set(row.user_id, list)
  }
  return store.profiles
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((p) => ({ ...p, roles: byUser.get(p.id) ?? [] }))
}

export function demoPromoteToRole(
  userId: string,
  role: AppRole,
  grantedBy?: string | null,
): void {
  mutateDemoStore((store) => {
    if (!store.userRoles.some((r) => r.user_id === userId && r.role === role)) {
      store.userRoles.push({
        id: id('demo-role'),
        user_id: userId,
        role,
        granted_by: grantedBy ?? null,
        granted_at: nowIso(),
      })
    }
  })
}

export function demoCreateProvisionedUser(input: {
  loginId: string
  password: string
  fullName: string
  role: 'teacher' | 'student'
}): {
  userId: string
  loginId: string
  email: string
  role: 'teacher' | 'student'
} {
  const loginId = input.loginId.trim().toLowerCase()
  const email = `${loginId}@suq.local`
  const userId = id(`demo-${input.role}`)
  const now = nowIso()

  mutateDemoStore((store) => {
    if (
      store.profiles.some(
        (p) => p.login_id && p.login_id.toLowerCase() === loginId,
      )
    ) {
      throw new Error('Login ID already exists')
    }
    store.profiles.push({
      id: userId,
      email,
      full_name: input.fullName || loginId,
      full_name_ur: null,
      avatar_url: null,
      phone: null,
      locale: 'en',
      bio: null,
      is_active: true,
      login_id: loginId,
      created_at: now,
      updated_at: now,
    })
    store.userRoles = store.userRoles.filter((r) => r.user_id !== userId)
    store.userRoles.push({
      id: id('demo-role'),
      user_id: userId,
      role: input.role,
      granted_by: FIXED.adminProfileId,
      granted_at: now,
    })
    if (input.role === 'student') {
      store.students.push({
        id: id('demo-stu'),
        profile_id: userId,
        student_code: loginId.toUpperCase(),
        guardian_name: null,
        guardian_phone: null,
        date_of_birth: null,
        gender: null,
        address: null,
        notes: 'Provisioned by admin (demo)',
        joined_at: now,
        created_at: now,
        updated_at: now,
      })
    }
    store.credentials[loginId] = input.password
  })

  return { userId, loginId, email, role: input.role }
}

export function demoResetUserPassword(userId: string, password: string): void {
  mutateDemoStore((store) => {
    const profile = store.profiles.find((p) => p.id === userId)
    if (!profile?.login_id && !profile?.email) {
      throw new Error('User not found')
    }
    const key = (profile.login_id || profile.email || '').toLowerCase()
    store.credentials[key] = password
  })
}

/** Demo login check for admin-provisioned IDs. */
export function demoAuthenticateLogin(
  loginOrEmail: string,
  password: string,
): { role: AppRole; email: string; fullName: string } | null {
  const store = getDemoStore()
  const raw = loginOrEmail.trim().toLowerCase()
  const profile = store.profiles.find(
    (p) =>
      (p.login_id && p.login_id.toLowerCase() === raw) ||
      (p.email && p.email.toLowerCase() === raw) ||
      (p.email && p.email.toLowerCase() === `${raw}@suq.local`),
  )
  if (!profile) return null
  const key = (profile.login_id || profile.email || '').toLowerCase()
  const expected = store.credentials[key]
  if (!expected || expected !== password) return null
  const roles = store.userRoles
    .filter((r) => r.user_id === profile.id)
    .map((r) => r.role)
  const role: AppRole = roles.includes('admin')
    ? 'admin'
    : roles.includes('teacher')
      ? 'teacher'
      : 'student'
  return {
    role,
    email: profile.email || key,
    fullName: profile.full_name || key,
  }
}

export function demoDemoteFromRole(userId: string, role: AppRole): void {
  mutateDemoStore((store) => {
    store.userRoles = store.userRoles.filter(
      (r) => !(r.user_id === userId && r.role === role),
    )
  })
}

export function demoCountTeachers(): number {
  const ids = new Set(
    getDemoStore()
      .userRoles.filter((r) => r.role === 'teacher')
      .map((r) => r.user_id),
  )
  return ids.size
}

export function demoListEnrollments(filters?: {
  courseId?: string
  studentId?: string
  status?: Tables<'enrollments'>['status']
}): Array<
  DemoEnrollment & {
    courses: DemoCourse
  }
> {
  const courses = demoListCourses()
  let rows = getDemoStore().enrollments
  if (filters?.courseId) {
    rows = rows.filter((e) => e.course_id === filters.courseId)
  }
  if (filters?.studentId) {
    rows = rows.filter((e) => e.student_id === filters.studentId)
  }
  if (filters?.status) {
    rows = rows.filter((e) => e.status === filters.status)
  }
  return rows
    .map((e) => {
      const course =
        courses.find((c) => c.id === e.course_id) ??
        ({
          id: e.course_id,
          slug: 'unknown',
          cover_image_url: null,
          difficulty: null,
          estimated_hours: null,
          is_published: false,
          sort_order: 0,
          created_by: null,
          created_at: e.enrolled_at,
          updated_at: e.enrolled_at,
          course_translations: [],
        } satisfies DemoCourse)
      return { ...e, courses: course }
    })
    .sort((a, b) => b.enrolled_at.localeCompare(a.enrolled_at))
}

export function demoListCertificates(filters?: {
  studentId?: string
  courseId?: string
  status?: Tables<'certificates'>['status']
}): Array<
  DemoCertificate & {
    profiles?: Pick<
      DemoProfile,
      'id' | 'full_name' | 'full_name_ur' | 'email'
    > | null
    courses?: DemoCourse | null
  }
> {
  const store = getDemoStore()
  const courses = demoListCourses()
  let rows = store.certificates
  if (filters?.studentId) {
    rows = rows.filter((c) => c.student_id === filters.studentId)
  }
  if (filters?.courseId) {
    rows = rows.filter((c) => c.course_id === filters.courseId)
  }
  if (filters?.status) {
    rows = rows.filter((c) => c.status === filters.status)
  }
  return rows.map((c) => {
    const profile = store.profiles.find((p) => p.id === c.student_id)
    return {
      ...c,
      profiles: profile
        ? {
            id: profile.id,
            full_name: profile.full_name,
            full_name_ur: profile.full_name_ur,
            email: profile.email,
          }
        : null,
      courses: courses.find((x) => x.id === c.course_id) ?? null,
    }
  })
}

export function demoVerifyCertificate(certificateNumber: string): {
  valid: boolean
  certificate: {
    certificate_number: string
    student_name: string | null
    student_name_ur: string | null
    course_title_en: string | null
    course_title_ur: string | null
    issued_at: string | null
    status: Tables<'certificates'>['status']
  } | null
} {
  const trimmed = certificateNumber.trim()
  if (!trimmed) return { valid: false, certificate: null }

  const cert = demoListCertificates().find(
    (c) => c.certificate_number === trimmed,
  )
  if (!cert || cert.status !== 'issued') {
    return { valid: false, certificate: null }
  }

  const en =
    cert.courses?.course_translations.find((t) => t.locale === 'en')?.title ??
    null
  const ur =
    cert.courses?.course_translations.find((t) => t.locale === 'ur')?.title ??
    null

  return {
    valid: true,
    certificate: {
      certificate_number: cert.certificate_number,
      student_name: cert.profiles?.full_name ?? null,
      student_name_ur: cert.profiles?.full_name_ur ?? null,
      course_title_en: en,
      course_title_ur: ur,
      issued_at: cert.issued_at,
      status: cert.status,
    },
  }
}

export function demoGetAttendancePercentage(): {
  percentage: number
  total: number
  present: number
  absent: number
  late: number
  excused: number
} {
  return {
    percentage: 92,
    total: 25,
    present: 23,
    absent: 2,
    late: 0,
    excused: 0,
  }
}

export function demoListNotifications(
  userId: string,
  options?: { unreadOnly?: boolean; limit?: number },
): DemoNotification[] {
  let rows = getDemoStore().notifications.filter((n) => n.user_id === userId)
  if (options?.unreadOnly) rows = rows.filter((n) => !n.is_read)
  rows = rows.sort((a, b) => b.created_at.localeCompare(a.created_at))
  const limit = options?.limit ?? 100
  return rows.slice(0, limit)
}

export function demoUnreadCount(userId: string): number {
  return demoListNotifications(userId, { unreadOnly: true }).length
}

export function demoMarkNotificationRead(id: string): DemoNotification {
  let updated: DemoNotification | null = null
  mutateDemoStore((store) => {
    const idx = store.notifications.findIndex((n) => n.id === id)
    if (idx >= 0) {
      store.notifications[idx] = {
        ...store.notifications[idx]!,
        is_read: true,
      }
      updated = store.notifications[idx]!
    }
  })
  if (!updated) throw new Error('Notification not found')
  return updated
}

export function demoMarkAllNotificationsRead(userId: string): void {
  mutateDemoStore((store) => {
    store.notifications = store.notifications.map((n) =>
      n.user_id === userId ? { ...n, is_read: true } : n,
    )
  })
}

export function demoListResources(filters?: {
  courseId?: string
  resourceType?: Tables<'library_resources'>['resource_type']
  publicOnly?: boolean
}): Array<
  DemoLibraryResource & {
    courses: DemoCourse | null
  }
> {
  const courses = demoListCourses()
  let rows = getDemoStore().libraryResources
  if (filters?.courseId) {
    rows = rows.filter((r) => r.course_id === filters.courseId)
  }
  if (filters?.resourceType) {
    rows = rows.filter((r) => r.resource_type === filters.resourceType)
  }
  if (filters?.publicOnly) {
    rows = rows.filter((r) => r.is_public)
  }
  return rows.map((r) => ({
    ...r,
    courses: r.course_id
      ? (courses.find((c) => c.id === r.course_id) ?? null)
      : null,
  }))
}

export function demoListDuas(options?: {
  publishedOnly?: boolean
  category?: string
}): DemoDua[] {
  let rows = getDemoStore().duas
  if (options?.publishedOnly) rows = rows.filter((d) => d.is_published)
  if (options?.category) {
    rows = rows.filter((d) => d.category === options.category)
  }
  return rows.sort((a, b) => a.sort_order - b.sort_order)
}

export function demoListUpcomingLive(options?: {
  courseId?: string
  includePast?: boolean
  limit?: number
}): Array<DemoLiveClass & { courses: DemoCourse | null }> {
  const courses = demoListCourses()
  let rows = getDemoStore().liveClasses
  if (!options?.includePast) {
    rows = rows.filter((l) => l.status === 'scheduled' || l.status === 'live')
  }
  if (options?.courseId) {
    rows = rows.filter((l) => l.course_id === options.courseId)
  }
  rows = rows.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
  if (options?.limit) rows = rows.slice(0, options.limit)
  return rows.map((l) => ({
    ...l,
    courses: l.course_id
      ? (courses.find((c) => c.id === l.course_id) ?? null)
      : null,
  }))
}

export function demoListMyGroups(options?: {
  groupType?: Tables<'groups'>['group_type']
  courseId?: string
}): Array<
  DemoGroup & {
    courses: DemoCourse | null
  }
> {
  const courses = demoListCourses()
  let rows = getDemoStore().groups.filter((g) => g.is_active)
  if (options?.groupType) {
    rows = rows.filter((g) => g.group_type === options.groupType)
  }
  if (options?.courseId) {
    rows = rows.filter((g) => g.course_id === options.courseId)
  }
  return rows.map((g) => ({
    ...g,
    courses: g.course_id
      ? (courses.find((c) => c.id === g.course_id) ?? null)
      : null,
  }))
}

export function demoListAnnouncements(options?: {
  courseId?: string
  publishedOnly?: boolean
}): Array<
  DemoAnnouncement & {
    courses?: DemoCourse | null
    profiles?: Pick<DemoProfile, 'id' | 'full_name'> | null
  }
> {
  const store = getDemoStore()
  const courses = demoListCourses()
  let rows = store.announcements
  if (options?.courseId) {
    rows = rows.filter((a) => a.course_id === options.courseId)
  }
  if (options?.publishedOnly) {
    rows = rows.filter((a) => a.is_published)
  }
  return rows
    .slice()
    .sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned))
    .map((a) => {
      const publisher = store.profiles.find((p) => p.id === a.published_by)
      return {
        ...a,
        courses: a.course_id
          ? (courses.find((c) => c.id === a.course_id) ?? null)
          : null,
        profiles: publisher
          ? { id: publisher.id, full_name: publisher.full_name }
          : null,
      }
    })
}

export function demoListSurahs(): DemoSurah[] {
  return getDemoStore()
    .surahs.slice()
    .sort((a, b) => a.number - b.number)
}

export function demoGetAyahsBySurah(surahId: string): DemoAyah[] {
  return getDemoStore()
    .ayahs.filter((a) => a.surah_id === surahId)
    .sort((a, b) => a.ayah_number - b.ayah_number)
}

export function demoGetCorpusStats(): { surahCount: number; ayahCount: number } {
  const store = getDemoStore()
  return {
    surahCount: store.surahs.length || 2,
    ayahCount: store.ayahs.length || 14,
  }
}

export function demoGetPointsTotal(studentId: string): number {
  return getDemoStore()
    .pointsLedger.filter((p) => p.student_id === studentId)
    .reduce((sum, row) => sum + (row.points ?? 0), 0)
}

export function demoListPointsLedger(
  studentId: string,
  limit = 50,
): DemoPointsEntry[] {
  return getDemoStore()
    .pointsLedger.filter((p) => p.student_id === studentId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
}

export function demoListBadges(): DemoBadge[] {
  return getDemoStore()
    .badges.filter((b) => b.is_active)
    .sort(
      (a, b) => (a.points_required ?? 0) - (b.points_required ?? 0),
    )
}

export function demoListStudentBadges(
  studentId: string,
): DemoStudentBadge[] {
  const store = getDemoStore()
  return store.studentBadges
    .filter((sb) => sb.student_id === studentId)
    .map((sb) => ({
      ...sb,
      badges: store.badges.find((b) => b.id === sb.badge_id) ?? null,
    }))
}

export function demoListTests(): DemoTest[] {
  return getDemoStore().tests
}

export function demoListTestAssignments(
  studentProfileId: string,
): Array<DemoTestAssignment & { tests: DemoTest | null }> {
  const store = getDemoStore()
  return store.testAssignments
    .filter((a) => a.student_id === studentProfileId)
    .map((a) => ({
      ...a,
      tests: store.tests.find((t) => t.id === a.test_id) ?? null,
    }))
}

export function demoCreateTest(input: {
  titleEn: string
  titleUr?: string | null
  descriptionEn?: string | null
  descriptionUr?: string | null
  courseId?: string | null
  durationMinutes?: number | null
  passingScore?: number
  maxAttempts?: number | null
  status?: DemoTest['status']
  isPublished?: boolean
  createdBy?: string | null
}): DemoTest {
  const now = nowIso()
  const row: DemoTest = {
    id: id('demo-test'),
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
    created_at: now,
    updated_at: now,
  }
  mutateDemoStore((store) => {
    store.tests.unshift(row)
  })
  return row
}

export function demoGetTest(testId: string): DemoTest | null {
  return getDemoStore().tests.find((t) => t.id === testId) ?? null
}

export function demoAssignTest(input: {
  testId: string
  studentId: string
  assignedBy?: string | null
  dueAt?: string | null
}): DemoTestAssignment {
  const now = nowIso()
  const row: DemoTestAssignment = {
    id: id('demo-tassign'),
    test_id: input.testId,
    student_id: input.studentId,
    assigned_by: input.assignedBy ?? null,
    assigned_at: now,
    due_at: input.dueAt ?? null,
  }
  mutateDemoStore((store) => {
    store.testAssignments.push(row)
  })
  return row
}

export function demoCreateEnrollment(
  input: TablesInsert<'enrollments'>,
): DemoEnrollment {
  const now = nowIso()
  const row: DemoEnrollment = {
    id: input.id ?? id('demo-enroll'),
    course_id: input.course_id,
    student_id: input.student_id,
    status: input.status ?? 'active',
    enrolled_by: input.enrolled_by ?? null,
    enrolled_at: input.enrolled_at ?? now,
    completed_at: input.completed_at ?? null,
    notes: input.notes ?? null,
  }
  mutateDemoStore((store) => {
    store.enrollments.push(row)
  })
  return row
}

export function demoUpdateEnrollment(
  enrollmentId: string,
  patch: Partial<DemoEnrollment>,
): DemoEnrollment {
  let updated: DemoEnrollment | null = null
  mutateDemoStore((store) => {
    const idx = store.enrollments.findIndex((e) => e.id === enrollmentId)
    if (idx < 0) throw new Error('Enrollment not found')
    store.enrollments[idx] = { ...store.enrollments[idx]!, ...patch }
    updated = store.enrollments[idx]!
  })
  return updated!
}

export function demoCreateAnnouncement(
  input: TablesInsert<'announcements'>,
): DemoAnnouncement {
  const now = nowIso()
  const row: DemoAnnouncement = {
    id: input.id ?? id('demo-ann'),
    course_id: input.course_id ?? null,
    group_id: input.group_id ?? null,
    title_en: input.title_en,
    title_ur: input.title_ur ?? null,
    body_en: input.body_en,
    body_ur: input.body_ur ?? null,
    published_by: input.published_by ?? null,
    published_at: input.published_at ?? now,
    is_pinned: input.is_pinned ?? false,
    is_published: input.is_published ?? true,
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
  }
  mutateDemoStore((store) => {
    store.announcements.push(row)
  })
  return row
}

export function demoUpdateAnnouncement(
  announcementId: string,
  patch: Partial<DemoAnnouncement>,
): DemoAnnouncement {
  let updated: DemoAnnouncement | null = null
  mutateDemoStore((store) => {
    const idx = store.announcements.findIndex((a) => a.id === announcementId)
    if (idx < 0) throw new Error('Announcement not found')
    store.announcements[idx] = {
      ...store.announcements[idx]!,
      ...patch,
      updated_at: patch.updated_at ?? nowIso(),
    }
    updated = store.announcements[idx]!
  })
  return updated!
}

export function demoDeleteAnnouncement(announcementId: string): void {
  mutateDemoStore((store) => {
    store.announcements = store.announcements.filter(
      (a) => a.id !== announcementId,
    )
  })
}

export function demoCreateAttendanceSession(
  input: TablesInsert<'attendance_sessions'>,
): Tables<'attendance_sessions'> {
  const now = nowIso()
  const row: Tables<'attendance_sessions'> = {
    id: input.id ?? id('demo-att-sess'),
    course_id: input.course_id,
    teacher_id: input.teacher_id ?? null,
    session_date: input.session_date ?? now.slice(0, 10),
    title: input.title ?? null,
    notes: input.notes ?? null,
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
  }
  mutateDemoStore((store) => {
    store.attendanceSessions.push(row)
  })
  return row
}

export function demoMarkAttendanceRecords(
  sessionId: string,
  records: Array<{
    studentId: string
    status: Tables<'attendance_records'>['status']
    notes?: string | null
    markedBy?: string | null
  }>,
): Tables<'attendance_records'>[] {
  const now = nowIso()
  const result: Tables<'attendance_records'>[] = []
  mutateDemoStore((store) => {
    for (const r of records) {
      const existing = store.attendanceRecords.findIndex(
        (row) =>
          row.session_id === sessionId && row.student_id === r.studentId,
      )
      const row: Tables<'attendance_records'> = {
        id:
          existing >= 0
            ? store.attendanceRecords[existing]!.id
            : id('demo-att-rec'),
        session_id: sessionId,
        student_id: r.studentId,
        status: r.status,
        notes: r.notes ?? null,
        marked_by: r.markedBy ?? null,
        marked_at: now,
      }
      if (existing >= 0) store.attendanceRecords[existing] = row
      else store.attendanceRecords.push(row)
      result.push(row)
    }
  })
  return result
}

export function demoListAttendanceSessions(filters?: {
  courseId?: string
  dateFrom?: string
  dateTo?: string
  studentId?: string
}): Array<
  Tables<'attendance_sessions'> & {
    courses: DemoCourse
    attendance_records: Array<
      Tables<'attendance_records'> & { profiles: DemoProfile | null }
    >
  }
> {
  const store = getDemoStore()
  const courses = demoListCourses()
  let sessions = store.attendanceSessions.slice()
  if (filters?.courseId) {
    sessions = sessions.filter((s) => s.course_id === filters.courseId)
  }
  if (filters?.dateFrom) {
    sessions = sessions.filter((s) => s.session_date >= filters.dateFrom!)
  }
  if (filters?.dateTo) {
    sessions = sessions.filter((s) => s.session_date <= filters.dateTo!)
  }
  sessions = sessions.sort((a, b) =>
    b.session_date.localeCompare(a.session_date),
  )

  return sessions
    .map((s) => {
      let records = store.attendanceRecords
        .filter((r) => r.session_id === s.id)
        .map((r) => ({
          ...r,
          profiles: store.profiles.find((p) => p.id === r.student_id) ?? null,
        }))
      if (filters?.studentId) {
        records = records.filter((r) => r.student_id === filters.studentId)
      }
      const course =
        courses.find((c) => c.id === s.course_id) ??
        ({
          id: s.course_id,
          slug: 'unknown',
          cover_image_url: null,
          difficulty: null,
          estimated_hours: null,
          is_published: false,
          sort_order: 0,
          created_by: null,
          created_at: s.created_at,
          updated_at: s.updated_at,
          course_translations: [],
        } satisfies DemoCourse)
      return { ...s, courses: course, attendance_records: records }
    })
    .filter((s) => !filters?.studentId || s.attendance_records.length > 0)
}

export function demoListAttendanceRecords(
  studentProfileId: string,
  options?: { courseId?: string; limit?: number },
): Array<
  Tables<'attendance_records'> & {
    attendance_sessions: Tables<'attendance_sessions'> & {
      courses: DemoCourse
    }
  }
> {
  const store = getDemoStore()
  const courses = demoListCourses()
  let rows = store.attendanceRecords.filter(
    (r) => r.student_id === studentProfileId,
  )
  rows = rows.sort((a, b) => b.marked_at.localeCompare(a.marked_at))
  if (options?.limit) rows = rows.slice(0, options.limit)

  return rows
    .map((r) => {
      const session = store.attendanceSessions.find(
        (s) => s.id === r.session_id,
      )
      if (!session) return null
      if (options?.courseId && session.course_id !== options.courseId) {
        return null
      }
      const course =
        courses.find((c) => c.id === session.course_id) ??
        ({
          id: session.course_id,
          slug: 'unknown',
          cover_image_url: null,
          difficulty: null,
          estimated_hours: null,
          is_published: false,
          sort_order: 0,
          created_by: null,
          created_at: session.created_at,
          updated_at: session.updated_at,
          course_translations: [],
        } satisfies DemoCourse)
      return {
        ...r,
        attendance_sessions: { ...session, courses: course },
      }
    })
    .filter((r): r is NonNullable<typeof r> => r != null)
}

export function demoListHifzProgress(
  studentProfileId: string,
): Array<Tables<'hifz_progress'> & { surahs: DemoSurah | null }> {
  const store = getDemoStore()
  return store.hifzProgress
    .filter((p) => p.student_id === studentProfileId)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .map((p) => ({
      ...p,
      surahs: store.surahs.find((s) => s.id === p.surah_id) ?? null,
    }))
}

export function demoUpsertHifzProgress(
  input: TablesInsert<'hifz_progress'>,
): Tables<'hifz_progress'> {
  const now = nowIso()
  let row: Tables<'hifz_progress'> | null = null
  mutateDemoStore((store) => {
    if (input.id) {
      const idx = store.hifzProgress.findIndex((p) => p.id === input.id)
      if (idx >= 0) {
        store.hifzProgress[idx] = {
          ...store.hifzProgress[idx]!,
          surah_id: input.surah_id,
          ayah_from: input.ayah_from,
          ayah_to: input.ayah_to,
          status: input.status ?? store.hifzProgress[idx]!.status,
          notes: input.notes ?? null,
          assigned_by: input.assigned_by ?? null,
          updated_at: now,
        }
        row = store.hifzProgress[idx]!
        return
      }
    }
    row = {
      id: input.id ?? id('demo-hifz-p'),
      student_id: input.student_id,
      surah_id: input.surah_id,
      ayah_from: input.ayah_from,
      ayah_to: input.ayah_to,
      status: input.status ?? 'in_progress',
      assigned_by: input.assigned_by ?? null,
      notes: input.notes ?? null,
      created_at: input.created_at ?? now,
      updated_at: now,
    }
    store.hifzProgress.push(row)
  })
  return row!
}

export function demoApproveHifzProgress(
  progressId: string,
  status: Tables<'hifz_progress'>['status'] = 'memorized',
  notes?: string | null,
): Tables<'hifz_progress'> {
  let updated: Tables<'hifz_progress'> | null = null
  mutateDemoStore((store) => {
    const idx = store.hifzProgress.findIndex((p) => p.id === progressId)
    if (idx < 0) throw new Error('Hifz progress not found')
    store.hifzProgress[idx] = {
      ...store.hifzProgress[idx]!,
      status,
      notes: notes ?? store.hifzProgress[idx]!.notes,
      updated_at: nowIso(),
    }
    updated = store.hifzProgress[idx]!
  })
  return updated!
}

export function demoListHifzDaily(
  studentProfileId: string,
  limit = 60,
): Array<Tables<'hifz_daily_records'> & { surahs: DemoSurah | null }> {
  const store = getDemoStore()
  return store.hifzDaily
    .filter((r) => r.student_id === studentProfileId)
    .sort((a, b) => b.record_date.localeCompare(a.record_date))
    .slice(0, limit)
    .map((r) => ({
      ...r,
      surahs: r.surah_id
        ? (store.surahs.find((s) => s.id === r.surah_id) ?? null)
        : null,
    }))
}

export function demoUpsertHifzDaily(
  input: TablesInsert<'hifz_daily_records'>,
): Tables<'hifz_daily_records'> & { surahs: DemoSurah | null } {
  const now = nowIso()
  let rowId = input.id
  mutateDemoStore((store) => {
    if (rowId) {
      const idx = store.hifzDaily.findIndex((r) => r.id === rowId)
      if (idx >= 0) {
        store.hifzDaily[idx] = {
          ...store.hifzDaily[idx]!,
          ...input,
          id: rowId,
          updated_at: now,
        } as Tables<'hifz_daily_records'>
        return
      }
    }
    rowId = rowId ?? id('demo-hifz-d')
    store.hifzDaily.push({
      id: rowId,
      student_id: input.student_id,
      record_date: input.record_date ?? now.slice(0, 10),
      surah_id: input.surah_id ?? null,
      ayah_from: input.ayah_from ?? null,
      ayah_to: input.ayah_to ?? null,
      pages_revised: input.pages_revised ?? null,
      quality_rating: input.quality_rating ?? null,
      teacher_notes: input.teacher_notes ?? null,
      recorded_by: input.recorded_by ?? null,
      created_at: input.created_at ?? now,
      updated_at: now,
    })
  })
  const store = getDemoStore()
  const row = store.hifzDaily.find((r) => r.id === rowId)!
  return {
    ...row,
    surahs: row.surah_id
      ? (store.surahs.find((s) => s.id === row.surah_id) ?? null)
      : null,
  }
}

export function demoAwardPoints(
  input: TablesInsert<'points_ledger'>,
): DemoPointsEntry {
  const row: DemoPointsEntry = {
    id: input.id ?? id('demo-pts'),
    student_id: input.student_id,
    points: input.points,
    reason: input.reason,
    reference_type: input.reference_type ?? null,
    reference_id: input.reference_id ?? null,
    created_by: input.created_by ?? null,
    created_at: input.created_at ?? nowIso(),
  }
  mutateDemoStore((store) => {
    store.pointsLedger.push(row)
  })
  return row
}

export function demoAwardBadge(input: {
  studentId: string
  badgeId: string
  awardedBy?: string | null
}): Tables<'student_badges'> {
  const store = getDemoStore()
  const existing = store.studentBadges.find(
    (sb) =>
      sb.student_id === input.studentId && sb.badge_id === input.badgeId,
  )
  if (existing) return existing

  const row: Tables<'student_badges'> = {
    id: id('demo-sb'),
    student_id: input.studentId,
    badge_id: input.badgeId,
    awarded_at: nowIso(),
    awarded_by: input.awardedBy ?? null,
  }
  mutateDemoStore((s) => {
    s.studentBadges.push(row)
  })
  return row
}

export function demoGetBadge(badgeId: string): DemoBadge | null {
  return getDemoStore().badges.find((b) => b.id === badgeId) ?? null
}

export function demoCreateLiveClass(
  input: TablesInsert<'live_classes'>,
): DemoLiveClass {
  const now = nowIso()
  const row: DemoLiveClass = {
    id: input.id ?? id('demo-live'),
    course_id: input.course_id ?? null,
    title_en: input.title_en,
    title_ur: input.title_ur ?? null,
    description_en: input.description_en ?? null,
    description_ur: input.description_ur ?? null,
    scheduled_at: input.scheduled_at,
    ends_at: input.ends_at ?? null,
    meeting_url: input.meeting_url ?? null,
    status: input.status ?? 'scheduled',
    host_id: input.host_id ?? null,
    notes: input.notes ?? null,
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
  }
  mutateDemoStore((store) => {
    store.liveClasses.push(row)
  })
  return row
}

export function demoUpdateLiveClass(
  liveClassId: string,
  patch: Partial<DemoLiveClass>,
): DemoLiveClass {
  let updated: DemoLiveClass | null = null
  mutateDemoStore((store) => {
    const idx = store.liveClasses.findIndex((l) => l.id === liveClassId)
    if (idx < 0) throw new Error('Live class not found')
    store.liveClasses[idx] = {
      ...store.liveClasses[idx]!,
      ...patch,
      updated_at: patch.updated_at ?? nowIso(),
    }
    updated = store.liveClasses[idx]!
  })
  return updated!
}

export function demoCreateNotification(
  input: TablesInsert<'notifications'>,
): DemoNotification {
  const row: DemoNotification = {
    id: input.id ?? id('demo-notif'),
    user_id: input.user_id,
    type: input.type ?? 'info',
    title_en: input.title_en,
    title_ur: input.title_ur ?? null,
    body_en: input.body_en ?? null,
    body_ur: input.body_ur ?? null,
    link: input.link ?? null,
    is_read: input.is_read ?? false,
    metadata: input.metadata ?? {},
    created_at: input.created_at ?? nowIso(),
  }
  mutateDemoStore((store) => {
    store.notifications.push(row)
  })
  return row
}

export function demoGetLessonProgress(
  studentId: string,
  lessonId: string,
): Tables<'lesson_progress'> | null {
  return (
    getDemoStore().lessonProgress.find(
      (p) => p.student_id === studentId && p.lesson_id === lessonId,
    ) ?? null
  )
}

export function demoSaveLessonProgress(input: {
  studentId: string
  lessonId: string
  positionSeconds?: number
  status?: Tables<'lesson_progress'>['status']
  percent?: number
}): Tables<'lesson_progress'> {
  const now = nowIso()
  const existing = demoGetLessonProgress(input.studentId, input.lessonId)
  const progressPercent = Math.min(
    100,
    Math.max(0, input.percent ?? existing?.progress_percent ?? 0),
  )
  let status: Tables<'lesson_progress'>['status'] =
    input.status ?? existing?.status ?? 'in_progress'
  if (progressPercent >= 100) status = 'completed'
  else if (status === 'not_started' && (input.positionSeconds ?? 0) > 0) {
    status = 'in_progress'
  }

  let result: Tables<'lesson_progress'> | null = null
  mutateDemoStore((store) => {
    if (existing) {
      const idx = store.lessonProgress.findIndex((p) => p.id === existing.id)
      if (idx >= 0) {
        store.lessonProgress[idx] = {
          ...store.lessonProgress[idx]!,
          last_position_seconds:
            input.positionSeconds ??
            existing.last_position_seconds ??
            0,
          progress_percent: progressPercent,
          status,
          updated_at: now,
          completed_at:
            status === 'completed' ? (existing.completed_at ?? now) : null,
        }
        result = store.lessonProgress[idx]!
      }
    } else {
      result = {
        id: id('demo-lp'),
        student_id: input.studentId,
        lesson_id: input.lessonId,
        last_position_seconds: input.positionSeconds ?? 0,
        progress_percent: progressPercent,
        status,
        completed_at: status === 'completed' ? now : null,
        created_at: now,
        updated_at: now,
      }
      store.lessonProgress.push(result)
    }
  })
  return result!
}

export function demoListCourseLessonProgress(
  studentId: string,
  courseId: string,
): Tables<'lesson_progress'>[] {
  const store = getDemoStore()
  const lessonIds = new Set(
    store.lessons.filter((l) => l.course_id === courseId).map((l) => l.id),
  )
  return store.lessonProgress.filter(
    (p) => p.student_id === studentId && lessonIds.has(p.lesson_id),
  )
}

/** Soft create lesson in demo store. */
export function demoUpsertLesson(input: TablesInsert<'lessons'> & {
  id?: string
  translations?: Array<{
    locale: 'en' | 'ur'
    title: string
    summary?: string | null
  }>
}): DemoLesson {
  const now = nowIso()
  let lessonId = input.id
  mutateDemoStore((store) => {
    if (lessonId) {
      const idx = store.lessons.findIndex((l) => l.id === lessonId)
      if (idx >= 0) {
        store.lessons[idx] = {
          ...store.lessons[idx]!,
          ...input,
          id: lessonId,
          updated_at: now,
        } as Tables<'lessons'>
      }
    } else {
      lessonId = id('demo-lesson')
      store.lessons.push({
        id: lessonId,
        course_id: input.course_id,
        slug: input.slug,
        sort_order: input.sort_order ?? 0,
        duration_minutes: input.duration_minutes ?? null,
        is_published: input.is_published ?? false,
        created_at: now,
        updated_at: now,
      })
    }
    if (input.translations && lessonId) {
      for (const tr of input.translations) {
        const existing = store.lessonTranslations.findIndex(
          (t) => t.lesson_id === lessonId && t.locale === tr.locale,
        )
        if (existing >= 0) {
          store.lessonTranslations[existing] = {
            ...store.lessonTranslations[existing]!,
            title: tr.title,
            summary: tr.summary ?? null,
          }
        } else {
          store.lessonTranslations.push({
            id: id('demo-ltr'),
            lesson_id: lessonId,
            locale: tr.locale,
            title: tr.title,
            summary: tr.summary ?? null,
          })
        }
      }
    }
  })
  const lessons = demoListLessons(input.course_id)
  return lessons.find((l) => l.id === lessonId)!
}

export { FIXED as DEMO_FIXED_IDS }
