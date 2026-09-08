# Dull — Frontend

React + Vite. ראו `TECH_SPEC.md` (סטאק, מוסכמות, תוכנית עבודה) ואת
`docs/API_CONTRACT.md`, `docs/PRD.md`, `docs/SCREENS_INVENTORY.md` בשורש
הריפו לפני שנוגעים בקוד.

## הרצה מקומית

```bash
cp .env.example .env   # ולמלא VITE_API_BASE_URL / VITE_GOOGLE_CLIENT_ID
npm install
npm run dev
```

ברירת המחדל ב-`.env.example` מצביעה ל-backend מקומי (`http://localhost:4000`,
דורש `npm run dev` בתיקיית `backend` במקביל). כדי לעבוד מול ה-backend החי
בלי להריץ backend מקומי, אפשר להחליף ל-`VITE_API_BASE_URL="https://dull.onrender.com"`.

## מבנה

- `src/config/env.ts` - המקום היחיד שקורא `import.meta.env` (מוולד עם Zod).
- `src/constants/` - קבועים לא-תלויי-סביבה (routes, locales, storage keys).
- `src/lib/api/` - HTTP client דק מול ה-backend.
- `src/i18n/` - react-i18next + מילוני en/he. RTL מסונכרן אוטומטית
  (`src/hooks/useLocaleSync.ts`) מול `<html lang dir>`.
- `src/content/sizeCharts.ts` - **טבלת מידות היא hardcoded בכוונה** - ה-API
  עדיין לא מספק נתוני מדידה. ראו הערה בראש הקובץ.
- `src/components/product/` - קומפוננטות עמוד הפריט.
- `../tokens.css` (תיקיית `frontend/`, מחוץ ל-`src/`) - מקור האמת היחיד
  לעיצוב, מוזן ל-Tailwind דרך `@theme inline` ב-`src/styles/index.css`.
