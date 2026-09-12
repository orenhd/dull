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

// סימן המטבע להצגה (לא לבלבל עם CURRENCY_CODE - קוד ISO לשימוש טכני/API,
// זה הסימן שמוצג לבן אדם, למשל בטבלת הפריטים במייל אישור הזמנה).
export const CURRENCY_SYMBOL = "₪";

// תקרת כמות לכל שורת עגלה/הזמנה (אותו variantId) - עד 2026-09 לא הייתה
// שום תקרה חוץ מ-stockQty בפועל (Oren מצא שאפשר להקליד כל מספר בשדה הכמות
// בעגלה). נבחר ערך אחיד לכל הקטלוג (לא שונה בין SHIRT ל-FOOTWEAR) במכוון -
// המטרה היא למנוע ערכים אבסורדיים/הקלדה שגויה, לא לבטא הנחה על "כמה יחידות
// הגיוני לקנות מקטגוריה X" (רכישת כמה יחידות זהות היא תרחיש סביר גם
// לחולצות - למשל מתנה למשפחה - וגם לסנדלים). זהה בכוונה ל-
// frontend/src/constants/index.ts - שני הצדדים חייבים להסכים על אותו ערך,
// אחרת המשתמש יקבל שגיאת ולידציה מהשרת בלי שה-UI מנע ממנו מראש. אכיפה
// אמיתית היא כאן (routes/orders.ts, createOrderSchema) - כל בדיקה מקבילה
// ב-frontend היא נוחות UX בלבד, לא קו ההגנה.
export const MAX_LINE_ITEM_QUANTITY = 5;
