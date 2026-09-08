# Dull — Frontend Tech Spec

מסמך זה מרכז את החלטות הארכיטקטורה/סטאק ל-frontend, שסוכמו בשיחת תכנון עם Claude (backend & infra lead בפרויקט) לפני פתיחת השיחה הייעודית לבנייה בפועל. הוא המשך ישיר ל-`docs/PRD.md` ו-`docs/SCREENS_INVENTORY.md` — לא תחליף להם.

**לפני שמתחילים לבנות:** קרא/י את `docs/PRD.md` (כולל סעיף 11 - "עדכוני Scope", שגובר על סעיפים מוקדמים במקום שיש סתירה) ואת `docs/SCREENS_INVENTORY.md`. **שני המסמכים האלה מתעדכנים תוך כדי תנועה ולא תמיד משקפים את ההחלטה העדכנית ביותר** — גילינו את זה בפועל באיטרציה הזו (סעיף "שפה וכיוון" בראש שני המסמכים היה שגוי/מיושן ביחס להחלטה בפועל, עד שתוקן ב-11.9). כשמשהו בקוד/בשיחה סותר את מה שכתוב שם, יש להניח שהקוד/הדיון העדכני נכון יותר, לדווח לבעל המוצר, ולעדכן את המסמך בהתאם — לא לבנות שקט מול הסתירה.

## 1. Stack

