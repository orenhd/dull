// Toast גלובלי - קליל, zustand במקום context ידני (עקבי עם בחירת ה-state
// management ב-TECH_SPEC.md). ה-timeout id נשמר ב-store עצמו כדי ש-toast
// שני שמגיע לפני שהראשון נעלם יאתחל את הטיימר מחדש, לא יריץ שני timers
// שמתחרים על מי מסתיר את ה-toast קודם.
import { create } from "zustand";
import { TOAST_DURATION_MS } from "@/constants";

interface ToastState {
  message: string | null;
  show: (message: string) => void;
  hide: () => void;
}

let hideTimer: ReturnType<typeof setTimeout> | undefined;

export const useToastStore = create<ToastState>()((set) => ({
  message: null,
  show: (message) => {
    clearTimeout(hideTimer);
    set({ message });
    hideTimer = setTimeout(() => set({ message: null }), TOAST_DURATION_MS);
  },
  hide: () => {
    clearTimeout(hideTimer);
    set({ message: null });
  },
}));
