import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './en.json';
import hi from './hi.json';
import kn from './kn.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  kn: { translation: kn },
};

// One-time migration: older builds used `ka` for Kannada by mistake.
// Keep supported languages strict (`en`, `hi`, `kn`) but transparently migrate.
if (typeof window !== 'undefined') {
  try {
    const stored = window.localStorage?.getItem('i18nextLng');
    if (stored === 'ka') window.localStorage.setItem('i18nextLng', 'kn');
  } catch {
    // ignore storage access errors
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: ['en', 'hi', 'kn'],
    fallbackLng: 'en',
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
