// Toast גלובלי - קליל, zustand במקום context ידני (עקבי עם בחירת ה-state
// management ב-TECH_SPEC.md). ה-timeout id נשמר ב-store עצמו כדי ש-toast
// שני שמגיע לפני שהראשון נעלם יאתחל את הטיימר מחדש, לא יריץ שני timers
// שמתחרים על מי מסתיר את ה-toast קודם.
//
// `tone` (תוקן 2026-09-22, דיווח Oren): "default" הוא ה-toast הכהה/בולט
// המקורי (Added to Bag, שגיאת Sign-in) - עבור אלה זה מתאים, הן הודעות
// "משהו קרה/נכשל" שדורשות תשומת לב חזקה. "subtle" נוסף לצורך ספציפי אחד
// (אישור Decline ב-ConsentBanner.tsx) - הודעה **חיובית/ניטרלית** ("הבנתי,
// זה כבוי"), לא דורשת את אותה עוצמה חזותית, ובמובייל הכהה/הפוך הורגש
// "ברוטאלי" (הלשון של Oren). לא שונה עיצוב ה-default הקיים - שני
// הצרכנים האחרים (AddToBagForm.tsx, GoogleSignInButton.tsx) לא התלוננו
// ונשארים בדיוק כמו שהיו.
import { create } from "zustand";
import { TOAST_DURATION_MS } from "@/constants";

export type ToastTone = "default" | "subtle";

interface ToastState {
  message: string | null;
  tone: ToastTone;
  show: (message: string, tone?: ToastTone) => void;
  hide: () => void;
}

let hideTimer: ReturnType<typeof setTimeout> | undefined;

export const useToastStore = create<ToastState>()((set) => ({
  message: null,
  tone: "default",
  show: (message, tone = "default") => {
    clearTimeout(hideTimer);
    set({ message, tone });
    hideTimer = setTimeout(() => set({ message: null }), TOAST_DURATION_MS);
  },
  hide: () => {
    clearTimeout(hideTimer);
    set({ message: null });
  },
}));
