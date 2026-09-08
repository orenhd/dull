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

// --- Routes ---
// נתיבי ה-router כמחרוזות בודדות - ראו src/router.tsx. שימוש ב-`as const`
// שומר type-safety מול TanStack Router (שמצליב את הנתיב עם ה-param types).
export const ROUTES = {
  home: "/",
  product: "/products/$slug",
} as const;

// --- localStorage keys ---
export const CART_STORAGE_KEY = "dull:cart";
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
