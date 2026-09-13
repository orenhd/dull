// מרכז identify/reset של Mixpanel במקום אחד (docs/PRD.md סעיף 20), במקום
// לפזר קריאות בכל מקום שמשנה את authStore.user: GoogleSignInButton.tsx
// (login), CheckoutPage.tsx+UserMenu.tsx (שני handleLogout נפרדים בכוונה,
// ראו הערה ב-UserMenu.tsx), וגם OrdersPage/OrderDetailPage/CheckoutPage
// (setUser(null) על 401 שמתגלה). ריכוז כאן אומר שאף אחד מהמקומות האלה לא
// צריך לדעת בכלל שאנליטיקה קיימת - authStore הוא מקור-האמת היחיד למי
// מחובר, וה-hook הזה רק *מגיב* לשינוי בו.
//
// מופעל פעם אחת מ-RootLayout.tsx, לצד useLocaleSync/useAuthBootstrap.
//
// identify(user) נקרא גם בטעינת אפליקציה עם session קיים (לא רק login
// אינטראקטיבי טרי) - זה בדיוק ההתנהגות הנכונה לפי Mixpanel עצמו
// ("Identifying Users (Simplified)": קוראים ל-identify() גם "when an app
// reopens in a logged-in state"). אירוע ה-track הנפרד "Sign In Completed"
// (GoogleSignInButton.tsx) *לא* קורה כאן - identify הוא סנכרון-זהות שקט,
// לא אירוע מדיד; אחרת כל רענון דף של משתמש מחובר היה נספר בטעות כ"התחברות".
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { identifyUser, resetIdentity, trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics";

export function useAnalyticsIdentity(): void {
  // המשתמש המלא (לא רק id) - identifyUser (lib/analytics.ts) צריך גם
  // name/email כדי לאכלס את פרופיל ה-People ב-Mixpanel, לא רק את ה-identify
  // עצמו (docs/PRD.md סעיף 23).
  const user = useAuthStore((s) => s.user);
  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    if (user) {
      identifyUser(user);
    } else if (prevUserId.current) {
      // "Signed Out" (docs/PRD.md סעיף 23, בקשת Oren) - נורה *לפני* קריאת
      // resetIdentity() למטה, לא אחריה: reset() יוצר מיד distinct_id
      // אנונימי חדש, אז trackEvent אחרי ה-reset היה מיוחס בטעות לזהות
      // האנונימית החדשה במקום למשתמש שבאמת התנתק/פג לו ה-session.
      // מכסה גם logout מפורש (כפתור) וגם 401 שהתגלה - אין דרך להבחין
      // ביניהם מכאן (ה-hook צופה רק בשינוי ב-authStore.user, לא בסיבה לו) -
      // זה בכוונה, כדי לא לגעת בקוד ה-login/logout/401 הקיים (ראו למעלה).
      trackEvent(ANALYTICS_EVENTS.signedOut);
      resetIdentity();
    }
    prevUserId.current = user?.id ?? null;
  }, [user]);
}
