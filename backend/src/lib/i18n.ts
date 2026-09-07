// שדות i18n מאוחסנים ב-DB כ-JSON, לדוגמה { en: "Darkthrone Tee", he: "..." }.
// localize() בוחר את השפה המבוקשת עם נפילה חזרה ל-DEFAULT_LOCALE אם חסר
// תרגום לאותו שדה - כך שדה בעבודה (עוד לא תורגם לעברית) לא יציג "undefined".
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "../constants/index.js";

type LocalizedJson = Record<string, string>;

export function localize(
  value: LocalizedJson | null | undefined,
  locale: Locale,
): string | null {
  if (!value) return null;
  return value[locale] ?? value[DEFAULT_LOCALE] ?? null;
}

// query params מגיעים כ-string לא-מאומת מהלקוח - לא סומכים עליהם בלי בדיקה
// מול הרשימה הסגורה ב-constants, אחרת אפשר "לבקש" locale שלא קיים.
export function parseLocale(raw: unknown): Locale {
  if (typeof raw === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(raw)) {
    return raw as Locale;
  }
  return DEFAULT_LOCALE;
}
