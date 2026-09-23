import { useToastStore } from "@/stores/toastStore";
import { useStickyBottomOffset } from "@/hooks/useStickyBottomOffset";

// שני tones (תוקן 2026-09-22, ראו הערה מלאה ב-toastStore.ts): "default"
// הוא ה-pill הכהה/הפוך המקורי, "subtle" הוא כרטיס בהיר עם border - אותה
// שפה חזותית בדיוק כמו כרטיסי האתר הרגילים (ConsentBanner.tsx/
// MaterialsCard.tsx וכו', לא המצאה חדשה) - עדיין קבוע/בולט באותו מיקום,
// רק לא "צועק" באותה עוצמה.
//
// תוקן 2026-09-22 (באג שדיווח אורן: הפופ-אפ מוסתר מתחת ל-ConsentBanner.tsx).
// ותוקן שוב, אותו סבב (ממצא יזום): גם כש-**אין** באנר, ה-toast חפף בפועל
// לפוטר הקבוע (RootLayout.tsx בנוי כ-app-shell - הפוטר תמיד גלוי, לא
// משהו שגוללים אליו). תוקן ושוב (סעיף 52): הלוגיקה חולצה ל-hook משותף
// `useStickyBottomOffset` (hooks/) - אותה בעיה בדיוק נמצאה גם ב-
// StickyAddToBagBar.tsx וגם בסיכום הדביק של CartPage.tsx/CheckoutPage.tsx -
// ראו שם להסבר המלא/מאומת של המנגנון.
export function ToastHost() {
  const message = useToastStore((state) => state.message);
  const tone = useToastStore((state) => state.tone);
  const bottomOffsetPx = useStickyBottomOffset();

  const toneClassName =
    tone === "subtle"
      ? "border border-border-base bg-surface-base text-text-base"
      : "bg-text-base text-surface-base";

  return (
    <div
      role="status"
      aria-live="polite"
      hidden={!message}
      className={`fixed inset-x-0 mx-auto w-fit max-w-[calc(100%-var(--space-xl))] rounded-sm px-lg py-sm text-center text-body ${toneClassName}`}
      style={{ bottom: `calc(var(--space-lg) + ${bottomOffsetPx}px)` }}
    >
      {message}
    </div>
  );
}
