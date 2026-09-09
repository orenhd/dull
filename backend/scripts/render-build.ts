// בונה את frontend/ ומעתיק את הפלט ל-backend/public/web, כדי ש-express.static
// יגיש אותו כחלק מאותו Render service (docs/PRD.md סעיף 12.10). נתיבים
// יחסיים ל-__dirname (לא cwd) - אותה שיטה בדיוק כמו PUBLIC_IMAGES_DIR
// ב-backend/src/lib/paths.ts - כך זה עובד בלי קשר ל-Root Directory של Render.
import { execSync } from "node:child_process";
import { cpSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.join(__dirname, "../../frontend");
const TARGET_DIR = path.join(__dirname, "../public/web");

// --include=dev קריטי גם כאן, מאותה סיבה בדיוק כמו ב-backend (README.md,
// "בעיות שנתקלנו בהן" #3): NODE_ENV=production גורם ל-npm לדלג על
// devDependencies כברירת מחדל, ו-vite/typescript/tailwindcss (נדרשים
// ל-`npm run build` של frontend) כולם שם.
execSync("npm install --include=dev", { cwd: FRONTEND_DIR, stdio: "inherit" });
execSync("npm run build", { cwd: FRONTEND_DIR, stdio: "inherit" });

rmSync(TARGET_DIR, { recursive: true, force: true });
cpSync(path.join(FRONTEND_DIR, "dist"), TARGET_DIR, { recursive: true });
