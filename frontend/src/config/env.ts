// המקום היחיד בקוד שקורא import.meta.env ישירות - ראו backend/src/config/env.ts,
// אותה מוסכמה בדיוק (TECH_SPEC סעיף 2). אם ערך חסר/לא תקין נדע את זה מיד
// באתחול האפליקציה (קריסה ברורה), לא באמצע קריאת רשת כלשהי.
import { z } from "zod";

const envSchema = z.object({
  // כתובת ה-backend החי - ראו docs/API_CONTRACT.md. אין ברירת מחדל בכוונה:
  // "לשכוח" להגדיר את זה צריך להיכשל מיד, לא ליפול חזרה בשקט למשהו שגוי.
  VITE_API_BASE_URL: z.url(),

  // Client ID של Google OAuth - נדרש רק במסך ה-checkout (לא בעמוד הפריט),
  // אבל מוולד כאן כבר עכשיו כדי שהחלק הזה של התשתית לא יידרש שוב מאוחר
  // יותר. לא סוד (ראו docs/API_CONTRACT.md).
  VITE_GOOGLE_CLIENT_ID: z.string().min(1, "VITE_GOOGLE_CLIENT_ID is required"),

  // Mixpanel project token (docs/PRD.md סעיף 20, בקשת Oren 2026-09-12) -
  // *אופציונלי בכוונה*, בניגוד לשני הערכים למעלה: אנליטיקה היא תוספת
  // best-effort, לא תלות קריטית - האתר חייב להמשיך לעבוד במלואו גם בלי
  // טוקן מוגדר (dev מקומי לפני שנפתח חשבון Mixpanel, או אם החשבון ייסגר/
  // יימחק בעתיד). src/lib/analytics.ts בודק בעצמו אם הערך קיים ונשאר
  // no-op בשקט אם לא - ראו שם.
  VITE_MIXPANEL_TOKEN: z.string().optional(),
});

export const env = envSchema.parse(import.meta.env);
