// ============================================================================
// HARDCODED בכוונה - לא מגיע מה-API.
//
// ה-DB (backend/prisma/schema.prisma) לא מדגם מדידות בגד בכלל: ל-Media יש
// role/url/altText/axisValueIds בלבד, בלי טבלת מידות ובלי "פיד התאמה"
// מתויג (החלק שבדמו (github.com/orenhd/dull-demo) נקרא "How it fits, on
// real bodies" - תמונות דוגמנים עם תגית "Fits true"/"Take a size up" +
// הערת גובה). הוסר מכוון: הוחלט (איתור/שיחת 2026-09-08) לא לפתח מודל
// חדש ב-backend כרגע, ולוותר על חלק פיד-ההתאמה לגמרי (רק טבלת המידות
// נשארת). ראו TECH_SPEC.md / דיווח ל-#dull-frontend.
//
// המספרים כאן הם הערכה עריכתית שלי, לא מדידה אמיתית של בגד פיזי - הוסקו
// ממבט על תמונות ה-flat בגזרת גברים/נשים תחת hi-res/ (מידות "רגילות",
// גזרת גברים רחבה/ארוכה יותר, גזרת נשים מחויטת יותר וקצרה יותר - שתיהן
// לא צמודות). מתאימות לכל מוצר מסוג SHIRT ולא ספציפיות ל-slug בודד, כי
// כל חולצות ה-catalog (ראו backend/prisma/seed.ts) חולקות את אותה תבנית
// גזרות/גדלים (Fit x Colorway x Size). אם המידות האמיתיות יתבררו כשונות,
// זו עריכה במקום אחד, לא רה-סטרקטור.
//
// כשה-backend יתמוך במדידות אמיתיות (טבלה, per-product) - הקובץ הזה נמחק
// ו-src/lib/api/products.ts שולף את אותו מבנה מה-API. עד אז: flag ל-Oren,
// לא החלטה שקטה.
// ============================================================================

export interface SizeChartRow {
  size: string; // תואם ל-label של ערך-הציר Size בפועל (backend/prisma/seed.ts)
  chestCm: number;
  lengthCm: number;
  sleeveCm: number;
}

export const SIZE_CHART_MENS: SizeChartRow[] = [
  { size: "S", chestCm: 50, lengthCm: 68, sleeveCm: 19 },
  { size: "M", chestCm: 53, lengthCm: 70, sleeveCm: 20 },
  { size: "L", chestCm: 56, lengthCm: 72, sleeveCm: 21 },
  { size: "XL", chestCm: 59, lengthCm: 74, sleeveCm: 22 },
  { size: "XXL", chestCm: 62, lengthCm: 76, sleeveCm: 23 },
];

export const SIZE_CHART_WOMENS: SizeChartRow[] = [
  { size: "Petite", chestCm: 43, lengthCm: 59, sleeveCm: 15 },
  { size: "S", chestCm: 46, lengthCm: 61, sleeveCm: 16 },
  { size: "M", chestCm: 49, lengthCm: 63, sleeveCm: 17 },
  { size: "L", chestCm: 52, lengthCm: 65, sleeveCm: 18 },
  { size: "XL", chestCm: 55, lengthCm: 67, sleeveCm: 19 },
];

// fit axis value `key` (backend/prisma/seed.ts: "mens" | "womens") -> טבלה.
// מוצר עתידי עם fit key אחר פשוט לא יציג טבלה (getSizeChartForFitKey
// מחזירה null) - נופל בחזרה בשקט, לא קורס.
export function getSizeChartForFitKey(fitKey: string): SizeChartRow[] | null {
  if (fitKey === "mens") return SIZE_CHART_MENS;
  if (fitKey === "womens") return SIZE_CHART_WOMENS;
  return null;
}

// ============================================================================
// נעליים/סנדלים (docs/PRD.md סעיף 12.19, בקשת Oren 2026-09-10) - קובץ נפרד
// לגמרי מהחולצות למעלה, לא רק כי הצירים חסרים (colorway), אלא כי הפריטים
// שנמדדים שונים לגמרי (רגל, לא גוף). שים לב: ל-fit axis value key יש אותם
// ערכים בדיוק ("mens"/"womens") כמו בחולצות (backend/prisma/seed.ts) - אבל
// אלו *לא* אותו מוצר/קטגוריה, אז אסור לקרוא ל-getSizeChartForFitKey למעלה
// עבור נעליים (זה יחזיר את טבלת מידות ה*גוף* של חולצות, שגוי לגמרי) - ראו
// getSandalsSizeChartForFitKey הנפרד למטה, ו-SizeGuideAccordion.tsx שמפריד
// בין השניים לפי product.category, לא לפי fitKey בלבד.
//
// המספרים כאן (אורך כף הרגל בס"מ) מבוססים על טבלת המרה מקובלת מידת-EU-
// לאורך-כף-רגל, נפוצה בענף ההנעלה (לא מדידה בפועל של המוצר הספציפי שלנו -
// "לא צריך מספרים מדויקים על המילימטר", בקשת Oren, 2026-09-10). בכוונה
// *בלי* עמודת רוחב, למרות שהוצעה: בניגוד לאורך, אין המרה סטנדרטית מוסכמת
// אחת לרוחב-כף-רגל לפי מידת EU בענף ההנעלה - רוחב תלוי בגזרת ה-last של
// הנעל הספציפית, לא רק במידה המספרית. מספר "רוחב" מומצא היה נותן תחושת
// דיוק מזויפת - גרוע יותר מלא להציג את העמודה בכלל.
export interface FootwearSizeChartRow {
  size: string; // EU - תואם ל-label של ערך-הציר Size בפועל (SANDALS_MENS_EU_SIZES/SANDALS_WOMENS_EU_SIZES, backend/prisma/seed.ts)
  footLengthCm: number;
}

export const SANDALS_SIZE_CHART_MENS: FootwearSizeChartRow[] = [
  { size: "40", footLengthCm: 25.5 },
  { size: "41", footLengthCm: 26 },
  { size: "42", footLengthCm: 27 },
  { size: "43", footLengthCm: 27.5 },
  { size: "44", footLengthCm: 28.5 },
  { size: "45", footLengthCm: 29 },
  { size: "46", footLengthCm: 30 },
];

export const SANDALS_SIZE_CHART_WOMENS: FootwearSizeChartRow[] = [
  { size: "36", footLengthCm: 22.5 },
  { size: "37", footLengthCm: 23.5 },
  { size: "38", footLengthCm: 24 },
  { size: "39", footLengthCm: 24.5 },
  { size: "40", footLengthCm: 25.5 },
  { size: "41", footLengthCm: 26 },
];

export function getSandalsSizeChartForFitKey(fitKey: string): FootwearSizeChartRow[] | null {
  if (fitKey === "mens") return SANDALS_SIZE_CHART_MENS;
  if (fitKey === "womens") return SANDALS_SIZE_CHART_WOMENS;
  return null;
}
