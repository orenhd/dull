// תוקן 2026-09-22 (בקשת אורן, סעיף ח' בדיווח): מחליף לגמרי את
// DisclaimerBanner.tsx (הבאנר החד-פעמי העליון) - שני נימוקים לאיחוד:
// (1) אורן ציין כפילות בין הבאנר העליון לתוכן ה-Footer הקבוע; (2) חסר
// היה מנגנון consent מפורש לאנליטיקה (Mixpanel) - לא רק באנר-מידע פסיבי.
// באנר אחד תחתון (בקשת אורן: "להקפיץ בביקור ראשון מלמטה") מכסה גם את
// הודעת ה"הומאז'/הדגמה" המקורית וגם consent אמיתי - accept()/decline()
// (useConsentStore, stores/consentStore.ts) קוראות בפועל ל-
// opt_in_tracking()/opt_out_tracking() של Mixpanel (lib/analytics.ts),
// לא רק כותבות דגל UI. שלוש ההפניות הקבועות כבר קיימות תמיד ב-Footer.tsx
// (Learn more/Privacy Policy/Terms of Service) - לא נדרש להוסיף אותן
// במקום נוסף (נבדק מול אורן, ראו PRD).
//
// position:fixed (לא flex-item כמו DisclaimerBanner.tsx הישן) - חייב
// להופיע מעל **כל** עמוד באתר עם אותה עקביות, לא רק כשה-<main> גולל
// מספיק כדי לחשוף flex-item בתחתית תוכן. z-20 מעל תוכן רגיל; ToastHost.tsx
// (fixed bottom-lg, בלי z-index מפורש) לא אמור להתנגש בפועל - toast
// מופיע כתוצאה מפעולת משתמש (הוספה לעגלה וכו'), לא בביקור ראשון ריק.
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { useConsentStore } from "@/stores/consentStore";

export function ConsentBanner() {
  const { t } = useTranslation();
  const visible = useConsentStore((s) => s.visible);
  const accept = useConsentStore((s) => s.accept);
  const decline = useConsentStore((s) => s.decline);

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label={t("consent.title")}
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border-base bg-surface-base px-md py-md desktop:px-xl"
      style={{ paddingBottom: "calc(var(--space-md) + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-sm desktop:flex-row desktop:items-center desktop:justify-between desktop:gap-lg">
        <p className="m-0 text-caption text-text-muted">
          {t("consent.body")}{" "}
          <Link to="/disclaimer" className="text-text-base underline hover:text-brand-primary">
            {t("consent.learnMore")}
          </Link>
          {" · "}
          <Link to="/privacy" className="text-text-base underline hover:text-brand-primary">
            {t("footer.privacyLink")}
          </Link>
          {" | "}
          <Link to="/terms" className="text-text-base underline hover:text-brand-primary">
            {t("footer.termsLink")}
          </Link>
        </p>

        {/* שני כפתורי טקסט פשוטים (לא Button.tsx המשותף) - בכוונה: זהו
            אזור צר יחסית (גם בדסקטופ, לצד פסקת טקסט ארוכה), ו-Button.tsx
            נבנה סביב CTA ראשי מלא-רוחב (BASE כולל w-full/py-md/px-xl) -
            לכפות עליו כאן היה דורש override מסורבל יותר מכפתור פשוט. */}
        <div className="flex flex-none items-center gap-sm">
          <button
            type="button"
            onClick={decline}
            className="px-sm py-xs text-caption text-text-muted underline hover:text-text-base"
          >
            {t("consent.decline")}
          </button>
          <button
            type="button"
            onClick={accept}
            className="rounded-sm bg-text-base px-lg py-sm text-caption font-bold text-surface-base hover:opacity-90"
          >
            {t("consent.accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
