// עמוד "אודות" (docs/SCREENS_INVENTORY.md מסך 6, שם נקרא "הקונספט" - ראו
// הערה ב-router.tsx/PROMPT היסטוריה על הבדל השם).
//
// התוכן (docs/PRD.md סעיף 33, 2026-09-15) הגיע מוכן משיחת "Dull Presentation"
// נפרדת - docs/ABOUT_PAGE_CONTENT.md הוא ה-source of truth (נשאר בפרויקט
// כתיעוד ההחלטות שאורן קיבל שם, גם אחרי שהתוכן חווט לכאן). **שני טקסטים
// עצמאיים** (לא תרגום מילולי זה מזה, בדיוק כמו כל תוכן אחר באתר) - חווטו
// כלשונם ל-i18n, בלי לשנות ניסוח.
//
// למה בלי שום CSS ספציפי ל-RTL: <div className="flex ..."> רגיל (לא
// flex-row-reverse) כבר מתהפך אוטומטית תחת dir="rtl" - זה בדיוק הסיבה
// שה-flex/inline-start-end ה"לוגיים" של הדפדפן קיימים; שמים את התמונה
// ראשונה ב-DOM וזה מספיק, אין צורך ב-`ps-*`/`start-*` על מיקום התמונה.
//
// עדיין פלייסהולדר לתמונה בלבד - התמונה עצמה (Nano Banana) טרם הופקה,
// יוחלף ב-<img> אמיתי כשהיא תהיה מוכנה (ראו הדרכת פרומפט שניתנה בנפרד).
import { useTranslation } from "react-i18next";

export function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex max-w-[1200px] min-w-0 flex-col gap-lg px-md py-lg desktop:flex-row desktop:items-start desktop:gap-xl">
      <div
        aria-hidden="true"
        className="flex aspect-square w-full flex-none items-center justify-center bg-surface-sunken desktop:w-[360px]"
      >
        <span className="px-md text-center text-caption text-text-muted">{t("about.imagePlaceholder")}</span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-lg">
        <h1 className="m-0 font-headline text-h2 font-black text-text-base">{t("about.title")}</h1>

        <div className="flex flex-col gap-md text-body text-text-base">
          <p className="m-0">{t("about.intro")}</p>
          <p className="m-0">{t("about.origin")}</p>
          <p className="m-0">{t("about.translation")}</p>

          {/* "לב הטקסט" (ABOUT_PAGE_CONTENT.md, הערה טכנית) - פסקה עצמאית עם
              ריווח לפני/אחרי והדגשה חזותית, לא רק תוכנית - כדי שתתפקד כ"לב
              הטקסט" גם בעיצוב. */}
          <p className="m-0 py-xs text-body-strong font-bold text-text-base">{t("about.heartLine")}</p>

          <p className="m-0">{t("about.craft")}</p>
          <p className="m-0">{t("about.credits")}</p>
        </div>

        {/* שתי שורות עצמאיות קטנות (לא המשך פסקה) - בדיוק כמו שההערה הטכנית
            במסמך המקור מבקשת: "loveLine" ו-"writtenByClaude" מופרדות מעט
            מגוף הטקסט, לפני הציטוט. */}
        <div className="flex flex-col gap-xs text-body text-text-muted">
          <p className="m-0">{t("about.loveLine")}</p>
          <p className="m-0">{t("about.writtenByClaude")}</p>
        </div>

        {/* ציטוט זאפה - blockquote מובחן חזותית (לא פסקת גוף), נשאר באנגלית
            בשתי השפות במכוון (בקשת אורן, ABOUT_PAGE_CONTENT.md סעיף ג).
            border-s (לוגי, לא border-l) כדי שהפס יישב בצד ה"התחלה" הנכון
            גם תחת RTL - אותה גישה כמו ms-xs/-ms-sm הקיימים כבר בפרויקט. */}
        <blockquote className="m-0 border-s-2 border-border-base py-xs ps-md italic text-body text-text-muted">
          <p className="m-0">&ldquo;{t("about.quoteText")}&rdquo;</p>
          <footer className="mt-xs text-caption not-italic">
            — <cite className="not-italic">{t("about.quoteAttribution")}</cite>
          </footer>
        </blockquote>
      </div>
    </div>
  );
}
