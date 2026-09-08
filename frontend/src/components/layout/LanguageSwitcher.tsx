import { useTranslation } from "react-i18next";
import type { Locale } from "@/constants";

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? i18n.language) as Locale;
  const next: Locale = current === "he" ? "en" : "he";

  return (
    <button
      type="button"
      onClick={() => void i18n.changeLanguage(next)}
      className="inline-block px-xs py-xs text-caption text-text-muted hover:text-text-base"
      lang={next}
    >
      {t("common.languageSwitch")}
    </button>
  );
}
