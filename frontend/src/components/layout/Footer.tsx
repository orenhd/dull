// PRD.md סעיף 11 פריט 7: טקסט disclaimer קצר ב-footer בכל עמודי האתר
// ("This is an educational/demo project..."). הדמו (dull-demo) נבנה לפני
// העדכון הזה ל-PRD ולכן אין לו footer בכלל - זו תוספת מכוונת שלי, לא
// חלק מהפורטינג של הדמו. ה-banner החד-פעמי + עמוד ה-disclaimer המלא
// (docs/SCREENS_INVENTORY.md מסך 7) עדיין לא נבנו - זה נשאר בתור.
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="shrink-0 border-t border-border-base px-md py-lg">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-xs text-caption text-text-muted">
        <p>{t("footer.rightsNote")}</p>
        <p>{t("footer.disclaimer")}</p>
      </div>
    </footer>
  );
}
