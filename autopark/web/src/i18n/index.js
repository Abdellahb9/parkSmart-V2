import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import fr from './fr';
import ar from './ar';

export const LANG_KEY = 'autopark_lang';
export const LANGUAGES = [
  { code: 'fr', label: 'Français', short: 'FR', dir: 'ltr', locale: 'fr-MA' },
  { code: 'ar', label: 'العربية', short: 'ع', dir: 'rtl', locale: 'ar-MA' },
];

const byCode = (code) => LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];

const readSaved = () => {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    return LANGUAGES.some((l) => l.code === saved) ? saved : 'fr';
  } catch {
    return 'fr';
  }
};

/** Mirrors the language onto <html>, which is what flips Tailwind's rtl: variants. */
const applyToDocument = (code) => {
  const lang = byCode(code);
  document.documentElement.lang = lang.code;
  document.documentElement.dir = lang.dir;
};

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, ar: { translation: ar } },
  lng: readSaved(),
  fallbackLng: 'fr',
  // React already escapes; double escaping would show &amp; in labels.
  interpolation: { escapeValue: false },
  returnNull: false,
});

applyToDocument(i18n.language);

i18n.on('languageChanged', (code) => {
  applyToDocument(code);
  try {
    localStorage.setItem(LANG_KEY, code);
  } catch {
    // Not persisting is fine; the choice lasts for this tab.
  }
});

export const setLanguage = (code) => i18n.changeLanguage(byCode(code).code);

/** The Intl locale for the active language: fr-MA or ar-MA (Latin digits). */
export const currentLocale = () => byCode(i18n.language).locale;

export const isRtl = () => byCode(i18n.language).dir === 'rtl';

/** Direction-aware helpers for components that position things themselves. */
export function useDirection() {
  const { i18n: instance } = useTranslation();
  const lang = byCode(instance.language);
  return { dir: lang.dir, rtl: lang.dir === 'rtl', lang: lang.code, locale: lang.locale };
}

export default i18n;
