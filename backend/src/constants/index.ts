// קבועים אמיתיים בלבד - ערכים שלא תלויים בסביבת הרצה ולא ניתנים לעריכה
// ע"י בעל האתר. הבחנה מכוונת משתי קטגוריות אחרות:
//   - env.ts        -> תלוי-סביבה (URL של DB, פורט)
//   - StoreSettings  -> תלוי-משתמש/עסק, ולכן חי ב-DB ולא כאן (למשל: זמן
//                        טיפול משוער בהחזר כספי מה-PRD סעיף 7 - זה "הגדרה"
//                        שבעל האתר עשוי לרצות לעדכן בלי deploy, לא קבוע קוד)

export const SUPPORTED_LOCALES = ["en", "he"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const CURRENCY_CODE = "ILS";

export const DEFAULT_PAGE_SIZE = 24;

// כמה זמן ה-session cookie (ולכן ה-JWT שבתוכו) תקף - זהה בכל סביבה, לא
// תלוי-deploy ולא ניתן לעריכה ע"י בעל האתר, ולכן קבוע כאן ולא ב-env/DB.
export const SESSION_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 יום

export const SESSION_COOKIE_NAME = "dull_session";
