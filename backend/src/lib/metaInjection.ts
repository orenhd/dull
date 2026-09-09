// שכבת "meta-injection" דקה (docs/PRD.md סעיף 12.10): מזריקה <title>/og:*/
// twitter:* per-product לתוך index.html הבנוי לפני שהוא נשלח, כדי שבוטים של
// תצוגה-מקדימה בשיתוף קישור (WhatsApp/Slack/iMessage/Facebook וכו') - שכמעט
// אף פעם לא מריצים JS, רק קוראים HTML גולמי - יראו כותרת/תמונה נכונות
// למוצר הספציפי. לא Next.js/SSR מלא בכוונה - רק string-replace ממוקד על
// html קבוע. frontend/index.html מכיל הערה שמסמנת בדיוק אילו ערכי ברירת-
// מחדל כאן הם היעד להחלפה - לשמור סנכרון בין שני הקבצים אם משהו שם משתנה.
import type { Request } from "express";
import { getProductBySlug } from "./products.js";
import { findDefaultFlatMediaUrl } from "./media.js";
import { localize } from "./i18n.js";
import { DEFAULT_LOCALE } from "../constants/index.js";

// בוטים ידועים שמבקשים תצוגה מקדימה - fallback ל-content negotiation לפי
// Accept header (למטה). רוב הבוטים כן שולחים Accept: text/html מפורש (הם
// צריכים לפרש HTML אמיתי כדי לחלץ meta tags - זו כל הסיבה שהם קיימים),
// אבל לא כל בוט ממושמע, ורשימת whitelist קטנה כאן זולה ובטוחה יותר מלהמר
// על כך. iMessage לא צריך token נפרד - בפועל הוא "מתחזה" ל-
// facebookexternalhit/Twitterbot בזמן סריקה (מתועד פומבית), אז כבר מכוסה.
const KNOWN_PREVIEW_BOT_USER_AGENT_SUBSTRINGS = [
  "facebookexternalhit",
  "Twitterbot",
  "Slackbot",
  "WhatsApp",
  "TelegramBot",
  "Discordbot",
  "LinkedInBot",
] as const;

// האם הבקשה הזו רוצה HTML (ניווט דפדפן/בוט תצוגה-מקדימה) ולא JSON (קריאת
// ה-API הפנימית של ה-SPA עצמו, GET /products/:slug דרך frontend/src/lib/
// api/client.ts - ראו docs/API_CONTRACT.md). ה-client הפנימי לא שולח Accept
// header מפורש (fetch() שולח "*/*" כברירת מחדל) - ב-req.accepts(["json",
// "html"]) "json" מנצח בתיקו (סדר המערך קובע רק כשאין העדפה מפורשת ב-
// Accept), כך שאין צורך בשום שינוי בצד ה-frontend. דפדפן אמיתי/בוט תצוגה-
// מקדימה תקין שולחים "text/html" מפורש ב-Accept - אז html מנצח שם על סמך
// ההתאמה בפועל (לא סדר המערך). ה-User-Agent whitelist למעלה הוא גיבוי
// נוסף לבוטים שלא שולחים Accept מפורש.
export function wantsHtmlPreview(req: Request): boolean {
  const userAgent = req.get("user-agent") ?? "";
  const isKnownBot = KNOWN_PREVIEW_BOT_USER_AGENT_SUBSTRINGS.some((token) =>
    userAgent.includes(token),
  );
  if (isKnownBot) return true;

  return req.accepts(["json", "html"]) === "html";
}

interface ProductMetaValues {
  title: string;
  pageUrl: string;
  imageUrl: string | null;
}

