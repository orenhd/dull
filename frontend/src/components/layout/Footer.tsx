// PRD.md סעיף 11 פריט 7: טקסט disclaimer קצר ב-footer בכל עמודי האתר
// ("This is an educational/demo project..."). הדמו (dull-demo) נבנה לפני
// העדכון הזה ל-PRD ולכן אין לו footer בכלל - זו תוספת מכוונת שלי, לא
// חלק מהפורטינג של הדמו.
//
// עדכון 2026-09-09 (docs/SCREENS_INVENTORY.md מסך 7, נבנה): נוסף קישור
// "לפרטים נוספים" ל-/disclaimer (DisclaimerPage.tsx) - הגרסה המורחבת של
// אותם שני משפטים. חשוב כנקודת-כניסה קבועה לעמוד המלא גם למשתמש שכבר סגר
// את DisclaimerBanner.tsx (הבאנר החד-פעמי) - בלעדיו, אחרי הסגירה הראשונה
// אין דרך לחזור לעמוד המלא חוץ מניווט ישיר ב-URL.
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";

export function Footer() {
  const { t } = useTranslation();
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
      </div>
    </footer>
  );
}
