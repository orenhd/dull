import { useToastStore } from "@/stores/toastStore";
import { useConsentStore } from "@/stores/consentStore";

// שני tones (תוקן 2026-09-22, ראו הערה מלאה ב-toastStore.ts): "default"
// הוא ה-pill הכהה/הפוך המקורי, "subtle" הוא כרטיס בהיר עם border - אותה
// שפה חזותית בדיוק כמו כרטיסי האתר הרגילים (ConsentBanner.tsx/
// MaterialsCard.tsx וכו', לא המצאה חדשה) - עדיין קבוע/בולט באותו מיקום,
// רק לא "צועק" באותה עוצמה.
//
// תוקן 2026-09-22 (באג שדיווח אורן: הפופ-אפ מוסתר מתחת ל-ConsentBanner.tsx,
// גם בדסקטופ וגם במובייל - למשל ההודעה שמאשרת Add to Bag, אצל מבקר/ת
// ראשון/ה שהוסיף/ה לסל לפני שהחליט/ה Accept/Decline). בשונה מ-
// StickyAddToBagBar.tsx (position:sticky בתוך <main>, ראו ההערה המפורטת
// שם על הניסיון הכושל להזיז אותו עם bottom דינמי) - הרכיב הזה תמיד היה
// `position: fixed` ביחס לחלון, בדיוק כמו הבאנר עצמו. אצל fixed, bottom
// הוא קואורדינטת-חלון פשוטה וליניארית (לא sticky-threshold, לא מוגבל
// ל-containing block) - אין את אותה בעיה. כש-consentBannerVisible,
// מוסיפים בפועל את הגובה שלו (bannerHeightPx, נמדד ב-ConsentBanner.tsx
// עצמו - ResizeObserver, ראו שם) ל-bottom הקבוע - ה-Toast "עולה" בדיוק
// מעל הבאנר, בלי לחפוף אליו. אין השפעה על מקרה הרגיל (בלי באנר) - אז
// bottom נשאר var(--space-lg) בדיוק כמו קודם.
export function ToastHost() {
  const message = useToastStore((state) => state.message);
  const tone = useToastStore((state) => state.tone);
  const consentBannerVisible = useConsentStore((s) => s.visible);
  const consentBannerHeightPx = useConsentStore((s) => s.bannerHeightPx);

  const toneClassName =
    tone === "subtle"
      ? "border border-border-base bg-surface-base text-text-base"
      : "bg-text-base text-surface-base";

  const bottomStyle = consentBannerVisible
    ? `calc(var(--space-lg) + ${consentBannerHeightPx}px)`
    : "var(--space-lg)";

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
