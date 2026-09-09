// רץ פעם אחת בטעינת האפליקציה (מופעל מ-RootLayout.tsx, לצד useLocaleSync) -
// בודק GET /auth/me (docs/API_CONTRACT.md, נוסף 2026-09-09) כדי לדעת אם יש
// session תקף משרת/רענון קודם, ומעדכן את authStore בהתאם. זו ההשלמה של
// הפער שתועד ב-docs/PRD.md סעיף 12.6.
//
// כישלון רשת/שרת (לא "לא מחובר" - GET /auth/me תמיד מחזיר 200, גם
// { user: null } הוא תשובה תקינה, ראו docs/API_CONTRACT.md) מטופל כ-guest
// ולא זורק/תוקע את האפליקציה - גלישה כ-guest תמיד מותרת (docs/PRD.md סעיף
// 11.4), אז זו ברירת המחדל הבטוחה כשלא ברור מה המצב האמיתי.
import { useEffect, useRef } from "react";
import { getCurrentUser } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/authStore";

export function useAuthBootstrap() {
  const setUser = useAuthStore((s) => s.setUser);
  const setReady = useAuthStore((s) => s.setReady);
  const ran = useRef(false);

  useEffect(() => {
    // React.StrictMode (main.tsx) מרנדר אפקטים פעמיים ב-dev - לא קריטי כאן
    // (קריאה כפולה הייתה נותנת אותה תשובה), אבל אין סיבה לבזבז קריאת רשת.
    if (ran.current) return;
    ran.current = true;

    getCurrentUser()
      .then(({ user }) => setUser(user))
      .catch(() => {
        // guest כברירת מחדל בטוחה - ראו הערה בראש הקובץ.
      })
      .finally(() => setReady());
  }, [setUser, setReady]);
}
