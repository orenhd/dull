import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-md px-md py-xl">
      <h1 className="font-headline text-h2 font-black text-text-base">{t("notFound.title")}</h1>
      <p className="m-0 text-body text-text-base">{t("notFound.body")}</p>
      <Link to="/" className="self-start px-xs py-xs text-body-strong text-brand-primary underline">
        {t("notFound.backHome")} →
      </Link>
    </div>
  );
}
