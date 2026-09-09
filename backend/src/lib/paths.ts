// נתיבי קבצים משותפים על דיסק - מחושבים פעם אחת ביחס למיקום הקובץ הזה
// (לא ביחס ל-cwd, כך זה עובד בלי קשר מאיפה מריצים את התהליך). גם ה-static
// middleware (index.ts) וגם קריאת קבצים לצירוף inline במייל (email.ts)
// מצביעים לאותה תיקייה אחת - אין שכפול של "../public/images" בכמה מקומות.
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const PUBLIC_IMAGES_DIR = path.join(__dirname, "../../public/images");

// build artifact של frontend/, מועתק לכאן ע"י scripts/render-build.ts
// (docs/PRD.md סעיף 12.10) - לא frontend/dist ישירות, כדי שה-process שרץ
// ב-runtime יהיה עצמאי לגמרי בתוך עץ התיקיות של backend/.
export const PUBLIC_WEB_DIR = path.join(__dirname, "../../public/web");
export const WEB_INDEX_HTML_PATH = path.join(PUBLIC_WEB_DIR, "index.html");
