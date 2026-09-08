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
3. `cp .env.example .env` ותמלא: `DATABASE_URL` (מ-Neon), `GOOGLE_CLIENT_ID`
   (Google Cloud Console -> Google Auth Platform -> Clients), `JWT_SECRET`
   (לייצר עם `openssl rand -hex 32` - סוד אמיתי, לעולם לא ב-.env.example).
4. `npm run prisma:migrate` — יוצר את הטבלאות בענן לפי `prisma/schema.prisma`.
5. `npm run seed` — ממלא מוצרים אמיתיים (ראו `prisma/seed.ts`).
6. `npm run images:generate` — ממיר את `../hi-res` לתמונות web (`public/images`, לא ב-git - build artifact).
7. `npm run dev` — מריץ את השרת עם hot-reload על `http://localhost:4000`.

## ניהול מוצרים (CMS)
אין כרגע UI מותאם לניהול קטלוג - `npm run prisma:studio` (עורך טבלאות
בדפדפן, חינמי, מגיע עם Prisma) משמש בתור זה. החלטה מכוונת: לא לבנות CMS
מותאם עד שיתברר שבאמת צריך יותר מזה (למשל הרבה מוצרים בקצב גבוה) - ראו
דיון בצ'אט. Prisma Studio לא מגן מפני טעויות לוגיות (כמו `key` שלא תואם
בין axis values), אז שינויים מורכבים (מוצר חדש עם כל הוריאנטים) עדיין
עוברים דרך `prisma/seed.ts`.

## בדיקות ידניות
- `requests.http` — בקשות GET לקטלוג (עם REST Client extension ל-VS Code).
- `dev-tools/google-signin-test.html` — בדיקת login מלאה (Google Sign-In
  אמיתי -> session cookie -> POST /orders) - ראו `dev-tools/README.md`.

## פריסה (Render)
- **Root Directory**: `backend` (המונורפו כולל גם docs/hi-res/db - Render צריך לדעת שהאפליקציה חיה בתת-תיקייה).
- **Region**: Frankfurt - קרוב ביותר ל-Neon (גם הוא Frankfurt) ולקהל היעד בישראל.
- **Build Command**: `npm ci && npm run images:generate && npm run build`
  (חובה לכלול `images:generate` - תיקיית `public/images` היא build artifact
  ולא נשמרת ב-git, אז בלי זה השרת החי לא יגיש שום תמונה).
- **Pre-Deploy Command**: `npx prisma migrate deploy` (מריץ מיגרציות ממתינות
  לפני שהגרסה החדשה מקבלת תנועה - לא `migrate dev`, זה אינטראקטיבי ולא מתאים
  ל-CI/deploy). אם זה לא זמין ב-plan החינמי, לשלב בתוך ה-Build Command במקום.
- **Start Command**: `npm run start`
- **משתני סביבה** (Environment tab בדשבורד - `.env` עצמו כמובן לא מגיע ל-git):
  `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `JWT_SECRET`, `RESEND_API_KEY`,
  `EMAIL_FROM`, `NODE_ENV=production`. לא צריך להגדיר `PORT` - Render מזריק
  אותו בעצמו וה-קוד כבר קורא מ-`env.PORT`.
- **מגבלת free tier**: השירות "נרדם" אחרי 15 דקות בלי תנועה, והבקשה הראשונה
  אחרי זה לוקחת כ-30-60 שניות (Render מעיר אותו). 750 שעות instance חינם
  לחודש לכל workspace.

## סטטוס
קיים: סכימת DB מלאה, seed עם מוצרים אמיתיים, `/products` (קטלוג + פריט),
`/auth/google` (login + session cookie), `/orders` (יצירה/רשימה/פריט),
צינור תמונות web, ניהול מוצרים דרך Prisma Studio.
אין עדיין: מייל תודה + מתנת PDF, frontend (לא באחריות Backend).
