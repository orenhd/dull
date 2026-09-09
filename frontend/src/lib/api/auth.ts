import { api } from "./client";
import type { AuthUser } from "@/types/auth";

export function loginWithGoogle(credential: string) {
  return api.post<{ user: AuthUser }>("/auth/google", { credential });
}

// נוסף 2026-09-09 (docs/API_CONTRACT.md) - בדיקת מצב התחברות בטעינת/רענון
// דף. תמיד מחזיר 200 - { user: null } כשלא מחובר הוא מצב תקין, לא שגיאה -
// לכן אין כאן טיפול ב-401/ApiError מיוחד כמו ב-createOrder. הקורא
// (hooks/useAuthBootstrap.ts) הוא זה שמפעיל את זה בפועל, פעם אחת בטעינת
// האפליקציה.
export function getCurrentUser() {
  return api.get<{ user: AuthUser | null }>("/auth/me");
}

// בלי body בכוונה - תואם מדויק ל-docs/API_CONTRACT.md ("POST /auth/logout,
// בלי body").
export function logout() {
  return api.post<{ ok: true }>("/auth/logout");
}
