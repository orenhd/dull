// Terms of Service (docs/SCREENS_INVENTORY.md מסך 16) - עמוד ציבורי, בלי
// auth. נדרש כתנאי סף ל-Publish של Google OAuth consent screen, בדיוק כמו
// PrivacyPage.tsx (ראו ההערה המלאה שם) - שני העמודים נבנו יחד, אותה סיבה.
import { useTranslation, Trans } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { CONTACT_EMAIL } from "@/constants";

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-xs">
      <h2 className="m-0 text-body-strong font-bold text-text-base">{title}</h2>
      <p className="m-0 text-body text-text-base">{body}</p>
    </div>
  );
}

export function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-lg px-md py-lg">
      <Link to="/" className="self-start px-xs py-xs text-caption text-text-muted underline hover:text-text-base">
        {t("disclaimer.backLink")}
      </Link>

      <div className="flex flex-col gap-md">
        <h1 className="m-0 font-headline text-h2 font-black text-text-base">{t("terms.title")}</h1>

        <Section title={t("terms.about.title")} body={t("terms.about.body")} />
        <Section title={t("terms.notRealStore.title")} body={t("terms.notRealStore.body")} />
        <Section title={t("terms.acceptableUse.title")} body={t("terms.acceptableUse.body")} />

        <div className="flex flex-col gap-xs">
          <h2 className="m-0 text-body-strong font-bold text-text-base">{t("terms.intellectualProperty.title")}</h2>
          {/* קישור inline ל-/disclaimer - בלי children (אותו לקח מ-BandCredit.tsx,
              docs/PRD.md סעיף 12.11): components+values (כאן בלי values בכלל,
              אין אינטרפולציה) מספיקים לגמרי. */}
          <p className="m-0 text-body text-text-base">
            <Trans
              i18nKey="terms.intellectualProperty.body"
              components={{ disclaimer: <Link to="/disclaimer" className="underline hover:text-text-base" /> }}
            />
          </p>
        </div>

        <Section title={t("terms.noWarranty.title")} body={t("terms.noWarranty.body")} />
        <Section title={t("terms.changes.title")} body={t("terms.changes.body")} />
        <Section title={t("terms.contact.title")} body={t("terms.contact.body", { email: CONTACT_EMAIL })} />
      </div>
    </div>
  );
}
