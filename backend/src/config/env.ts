// המקום היחיד בקוד שקורא process.env ישירות. כל שאר הקוד מייבא מכאן -
// כך אין "מחרוזת קסם" של שם משתנה סביבה מפוזרת בכל הפרויקט, ואם ערך חסר
// או לא תקין נדע את זה מיד באתחול השרת, לא באמצע בקשה.
//
// dotenv.config() חייב לרוץ פה, לפני ה-parse - Prisma CLI (migrate/studio)
// טוען .env אוטומטית בעצמו, אבל השרת שלנו (tsx/node) לא עושה את זה מעצמו.
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(4000),

  // שולט למשל בהאם session cookie מסומן secure (דורש https - לא זמין ב-
  // localhost בפיתוח). ברירת מחדל development כדי ש-`npm run dev` יעבוד
  // מיד בלי לדרוש להגדיר את זה - production מוגדר מפורשות ב-deploy.
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Client ID של Google OAuth (Google Cloud Console -> APIs & Services ->
  // Credentials -> OAuth client ID -> Web application). זה לא סוד - הוא
  // גלוי גם בקוד ה-frontend - אבל עדיין חי כאן ולא ב-constants, כי הוא
  // תלוי-סביבה (ערך שונה לכל פרויקט ב-Google Cloud, למשל dev מול prod).
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),

  // סוד לחתימת ה-JWT של session cookie - זה כן סוד אמיתי. ליצור עם
  // `openssl rand -hex 32` ולשים ב-.env בלבד (אף פעם לא ב-.env.example
  // ואף פעם לא בקוד) - ראו את ה-README לגבי ההבחנה בין שני הקבצים.
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters - generate with `openssl rand -hex 32`"),

  // שליחת מייל דרך Gmail SMTP (לא Resend יותר - ראו הערה מפורטת ב-
  // lib/email.ts על הסיבה למעבר: כתובת ה-sandbox של Resend,
  // onboarding@resend.dev, יכולה לשלוח *רק* לכתובת שנרשמת איתה ל-Resend -
  // כל נמען אחר נכשל בשקט עם 403. בלי דומיין מאומת משלנו, זה לא שימיש
  // ללקוחות אמיתיים. Gmail SMTP שולח לכל נמען מיד, בלי לרכוש דומיין).
  //
  // GMAIL_USER: כתובת ה-Gmail ששולחת בפועל (חשבון אמיתי, לא alias).
  // GMAIL_APP_PASSWORD: סוד אמיתי בן 16 תווים - *לא* הסיסמה הרגילה של
  // החשבון. נוצר ב-myaccount.google.com/apppasswords, ודורש שתחילה
  // תפעיל 2-Step Verification בחשבון. לא ב-.env.example.
  GMAIL_USER: z.string().email("GMAIL_USER must be a valid email address"),
  GMAIL_APP_PASSWORD: z.string().min(1, "GMAIL_APP_PASSWORD is required"),

  // כתובת "מאת" למיילים. שם התצוגה חופשי ("Dull <a@b.com>") - שם התצוגה
  // הוא מה שהנמען רואה בתיבת הדואר שלו - אבל הכתובת הטכנית בתוך ה-<>
  // חייבת להיות זהה ל-GMAIL_USER (או alias מאומת תחת Gmail -> Settings ->
  // Accounts -> "Send mail as"), אחרת Gmail דוחה את השליחה או משכתב את
  // הכתובת בשקט. לא z.string().email() בכוונה - זה היה פוסל את פורמט
  // "שם <כתובת>".
  EMAIL_FROM: z.string().min(3, "EMAIL_FROM is required"),
});

export const env = envSchema.parse(process.env);
