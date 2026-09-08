import { useTranslation } from "react-i18next";

export function SkipLink() {
  const { t } = useTranslation();
  return (
    <a
      href="#main"
      className="absolute -start-[9999px] top-0 z-10 bg-surface-base px-md py-sm text-text-base focus:start-sm focus:top-sm"
    >
      {t("common.skipToContent")}
    </a>
  );
}
