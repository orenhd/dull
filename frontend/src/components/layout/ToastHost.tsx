import { useToastStore } from "@/stores/toastStore";

// שני tones (תוקן 2026-09-22, ראו הערה מלאה ב-toastStore.ts): "default"
// הוא ה-pill הכהה/הפוך המקורי, "subtle" הוא כרטיס בהיר עם border - אותה
// שפה חזותית בדיוק כמו כרטיסי האתר הרגילים (ConsentBanner.tsx/
// MaterialsCard.tsx וכו', לא המצאה חדשה) - עדיין קבוע/בולט באותו מיקום,
// רק לא "צועק" באותה עוצמה.
export function ToastHost() {
  const message = useToastStore((state) => state.message);
  const tone = useToastStore((state) => state.tone);

  const toneClassName =
    tone === "subtle"
      ? "border border-border-base bg-surface-base text-text-base"
      : "bg-text-base text-surface-base";

  return (
    <div
      role="status"
      aria-live="polite"
      hidden={!message}
      className={`fixed inset-x-0 bottom-lg mx-auto w-fit max-w-[calc(100%-var(--space-xl))] rounded-sm px-lg py-sm text-center text-body ${toneClassName}`}
    >
      {message}
    </div>
  );
}
