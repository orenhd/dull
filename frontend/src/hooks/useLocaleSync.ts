// תנאי הכרחי מ-TECH_SPEC.md סעיף 3: "יש לסנכרן בפועל <html lang="he"
// dir="rtl"> ... מול ה-locale הפעיל ב-react-i18next... בלי זה, שום override
// ב-tokens.css לא 'מתעורר'". מאזין ל-i18next "languageChanged" (לא רק רץ
// פעם אחת ב-mount) כדי לתפוס גם שינוי שפה בזמן ריצה (למשל דרך
// LanguageSwitcher), לא רק את הזיהוי הראשוני של הדפדפן.
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LOCALES, type Locale } from "@/constants";

const RTL_LOCALES: readonly Locale[] = ["he"];

function isSupportedLocale(lng: string): lng is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(lng);
}

function applyDocumentLocale(lng: string) {
  const locale = isSupportedLocale(lng) ? lng : "en";
  document.documentElement.lang = locale;
  document.documentElement.dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
}

export function useLocaleSync() {
  const { i18n } = useTranslation();

  useEffect(() => {
    applyDocumentLocale(i18n.resolvedLanguage ?? i18n.language);
    i18n.on("languageChanged", applyDocumentLocale);
    return () => {
      i18n.off("languageChanged", applyDocumentLocale);
    };
  }, [i18n]);
}
