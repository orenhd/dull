// קובע איזו תמונת FLAT (רקע אפור) תואמת לוריאנט נתון - נדרש לצירוף
// thumbnail במייל אישור הזמנה, כי שם (בניגוד ל-frontend מול GET
// /products/:slug) אין דפדפן שיכול לעשות את ההצלבה בעצמו.
//
// "תואמת" = כל ערכי-הציר שהתמונה משויכת אליהם (בד"כ Fit+Colorway, בלי
// Size - כי אותה תמונת flat משרתת את כל המידות) מופיעים גם בין ערכי-הציר
// של הוריאנט הספציפי (שכולל גם Size). אותה לוגיקה בדיוק, רק בצד השרת.
import type { Media, MediaAxisValue, VariantAxisSelection } from "@prisma/client";

type MediaWithAxisValues = Media & { axisValues: MediaAxisValue[] };

export function findFlatMediaUrl(
  media: MediaWithAxisValues[],
  variantAxisSelections: Pick<VariantAxisSelection, "axisValueId">[],
): string | null {
  const variantAxisValueIds = new Set(variantAxisSelections.map((s) => s.axisValueId));

  const match = media.find(
    (m) =>
      m.role === "FLAT" &&
      m.axisValues.length > 0 &&
      m.axisValues.every((av) => variantAxisValueIds.has(av.axisValueId)),
  );

  return match?.url ?? null;
}
