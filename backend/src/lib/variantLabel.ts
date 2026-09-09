// בונה snapshot דו-לשוני של "תיאור הבחירה" של וריאנט (למשל ["Women's", "Light", "S"])
// לצורך שמירה בהיסטוריית הזמנות - בדיוק אותו עיקרון כמו productNameSnapshot:
// נלקח וריאנט חי (product/axis/axisValue יכולים תיאורטית להשתנות/להימחק
// בעתיד), ונשמרים ה-tokens הקפואים לכל locale בזמן הרכישה - לא live-join.
//
// מכוונים החוצה **array** של הרכיבים (לא string מחובר עם מפריד) בכוונה:
// המפריד הוויזואלי (" · " בעגלה) הוא עניין תצוגתי-בלבד, לא חלק מ"מה נקנה" -
// ולכן שייך ל-frontend (אותה פונקציית format שכבר משמשת את העגלה), לא ל-
// snapshot. כך גם אם עיצוב המפריד ישתנה בעתיד, הזמנות היסטוריות יוצגו עם
// הסטייל הנוכחי - זה תקין, בניגוד ל-productNameSnapshot/מחיר שהם עובדות
// היסטוריות שאסור להן להשתנות למפרע.
//
// הסדר בין ערכי-הציר (Fit, Colorway, Size...) נקבע לפי VariantAxis.sortOrder
// של כל ציר - לא לפי סדר השורות ב-DB, שאינו מובטח.
import type { VariantAxis, VariantAxisSelection, VariantAxisValue } from "@prisma/client";
import { localize } from "./i18n.js";
import { SUPPORTED_LOCALES, type Locale } from "../constants/index.js";

export type AxisSelectionWithLabel = VariantAxisSelection & {
  axisValue: VariantAxisValue & { axis: VariantAxis };
};

export function buildSelectionLabelSnapshot(
  axisSelections: AxisSelectionWithLabel[],
): Record<Locale, string[]> {
  const sorted = [...axisSelections].sort(
    (a, b) => a.axisValue.axis.sortOrder - b.axisValue.axis.sortOrder,
  );

  const result = {} as Record<Locale, string[]>;
  for (const locale of SUPPORTED_LOCALES) {
    result[locale] = sorted.map(
      (selection) =>
        localize(selection.axisValue.label as Record<string, string>, locale) ??
        selection.axisValue.key,
    );
  }
  return result;
}