// הגנה בסיסית מפני שבירת attribute/HTML - שם המוצר מגיע מה-DB (Prisma),
// לא מקלט חיצוני בבקשה הנוכחית, אבל בכל זאת מוזרק ל-HTML גולמי.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// string-replace ממוקד על ערכי ברירת המחדל המדויקים ב-frontend/index.html
// (לא parser HTML מלא, בכוונה - שכבה "דקה"). אם ברירות המחדל שם ישתנו בלי
// עדכון כאן, ה-.replace() פשוט לא ימצא התאמה ולא יעשה כלום (fail open) -
// התוצאה תהיה index.html גנרי במקום meta מדויקת, לא קריסה.
export function injectProductMeta(html: string, values: ProductMetaValues): string {
  let result = html;

  result = result.replace("<title>Dull</title>", `<title>${escapeHtml(values.title)} — Dull</title>`);

  result = result.replace(
    '<meta property="og:title" content="Dull" />',
    `<meta property="og:title" content="${escapeHtml(values.title)}" />`,
  );

  result = result.replace(
    '<meta property="og:url" content="https://dull.onrender.com/" />',
    `<meta property="og:url" content="${escapeHtml(values.pageUrl)}" />`,
  );

  // og:image/twitter:image לא קיימים כברירת מחדל ב-index.html (אין עדיין
  // צילום קמפיין גנרי, ראו ההערה שם) - מוזרקים כאן רק כשיש תמונת flat
  // אמיתית למוצר הזה, מיד אחרי שורת twitter:card (שגם משודרגת ל-
  // summary_large_image כאן, כי רק עכשיו יש בכלל תמונה להציג גדולה).
  const twitterCardReplacement = [
    '<meta name="twitter:card" content="summary_large_image" />',
    values.imageUrl ? `<meta property="og:image" content="${escapeHtml(values.imageUrl)}" />` : null,
    values.imageUrl ? `<meta name="twitter:image" content="${escapeHtml(values.imageUrl)}" />` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n    ");

  result = result.replace('<meta name="twitter:card" content="summary" />', twitterCardReplacement);

  return result;
}

// בונה את שלוש הערכים הדרושים ל-injectProductMeta() ישירות מה-DB
// (getProductBySlug) - "fail open" מלא: כל כשל (מוצר לא נמצא/לא פעיל,
// שגיאת DB) מחזיר null כדי שה-caller (index.ts) יגיש את index.html
// המקורי בלי לגעת בו, ולא יחזיר שגיאת HTTP על עמוד ציבורי.
//
// שם המוצר נלקח תמיד ב-DEFAULT_LOCALE: כתובת העמוד (/products/:slug) לא
// נושאת locale (אין /he/products/... בנתיב, ראו frontend/TECH_SPEC.md) -
// אין דרך לדעת איזו שפה מבקשים כששולחים קישור, אז ברירת המחדל היא הבחירה
// היחידה שאינה שרירותית. אותו עיקרון בדיוק כמו sendThankYouEmail ב-
// routes/orders.ts.
export async function buildProductMetaValues(
  slug: string,
  req: Request,
): Promise<ProductMetaValues | null> {
  try {
    const product = await getProductBySlug(slug);
    if (!product || !product.isActive) return null;

    const title = localize(product.name as Record<string, string>, DEFAULT_LOCALE);
    if (!title) return null;

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    // "ברירת מחדל" משותפת עם הכרטיס בקטלוג (routes/products.ts, GET /) -
    // אותה פונקציה בדיוק, lib/media.ts - כדי שתמונת השיתוף וכרטיס הקטלוג
    // תמיד יציגו את אותו גוון/גזרה (docs/PRD.md סעיף 6, הוכרע 2026-09-09).
    // *לא* product.variants[0] (כפי שהיה כאן קודם) - לוריאנטים אין orderBy
    // מוגדר בכלל, אז "הראשון" היה בפועל שרירותי/לא-מוגדר, לא "ברירת מחדל"
    // אמיתית.
    const relativeImageUrl = findDefaultFlatMediaUrl(product.media);

    return {
      title,
      pageUrl: `${baseUrl}/products/${product.slug}`,
      imageUrl: relativeImageUrl ? new URL(relativeImageUrl, baseUrl).toString() : null,
    };
  } catch (err) {
    console.error(`Failed to build product meta for slug "${slug}":`, err);
    return null;
  }
}
