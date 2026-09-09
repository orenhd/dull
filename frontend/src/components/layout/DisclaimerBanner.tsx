// באנר חד-פעמי (docs/SCREENS_INVENTORY.md מסך 7) - מוצג בכניסה הראשונה
// לאתר, עם קישור לעמוד ה-Disclaimer המלא (DisclaimerPage.tsx, /disclaimer).
// "חד-פעמי" = לתמיד, לא לסשן - לכן localStorage (לא sessionStorage/Zustand
// persist): ראו CART_STORAGE_KEY לניגוד - שם ה-state עצמו (תוכן העגלה) הוא
// מה שצריך להישמר; כאן רק דגל בוליאני "כבר נראה", ואין state אחר לשתף,
// אז store ייעודי (zustand+persist) הוא overkill - useState+localStorage
// ישיר מספיק, עם try/catch כדי לא לקרוס במצבים כמו incognito/דפדפן שחוסם
// storage (Safari private mode יכול לזרוק על getItem/setItem).
//
// ממוקם ב-RootLayout.tsx כ-flex-item רגיל בין SiteHeader ל-<main>, לא fixed
// overlay - כך הוא פשוט "דוחף" את שאר ה-app-shell (h-[100dvh] overflow-hidden,
// ראו הערה ב-RootLayout.tsx) בלי להסתיר תוכן או להתנגש ב-z-index עם
// ToastHost/כותרת נדבקת.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { DISCLAIMER_BANNER_STORAGE_KEY } from "@/constants";

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISCLAIMER_BANNER_STORAGE_KEY) === "1";
  } catch {
    // storage חסום (private mode וכו') - מתייחסים כאילו לא נראה עדיין;
    // הבאנר פשוט יוצג שוב בביקור הבא, לא קריטי.
    return false;
  }
}

function writeDismissed(): void {
  try {
    localStorage.setItem(DISCLAIMER_BANNER_STORAGE_KEY, "1");
  } catch {
    // אין מה לעשות אם storage חסום - הבאנר יופיע שוב בביקור הבא, בסדר גמור.
  }
}

export function DisclaimerBanner() {
  const { t } = useTranslation();
  // אתחול עצל מ-localStorage (רק בקריאה הראשונה, לא בכל render) - כך
  // הבאנר לא "מהבהב" רגע אחד לפני שהוא נעלם אצל מי שכבר סגר אותו בעבר.
  const [dismissed, setDismissed] = useState(readDismissed);

  if (dismissed) return null;

  function dismiss() {
    writeDismissed();
    setDismissed(true);
  }

  return (
    <div
      role="region"
      aria-label={t("disclaimerBanner.text")}
      className="flex shrink-0 flex-wrap items-center justify-center gap-sm bg-surface-sunken px-md py-xs text-center text-caption text-text-muted"
    >
      <span>{t("disclaimerBanner.text")}</span>
      <Link to="/disclaimer" onClick={dismiss} className="text-text-base underline hover:text-brand-primary">
        {t("disclaimerBanner.readMore")}
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("disclaimerBanner.dismiss")}
        className="ms-xs px-xs py-xs text-caption text-text-muted underline hover:text-text-base"
      >
        {t("disclaimerBanner.dismiss")}
      </button>
    </div>
  );
}
