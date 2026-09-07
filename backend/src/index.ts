import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { productsRouter } from "./routes/products.js";
import { authRouter } from "./routes/auth.js";
import { ordersRouter } from "./routes/orders.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
// credentials: true נדרש כדי שהדפדפן ישלח/יקבל את ה-session cookie מבקשות
// cross-origin (ה-frontend ירוץ בפורט אחר מה-backend גם ב-dev). origin: true
// משקף בחזרה את ה-Origin שהבקשה הגיעה ממנו - לא אפשר "*" יחד עם credentials
// (הדפדפן חוסם את זה). TODO כשיוחלט מה כתובת ה-frontend ב-production: להחליף
// ל-allowlist מפורש דרך env, לא להשאיר פתוח לכל origin.
app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(cookieParser());

// תמונות מוצר מוגשות סטטית מ-public/images (ראו scripts/generate-web-images.ts)
app.use("/images", express.static(path.join(__dirname, "../public/images")));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/products", productsRouter);
app.use("/auth", authRouter);
app.use("/orders", ordersRouter);

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
