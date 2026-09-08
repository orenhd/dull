import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { buttonClassName } from "@/components/ui/Button";

export function SoldOutNotice() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-start gap-sm rounded-md border border-border-strong p-lg">
      <h2 className="m-0 font-headline text-h3 text-text-base">{t("soldOut.title")}</h2>
      <p className="m-0 text-body text-text-base">{t("soldOut.body")}</p>
      <Link to="/" className={buttonClassName("secondary")}>
        {t("soldOut.backLink")}
      </Link>
    </div>
  );
}
