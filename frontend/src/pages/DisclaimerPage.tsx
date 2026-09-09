// עמוד ה-Disclaimer המלא (docs/SCREENS_INVENTORY.md מסך 7). ה-footer
// (Footer.tsx) כבר מציג גרסה מקוצרת של אותם שני משפטים בכל עמוד; העמוד הזה
// הוא ה"הרחבה" שאליה מפנים גם ה-footer (קישור "לפרטים נוספים") וגם
// DisclaimerBanner.tsx (הבאנר החד-פעמי). שני מקורות התוכן (rightsNote/
// disclaimer) ב-footer.* נשארים כפי שהם - לא שוכפלו כאן, אלא הורחבו
// למקטע נפרד תחת מפתחות disclaimer.* בקבצי ה-locale.
//
// תוכן: זו הרחבה טקסטואלית ישירה של שני המשפטים הקיימים ב-footer, לא
// ניסוח משפטי חדש/פורמלי - לא הומצאו כאן טענות/מדיניות שלא היו כבר
// מאושרות ע"י Oren. אם רוצים ניסוח משפטי מחמיר יותר בעתיד, כדאי שOren
// יעביר טקסט מדויק במקום שאני אנחש.
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";

export function DisclaimerPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-lg px-md py-lg">
      <Link to="/" className="self-start px-xs py-xs text-caption text-text-muted underline hover:text-text-base">
        {t("disclaimer.backLink")}
      </Link>

      <div className="flex flex-col gap-md">
        <h1 className="m-0 font-headline text-h2 font-black text-text-base">{t("disclaimer.title")}</h1>
        <p className="m-0 text-body text-text-base">{t("disclaimer.rightsNote")}</p>
        <p className="m-0 text-body text-text-base">{t("disclaimer.demoNote")}</p>
      </div>
    </div>
  );
}
