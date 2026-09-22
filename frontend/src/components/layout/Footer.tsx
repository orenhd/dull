// PRD.md סעיף 11 פריט 7: טקסט disclaimer קצר ב-footer בכל עמודי האתר
// ("This is an educational/demo project..."). הדמו (dull-demo) נבנה לפני
// העדכון הזה ל-PRD ולכן אין לו footer בכלל - זו תוספת מכוונת שלי, לא
// חלק מהפורטינג של הדמו.
//
// עדכון 2026-09-09 (docs/SCREENS_INVENTORY.md מסך 7, נבנה): נוסף קישור
// "לפרטים נוספים" ל-/disclaimer (DisclaimerPage.tsx) - הגרסה המורחבת של
// אותם שני משפטים. חשוב כנקודת-כניסה קבועה לעמוד המלא, גם למי שכבר סגר
// את ConsentBanner.tsx (תוקן 2026-09-22 - היה DisclaimerBanner.tsx, ראו
// הערה שם) - בלעדיו, אחרי סגירת הבאנר אין דרך לחזור לעמוד המלא חוץ
// מניווט ישיר ב-URL.
//
// עדכון 2026-09-09 (docs/SCREENS_INVENTORY.md מסך 16, נבנה): נוספה שורת
// קישורים ל-/privacy ו-/terms - תנאי סף ל-Publish של Google OAuth consent
// screen (ראו docs/PRD.md סעיף 12.13). שורה נפרדת, לא בתוך פסקת ה-disclaimer
// הקיימת - זה תוכן שונה לגמרי (מדיניות/תנאים, לא הומאז'/דיסקליימר זכויות).
//
// תוקן 2026-09-22 (בקשת אורן, סעיף ח'): "העדפות עוגיות" נוסף לאותה שורה -
// נקודת-כניסה קבועה לשינוי החלטת ה-consent גם אחרי סגירת ConsentBanner.tsx
// (reopen(), stores/consentStore.ts) - בלעדיה, אחרי החלטה ראשונה אין דרך
// לחזור ולשנות אותה חוץ מלנקות localStorage ידנית מה-devtools.
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { useConsentStore } from "@/stores/consentStore";

export function Footer() {
  const { t } = useTranslation();
  const reopenConsent = useConsentStore((s) => s.reopen);
  return (
    <footer className="shrink-0 border-t border-border-base px-md py-lg">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-xs text-caption text-text-muted">
        <p>{t("footer.rightsNote")}</p>
        <p>
          {t("footer.disclaimer")}{" "}
          <Link to="/disclaimer" className="underline hover:text-text-base">
            {t("footer.readMore")}
          </Link>
        </p>
        <p>
          <Link to="/privacy" className="underline hover:text-text-base">
            {t("footer.privacyLink")}
          </Link>
          {" | "}
          <Link to="/terms" className="underline hover:text-text-base">
            {t("footer.termsLink")}
          </Link>
          {" | "}
          <button type="button" onClick={reopenConsent} className="underline hover:text-text-base">
            {t("footer.cookiePreferences")}
          </button>
        </p>
      </div>
    </footer>
  );
}
