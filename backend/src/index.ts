import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { productsRouter } from "./routes/products.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

// תמונות מוצר מוגשות סטטית מ-public/images (ראו scripts/generate-web-images.ts)
app.use("/images", express.static(path.join(__dirname, "../public/images")));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/products", productsRouter);

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
