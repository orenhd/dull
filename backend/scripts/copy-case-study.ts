// מעתיק case-study/ (בשורש המונורפו, קייס סטאדי סטטי לקורס UX/UI) ל-
// backend/public/case-study, כדי ש-express.static יגיש אותו כחלק מאותו
// Render service - אותה שיטה בדיוק כמו render-build.ts (frontend) ו-
// PUBLIC_IMAGES_DIR/PUBLIC_WEB_DIR (backend/src/lib/paths.ts). נתיבים
// יחסיים ל-__dirname (לא cwd) - עובד בלי קשר ל-Root Directory של Render.
// בניגוד ל-hi-res/ (images:generate) - אין כאן המרה/דחיסה, התמונות תחת
// case-study/assets כבר .jpg מוכנים-לפרסום כפי שהם; זה קופי גולמי בלבד.
// (docs/PRD.md סעיף 36)
import { cpSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = path.join(__dirname, "../../case-study");
const TARGET_DIR = path.join(__dirname, "../public/case-study");

rmSync(TARGET_DIR, { recursive: true, force: true });
cpSync(SOURCE_DIR, TARGET_DIR, { recursive: true });
