import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import en from './en';
import pl from './pl';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en, pl },
    fallbackLng: 'pl',
    lng: 'pl',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
