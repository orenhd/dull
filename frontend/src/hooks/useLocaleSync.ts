// תנאי הכרחי מ-TECH_SPEC.md סעיף 3: "יש לסנכרן בפועל <html lang="he"
// dir="rtl"> ... מול ה-locale הפעיל ב-react-i18next... בלי זה, שום override
// ב-tokens.css לא 'מתעורר'". מאזין ל-i18next "languageChanged" (לא רק רץ
// פעם אחת ב-mount) כדי לתפוס גם שינוי שפה בזמן ריצה (למשל דרך
// LanguageSwitcher), לא רק את הזיהוי הראשוני של הדפדפן.
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LOCALES, type Locale } from "@/constants";
import { registerLocale, trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics";

const RTL_LOCALES: readonly Locale[] = ["he"];

function isSupportedLocale(lng: string): lng is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(lng);
}

function resolveLocale(lng: string): Locale {
  return isSupportedLocale(lng) ? lng : "en";
}

function applyDocumentLocale(locale: Locale) {
  document.documentElement.lang = locale;
  document.documentElement.dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
  // locale כ-super property גלובלי על כל אירוע Mixpanel עתידי (docs/PRD.md
  // סעיף 20) - לא property בודד שצריך לצרף ידנית בכל trackEvent. אותה
  // נקודת-האזנה בדיוק ("languageChanged", למטה) ששולטת על html lang/dir -
  // אין צורך במאזין נפרד.
  registerLocale(locale);
}

export function useLocaleSync() {
  const { i18n } = useTranslation();
  // עוקב אחרי ה-locale הקודם, כדי להבחין בין ההפעלה הראשונית (mount, אין
  // "מעבר" אמיתי - סתם קביעת השפה הראשונה) לבין מעבר בפועל בזמן ריצה.
  // אותו idiom בדיוק כמו prevUserId ב-hooks/useAnalyticsIdentity.ts.
  const prevLocaleRef = useRef<Locale | null>(null);

  useEffect(() => {
    const initialLocale = resolveLocale(i18n.resolvedLanguage ?? i18n.language);
    applyDocumentLocale(initialLocale);
    prevLocaleRef.current = initialLocale;

    // docs/PRD.md סעיף 21 (בקשת Oren, 2026-09-13): "Language Switched" -
    // אירוע נפרד מ-registerLocale למעלה. registerLocale קובע רק *מהו*
    // ה-locale הנוכחי כ-property על כל אירוע עתידי (כבר קיים) - זה כאן
    // הוא אירוע מדיד על *פעולת המעבר עצמה* בין שפות, כדי שאורן יוכל לראות
    // כמה משתמשים בפועל מחליפים שפה ומתי, לא רק את ההתפלגות הסופית.
    // יורה רק כשה-locale המנורמל *באמת* השתנה (לא בכל קריאה ל-changeLanguage
    // עם אותו ערך, ולא בהפעלה הראשונית שכבר טופלה למעלה, מחוץ למאזין הזה).
    function handleLanguageChanged(lng: string) {
      const nextLocale = resolveLocale(lng);
      applyDocumentLocale(nextLocale);
      if (prevLocaleRef.current && prevLocaleRef.current !== nextLocale) {
        trackEvent(ANALYTICS_EVENTS.languageSwitched, {
          from: prevLocaleRef.current,
          to: nextLocale,
        });
      }
      prevLocaleRef.current = nextLocale;
    }

    i18n.on("languageChanged", handleLanguageChanged);
    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, [i18n]);
}
