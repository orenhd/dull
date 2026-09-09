import type { ReactNode } from "react";
import { useLocaleSync } from "@/hooks/useLocaleSync";
import { useAuthBootstrap } from "@/hooks/useAuthBootstrap";
import { SkipLink } from "./SkipLink";
import { SiteHeader } from "./SiteHeader";
import { DisclaimerBanner } from "./DisclaimerBanner";
import { Footer } from "./Footer";
import { ToastHost } from "./ToastHost";

export function RootLayout({ children }: { children: ReactNode }) {
  useLocaleSync();
  // בדיקת session חד-פעמית (GET /auth/me) - ראו hooks/useAuthBootstrap.ts.
  // מופעלת כאן, ברמת ה-root, ולא בתוך CheckoutPage עצמו - כדי שהבדיקה
  // תתחיל מיד עם טעינת האפליקציה (לא רק כשמגיעים בפועל ל-/checkout), וכך
  // בזמן שהמשתמש מנווט בקטלוג התשובה כבר תהיה מוכנה כשיגיע לעגלה.
  useAuthBootstrap();

  return (
    // App-shell (בקשת Oren, 2026-09-08): header ו-footer צמודים תמיד לקצוות
    // החלון, גם דסקטופ וגם מובייל - רק ה-<main> גולל פנימית. h-[100dvh]
    // ולא min-h-screen כמו קודם: min-h-screen מאפשר לכל העמוד לגלול יחד
    // כשהתוכן ארוך מה-viewport, ואז ה-footer כבר לא "דבוק" באמת אלא רק
    // צף בסוף תוכן קצר. dvh ולא vh כדי להתחשב בסרגלי כתובת דינמיים
    // בדפדפני מובייל. overflow-hidden כאן + על html/body (src/styles/index.css)
    // מונע scrollbar כפול ברמת ה-body.
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <SkipLink />
      <SiteHeader />
      {/* DisclaimerBanner.tsx - flex-item רגיל (shrink-0), לא fixed overlay -
          כשמוצג הוא פשוט מכווץ את <main> כמו כל שאר ה-app-shell, ונעלם
          כליל (מחזיר null) לאחר סגירה/ביקור ראשון - ראו הערה מלאה שם. */}
      <DisclaimerBanner />
      {/* min-h-0 הכרחי: flex-item עם overflow-y-auto לא באמת יגלול בלי זה
          (ברירת המחדל min-height:auto מונעת מה-item להתכווץ מתחת לגובה
          התוכן שלו, וכל ה-<div> היה גדל ודוחף את ה-footer מחוץ למסך). */}
      <main id="main" className="min-h-0 flex-1 overflow-y-auto">
        {children}
      </main>
      <Footer />
      <ToastHost />
    </div>
  );
}
