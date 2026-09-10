import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import {
  DEFAULT_LOCALE,
  LANGUAGE_STORAGE_KEY,
  LOCALES,
  type AppLocale,
} from '@/lib/constants'
import en from './en.json'
import ur from './ur.json'

function isAppLocale(value: string | null): value is AppLocale {
  return LOCALES.includes(value as AppLocale)
}

function getStoredLocale(): AppLocale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return isAppLocale(stored) ? stored : DEFAULT_LOCALE
}

function applyDocumentLanguage(locale: AppLocale) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = locale
  document.documentElement.dir = locale === 'ur' ? 'rtl' : 'ltr'
}

const initialLocale = getStoredLocale()

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ur: { translation: ur },
  },
  lng: initialLocale,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: [...LOCALES],
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
})

applyDocumentLanguage(initialLocale)

i18n.on('languageChanged', (lng) => {
  const locale = isAppLocale(lng) ? lng : DEFAULT_LOCALE
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, locale)
  applyDocumentLanguage(locale)
})

export default i18n
