// Zustand store לבאנר הסכמה (Cookie/Privacy Consent, בקשת אורן 2026-09-22) -
// אותה מוסכמה בדיוק כמו toastStore.ts (store קליל, לא context/provider,
// לא persist middleware - הקריאה/כתיבה ל-localStorage ידנית, try/catch,
// אותה סיבה בדיוק כמו DisclaimerBanner.tsx המקורי: דגל בודד, לא state
// ששני קומפוננטות צריכות לשתף בזמן אמת חוץ מ-visible/decision כאן).
//
// למה store נפרד ולא state מקומי ב-ConsentBanner.tsx: Footer.tsx (קישור
// "העדפות עוגיות") צריך להיות מסוגל *לפתוח מחדש* את הבאנר גם אחרי
// שהוחלט כבר - reopen() למטה. בלי store משותף זה היה דורש prop drilling
// דרך RootLayout.tsx או Context ייעודי - overkill מול store קטן אחד.
//
// accept()/decline() קוראות גם ל-grantAnalyticsConsent/revokeAnalyticsConsent
// (lib/analytics.ts - עוטפות את opt_in_tracking()/opt_out_tracking() הרשמיים
// של mixpanel-browser) - כך שההחלטה משפיעה בפועל על אנליטיקה באותו רגע
// בדיוק שהיא נשמרת, לא רק "נרשמת" ל-localStorage בלי אכיפה אמיתית.
import { create } from "zustand";
import { CONSENT_STORAGE_KEY } from "@/constants";
import { grantAnalyticsConsent, revokeAnalyticsConsent } from "@/lib/analytics";

export type ConsentDecision = "accepted" | "declined";

function readDecision(): ConsentDecision | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    return raw === "accepted" || raw === "declined" ? raw : null;
  } catch {
    // storage חסום (private mode וכו') - כמו DisclaimerBanner.tsx המקורי:
    // מתייחסים כאילו טרם הוחלט, הבאנר יוצג שוב בביקור הבא. לא קריטי.
    return null;
  }
}

function writeDecision(decision: ConsentDecision): void {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, decision);
  } catch {
    // אין מה לעשות אם storage חסום - ההחלטה עדיין תיאכף בסשן הנוכחי
    // (grant/revokeAnalyticsConsent למטה קוראות בכל מקרה), רק לא תיזכר
    // לביקור הבא.
  }
}

interface ConsentState {
  decision: ConsentDecision | null;
  visible: boolean;
  // תוקן 2026-09-22 (באג שדיווחה המרקטינג - הפס הדביק/StickyAddToBagBar.tsx
  // מוסתר לגמרי מתחת לבאנר הזה אצל מבקר/ת ראשון/ה, שני האלמנטים fixed/
  // sticky בתחתית המסך). הגובה **בפועל** של הבאנר (נמדד ב-ConsentBanner.tsx
  // עצמו, ResizeObserver - ראו הערה שם) נשמר כאן כדי ש-StickyAddToBagBar.tsx
  // יוכל "לפנות" בדיוק את השטח הזה במקום להסתמך על מספר קבוע-מראש (שהיה
  // שביר: אורך טקסט שונה בעברית/אנגלית, גלישת שורה, env(safe-area-inset-bottom)
  // בדיוק כמו שהבאנר עצמו כבר מוסיף לעצמו). 0 כברירת מחדל - לא רלוונטי
  // כשהבאנר לא מוצג (visible===false), הצרכן תמיד בודק visible קודם.
  bannerHeightPx: number;
  accept: () => void;
  decline: () => void;
  reopen: () => void;
  setBannerHeight: (px: number) => void;
}

export const useConsentStore = create<ConsentState>()((set) => {
  // אתחול עצל בזמן יצירת ה-store (לא ב-render של קומפוננטה) - כך הבאנר
  // לא "מהבהב" רגע לפני שהוא נעלם אצל מי שכבר החליט בעבר, אותו טיעון
  // בדיוק כמו readDismissed ב-DisclaimerBanner.tsx הישן.
  const initialDecision = readDecision();
  return {
    decision: initialDecision,
    visible: initialDecision === null,
    bannerHeightPx: 0,
    accept: () => {
      writeDecision("accepted");
      grantAnalyticsConsent();
      set({ decision: "accepted", visible: false });
    },
    decline: () => {
      writeDecision("declined");
      revokeAnalyticsConsent();
      set({ decision: "declined", visible: false });
    },
    // נקראת מ-Footer.tsx ("העדפות עוגיות") - לא מאפסת/מוחקת decision
    // קיים (המשתמש רואה שוב את שתי הכפתורים ובוחר מחדש; אם יבחר את אותה
    // בחירה כמו קודם - accept()/decline() פשוט יכתבו את אותו ערך שוב,
    // לא בעיה).
    reopen: () => set({ visible: true }),
    setBannerHeight: (px) => set({ bannerHeightPx: px }),
  };
});
