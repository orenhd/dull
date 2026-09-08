// עמוד "אודות" (docs/SCREENS_INVENTORY.md מסך 6, שם נקרא "הקונספט" - ראו
// הערה ב-router.tsx/PROMPT היסטוריה על הבדל השם). עימוד הכנה בלבד לפי בקשת
// Oren (2026-09-08): אין עדיין תוכן אמיתי (עובד על מכתב פואטי) - זה רק
// ה-layout: תמונה בצד ה-start (שמאל ב-LTR, ימין ב-RTL) לצד טקסט רץ שתופס
// את רוב הרוחב.
//
// למה בלי שום CSS ספציפי ל-RTL: <div className="flex ..."> רגיל (לא
// flex-row-reverse) כבר מתהפך אוטומטית תחת dir="rtl" - זה בדיוק הסיבה
// שה-flex/inline-start-end ה"לוגיים" של הדפדפן קיימים; שמים את התמונה
// ראשונה ב-DOM וזה מספיק, אין צורך ב-`ps-*`/`start-*` פה בכלל.
import { useTranslation } from "react-i18next";

export function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex max-w-[1200px] min-w-0 flex-col gap-lg px-md py-lg desktop:flex-row desktop:items-start desktop:gap-xl">
      {/* פלייסהולדר לתמונה - יוחלף ב-<img> אמיתי כשהתוכן יהיה מוכן. */}
      <div
        aria-hidden="true"
        className="flex aspect-square w-full flex-none items-center justify-center bg-surface-sunken desktop:w-[360px]"
      >
        <span className="px-md text-center text-caption text-text-muted">{t("about.imagePlaceholder")}</span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-md">
        <h1 className="m-0 font-headline text-h2 font-black text-text-base">{t("about.title")}</h1>
        <p className="m-0 text-body text-text-muted">{t("about.contentPlaceholder")}</p>
      </div>
    </div>
  );
}
