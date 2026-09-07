# dull-backend

## מוסכמת תיקיות
- `backend/` — אפליקציית ה-Node/TypeScript (API, סכימת Prisma, לוגיקת עסק).
- `db/` — תיעוד/סקריפטים עתידיים סביב ה-DB (seed, ניתוח). Postgres עצמו רץ
  אך ורק כאינסטנס מנוהל בענן (Neon) - אין Docker ואין עותק מקומי בפרויקט הזה.

## מוסכמות קוד (חשוב - קרא לפני שמוסיפים קוד)
אין magic numbers/strings בקוד. כל ערך קבוע מעוגן באחת משלוש קטגוריות:
- **`src/config/env.ts`** — תלוי-סביבת הרצה (URL של DB, פורט). המקום היחיד
  שמותר לו לקרוא `process.env` ישירות; הכל אחר מייבא ממנו.
- **`src/constants/`** — קבועים אמיתיים שלא תלויים בסביבה ולא ניתנים לעריכה
  ע"י בעל האתר (locales נתמכים, מטבע, page size ברירת מחדל).
- **StoreSettings (עתידי, ב-DB)** — ערכים תלויי-עסק שבעל האתר עשוי לרצות
  לשנות בלי deploy (למשל: זמן טיפול משוער בהחזר כספי, מה-PRD סעיף 7).

## הרצה ראשונית
1. תיצור פרויקט חינמי ב-[neon.tech](https://neon.tech), תעתיק את ה-connection string.
2. `cd backend && npm install`
3. `cp .env.example .env` ותדביק את ה-DATABASE_URL האמיתי.
4. `npm run prisma:migrate` — יוצר את הטבלאות בענן לפי `prisma/schema.prisma`.
5. `npm run dev` — מריץ את השרת עם hot-reload על `http://localhost:4000`.

## סטטוס
שלד ראשוני: סכימת DB, נקודת קצה יחידה `/health`, ומוסכמת env/constants.
אין עדיין: routes למוצרים/עגלה/הזמנות, Google OAuth, seed data.
