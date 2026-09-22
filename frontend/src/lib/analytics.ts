// Mixpanel - אנליטיקה בסיסית ב-frontend בלבד (docs/PRD.md סעיף 20, בקשת
// Oren 2026-09-12: "כל funnel שמעניין אותו קורה client-side ממילא", אין
// endpoint/שינוי ב-backend). Mixpanel נבחר על פני GA4 (אורן: לא אוהב את
// ה-dashboard של GA4 בנפח תנועה נמוך; Mixpanel נותן פירוט per-event ישיר,
// ופלאן חינמי (1M events/חודש) נדיב בהרבה ממה שהפרויקט הזה יפיק).
// "יציאת ידי חובה" - מינימום מאמץ בכוונה: wrapper דק מעל ה-SDK, לא state
// management/Provider/context נוסף.
//
// **הכל כאן no-op בשקט אם VITE_MIXPANEL_TOKEN לא מוגדר** (src/config/env.ts -
// אופציונלי בכוונה) - היעדר טוקן (למשל לפני שאורן פותח חשבון Mixpanel, או
// ב-dev מקומי בלי טוקן) אף פעם לא אמור לשבור את האתר עצמו. אנליטיקה היא
// always-best-effort, לא תלות קריטית כמו ה-API הראשי.
//
// Identify/reset לא נקראים ישירות מכל מקום login/logout - מרוכזים ב-
// hooks/useAnalyticsIdentity.ts (עוקב אחרי authStore.user), ראו שם להסבר
// המלא של למה זה עדיף על פיזור הקריאות בכל handleLogout/handleCredentialResponse.
import mixpanel from "mixpanel-browser";
import { env } from "@/config/env";
import type { Locale } from "@/constants";
import type { AuthUser } from "@/types/auth";

// שמות אירועי Mixpanel מרוכזים כאן במקום אחד יחיד, לא מחרוזות ישירות בכל
// call site (בקשת Oren, 2026-09-13: "לפעמים פעולות שונות יכולות להחיל את
// אותו אירוע, פשוט מטריגרים שונים - מקלדת, עכבר וכיוב'") - אותה מוסכמה
// בדיוק כמו MEDIA_ROLE/PRODUCT_CATEGORY ב-constants/index.ts (אובייקט
// camelCase-key -> string-value, `as const`). ה-value הוא שם האירוע
// הקריא-לאדם שרואים בפועל ב-Mixpanel UI; ה-key הוא מה ש-call sites
// משתמשים בו בקוד. `trackEvent()` למטה מוגבל טיפוסית לערכים מכאן בלבד -
// לא ניתן להעביר מחרוזת שרירותית ולפספס את המרכוז בטעות (שגיאת קומפילציה,
// לא רק מוסכמה).
export const ANALYTICS_EVENTS = {
  signInCompleted: "Sign In Completed",
  productViewed: "Product Viewed",
  addedToBag: "Added to Bag",
  checkoutStarted: "Checkout Started",
  orderPlaced: "Order Placed",
  // "מעבר בין שפות" (docs/PRD.md סעיף 21, בקשת Oren) - נפרד מ-`registerLocale`
  // למטה: זה אירוע מדיד (פעולת מעבר בפועל), בעוד ש-registerLocale רק קובע
  // מהו ה-locale הנוכחי כ-super property על *כל* אירוע עתידי. שני הדברים
  // ביחד עונים על שתי השאלות שאורן שאל - "איזו שפה" (locale property, כל
  // אירוע) ו"מעבר בין שפות" (אירוע ייעודי, ראו useLocaleSync.ts).
  languageSwitched: "Language Switched",
  // "התנתקות" (docs/PRD.md סעיף 23, בקשת Oren) - נורה מ-useAnalyticsIdentity.ts
  // *לפני* ה-reset בפועל (ראו שם) כדי שעדיין ייוחס למשתמש שהתנתק, לא
  // לזהות האנונימית החדשה שנוצרת מיד אחרי.
  signedOut: "Signed Out",
} as const;

type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

let enabled = false;

