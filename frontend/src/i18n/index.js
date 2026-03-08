import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import es from './locales/es.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import pt from './locales/pt.json';
import it from './locales/it.json';
import ar from './locales/ar.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      de: { translation: de },
      fr: { translation: fr },
      pt: { translation: pt },
      it: { translation: it },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  });

// RTL support: update dir attribute when language changes
const RTL_LANGUAGES = ['ar'];
const updateDirection = (lng) => {
  const lang = lng?.substring(0, 2) || 'en';
  document.documentElement.dir = RTL_LANGUAGES.includes(lang) ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
};
i18n.on('languageChanged', updateDirection);
updateDirection(i18n.language);

export default i18n;
