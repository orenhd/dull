// אילו מ-i18next (שתי שפות UI, EN/HE) לבין ה-locale שנשלח ל-API (אותם שני
// ערכים בדיוק - ראו docs/API_CONTRACT.md) - אותו hook, מרכזי, כדי שכל מקום
// שקורא ל-getProducts/getProduct יבחר locale באותה שיטה בדיוק (חולץ מ-
// ProductPage.tsx, 2026-09-08 - היה מוגדר שם inline, עכשיו גם HomePage/
// CollectionPage צריכים אותו).
import { useTranslation } from "react-i18next";
import type { Locale } from "@/constants";

export function useApiLocale(): Locale {
  const { i18n } = useTranslation();
  const resolved = i18n.resolvedLanguage ?? i18n.language;
  return resolved === "he" ? "he" : "en";
}
