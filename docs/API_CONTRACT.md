# Dull — API Contract (backend → frontend)

מסמך ייחוס עצמאי ל-API החי. נכתב ע"י ה-backend/infra lead בשביל שיחת ה-frontend - אינו דורש לקרוא את כל הדיונים שהובילו לבנייתו. המקור-האמת האמיתי הוא הקוד עצמו (`backend/src/routes/*.ts`) ו-`backend/requests.http` - המסמך הזה יכול להתיישן, הקוד לא.

## Base URL

**עדכון 2026-09 (`docs/PRD.md` סעיף 12.10):** ה-frontend הבנוי מוגש עכשיו מאותו Render service כמו ה-API עצמו (`scripts/render-build.ts` מעתיק את `frontend/dist` ל-`backend/public/web`, ו-`backend/src/index.ts` מגיש אותו) - בפרודקשן זה **same-origin לגמרי**, לא שני domains נפרדים. `VITE_API_BASE_URL` עדיין נחוץ (ראה למטה) והערך שלו לא השתנה - רק שעכשיו כשקוראים לו מתוך עמוד שמוגש מאותו origin, הבקשות בפועל לא נושאות `Origin` header כלל (הדפדפן שולח אותו רק ב-cross-origin), אז ה-CORS allowlist למטה כמעט ולא נכנס לפעולה בפרודקשן - הוא נשאר רלוונטי בעיקר ל-dev מקומי.

| סביבה | כתובת |
|---|---|
| Production | `https://dull.onrender.com` (גם ה-API וגם ה-frontend הבנוי, אותו origin) |
| Dev מקומי | `http://localhost:4000` (`npm run dev` בתיקיית `backend`) - ה-frontend ממשיך לרוץ בנפרד על `http://localhost:5173` (Vite dev server), זה נשאר cross-origin ב-dev |

לפי מוסכמת ה-`env.ts` שכבר קיימת ב-backend, ה-frontend צריך טוקן env מקביל משלו: **`VITE_API_BASE_URL`**, נקרא במקום יחיד (`src/config/env.ts` ב-frontend, מוולד עם Zod), לא hardcoded באף fetch call. ב-Render, `VITE_API_BASE_URL` ו-`VITE_GOOGLE_CLIENT_ID` (ראו סעיף Auth למטה) מוגדרים כ-Environment Variables רגילים על אותו service - Vite קורא `VITE_*` ישירות מ-`process.env` בזמן ה-build (`npm run frontend:build`), אין קובץ `.env` פיזי בפרודקשן.

## Auth ו-cookies — הכי חשוב לא לפספס

- ה-session הוא **httpOnly cookie חתום**, לא token ב-localStorage/header. כל בקשה שדורשת התחברות (הכל תחת `/orders`) חייבת להישלח עם `credentials: 'include'` (fetch) / `withCredentials: true` (axios) - אחרת ה-cookie לא יישלח והשרת יחזיר 401 דרך `requireAuth`.
- Google Sign-In מתבצע **כולו בצד ה-frontend** (Google Identity Services, לא redirect מהשרת) - ה-frontend מקבל `credential` (ID token) מ-Google ושולח אותו ל-`POST /auth/google`. השרת מאמת, יוצר/מוצא משתמש, ומחזיר cookie.
- ה-frontend צריך **את אותו** Google OAuth Client ID שיש ל-backend (`GOOGLE_CLIENT_ID`) כדי לאתחל את כפתור ה-Sign-In - זה מזהה ציבורי (לא סוד), חשוף לצד לקוח לגיטימית. שם מוצע: `VITE_GOOGLE_CLIENT_ID`.
- **בדיקת מצב התחברות בטעינת/רענון דף:** `GET /auth/me` — ראו למטה. ה-cookie הוא httpOnly בכוונה (הגנה מפני XSS) כך שאין דרך אחרת ל-frontend לדעת אם המשתמש מחובר.
- **גלישה כ-Guest מלאה בכל האתר, כולל הוספה לעגלה** - login נדרש רק במעבר מהעגלה ל-checkout (ראו `docs/PRD.md` סעיף 11.4).
- **CORS**: **עודכן 2026-09** - allowlist מפורש (לא `origin: true` פתוח יותר): `http://localhost:5173` ו-`https://dull.onrender.com`. אם ה-frontend-dev-server ירוץ אי-פעם על פורט אחר מ-5173, או אם יתווסף domain נוסף - זו פנייה חובה חזרה לשיחת ה-backend, לא שינוי frontend-side עצמאי.

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

**חשוב (נוסף 2026-09, `docs/PRD.md` 12.10) - content negotiation על אותו נתיב:** `GET /products/:slug` מגיש עכשיו **שני דברים שונים** לפי מי מבקש, לא רק JSON:
- קריאת ה-API הרגילה מה-SPA עצמו (בדיוק כמו שמתועד למעלה) - **לא צריך שום שינוי בקוד ה-frontend הקיים**. `fetch()` בלי `Accept` header מפורש (המצב הנוכחי ב-`client.ts`) ימשיך לקבל JSON כרגיל.
- ניווט דפדפן ישיר / בוט תצוגה-מקדימה (WhatsApp/Slack/iMessage/Facebook/Twitter/Telegram/Discord/LinkedIn) מקבל את `index.html` הבנוי, עם `<title>`/`og:title`/`og:image`/`og:url`/`twitter:*` מוזרקים per-product בצד השרת (bots כאלה כמעט אף פעם לא מריצים JS).
- ההבחנה מבוססת על `Accept` header (מי ששולח `text/html` מפורש מקבל HTML) + רשימת User-Agent ידועה כגיבוי. **אם אי-פעם תרצו לשנות את `client.ts` להוסיף `Accept: application/json` מפורש** - זה עדיין יעבוד נכון (JSON תמיד ינצח כשמבוקש מפורשות), אבל **לעולם אל תוסיפו `Accept: text/html`** לקריאות ה-API הפנימיות - זה ישבור את הזיהוי ויחזיר HTML במקום JSON.

