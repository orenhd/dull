# Dull — API Contract (backend → frontend)

מסמך ייחוס עצמאי ל-API החי. נכתב ע"י ה-backend/infra lead בשביל שיחת ה-frontend - אינו דורש לקרוא את כל הדיונים שהובילו לבנייתו. המקור-האמת האמיתי הוא הקוד עצמו (`backend/src/routes/*.ts`) ו-`backend/requests.http` - המסמך הזה יכול להתיישן, הקוד לא.

## Base URL

| סביבה | כתובת |
|---|---|
| Production | `https://dull.onrender.com` |
| Dev מקומי | `http://localhost:4000` (`npm run dev` בתיקיית `backend`) |

לפי מוסכמת ה-`env.ts` שכבר קיימת ב-backend, ה-frontend צריך טוקן env מקביל משלו: **`VITE_API_BASE_URL`**, נקרא במקום יחיד (`src/config/env.ts` ב-frontend, מוולד עם Zod), לא hardcoded באף fetch call.

## Auth ו-cookies — הכי חשוב לא לפספס

- ה-session הוא **httpOnly cookie חתום**, לא token ב-localStorage/header. כל בקשה שדורשת התחברות (הכל תחת `/orders`) חייבת להישלח עם `credentials: 'include'` (fetch) / `withCredentials: true` (axios) - אחרת ה-cookie לא יישלח והשרת יחזיר 401 דרך `requireAuth`.
- Google Sign-In מתבצע **כולו בצד ה-frontend** (Google Identity Services, לא redirect מהשרת) - ה-frontend מקבל `credential` (ID token) מ-Google ושולח אותו ל-`POST /auth/google`. השרת מאמת, יוצר/מוצא משתמש, ומחזיר cookie.
- ה-frontend צריך **את אותו** Google OAuth Client ID שיש ל-backend (`GOOGLE_CLIENT_ID`) כדי לאתחל את כפתור ה-Sign-In - זה מזהה ציבורי (לא סוד), חשוף לצד לקוח לגיטימית. שם מוצע: `VITE_GOOGLE_CLIENT_ID`.
- **גלישה כ-Guest מלאה בכל האתר, כולל הוספה לעגלה** - login נדרש רק במעבר מהעגלה ל-checkout (ראו `docs/PRD.md` סעיף 11.4).
- **CORS**: כרגע `origin: true` (פתוח לכל origin, עם `credentials: true`) - יש TODO קיים בקוד להגביל ל-allowlist מפורש ברגע שיש domain אמיתי ל-frontend. **כשה-frontend יעלה לדומיין קבוע (Vercel/Netlify/וכו') - זו פנייה חובה חזרה לשיחת ה-backend**, לא רק frontend-side.

## Endpoints

### `GET /health`
`{ ok: true }` — לבדיקת חיות בלבד.

### `GET /products?locale=en|he`
קטלוג לדף רשימה. **לא דורש login.**

תגובה:
```json
{
  "locale": "en",
  "items": [{
    "id": "...", "slug": "darkthrone-tee", "category": "...",
    "name": "Darkthrone Tee",
    "bandCreditName": "...", "bandCreditUrl": "...",
    "priceAgorot": 8900,
    "flatImageUrl": "/images/...",
    "campaignImageUrl": "/images/..." // או null
  }]
}
```
`flatImageUrl` = תמונת ברירת מחדל בכרטיס; `campaignImageUrl` (אם קיים) מחליף אותה ב-hover (דסקטופ). `priceAgorot` הוא המחיר הזול מבין הוריאנטים (טווח "מ-").

**חשוב לגבי כתובות תמונה (`flatImageUrl`/`campaignImageUrl`/`media[].url`):** אלו נתיבים **יחסיים** בפועל (`"/images/x.webp"`, ראו `backend/src/routes/products.ts` - `url: media.url` כפי שנשמר ב-DB, וב-`backend/prisma/seed.ts`), לא URL מלא כפי שהדוגמה למעלה הציגה קודם (תוקן 2026-09-08 - הדוגמה הקודמת הייתה שגויה, לא רק מקוצרת). ה-frontend חייב לצרף אותן ל-base URL בעצמו (ראו `frontend/src/lib/api/client.ts`, `resolveMediaUrl()`) - לא להניח שהן כבר כתובת מלאה.

### `GET /products/:slug?locale=en|he`
דף פריט מלא. **לא דורש login.** 404 עם `{ "error": "PRODUCT_NOT_FOUND" }` אם לא קיים/לא פעיל.

תגובה (מקוצר):
```json
{
  "locale": "en",
  "product": {
    "id": "...", "slug": "...", "category": "...", "name": "...", "description": "...",
    "bandCreditName": "...", "bandCreditUrl": "...",
    "axes": [{ "key": "fit", "label": "Fit", "values": [
      { "id": "...", "key": "regular", "label": "Regular", "dependsOnValueId": null }
    ]}],
    "variants": [{ "id": "...", "sku": "...", "priceAgorot": 8900, "stockQty": 12, "axisValueIds": ["<id-fit-regular>", "<id-color-light>", "<id-size-m>"] }],
    "media": [{ "role": "FLAT", "url": "...", "altText": "...", "axisValueIds": ["<id-color-light>"] }]
  }
}
```
**הלוגיקה שה-frontend צריך לממש**: לכל בחירת המשתמש (Fit+Colorway+Size) - למצוא את ה-`variant` שה-`axisValueIds` שלו הם בדיוק אותה קבוצת ה-id-ים שנבחרו (חיתוך/השוואת סטים), ואת ה-`media` הרלוונטית לפי אותה שיטה (ל-media יכולה להיות תלות בציר אחד בלבד, למשל Colorway - אז ה-`axisValueIds` שלה יהיה subset, לא set מלא). `dependsOnValueId` על ערך-ציר אומר שהערך הזה רלוונטי רק כשערך-ציר אחר נבחר (למשל: מידה מסוימת רלוונטית רק ל-Fit מסוים).

### `POST /auth/google`
Body: `{ "credential": "<google id token>" }`. מגדיר session cookie. תגובה: `{ "user": { "id", "email", "name" } }`.

### `POST /auth/logout`
בלי body. מנקה את ה-cookie. תגובה: `{ "ok": true }`.

### `POST /orders` — **דורש login (cookie)**
Body:
```json
{
  "items": [{ "productVariantId": "...", "quantity": 1 }],
  "shippingAddress": { "...": "כל מבנה - טופס המשלוח עוד לא נקבע סופית ב-PRD" }
}
```
- המחיר **תמיד** מחושב בשרת מה-DB - לא לשלוח מחיר מה-frontend, הוא יתעלם ממנו ממילא.
- שגיאות אפשריות: `400 { error: "VARIANT_NOT_FOUND", productVariantId }`, `400 { error: "OUT_OF_STOCK", productVariantId }`.
- הצלחה: `201 { order: { id, totalAgorot, items: [...], ... } }`.
- **אין תשלום אמיתי** (v1 - "רכישה חינמית", ראו PRD 11.2). אחרי יצירת ההזמנה נשלח מייל תודה + PDF מתנה ל-מייל המשתמש - אין ל-frontend שום תפקיד בזה, זה effect צד-שרת מלא.

### `GET /orders` — **דורש login**
היסטוריית ההזמנות של המשתמש המחובר בלבד. `{ orders: [...] }`.

### `GET /orders/:id` — **דורש login**
הזמנה בודדת, בעלים בלבד - `404 { error: "ORDER_NOT_FOUND" }` גם אם ההזמנה קיימת אבל שייכת למשתמש אחר (לא 403, בכוונה - לא לחשוף קיום).

## שגיאות כלליות

כל שגיאה לא-צפויה (500): `{ "error": "INTERNAL_ERROR" }`. שגיאות ולידציה (Zod, 400) - יזרקו עם המבנה הרגיל של Zod, כדאי לטפל ב-frontend בצורה סלחנית (הצגת הודעה גנרית) ולא להסתמך על מבנה מדויק.

## מטבע ותצוגה

`priceAgorot` הוא **מספר שלם באגורות** (למרות השם ההיסטורי, זה כרגע ש"ח × 100, לא "תרומה" - ראו PRD 11.2). ליצור helper תצוגה ב-frontend (מקביל ל-`formatAgorot` ב-backend): `₪${(agorot/100).toFixed(2)}`.
