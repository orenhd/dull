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
      <Trans
        i18nKey="credit.print"
        values={{ band: bandCreditName }}
        components={{ band: <span lang="en" /> }}
      >
        Print: <span lang="en">{{ band: bandCreditName }}</span>.
      </Trans>{" "}
      {bandCreditUrl && (
        <a href={bandCreditUrl} target="_blank" rel="noopener" className="underline hover:text-text-base">
          {t("credit.officialLink")}
        </a>
      )}
      <span className="mt-xs block text-caption text-text-muted">{t("credit.nonCommercialNote")}</span>
    </p>
  );
}
