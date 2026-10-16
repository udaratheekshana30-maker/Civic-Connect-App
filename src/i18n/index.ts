import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import type { Language } from '@/types';
import en from './en';
import si from './si';
import ta from './ta';

export const supportedLanguages: Language[] = ['en', 'si', 'ta'];

/** Device language if we support it, otherwise English. */
export function deviceLanguage(): Language {
  const code = getLocales()[0]?.languageCode;
  return supportedLanguages.includes(code as Language) ? (code as Language) : 'en';
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, si: { translation: si }, ta: { translation: ta } },
  lng: deviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnObjects: true,
});

export default i18n;