| תחום | בחירה | למה |
|---|---|---|
| Build | Vite | סטנדרט נוכחי ל-SPA, מהיר |
| Routing | TanStack Router | type-safety מלא; Oren מכיר את React Router כרשת ביטחון אם יידרש |
| Server state | TanStack Query | caching/loading/error states מול ה-REST API בלי boilerplate |
| Client state | Zustand | קליל, בשביל העגלה (client-only, stateless מול ה-backend - נשלחת בשלמותה ב-checkout, אין `Cart` table) |
| Styling | Tailwind CSS v4 | מוזן ישירות מ-`tokens.css` דרך `@theme` - tokens.css נשאר מקור האמת היחיד, לא משוכפל |
| קומפוננטות מבניות | shadcn/ui, לפי צורך | רק לרכיבים "משעממים" מבחינה נגישותית (dropdown, modal) - **לא** לעיצוב החזותי, יש למותג זהות מובהקת משלו |
| i18n | react-i18next | תמיכה מובנית ב-pluralization/interpolation (גם אם לא בשימוש כרגע - לא לשלול את האפשרות) |
| ולידציה | Zod | סימטרי ל-backend; טפסים (checkout וכו') |
| שפה | TypeScript strict | כמו ב-backend |

**ללא Storybook כרגע** — משתלם בעיקר לספריית קומפוננטות חוצת-צוותים/צרכנים, לא רלוונטי לפרויקט יחיד עם זרימת עמודים מוגדרת. להוסיף רק אם יתעורר צורך קונקרטי (למשל: לדפדף בקומפוננטות בלי צורך בהרצת ה-backend המלא).

**החלטה פתוחה לשלב ההקמה בפועל:** טעינת גופנים (Archivo Black, Inter, Rubik, Assistant) - Google Fonts CDN מול self-hosting (למשל דרך חבילות `@fontsource/*`). Self-hosting עדיף בד"כ בפרודקשן (ביצועים, אין תלות/בקשה חיצונית ל-Google) - להכריע כשמקימים את ה-`index.html`/build בפועל.

## 2. מוסכמות קוד (מקביל ל-backend)

אין magic numbers/magic strings. אותה חלוקה לשלוש קטגוריות שנקבעה ב-backend, פלוס ציר רביעי ספציפי ל-frontend:

- **`src/config/env.ts`** — עוטף את `import.meta.env.VITE_*` (כתובת API, `GOOGLE_CLIENT_ID` צד-לקוח), מוולד עם Zod. המקום היחיד שקורא `import.meta.env` ישירות.
- **`src/constants/`** — שפות נתמכות, מפתחות ל-localStorage, נתיבי routes, ערכי debounce/pagination — לא תלוי סביבה, לא ניתן לעריכה ע"י בעל האתר.
- **הגדרות עסקיות דינמיות** — יגיעו מה-backend (StoreSettings העתידי), לא hardcoded בקוד ה-frontend.
- **`tokens.css`** — צבעים/מרווחים/טיפוגרפיה/רדיוסים/מושן. שום ערך עיצובי לא מופיע בקוד קומפוננטות - רק `var(--...)` דרך Tailwind theme.

## 3. דו-לשוניות (EN/HE) ו-RTL

**האתר דו-לשוני מ-MVP, לא רק אנגלית** (ראו `docs/PRD.md` סעיף 11.9 - זו הייתה סתירה מול המסמך המקורי, תוקנה).

- **טיפוגרפיה**: מוגדרת במלואה ב-`frontend/tokens.css` - Rubik Black 900 (כותרות) ו-Assistant (גוף) לעברית, מול Archivo Black/Inter לאנגלית. הגדלים וה-line-height **אינם** יחס אחיד בין השפות - נמדדו/כוילו בעין לכל תפקיד בנפרד (h1/h2/h3/body/body-strong/caption), כי גופנים עבריים לא בהכרח נראים באותו גודל אופטי כמו לטיניים באותו font-size. ה-overrides יושבים תחת `:root[lang="he"]`, **אותם שמות טוקן** כמו הגרסה הבסיסית - כדי שקוד קומפוננטות (`font-size: var(--typography-size-h1)`) לעולם לא יצטרך להסתעף לפי שפה.
- **תנאי הכרחי**: יש לסנכרן בפועל `<html lang="he" dir="rtl">` (או `lang="en" dir="ltr"`) מול ה-locale הפעיל ב-react-i18next (למשל listener על `languageChanged`). בלי זה, שום override בתוקן.css לא "מתעורר".
- **RTL ב-CSS**: להשתמש אך ורק ב-logical properties - `ps-*`/`pe-*` (padding-inline), `ms-*`/`me-*` (margin-inline), `text-start`/`text-end`, `start-*`/`end-*` (inset) - Tailwind תומך בזה built-in. **לא** `left`/`right`/`pl-*`/`pr-*` וכו'.
- **i18n של טקסט שאינו "סחורה"** (תפריט, כפתורים, הודעות מערכת - לא נתוני מוצר שמגיעים מה-API): react-i18next.

## 4. רספונסיביות

חשוב לשמר את ההתנהגות הרספונסיבית (desktop/mobile) בדיוק כפי שהיא ב-demo (`github.com/orenhd/dull-demo`, חי ב-`orenhd.github.io/dull-demo`). **לחלץ את ה-breakpoints וההתנהגות בפועל מה-CSS הקיים שם** (לא לבנות מחדש "מהזיכרון"/תחושה) ולקודד אותם כ-tokens מתועדים ב-`tokens.css` - כך שהרספונסיביות לא רק נשמרת אלא הופכת למפורשת ובדוקה.

## 5. תוכנית עבודה

1. בנייה מחדש של **עמוד הפריט** (מה-demo) כ-React עם קומפוננטות מסודרות - נבחר להתחיל דווקא כאן כי הוא המורכב ביותר לוגית (חיתוך צירי Fit×Colorway×Size מול המדיה, תואם למודל ה-`VariantAxis`/`Media` ב-backend). מכריח הקמה נכונה של כל התשתית החוצה-עמודים (API client, i18n, RTL, טוקנים→Tailwind) כבר בשלב הזה.
2. המשך לפי `docs/PRD.md` וטבלת `docs/SCREENS_INVENTORY.md`, לפי סדר העדיפויות שם.

## 6. אופן עבודה

זהה לחלוטין לזה שנקבע ב-backend, ומאותה סיבה (מגבלות סביבת ה-sandbox של Claude מול `node_modules`/binaries אמיתיים):
- Claude כותב את הקבצים בפועל בריפו.
- Oren מריץ `npm install`/`npm run dev`/`git push`/`gh` בטרמינל האמיתי שלו, ומדווח תוצאות/שגיאות בחזרה.
- מטרה מוצהרת: מינימום מעורבות ידנית מצד Oren (זה בדיוק הפואנטה של הקורס).

## 7. תקשורת

עדכונים על התקדמות ה-frontend מתועדים גם בערוץ Slack `#dull-frontend`.

---
*מסמך זה נכתב ב-2026-09-08 בשיחת התכנון שקדמה לפתיחת שיחת ה-frontend הייעודית.*
