// נתיבי קבצים משותפים על דיסק - מחושבים פעם אחת ביחס למיקום הקובץ הזה
// (לא ביחס ל-cwd, כך זה עובד בלי קשר מאיפה מריצים את התהליך). גם ה-static
// middleware (index.ts) וגם קריאת קבצים לצירוף inline במייל (email.ts)
// מצביעים לאותה תיקייה אחת - אין שכפול של "../public/images" בכמה מקומות.
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const PUBLIC_IMAGES_DIR = path.join(__dirname, "../../public/images");
