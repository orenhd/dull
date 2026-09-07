# dev-tools

כלים זמניים לבדיקה ידנית בזמן פיתוח - לא חלק מהאפליקציה, לא נטענים בשום
route, ולא קשורים ל-frontend האמיתי (שעוד לא קיים). מטרתם רק לוודא שה-
backend עובד end-to-end לפני שיש UI אמיתי לבדוק דרכו.

- `google-signin-test.html` - עמוד סטטי עם כפתור "Sign in with Google" אמיתי,
  לבדיקת `POST /auth/google` + `GET /orders` + `POST /auth/logout`. **חייב**
  לרוץ משרת סטטי מקומי (לא לפתוח כ-file://) על origin שנרשם ב-Google Cloud
  Console תחת Authorized JavaScript origins (למשל http://localhost:5173),
  אחרת Google תסרב לאתחל.

  איך מריצים:
  ```
  npx --yes http-server dev-tools -p 5173
  ```
  ואז פותחים http://localhost:5173/google-signin-test.html בדפדפן, בעוד
  `npm run dev` רץ במקביל בטרמינל אחר (השרת האמיתי על פורט 4000).
