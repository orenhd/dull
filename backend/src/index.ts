import fs from "node:fs";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ZodError } from "zod";
import { env } from "./config/env.js";
import { productsRouter } from "./routes/products.js";
import { authRouter } from "./routes/auth.js";
import { ordersRouter } from "./routes/orders.js";
import { PUBLIC_IMAGES_DIR, PUBLIC_WEB_DIR, WEB_INDEX_HTML_PATH, PUBLIC_CASE_STUDY_DIR } from "./lib/paths.js";
import { buildProductMetaValues, injectProductMeta, injectStaticPageImage, wantsHtmlPreview } from "./lib/metaInjection.js";

const app = express();

// Render (וכל PaaS דומה) מסיים TLS ב-edge ומעביר פנימה כ-HTTP רגיל, עם
// X-Forwarded-Proto: https - בלי trust proxy, req.protocol תמיד "http" גם
// בפרודקשן. חשוב במיוחד עכשיו: buildProductMetaValues (lib/metaInjection.ts)
// בונה og:url/og:image מ-req.protocol, וסכימה שגויה שם תשבור תצוגות מקדימה.
app.set("trust proxy", 1);

// עדכון 2026-09 (docs/PRD.md סעיף 12.10): ה-frontend הבנוי מוגש עכשיו מאותו
// service (ראו express.static(PUBLIC_WEB_DIR) למטה) - ברוב הבקשות בפרודקשן
// אין בכלל Origin header (same-origin). ה-allowlist נשאר רלוונטי בעיקר
// ל-dev מקומי (Vite על 5173 מול ה-backend על 4000, ראו README.md).
const ALLOWED_ORIGINS = ["http://localhost:5173", "https://dull.onrender.com"];

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      // בלי Origin header כלל (same-origin, curl, health check של Render עצמו) -
      // תמיד מותר; זה לא cross-origin request מבחינת הדפדפן מלכתחילה.
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin not allowed: ${origin}`));
    },
  }),
);
app.use(express.json());
app.use(cookieParser());

// תמונות מוצר מוגשות סטטית מ-public/images (ראו scripts/generate-web-images.ts)
app.use("/images", express.static(PUBLIC_IMAGES_DIR));

// קייס סטאדי סטטי לקורס (docs/PRD.md סעיף 36) - מוגש מ-public/case-study
// (ראו scripts/copy-case-study.ts). ממוקם כאן, *לפני* ה-SPA fallback למטה -
// אחרת ה-catch-all היה תופס את הבקשה קודם ומחזיר את ה-frontend Bundle
// במקום את דף הקייס סטאדי.
app.use("/case-study", express.static(PUBLIC_CASE_STUDY_DIR));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Meta-injection ל-GET /products/:slug בלבד (docs/PRD.md 12.10) - *לפני*
// productsRouter, כדי ליירט בקשות שרוצות HTML (ניווט דפדפן/בוט תצוגה-
// מקדימה) עוד לפני שהן מגיעות ל-JSON API. קריאות ה-API הפנימיות של ה-SPA
// עצמו (frontend/src/lib/api/client.ts) ממשיכות ל-productsRouter כרגיל -
// ראו התיעוד המלא ב-wantsHtmlPreview() (lib/metaInjection.ts) על איך
// ההבחנה הזו עובדת בלי שום שינוי בצד ה-frontend.
//
// **הערה על עקביות ארכיטקטונית (docs/PRD.md סעיף 66)**: זהו עדיין המקום
// היחיד באתר עם path זהה בין route API בבקאנד ל-route SPA בפרונטאנד
// (ה-/orders המקביל תוקן לגמרי למטה - ראו app.use("/api/orders", ...) -
// ע"י שינוי ה-prefix, לא ע"י תלות בניחוש Accept header). הכפילות כאן
// *נשארה בכוונה* כרגע: התיקון המקביל (מעבר ל-/api/products) דורש לגעת גם
// ב-buildProductMetaValues/injectProductMeta (יחסית לתמונות/query params
// של קומבינציית Fit+Colorway) - שינוי גדול יותר מבחינת שטח-נגיעה, נדחה
// בכוונה מתוך משמעת-scope (אורן ביקש היום תיקון ל-/orders בלבד, "נקי
// ומהיר בלי בדיקות רגרסיה רבות") - לא פוספס/נשכח. ראו התיעוד המלא.
app.get("/products/:slug", async (req, res, next) => {
  if (!wantsHtmlPreview(req) || !fs.existsSync(WEB_INDEX_HTML_PATH)) {
    // fs.existsSync נכשל רק ב-dev מקומי (frontend לא נבנה ל-public/web שם -
    // זה תקין, ה-frontend רץ בנפרד על Vite :5173) - fallback סביר יותר
    // מקריסה או 404 גולמי הוא פשוט להמשיך ל-JSON API הרגיל.
    next();
    return;
  }

  const indexHtml = fs.readFileSync(WEB_INDEX_HTML_PATH, "utf-8");
  const values = await buildProductMetaValues(req.params.slug, req);
  res.type("html").send(values ? injectProductMeta(indexHtml, values) : indexHtml);
});

// Meta-injection ל-GET / ו-GET /about (docs/PRD.md סעיף 67, בקשת אורן
// 2026-09-23): שתי תמונות-שיתוף קבועות (לא תלויות-DB כמו /products/:slug
// למעלה - אין כאן וריאנטים/query params, ערך סטטי יחיד לכל עמוד).
// **בניגוד** ל-/products/:slug ול-/orders (למטה) - אין כאן שום route API
// עם אותו path ל"התנגש" איתו, אז אין צורך ב-wantsHtmlPreview()/content
// negotiation בכלל: כל GET ל-/ או ל-/about הוא תמיד ניווט-עמוד, לא קריאת
// API פנימית. homepage: תמונה בלבד, בלי שינוי טקסט (בקשת אורן המפורשת -
// injectStaticPageImage החדשה, בניגוד ל-injectProductMeta, לא נוגעת ב-
// <title>/og:title/og:url בכלל). about: injectProductMeta הקיימת נבחרה
// בכוונה (לא נכתבה פונקציה חדשה) - title:"About" (תואם i18n about.title
// הקיים) גם מבהיר בבירור שזה עמוד ה-About (בקשת אורן) וגם עקבי עם אותה
// מוסכמה בדיוק כמו כל עמוד מוצר (<title>About — Dull</title>, אותו
// תבנית).
app.get("/", (req, res, next) => {
  if (!fs.existsSync(WEB_INDEX_HTML_PATH)) {
    next();
    return;
  }
  const indexHtml = fs.readFileSync(WEB_INDEX_HTML_PATH, "utf-8");
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const imageUrl = new URL("/images/talia-checkout_page.webp", baseUrl).toString();
  res.type("html").send(injectStaticPageImage(indexHtml, imageUrl));
});

app.get("/about", (req, res, next) => {
  if (!fs.existsSync(WEB_INDEX_HTML_PATH)) {
    next();
    return;
  }
  const indexHtml = fs.readFileSync(WEB_INDEX_HTML_PATH, "utf-8");
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const values = {
    title: "About",
    pageUrl: `${baseUrl}/about`,
    imageUrl: new URL("/images/sarah-about.webp", baseUrl).toString(),
  };
  res.type("html").send(injectProductMeta(indexHtml, values));
});

app.use("/products", productsRouter);
app.use("/auth", authRouter);

// דיווח אורן (2026-09-23): ניווט דפדפן ישיר ל-/orders/-/orders/:id (הדבקת
// URL, סימניה, וגם "Duplicate" של טאב בדפדפן - ראו בהמשך) חזר כ-JSON
// גולמי במקום כ-SPA. **תוקן תחילה** (סעיף 65) עם אותו wantsHtmlPreview()
// כמו /products/:slug למעלה - אבל אורן מצא בפועל שזה *לא* מספיק יציב
// (Duplicate Tab עדיין קיבל JSON, למרות שרענון רגיל עבד נכון) - ניווט-
// שכפול-טאב של הדפדפן לא בהכרח שולח את אותו Accept header/סוג-בקשה כמו
// ניווט "רגיל", כך שההבחנה ההיוריסטית לא אמינה מספיק כשה-stakes האמיתיים
// הם "פשוט אל תחזיר JSON לדפדפן" ולא רק "שפר preview לבוטים" (שם, אם
// הבחנה נכשלת, התוצאה היא היעדר meta מדויקת - לא JSON גולמי מוצג
// למשתמש).
//
// **הפתרון הסופי** (סעיף 66): לא עוד content-negotiation בכלל - שינוי
// ה-mount prefix עצמו מ-/orders ל-/api/orders. זה מסיר את ההתנגשות
// *מבנית* (אין יותר שום path זהה בין ה-API לבין ה-SPA), לא רק מנחש נכון
// יותר איזו בקשה זו. שינה גם את frontend/src/lib/api/orders.ts (שלושת
// הקריאות: POST/GET /orders, GET /orders/:id) ואת docs/API_CONTRACT.md
// בהתאם - ה-URL הציבורי שהמשתמש רואה (/orders, /orders/:orderId ב-SPA)
// לא השתנה כלל, רק ה-endpoint הפנימי שה-frontend קורא לו.
app.use("/api/orders", ordersRouter);

// קבצי ה-build הסטטיים של frontend/ (JS/CSS/אסטים, הועתקו ל-public/web
// ע"י scripts/render-build.ts - docs/PRD.md 12.10). ממוקם *אחרי* /products
// כדי שה-meta-injection למעלה תמיד תספיק ליירט קודם.
app.use(express.static(PUBLIC_WEB_DIR));

// SPA fallback: כל GET שלא תואם route קיים למעלה, ולא קובץ אסט קיים תחת
// public/web (כבר טופל ע"י express.static למעלה) - מחזיר את index.html
// הבנוי, כדי ש-TanStack Router בצד הלקוח יטפל בניתוב (/shirts, /footwear,
// /cart, /checkout, /orders, /orders/:orderId, /disclaimer - ל-/, /about
// ו-/products/:slug יש כבר טיפול ייעודי למעלה, כולל meta-injection). ה-
// middleware-ים למעלה (health/products/auth/api/orders/images) כבר "תפסו"
// את מה ששייך להם - זה שריד אחרון, ולכן חייב לבוא אחרון.
app.get("*", (_req, res) => {
  if (!fs.existsSync(WEB_INDEX_HTML_PATH)) {
    // מצב תקין ב-dev מקומי: ה-frontend לא נבנה/הועתק לכאן (זה קורה רק
    // ב-npm run frontend:build, כחלק מה-build על Render) - ב-dev פונים
    // ל-Vite dev server על :5173, לא לנתיב הזה ישירות מול ה-backend.
    res.status(404).send("Frontend build not found - run `npm run frontend:build`, or use the Vite dev server on :5173 in local dev.");
    return;
  }
  res.sendFile(WEB_INDEX_HTML_PATH);
});

// error handler גלובלי - Express 4 לא תופס דחיית Promise שלא טופלה בתוך
// route אוטומטית, לכן כל route קורא ל-next(err) ב-catch, וזה מרכז את
// התגובה האחידה ללקוח (JSON, לא HTML של stack trace).
//
// ZodError מקבל טיפול מיוחד (2026-09, נוסף יחד עם MAX_LINE_ITEM_QUANTITY
// ב-routes/orders.ts): לפני זה, *כל* כשל ולידציה של schema.parse() (למשל
// body חסר, quantity לא חוקי) היה נופל לכאן ומוחזר כ-500 "INTERNAL_ERROR" -
// מטעה (זו שגיאת קלט של הלקוח, לא תקלת שרת) וגם היה נראה בלוגים כתקלה
// אמיתית. עכשיו זה 400 עם פירוט ה-issues של zod - נכון לכל route שמשתמש
// ב-.parse() (orders/auth/products), לא רק להוספה החדשה.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "VALIDATION_ERROR", issues: err.issues });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "INTERNAL_ERROR" });
});

app.listen(env.PORT, () => {
  console.log(`dull-backend listening on http://localhost:${env.PORT}`);
});
