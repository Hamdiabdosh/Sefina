import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from '../locales/en.json';
import am from '../locales/am.json';
import ar from '../locales/ar.json';

const applyDocumentLanguage = (lng: string) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.body.style.fontFamily =
    lng === 'ar' ? 'var(--font-body-ar)' : 'var(--font-sans)';
};

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      am: { translation: am },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })
  .then(() => {
    applyDocumentLanguage(i18n.language);
  });

i18n.on('languageChanged', applyDocumentLanguage);

export default i18n;
