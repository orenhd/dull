// react-i18next - טקסט UI "שאינו סחורה" בלבד (ניווט, כפתורים, הודעות מערכת).
// טקסט מוצר (שם, תיאור, קרדיט) מגיע כבר מתורגם מה-API לפי `locale`
// (docs/API_CONTRACT.md) - לא עובר דרך i18next. ראו TECH_SPEC.md סעיף 3.
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/constants";
import en from "./locales/en/common.json";
import he from "./locales/he/common.json";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: en },
      he: { common: he },
    },
    defaultNS: "common",
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: SUPPORTED_LOCALES,
    nonExplicitSupportedLngs: true, // "he-IL" וכו' -> "he", לא נופל ל-fallback בטעות
    detection: {
      // i18next-browser-languagedetector כותב/קורא locale ב-localStorage
      // תחת המפתח שלו (constants.I18NEXT_LANGUAGE_STORAGE_KEY, ברירת המחדל
      // "i18nextLng") - לא צריך לנהל את זה ידנית.
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false, // React כבר עושה escaping
    },
  });

export default i18n;
