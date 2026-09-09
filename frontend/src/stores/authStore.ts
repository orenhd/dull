// Auth state - client-only cache שמסונכרן מול השרת דרך GET /auth/me (נוסף
// ל-backend ב-2026-09-09, ראו docs/API_CONTRACT.md). *לא* persisted
// ל-localStorage - אין בכך צורך יותר: הבדיקה האמיתית תמיד מול השרת
// (הבדיקה בפועל רצה פעם אחת בטעינת האפליקציה - ראו hooks/useAuthBootstrap.ts
// ו-RootLayout.tsx), לא caching אופטימי בצד הלקוח.
//
// היסטוריה (docs/PRD.md סעיף 12.6): עד 2026-09-09 לא היה ל-backend endpoint
// כזה בכלל - ה-state כאן היה client-only-בלבד, בלי שום סנכרון מול ה-cookie
// האמיתי (עוגיית ה-session היא httpOnly, JS בצד הלקוח לא יכול לקרוא אותה
// ישירות). הפער נסגר - `status` למטה הוא מה שנשאר מהתקופה הזו: מבחין בין
// "עוד לא ידוע" ל"כבר נבדק".
//
// `status`:
//   "checking" - ה-GET /auth/me הראשוני עוד לא חזר. מסכים שתלויים ב-auth
//     (CheckoutPage) צריכים להראות מצב טעינה במקום לקפוץ ישר ל-"לא מחובר"
//     ולגרום להבהוב אצל משתמש שבפועל כן מחובר.
//   "ready" - הבדיקה הראשונית הסתיימה (מחובר או לא) - יכול עדיין לזוז אחרי
//     זה (login/logout מפורשים, או 401 שמתגלה בזמן POST /orders).
import { create } from "zustand";
import type { AuthUser } from "@/types/auth";

interface AuthState {
  user: AuthUser | null;
  status: "checking" | "ready";
  setUser: (user: AuthUser | null) => void;
  setReady: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  status: "checking",
  setUser: (user) => set({ user }),
  setReady: () => set({ status: "ready" }),
}));

export function selectIsAuthenticated(state: AuthState): boolean {
  return state.user !== null;
}
