// עיצוב תאריך הזמנה לתצוגה (createdAt של Order, ISO string מה-API) - התאריך
// היחיד שמוצג באתר כרגע, אז Intl.DateTimeFormat מובנה מספיק בלי ספריית
// תאריכים חיצונית. he-IL/en-GB בהתאם ל-SUPPORTED_LOCALES.
import type { Locale } from "@/constants";

export function formatOrderDate(isoDate: string, locale: Locale): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
