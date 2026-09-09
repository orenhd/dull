import fs from "node:fs";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { productsRouter } from "./routes/products.js";
import { authRouter } from "./routes/auth.js";
import { ordersRouter } from "./routes/orders.js";
import { PUBLIC_IMAGES_DIR, PUBLIC_WEB_DIR, WEB_INDEX_HTML_PATH } from "./lib/paths.js";
import { buildProductMetaValues, injectProductMeta, wantsHtmlPreview } from "./lib/metaInjection.js";

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

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Meta-injection ל-GET /products/:slug בלבד (docs/PRD.md 12.10) - *לפני*
// productsRouter, כדי ליירט בקשות שרוצות HTML (ניווט דפדפן/בוט תצוגה-
// מקדימה) עוד לפני שהן מגיעות ל-JSON API. קריאות ה-API הפנימיות של ה-SPA
// עצמו (frontend/src/lib/api/client.ts) ממשיכות ל-productsRouter כרגיל -
// ראו התיעוד המלא ב-wantsHtmlPreview() (lib/metaInjection.ts) על איך
// ההבחנה הזו עובדת בלי שום שינוי בצד ה-frontend.
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

app.use("/products", productsRouter);
app.use("/auth", authRouter);
app.use("/orders", ordersRouter);

// קבצי ה-build הסטטיים של frontend/ (JS/CSS/אסטים, הועתקו ל-public/web
// ע"י scripts/render-build.ts - docs/PRD.md 12.10). ממוקם *אחרי* /products
// כדי שה-meta-injection למעלה תמיד תספיק ליירט קודם.
app.use(express.static(PUBLIC_WEB_DIR));

// SPA fallback: כל GET שלא תואם route קיים למעלה, ולא קובץ אסט קיים תחת
// public/web (כבר טופל ע"י express.static למעלה) - מחזיר את index.html
// הבנוי, כדי ש-TanStack Router בצד הלקוח יטפל בניתוב (/, /shirts,
// /footwear, /about, /cart, /checkout, /orders, /orders/:orderId,
// /disclaimer). ה-middleware-ים למעלה (health/products/auth/orders/images)
// כבר "תפסו" את מה ששייך להם - זה שריד אחרון, ולכן חייב לבוא אחרון.
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
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "INTERNAL_ERROR" });
});

app.listen(env.PORT, () => {
  console.log(`dull-backend listening on http://localhost:${env.PORT}`);
});
