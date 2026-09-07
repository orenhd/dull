import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { env } from "./config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

// תמונות מוצר מוגשות סטטית מ-public/images (ראו scripts/generate-web-images.ts)
app.use("/images", express.static(path.join(__dirname, "../public/images")));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(env.PORT, () => {
  console.log(`dull-backend listening on http://localhost:${env.PORT}`);
});
