// תוקן 2026-09-22 (PRD סעיף 51, ואז סעיף 52): חולץ מתוך StickyAddToBagBar.tsx/
// ToastHost.tsx ל-hook משותף - אחרי שאורן ציין ששני אלמנטים נוספים
// (הסיכום הדביק ב-CartPage.tsx/CheckoutPage.tsx) סובלים מאותה בעיה בדיוק
// (חפיפה עם ConsentBanner.tsx/Footer.tsx), הלוגיקה נדרשה ברביעי מקום -
// כפילות מלאה של ~15 שורות זהות הייתה סיכון אמיתי (עדכון אחד בלי השני).
//
// המנגנון (ראו הסבר מלא/מאומת ב-StickyAddToBagBar.tsx): כל אלמנט "צף
// בתחתית המסך" באתר צריך להימנע משני דברים בו-זמנית - ConsentBanner.tsx
// (fixed, כשמוצג) ו-Footer.tsx (תמיד גלוי - app-shell, RootLayout.tsx).
// מחזיר את הגובה שצריך "לפנות" מלמטה - גובה הבאנר בפועל כשהוא מוצג,
// אחרת גובה הפוטר בפועל - לשימוש כ-`bottom` על אלמנט `position:fixed`.
// (fixed, לא sticky - ראו StickyAddToBagBar.tsx להסבר המלא למה sticky
// עם offset דינמי לא אמין: נשבר ספציפית כשהקונטיינר-הגולל נגלל עד הסוף).
import { useEffect, useState } from "react";
import { useConsentStore } from "@/stores/consentStore";

export function useStickyBottomOffset(): number {
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

  return consentBannerVisible ? consentBannerHeightPx : footerHeightPx;
}