// נקרא פעם אחת, מ-main.tsx, לפני שהעץ מצטייר - ראו הערה שם.
export function initAnalytics(): void {
  if (!env.VITE_MIXPANEL_TOKEN) return;

  mixpanel.init(env.VITE_MIXPANEL_TOKEN, {
    // הפרויקט ב-Mixpanel נוצר עם EU Data Residency (בחירת אורן, 2026-09-13 -
    // לא מכוונת, אבל אין שום סיבה אמיתית לשנות: פרויקט הדגמה בלי מידע רגיש
    // של ממש). ה-SDK **חייב** api_host מפורש כדי לשלוח ל-region הנכון -
    // ברירת המחדל של mixpanel-browser היא ה-endpoint האמריקאי, ופרויקט EU
    // פשוט **לא קולט** events שמגיעים אליו (מתועד רשמית:
    // docs.mixpanel.com/docs/privacy/eu-residency) - "no data will be
    // ingested... unless your SDK is sending data to the EU endpoint".
    // אובחן בפועל: כל האירועים נראו תקינים ב-DevTools Network (payload/טוקן
    // תקינים), אבל לא הגיעו ל-Mixpanel כי חסר בדיוק השורה הזו.
    // **אם בעתיד ייווצר פרויקט חדש עם US Data Residency - יש להסיר שורה זו.**
    api_host: "https://api-eu.mixpanel.com",
    // "url-with-path" - מצב ה-pageview-tracking הייעודי ל-SPA של Mixpanel
    // עצמו (docs.mixpanel.com/docs/tracking-methods/sdks/javascript):
    // עוקב אוטומטית אחרי כל שינוי path (TanStack Router הוא client-side
    // routing מלא - History API רגיל, לא ניווטי דפדפן "אמיתיים" בין
    // עמודים) ושולח $mp_web_page_view. לא נבנה מנגנון ידני מקביל (router
    // subscription משלנו) - זה בדיוק מה שהיה הופך את זה ליותר ממינימום
    // המאמץ המבוקש.
    track_pageview: "url-with-path",
    // debug רק ב-dev מקומי - לא רועש בפרודקשן.
    debug: import.meta.env.DEV,
    // תוקן 2026-09-22 (בקשת אורן - consent מפורש, לא רק באנר-מידע): ה-SDK
    // עצמו כבר תומך במנגנון opt-in/opt-out ייעודי בדיוק לתרחיש הזה - לא
    // נבנה gate ידני סביב הקריאה ל-init() עצמה (שהייתה דורשת לדחות את כל
    // ה-side-effect הזה מחוץ ל-main.tsx, ולתאם עם טעינת ה-store/הבאנר).
    // opt_out_tracking_by_default:true אומר: מבקר חדש (בלי החלטה שמורה
    // כלל אצל Mixpanel עצמו) לא נשלח שום event - כולל autocapture/
    // track_pageview האוטומטי למעלה - עד קריאה מפורשת ל-opt_in_tracking()
    // (grantAnalyticsConsent, למטה). opt_out_tracking()/opt_in_tracking()
    // הם API רשמי של mixpanel-browser בדיוק לצורך cookie-consent banners -
    // לא מנגנון תוצרת-בית. ConsentBanner.tsx קורא ל-grant/revoke למטה.
    opt_out_tracking_by_default: true,
  });
  enabled = true;
}

// נקראות מ-stores/consentStore.ts בלבד (accept()/decline()) - לא ישירות
// מרכיבים. no-op אם אין טוקן (enabled===false), אותה מוסכמה בדיוק כמו
// trackEvent/identifyUser/resetIdentity למעלה - עקביות, לא תלות קריטית.
export function grantAnalyticsConsent(): void {
  if (!enabled) return;
  mixpanel.opt_in_tracking();
}

export function revokeAnalyticsConsent(): void {
  if (!enabled) return;
  mixpanel.opt_out_tracking();
}

export function trackEvent(name: AnalyticsEventName, properties?: Record<string, unknown>): void {
  if (!enabled) return;
  mixpanel.track(name, properties);
}

// נקרא מ-useAnalyticsIdentity.ts בלבד - ראו שם. מקבל את המשתמש המלא (לא רק
// id) כדי גם לקבוע את פרטי הפרופיל (בקשת Oren, 2026-09-13: "אין את פרטי
// המשתמש - לא כדאי להוסיף?") - בלי זה, Mixpanel People מציג רק distinct_id
// אטום לכל משתמש מזוהה, בלי שום דרך קריאה-לאדם לדעת מי זה בפועל.
// $name/$email הם שדות שמורים (reserved) שMixpanel עצמו מזהה ומציג
// בעמודות "Name"/"Email" הרגילות ב-People view - לא property מותאמות-אישית
// שדורשות קונפיגורציה נוספת. **שינוי היקף מכוון**: זה מרחיב את מה שזורם
// ל-Mixpanel (צד שלישי) מעבר ל"נתוני שימוש אנונימיים" בלבד - אל שם ואימייל
// אמיתיים מ-Google Sign-In. עודכן בהתאם: docs/PRD.md סעיף 23,
// privacy.analytics.body (שתי השפות, PrivacyPage.tsx).
export function identifyUser(user: AuthUser): void {
  if (!enabled) return;
  mixpanel.identify(user.id);
  mixpanel.people.set({
    $name: user.name,
    $email: user.email,
  });
}

// נקרא מ-useAnalyticsIdentity.ts בלבד - ראו שם.
export function resetIdentity(): void {
  if (!enabled) return;
  mixpanel.reset();
}

// locale (en/he) כ-super property גלובלי על כל אירוע עתידי (בקשת Oren) -
// לא property בודד שצריך לצרף ידנית לכל trackEvent קריאה. נקרא מ-
// useLocaleSync.ts, פעם אחת ב-mount ובכל שינוי שפה בזמן ריצה.
export function registerLocale(locale: Locale): void {
  if (!enabled) return;
  mixpanel.register({ locale });
}
