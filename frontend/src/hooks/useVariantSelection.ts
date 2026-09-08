// State הבחירה בעמוד הפריט - נקרא פעם אחת ב-ProductPage (מקור-אמת יחיד),
// ומועבר כ-props הלאה ל-ProductGallery/AddToBagForm/VariantSelector. לא
// hook עצמאי בכל קומפוננטה - שתיהן צריכות להסתכל על *אותה* בחירה בדיוק.
//
// החלטת מוצר מכוונת: "מידה" לא מקבלת ברירת מחדל אוטומטית כמו Fit/Colorway
// (deriveSelection לא נוגע בה בכלל). זה בדיוק ה-flow שהדמו בנה (<select>
// עם placeholder ריק + ולידציה, ראו dull-demo/index.html) - ולא במקרה:
// הכאב מס' 1 במחקר (docs/PRD.md סעיף 2) הוא בדיוק מידה שגויה שהונחה
// בטעות. לתת ברירת מחדל שקטה למידה הייתה סותרת את הסיבה שהתכונה קיימת.
import { useCallback, useMemo, useState } from "react";
import {
  deriveSelection,
  findVariant,
  getAvailableAxisValues,
  isCombinationSoldOut,
  type AxisSelection,
} from "@/lib/variant";
import type { Product } from "@/types/product";

const SIZE_AXIS_KEY = "size";

export function useVariantSelection(product: Product) {
  const nonSizeAxes = useMemo(() => product.axes.filter((a) => a.key !== SIZE_AXIS_KEY), [product.axes]);
  const sizeAxis = useMemo(() => product.axes.find((a) => a.key === SIZE_AXIS_KEY), [product.axes]);

  const [selection, setSelection] = useState<AxisSelection>(() => deriveSelection(nonSizeAxes, {}));

  const selectedIds = useMemo(() => new Set(Object.values(selection)), [selection]);

  const availableSizeValues = useMemo(
    () => (sizeAxis ? getAvailableAxisValues(sizeAxis, selectedIds) : []),
    [sizeAxis, selectedIds],
  );

  const setAxisValue = useCallback(
    (axisKey: string, valueId: string) => {
      if (axisKey === SIZE_AXIS_KEY) {
        setSelection((prev) => ({ ...prev, [SIZE_AXIS_KEY]: valueId }));
        return;
      }

      setSelection((prev) => {
        const base = deriveSelection(nonSizeAxes, { ...prev, [axisKey]: valueId });
        const prevSize = prev[SIZE_AXIS_KEY];
        if (!sizeAxis || !prevSize) return base;

        const baseIds = new Set(Object.values(base));
        const stillValid = getAvailableAxisValues(sizeAxis, baseIds).some((v) => v.id === prevSize);
        return stillValid ? { ...base, [SIZE_AXIS_KEY]: prevSize } : base;
      });
    },
    [nonSizeAxes, sizeAxis],
  );

  const variant = useMemo(() => findVariant(product.variants, selectedIds), [product.variants, selectedIds]);

  // צירי הבחירה *חוץ* מ-Size - בסיס להצלבת מדיה (Fit+Colorway, ראו
  // src/lib/variant.ts findMedia) ולבדיקת "האם הצירוף הזה אזל לגמרי".
  const nonSizeSelectedIds = useMemo(
    () => new Set(nonSizeAxes.map((axis) => selection[axis.key]).filter((id): id is string => Boolean(id))),
    [nonSizeAxes, selection],
  );

  const isColorwaySoldOut = useMemo(
    () => isCombinationSoldOut(product.variants, nonSizeSelectedIds),
    [product.variants, nonSizeSelectedIds],
  );

  return {
    nonSizeAxes,
    sizeAxis,
    selection,
    selectedIds,
    nonSizeSelectedIds,
    availableSizeValues,
    setAxisValue,
    variant,
    isColorwaySoldOut,
  };
}
