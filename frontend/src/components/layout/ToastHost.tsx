import { useEffect, useState } from "react";
import { useToastStore } from "@/stores/toastStore";
import { useConsentStore } from "@/stores/consentStore";

// שני tones (תוקן 2026-09-22, ראו הערה מלאה ב-toastStore.ts): "default"
// הוא ה-pill הכהה/הפוך המקורי, "subtle" הוא כרטיס בהיר עם border - אותה
// שפה חזותית בדיוק כמו כרטיסי האתר הרגילים (ConsentBanner.tsx/
// MaterialsCard.tsx וכו', לא המצאה חדשה) - עדיין קבוע/בולט באותו מיקום,
// רק לא "צועק" באותה עוצמה.
//
// תוקן 2026-09-22 (באג שדיווח אורן: הפופ-אפ מוסתר מתחת ל-ConsentBanner.tsx,
// גם בדסקטופ וגם במובייל). ותוקן שוב, באותו סבב (ממצא יזום, לא דווח עדיין):
// בדיקה בדפדפן חי מול dull.onrender.com גילתה שגם כש-**אין** באנר, ה-toast
// (fixed, bottom קבוע) חופף בפועל לפוטר הקבוע - RootLayout.tsx בנוי
// כ-app-shell (h-[100dvh]) שבו Footer.tsx **תמיד** גלוי בתחתית המסך, לא
// משהו שגוללים אליו - אז "bottom קבוע" תמיד נוחת בתוך אזור הפוטר, לא
// מתחתיו. אותו מנגנון בדיוק כמו התיקון ל-StickyAddToBagBar.tsx (ראו שם
// הסבר מפורט + אימות): הגובה **בפועל** של הפוטר נמדד כאן ישירות
// (ResizeObserver על `#site-footer`, לא ב-store משותף - רק שני צרכנים,
// לא הצדיק תלות משותפת חדשה) - כש-consentBannerVisible, `bottom` מוסיף
// את גובה הבאנר (כמו קודם), אחרת מוסיף את גובה הפוטר (חדש) - כך ה-toast
// תמיד "נערם" מעל מה שבאמת תופס את תחתית המסך באותו רגע, ולא נופל
// בתוכו.
export function ToastHost() {
  const message = useToastStore((state) => state.message);
  const tone = useToastStore((state) => state.tone);
  const consentBannerVisible = useConsentStore((s) => s.visible);
  const consentBannerHeightPx = useConsentStore((s) => s.bannerHeightPx);
  const [footerHeightPx, setFooterHeightPx] = useState(0);

  useEffect(() => {
    const footer = document.getElementById("site-footer");
    if (!footer) return;
    const measure = () => setFooterHeightPx(footer.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const toneClassName =
    tone === "subtle"
      ? "border border-border-base bg-surface-base text-text-base"
      : "bg-text-base text-surface-base";

  const baseOffsetPx = consentBannerVisible ? consentBannerHeightPx : footerHeightPx;
  const bottomStyle = `calc(var(--space-lg) + ${baseOffsetPx}px)`;

  return (
    <div
      role="status"
      aria-live="polite"
      hidden={!message}
      className={`fixed inset-x-0 mx-auto w-fit max-w-[calc(100%-var(--space-xl))] rounded-sm px-lg py-sm text-center text-body ${toneClassName}`}
      style={{ bottom: bottomStyle }}
    >
      {message}
    </div>
  );
}
