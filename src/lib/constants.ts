export const APP_NAME = 'Saut Ul Quran'
export const JAMIA_NAME = 'Jamia Saut-ul-Quran'
export const DEFAULT_LOCALE = 'en' as const
export const LOCALES = ['en', 'ur'] as const
export type AppLocale = (typeof LOCALES)[number]

export const ROLES = ['admin', 'teacher', 'student'] as const
export type UserRole = (typeof ROLES)[number]

export const COURSE_SLUGS = [
  'dua-e-noor-series',
  'ibad-ur-rahman-hifz-series',
  'tarteel-ul-quran-course',
  'tajweed-ul-quran-course',
  'yassarna-ul-quran-course',
  'hadith-shareef-course',
  'tafseer-ul-quran-course',
  'namaz-course',
  'umrah-guide-course',
] as const

export const LANGUAGE_STORAGE_KEY = 'suq_locale'

export const DEFAULT_JAMIA = {
  nameEn: 'Jamia Saut-ul-Quran',
  nameUr: 'جامعہ صوت القرآن',
  locationEn: 'Mandi Yala Tega, Tehsil Kamoke, District Gujranwala',
  locationUr: 'منڈی یالہ تیگہ، تحصیل کامونکی، ضلع گوجرانوالہ',
  headUstazahEn: 'Hafiza Wajiha',
  headUstazahUr: 'حافظہ وجیہہ',
  missionEn:
    'Teaching the Quran with correct Tajweed, translation and Tafseer, Hifz, Hadith Shareef, and guidance on Namaz and Umrah.',
  missionUr:
    'قرآن کریم کی درست تجوید، ترجمہ و تفسیر، حفظ، حدیث شریف، اور نماز و عمرہ کی رہنمائی کے ساتھ تعلیم۔',
  phone: null as string | null,
  email: 'info@sautulquran.demo' as string | null,
  website: null as string | null,
  logoUrl: '/logo.svg' as string | null,
}

/** Maps COURSE_SLUGS to i18n keys under `courses.*` */
export const COURSE_I18N_KEYS = {
  'dua-e-noor-series': 'duaNoor',
  'ibad-ur-rahman-hifz-series': 'hifzSeries',
  'tarteel-ul-quran-course': 'tarteel',
  'tajweed-ul-quran-course': 'tajweedCourse',
  'yassarna-ul-quran-course': 'yassarna',
  'hadith-shareef-course': 'hadith',
  'tafseer-ul-quran-course': 'tafseer',
  'namaz-course': 'namaz',
  'umrah-guide-course': 'umrah',
} as const satisfies Record<(typeof COURSE_SLUGS)[number], string>
