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
- **Language**: Node (לא Docker - אין Dockerfile בפרויקט, במכוון).
- **Region**: Frankfurt - קרוב ביותר ל-Neon (גם הוא Frankfurt) ולקהל היעד בישראל.
- **Build Command**: `npm install --include=dev && npm run frontend:build && npm run build && npm run images:generate`
  - `--include=dev` **קריטי ולא קוסמטי**: מכיוון ש-`NODE_ENV=production` מוגדר
    כמשתנה סביבה (ראו למטה), ו-Render מזריק את משתני הסביבה גם לשלב ה-Build
    ולא רק ל-runtime - וההתנהגות המתועדת של npm היא לדלג על `devDependencies`
    כש-`NODE_ENV=production` קיים. בלי הדגל הזה, `typescript`/`@types/*`
    לא מותקנים ו-`tsc` נכשל עם שגיאות "Cannot find name 'process'" וכו',
    למרות שהם רשומים כהלכה ב-`package.json`. גילינו את זה בדרך הקשה - ראו
    "בעיות שנתקלנו בהן" למטה אם זה קורה שוב.
  - `frontend:build` (נוסף 2026-09, `docs/PRD.md` סעיף 12.10) - מריץ
    `scripts/render-build.ts`: מבצע `npm install --include=dev && npm run
    build` בתוך `frontend/` (אותה סיבה בדיוק לגבי `--include=dev` - vite/
    typescript/tailwindcss הם devDependencies שם), ומעתיק את `frontend/dist`
    ל-`backend/public/web`. זה מאחד frontend+backend לאותו Render service
    ואותו origin (`https://dull.onrender.com`) - סוגר את ה-TODO הישן על CORS
    (ראו allowlist מפורש עכשיו ב-`src/index.ts`) ומייתר את סוגיית ה-SameSite
    cross-origin ל-production. **חייב לרוץ לפני `npm run build` של ה-backend
    עצמו** (הסדר בפקודה למעלה) - לא תלות טכנית, אבל שומר על סדר הגיוני אחד.
  - `images:generate` חובה - תיקיית `public/images` היא build artifact
    ולא נשמרת ב-git, אז בלי זה השרת החי לא יגיש שום תמונה.
- **Pre-Deploy Command**: `npx prisma migrate deploy` (מריץ מיגרציות ממתינות
  לפני שהגרסה החדשה מקבלת תנועה - לא `migrate dev`, זה אינטראקטיבי ולא מתאים
  ל-CI/deploy).
- **Start Command**: `npm run start`
- **Health Check Path**: `/health`.
- **Auto-Deploy**: On Commit - כל push ל-main מפעיל דיפלוי אוטומטית.
- **משתני סביבה** (Environment tab בדשבורד - `.env` עצמו כמובן לא מגיע ל-git):
  `DATABASE_URL`, `DIRECT_URL` (connection ישיר, unpooled, ל-Neon - נדרש
  ע"י `prisma migrate deploy`, ראו `.env.example` להסבר המלא), `GOOGLE_CLIENT_ID`,
  `JWT_SECRET`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `EMAIL_FROM` (Gmail SMTP -
  לא Resend יותר, ראו `.env.example`/`src/lib/email.ts`), `NODE_ENV=production`, ובנוסף
  (2026-09, לצורך `npm run frontend:build`) `VITE_API_BASE_URL=https://
  dull.onrender.com` ו-`VITE_GOOGLE_CLIENT_ID` (אותו ערך כמו `GOOGLE_CLIENT_ID`
  - Vite חושף ל-client bundle רק משתנים עם prefix `VITE_`, שום סוד קיים לא
  נחשף גם ביושבו באותה רשימה). לא צריך להגדיר `PORT` - Render מזריק אותו
  בעצמו וה-קוד כבר קורא מ-`env.PORT`.
- **גרסת Node**: מוגדרת מפורשות ב-`package.json` (`"engines": {"node": "22.x"}`)
  כדי לתאום לגרסה המקומית (22.x) ולמנוע ברירת מחדל שונה של Render.
- **Workspace Plan מול Instance Type - שני מקומות שונים לגמרי בדשבורד**:
  - *Workspace Plan* (Account/Billing → Hobby $0 / Pro $25) - נשארנו על
    **Hobby (חינם)**. זו רק הגדרה חשבונאית-ארגונית, לא קובעת ביצועים/זמינות.
  - *Instance Type* (בתוך השירות עצמו → Settings → Instance Type) - זה
    שקובע את משאבי המחשוב בפועל. בחרנו **Starter ($7/חודש)**, לא Free -
    Free "נרדם" אחרי 15 דקות בלי תנועה (~30-60 שניות התעוררות לבקשה
    הראשונה) - לא מתאים לפרויקט שנשלח לאנשים אמיתיים. $7/חודש קונה
    תמיד-ער בלי סיכון, ובלי תלות בהתנהגות לא-מובטחת של פלטפורמות אחרות
    (שקלנו גם Railway - יש לו אי-ודאות דומה סביב הירדמות ב-Hobby plan).

### בעיות שנתקלנו בהן בדיפלוי הראשון (לתיעוד, למקרה שיחזרו)
1. **Build נכשל על commit ישן** - Render בנה מ-`origin/main` שהיה 15 קומיטים
   מאחורי המקומי (git push לא בוצע בזמן). פתרון: לוודא `git push` לפני כל
   דיפלוי; `git status`/`git log origin/main..HEAD` בודקים את זה מראש.
2. **גרסת Node לא תואמת** - Render ברירת מחדל ל-Node 24, בעוד הפרויקט פותח
   על 22. פתרון: `engines` ב-`package.json` (ראו למעלה).
3. **`@types/*` לא מותקנים למרות שרשומים ב-package.json** - הסיבה האמיתית
   (אחרי שנפסלו: commit ישן, Node version, build cache) הייתה `NODE_ENV=
   production` גורם ל-npm לדלג על devDependencies. פתרון: `--include=dev`
   ב-Build Command (ראו למעלה). אבחון: `ls node_modules/@types` בתוך ה-
   Build Command חשף שהתיקייה ריקה לגמרי - זו הייתה ההוכחה המכרעת.

## סטטוס
קיים: סכימת DB מלאה, seed עם מוצרים אמיתיים, `/products` (קטלוג + פריט),
`/auth/google` (login + session cookie), `/auth/me`, `/orders` (יצירה/
רשימה/פריט, כולל snapshot של שם/בחירה/תמונה בזמן הרכישה), מייל תודה +
מתנת PDF (Gmail SMTP דרך nodemailer + pdf-lib - עברנו מ-Resend ב-2026-09,
ראו `src/lib/email.ts`; תוכן placeholder בכוונה - העיצוב/הקופי הסופיים
עוד לא נקבעו), צינור תמונות web, ניהול מוצרים דרך Prisma Studio.
**מ-2026-09**: ה-frontend (React/Vite, בבנייה ע"י Oren בשיחה נפרדת -
ראו `frontend/TECH_SPEC.md`) מאוחד לאותו Render service - נבנה ומוגש
דרך `npm run frontend:build`/`express.static`, כולל meta-injection
per-product (`og:title`/`og:image`) לתצוגות מקדימה בשיתוף קישור
(`docs/PRD.md` סעיף 12.10). **השרת פרוס ורץ בפועל** ב-Render:
https://dull.onrender.com (`/health`, `/products` נבדקו ועובדים).
אין עדיין: תוכן סופי למייל/PDF המתנה, נכסי מוצר נוספים (Immortal, שאר
Grave) לפי הזמינות.
