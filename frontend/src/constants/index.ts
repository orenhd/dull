// קבועים לא-תלויי-סביבה בלבד - שפות נתמכות, מפתחות ל-localStorage, נתיבי
// routes, ערכי debounce/pagination/timeouts. תואם למוסכמה ב-backend/src/
// constants/index.ts (TECH_SPEC סעיף 2). הגדרות עסקיות דינמיות (StoreSettings
// עתידי) לא שייכות לכאן - הן יגיעו מה-backend.

// זהה בכוונה ל-backend/src/constants/index.ts - שני הצדדים חייבים להסכים
// על אותן שפות/ברירת מחדל, אחרת ה-`locale` שנשלח ל-API לא יתאים למה
// שמוצג בפועל ב-UI.
export const SUPPORTED_LOCALES = ["en", "he"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const CURRENCY_SYMBOL = "₪";

// כתובת יצירת קשר ציבורית - מוצגת ב-Privacy Policy/Terms of Service
// (docs/SCREENS_INVENTORY.md מסך 16) לבקשות מידע/מחיקת נתונים. מקור יחיד
// (לא כפול בכל locale JSON) - מוזרק דרך אינטרפולציה (t("...", { email:
// CONTACT_EMAIL })), בדיוק כמו שאר הערכים הלא-מתורגמים (bandCreditName וכו').
export const CONTACT_EMAIL = "orenhd123@gmail.com";

// --- Routes ---
// נתיבי ה-router כמחרוזות בודדות - ראו src/router.tsx. שימוש ב-`as const`
// שומר type-safety מול TanStack Router (שמצליב את הנתיב עם ה-param types).
export const ROUTES = {
  home: "/",
  product: "/products/$slug",
} as const;

// --- localStorage keys ---
export const CART_STORAGE_KEY = "dull:cart";
// תוקן 2026-09-22 (בקשת אורן): DISCLAIMER_BANNER_STORAGE_KEY הוסר -
// DisclaimerBanner.tsx (הבאנר החד-פעמי העליון) הוחלף לגמרי ב-
// ConsentBanner.tsx (באנר תחתון מאוחד - גם דיסקליימר וגם consent
// לאנליטיקה, ראו הערה מלאה ב-stores/consentStore.ts). מבקרים שכבר סגרו
// את הבאנר הישן ישמרו מפתח יתום (dull:disclaimerBannerDismissed) ב-
// localStorage שלהם - לא נקרא בקוד יותר, לא משפיע על כלום, לא נמחק ביד
// (אין דרך "לנקות" localStorage של מבקרים קיימים מבחוץ ממילא).
export const CONSENT_STORAGE_KEY = "dull:consent";
// מפתח ברירת המחדל של i18next-browser-languagedetector (src/i18n/index.ts) -
// לא בשימוש ישיר בקוד שלנו, מתועד כאן כדי שלא יהיה "magic string" לא-מוסבר
// אם מישהו יחפש אותו ב-devtools.
export const I18NEXT_LANGUAGE_STORAGE_KEY = "i18nextLng";

// --- Timing ---
export const TOAST_DURATION_MS = 2200;

// --- Media role, matches backend Prisma enum (schema.prisma MediaRole) ---
export const MEDIA_ROLE = {
  flat: "FLAT",
  campaign: "CAMPAIGN",
  sizeGuide: "SIZE_GUIDE",
} as const;

// --- Product category, matches backend Prisma enum (schema.prisma ProductCategory) ---
export const PRODUCT_CATEGORY = {
  shirt: "SHIRT",
  footwear: "FOOTWEAR",
} as const;

// תקרת כמות לכל שורת עגלה/הזמנה (אותו variantId) - עד 2026-09 לא הייתה שום
// תקרה חוץ מ-stockQty בפועל (Oren מצא שאפשר היה להקליד כל מספר בשדה הכמות
// בעגלה). **זהה בכוונה ל-backend/src/constants/index.ts** - שני הצדדים
// חייבים להסכים על אותו ערך, אחרת המשתמש יכול להגיע בקלות ל-400
// VALIDATION_ERROR מהשרת (routes/orders.ts, createOrderSchema) בלי שה-UI
// מנע ממנו מראש. **אכיפה אמיתית היא בצד השרת** - הבדיקה כאן (cartStore.ts,
// CartPage.tsx) היא נוחות UX בלבד, לא קו ההגנה.
export const MAX_LINE_ITEM_QUANTITY = 5;
