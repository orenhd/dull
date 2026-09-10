// כפתור "שלום, {שם פרטי}" בheader כשיש authStore.user מחובר - לחיצה פותחת
// תפריט קטן עם "ההזמנות שלי" ו"התנתקות" (docs/PRD.md סעיף 12.15). מחליף את
// OrdersLink העצמאי שהיה קודם בקבוצת-הסוף של ה-header ובתוך תפריט המובייל
// (הוסר, ראו SiteHeader.tsx) - לא מוסיף עוד פריט להeader הצפוף, אלא מאחד
// שניים (קישור הזמנות + יכולת התנתקות חדשה) מתחת לתצוגה אחת. מוצג רק כשיש
// משתמש מחובר - כמו OrdersLink הקודם, מחזיר null אחרת.
//
// דפוס הנגישות (aria-expanded/aria-controls, בלי role="menu"/menuitem) עוקב
// אחרי הדיסקלוז הקיים כבר בקומפוננטה האם (SiteHeader.tsx, כפתור ה-hamburger) -
// לא הוצג role="menu" חדש כי אין כאן ניווט חצים במקלדת בין הפריטים, וזה היה
// מטעה קוראי מסך יותר משהיה עוזר.
//
// כפילות מכוונת (לא הופשטה ל-hook משותף): handleLogout כאן זהה כמעט לגמרי
// ל-handleLogout ב-CheckoutPage.tsx (best-effort POST /auth/logout, ואז
// setUser(null) תמיד ב-finally). לא רוענן ל-hook משותף (docs/PRD.md סעיף
// 12.15) כדי לא לגעת בכלל בקוד ה-checkout שכבר אומת מקצה-לקצה (login →
// הזמנה אמיתית) - סיכון נמוך יותר מלשכפל שש שורות מאשר לרפקטר מסך שעובד.
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";
import { logout } from "@/lib/api/auth";

export function UserMenu() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // סגירה בלחיצה מחוץ לתפריט או ב-Escape - אותה גישה בדיוק כמו הדיסקלוז של
  // ה-hamburger (SiteHeader.tsx), פלוס פנימית לתפריט הזה בלבד (pointerdown
  // מחוץ ל-containerRef).
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!user) return null;

  // שם פרטי בלבד ("שלום, אורן" ולא "שלום, אורן חדר") - ה-header כבר צפוף
  // (בקשת Oren, 2026-09-10), אין שדה firstName נפרד ב-AuthUser (types/auth.ts,
  // תואם ל-API - { id, email, name } בלבד) אז מפוצל בצד הלקוח.
  const firstName = user.name.trim().split(/\s+/)[0] || user.name;

  async function handleLogout() {
    setOpen(false);
    try {
      await logout();
    } catch {
      // best-effort - כמו ב-CheckoutPage.tsx: מנקים את המצב המקומי בכל
      // מקרה, כדי שהמשתמש תמיד יוכל לנסות שוב עם חשבון אחר.
    } finally {
      setUser(null);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="user-menu-panel"
        onClick={() => setOpen((value) => !value)}
        className="inline-block px-xs py-xs text-caption text-text-muted hover:text-text-base"
      >
        {t("header.greeting", { name: firstName })}
      </button>

      {open && (
        <div
          id="user-menu-panel"
          className="absolute end-0 top-full z-10 mt-xs flex min-w-[160px] flex-col border border-border-base bg-surface-base py-xs"
        >
          <Link
            to="/orders"
            onClick={() => setOpen(false)}
            className="px-sm py-xs text-caption text-text-muted hover:bg-surface-sunken hover:text-text-base"
          >
            {t("orders.navLabel")}
          </Link>
          {/* checkout.signOut משותף (לא כפול) - "Sign out"/"התנתקות" כבר קיים
              ומשמש בדיוק לאותה פעולה ב-CheckoutPage.tsx. */}
          <button
            type="button"
            onClick={handleLogout}
            className="px-sm py-xs text-start text-caption text-text-muted hover:bg-surface-sunken hover:text-text-base"
          >
            {t("checkout.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
