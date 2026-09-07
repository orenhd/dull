// המקום היחיד בקוד שקורא process.env ישירות. כל שאר הקוד מייבא מכאן -
// כך אין "מחרוזת קסם" של שם משתנה סביבה מפוזרת בכל הפרויקט, ואם ערך חסר
// או לא תקין נדע את זה מיד באתחול השרת, לא באמצע בקשה.
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(4000),
});

export const env = envSchema.parse(process.env);
