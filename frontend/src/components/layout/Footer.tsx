// PRD.md סעיף 11 פריט 7: במקור טקסט disclaimer קצר ב-footer בכל עמודי
// האתר. הדמו (dull-demo) נבנה לפני העדכון הזה ל-PRD ולכן אין לו footer
// בכלל - זו תוספת מכוונת שלי, לא חלק מהפורטינג של הדמו.
//
// עדכון 2026-09-09 (docs/SCREENS_INVENTORY.md מסך 16, נבנה): נוספה שורת
// קישורים ל-/privacy ו-/terms - תנאי סף ל-Publish של Google OAuth consent
// screen (ראו docs/PRD.md סעיף 12.13) - **חייבים** להישאר נגישים בעקביות
// מכל עמוד באתר, ולכן דווקא הם (ולא רק "Cookie preferences") נשארים כאן
// למטה, גם אחרי הכיווץ הבא.
//
// תוקן 2026-09-22 (בקשת אורן, סעיף ח'): "העדפות עוגיות" נוסף לאותה שורה -
// נקודת-כניסה קבועה לשינוי החלטת ה-consent גם אחרי סגירת ConsentBanner.tsx
// (reopen(), stores/consentStore.ts) - בלעדיה, אחרי החלטה ראשונה אין דרך
// לחזור ולשנות אותה חוץ מלנקות localStorage ידנית מה-devtools.
//
// תוקן 2026-09-22 (דיווח Oren [2a] - "הפוטר הקבוע... במובייל הוא מסתיר
// המון מהתוכן"): הפוטר כווץ לשורת-קישורים אחת בלבד - פסקאות ה-rightsNote
// (זכויות הלוגואים) וה-disclaimer+Learn-more (אין רכישה אמיתית) הוסרו
// מכאן והועברו ל-AboutPage.tsx (ראו הערה שם, מפתחות i18n חדשים תחת
// "legal", לא "footer" יותר) - התוכן שלהן כבר מכוסה ב-ConsentBanner.tsx
// בביקור הראשון בכל מקרה (ראו הערה שם), כך שההצדקה היחידה שנשארה להשאיר
// אותן *גם* קבוע בכל עמוד נחלשה, ואילו הנטל על גלילה במובייל (הדיווח כאן)
// היה אמיתי. Privacy/Terms נשארים כאן (ראו הערה למעלה - תנאי-סף חיצוני,
// לא רק החלטת UX), וכך גם "Cookie preferences" (בקשה נפרדת, לא כפולה).
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { useConsentStore } from "@/stores/consentStore";

export function Footer() {
  const { t } = useTranslation();
  const reopenConsent = useConsentStore((s) => s.reopen);
  return (
    <footer className="shrink-0 border-t border-border-base px-md py-sm">
      <div className="mx-auto max-w-[1200px] text-caption text-text-muted">
        <p className="m-0">
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
