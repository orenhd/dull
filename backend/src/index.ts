import express from "express";
import cors from "cors";
import { env } from "./config/env.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(env.PORT, () => {
  console.log(`dull-backend listening on http://localhost:${env.PORT}`);
});
