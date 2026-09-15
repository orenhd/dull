// MVP capability 2 (docs/PRD.md סעיף 5) - קרדיט וקישור חיצוני בלתי-תלוי
// במותג, לא "אזור ביקורות". bandCreditName/Url מגיעים מה-API כפי שהם
// (לא i18n - שם להקה/URL לא מתורגמים); ההודעה סביבם כן i18n.
import { useTranslation, Trans } from "react-i18next";

interface BandCreditProps {
  bandCreditName: string | null;
  bandCreditUrl: string | null;
}

export function BandCredit({ bandCreditName, bandCreditUrl }: BandCreditProps) {
  const { t } = useTranslation();
  if (!bandCreditName) return null;

  return (
    <p className="text-caption text-text-muted">
      {/* בלי children: זה גם התיקון לבאג build (2026-09-09, TS2353 - נחשף
          ע"י render-build.ts שהריץ npm run build אמיתי לראשונה) וגם הצורה
          הנכונה/מתועדת יותר כאן. ה-children שהיו קודם (fallback טקסטואלי,
          "Print: <span lang=\"en\">{{ band: bandCreditName }}</span>.")
          לא באמת נחוצים - התרגום קיים תמיד בפועל (EN/HE, שניהם מוגדרים
          ב-common.json) והרכיב כבר "יוצא" למעלה אם bandCreditName ריק, אז
          אין תרחיש שבו ה-fallback הזה היה אי-פעם נצרך. `{{ band:
          bandCreditName }}` בתוך children הצטלב עם type-inference של Trans
          כש-components גם מוגדר - components+values מספיקים לגמרי בלי
          children: components ממפה את התג <band> ב-`credit.print`
          (common.json) ל-<span lang="en">, values מזריק את הערך עצמו. */}
      {/* dir="ltr" (2026-09-15, docs/PRD.md סעיף 28) - lang="en" לבדו לא
          מבטיח בידוד כיווני בתוך משפט RTL: "45 Grave" (Trans מציג "45"
          לפני "Grave") הופך ל"Grave" לפני "45" בלי dir מפורש, כי הדפדפן
          עדיין קובע כיווניות-פנימית מספרים/טקסט לפי ה-Unicode Bidi
          Algorithm וההקשר העברי מסביב, לא רק lang. no-op ויזואלי לכל
          שם להקה שלא מתחיל בספרה (Darkthrone/Immortal) - רק "45 Grave"
          מושפע בפועל כרגע, אבל התיקון כללי לכל bandCreditName עתידי. */}
      <Trans
        i18nKey="credit.print"
        values={{ band: bandCreditName }}
        components={{ band: <span lang="en" dir="ltr" /> }}
      />{" "}
      {bandCreditUrl && (
        <a href={bandCreditUrl} target="_blank" rel="noopener" className="underline hover:text-text-base">
          {t("credit.officialLink")}
        </a>
      )}
      <span className="mt-xs block text-caption text-text-muted">{t("credit.nonCommercialNote")}</span>
    </p>
  );
}
