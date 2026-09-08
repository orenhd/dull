// Stub בכוונה - עמוד הבית האמיתי (docs/SCREENS_INVENTORY.md מסך 1) עוד לא
// נבנה. TECH_SPEC.md סעיף 5: עמוד הפריט נבחר להיבנות ראשון כדי להקים את
// כל התשתית החוצה-עמודים; שאר העמודים לפי docs/SCREENS_INVENTORY.md.
// קישור ישיר לעמוד הפריט הבנוי כאן לנוחות הבדיקה, לא כחלק מהעיצוב הסופי.
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { wordmarkClassName } from "@/lib/wordmark";

export function HomePage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-md px-md py-xl">
      <h1 className={wordmarkClassName("h1")}>{t("home.title")}</h1>
      <p className="m-0 text-body-strong text-text-base">{t("home.subtitle")}</p>
      <p className="m-0 text-body text-text-muted">{t("home.buildNote")}</p>
      <Link
        to="/products/$slug"
        params={{ slug: "darkthrone-tee" }}
        className="self-start px-xs py-xs text-body-strong text-brand-primary underline"
      >
        {t("home.viewItemCta")} →
      </Link>
    </div>
  );
}