### `POST /auth/google`
Body: `{ "credential": "<google id token>" }`. מגדיר session cookie. תגובה: `{ "user": { "id", "email", "name" } }`.

### `GET /auth/me`
**נוסף 2026-09-09** לצורך בדיקת מצב התחברות בטעינת/רענון דף (checkout צריך לדעת אם להציג login או לדלג עליו). **תמיד מחזיר 200**, גם כשלא מחובר - זו בדיקת מצב רגילה, לא "כישלון":
- מחובר: `200 { "user": { "id", "email", "name" } }` (אותו shape כמו `POST /auth/google`).
- לא מחובר / cookie לא בתוקף: `200 { "user": null }`.

בלי body, בלי דרישת `credentials: 'include'`-שהיא-קריטית-במיוחד (אבל כן לשלוח אותו, אחרת גם משתמש מחובר ייראה כ-`null`).

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
- הצלחה: `201 { order: { id, totalAgorot, items: [...], ... } }` — צורת `items[]` מפורטת למטה (זהה ב-`GET /orders`/`GET /orders/:id`).
- **אין תשלום אמיתי** (v1 - "רכישה חינמית", ראו PRD 11.2). אחרי יצירת ההזמנה נשלח מייל תודה + PDF מתנה ל-מייל המשתמש - אין ל-frontend שום תפקיד בזה, זה effect צד-שרת מלא.

### `GET /orders` — **דורש login**
היסטוריית ההזמנות של המשתמש המחובר בלבד. `{ orders: [...] }`.

### `GET /orders/:id` — **דורש login**
הזמנה בודדת, בעלים בלבד - `404 { error: "ORDER_NOT_FOUND" }` גם אם ההזמנה קיימת אבל שייכת למשתמש אחר (לא 403, בכוונה - לא לחשוף קיום).

### צורת `OrderItem` (בשלוש התגובות למעלה — `POST /orders`, `GET /orders`, `GET /orders/:id`)

**נוסף 2026-09-09**: לכל שורת הזמנה יש עכשיו, בנוסף ל-`productNameSnapshot` הקיים, גם `selectionLabelSnapshot` ו-`flatImageUrlSnapshot` — לצורך הצגת היסטוריית הזמנות (`GET /orders`) בלי לצטרך live-join מול הוריאנט/המוצר הנוכחיים (שיכולים להשתנות/להימחק). **שני השדות, כמו `productNameSnapshot`, הם snapshot שנלכד בזמן הרכישה** — לא מחושבים מחדש בקריאה:

```json
{
  "id": "...",
  "productVariantId": "...",
  "quantity": 1,
  "unitPriceAgorot": 8900,
  "productNameSnapshot": { "en": "Darkthrone Tee", "he": "..." },
  "selectionLabelSnapshot": { "en": "Women's, Light, S", "he": "..." },
  "flatImageUrlSnapshot": "/images/darkthrone-tee-women-light.webp"
}
```

- `selectionLabelSnapshot` — מחרוזת מוכנה-לתצוגה לכל locale, בונה מערכי-הציר שהרכיבו את הוריאנט (Fit/Colorway/Size...) בסדר ה-`sortOrder` של הצירים במוצר. אין צורך שה-frontend יבנה אותה בעצמו מ-`axisValueIds`.
- `flatImageUrlSnapshot` — נתיב **יחסי** (בדיוק כמו `flatImageUrl`/`media[].url` במקומות אחרים במסמך הזה) — יש לצרף ל-base URL באותה שיטה (`resolveMediaUrl()`), לא להניח כתובת מלאה.
- **הזמנות שבוצעו לפני 2026-09-09** (לפני ה-migration): שני השדות יהיו `null` — יש להתייחס לכך ב-frontend (למשל: להסתיר את התמונה/התיאור אם `null`, לא לזרוק שגיאה).

## שגיאות כלליות

כל שגיאה לא-צפויה (500): `{ "error": "INTERNAL_ERROR" }`. שגיאות ולידציה (Zod, 400) - יזרקו עם המבנה הרגיל של Zod, כדאי לטפל ב-frontend בצורה סלחנית (הצגת הודעה גנרית) ולא להסתמך על מבנה מדויק.

## מטבע ותצוגה

`priceAgorot` הוא **מספר שלם באגורות** (למרות השם ההיסטורי, זה כרגע ש"ח × 100, לא "תרומה" - ראו PRD 11.2). ליצור helper תצוגה ב-frontend (מקביל ל-`formatAgorot` ב-backend): `₪${(agorot/100).toFixed(2)}`.
