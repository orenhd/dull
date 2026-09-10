import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { VariantSelector } from "./VariantSelector";
import { SizeGuideAccordion } from "./SizeGuideAccordion";
import { MaterialsCard } from "./MaterialsCard";
import { Button } from "@/components/ui/Button";
import { resolveMediaUrl } from "@/lib/api/client";
import { findMedia, buildSelectionLabel } from "@/lib/variant";
import { MEDIA_ROLE } from "@/constants";
import { useCartStore } from "@/stores/cartStore";
import { useToastStore } from "@/stores/toastStore";
import type { Product } from "@/types/product";
import type { useVariantSelection } from "@/hooks/useVariantSelection";

interface AddToBagFormProps {
  product: Product;
  selection: ReturnType<typeof useVariantSelection>;
}

export function AddToBagForm({ product, selection }: AddToBagFormProps) {
  const { t } = useTranslation();
  const {
    nonSizeAxes,
    sizeAxis,
    selection: axisSelection,
    selectedIds,
    availableSizeValues,
    setAxisValue,
    variant,
  } = selection;

  const [sizeTouched, setSizeTouched] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const showToast = useToastStore((s) => s.show);

  const sizeMissing = Boolean(sizeAxis) && !axisSelection.size;
  const showSizeError = sizeTouched && sizeMissing;
  // "אזל" ברמת ה-SKU המדויק (הצירוף המלא כולל מידה) - שונה מ-isColorwaySoldOut
  // (כל הצירוף Fit+Colorway) שמוחלט ב-ProductPage ומחליף את כל הטופס הזה
  // ב-SoldOutNotice. כאן זה תמיד "מידה ספציפית אחת אזלה", לא כל הצבע.
  const outOfStock = variant != null && variant.stockQty <= 0;

  const fitAxis = nonSizeAxes.find((axis) => axis.key === "fit");
  const fitValueKey = fitAxis?.values.find((v) => v.id === axisSelection[fitAxis.key])?.key;

  function handleAxisChange(axisKey: string, valueId: string) {
    setAxisValue(axisKey, valueId);
    if (axisKey === "size") setSizeTouched(false);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (sizeMissing) {
      setSizeTouched(true);
      document.getElementById("size")?.focus();
      return;
    }
    if (!variant || outOfStock) return;

    // תוקן 2026-09-10 (docs/PRD.md סעיף 12.17, בקשת Oren ג2): התווית שנשלחת
    // ל-toast מחושבת פעם אחת ומשמשת גם את CartItem.selectionLabel וגם את
    // הודעת ה-toast - היה קודם חישוב נפרד (sizeLabel בלבד) לטוסט, שהציג רק
    // את המידה. buildSelectionLabel() כבר מרכיבה בדיוק את הפורמט המבוקש
    // ("Women's · Light · L") מכל הצירים הקיימים למוצר הזה - ולכן, למוצר
    // בלי ציר Fit/Colorway (כמו הסנדלים), היא כבר מניבה "מין · מידה" בלבד
    // באופן טבעי, בלי לוגיקה מותנית נוספת כאן.
    const selectionLabel = buildSelectionLabel(product.axes, axisSelection);

    const flatImage = findMedia(product.media, MEDIA_ROLE.flat, selectedIds);
    addItem({
      variantId: variant.id,
      productSlug: product.slug,
      productName: product.name,
      sku: variant.sku,
      priceAgorot: variant.priceAgorot,
      imageUrl: flatImage ? resolveMediaUrl(flatImage.url) : null,
      selectionLabel,
    });

    showToast(t("actions.addedToBagToast", { details: selectionLabel }));
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex w-full flex-col gap-md desktop:max-w-[360px]">
      <VariantSelector
        nonSizeAxes={nonSizeAxes}
        sizeAxis={sizeAxis}
        selection={axisSelection}
        selectedIds={selectedIds}
        availableSizeValues={availableSizeValues}
        onChange={handleAxisChange}
        sizeError={showSizeError}
      />

      <SizeGuideAccordion category={product.category} fitKey={fitValueKey} />

      <MaterialsCard description={product.description} />

      <Button type="submit" disabled={outOfStock}>
        {t("actions.addToBag")}
      </Button>

    </form>
  );
}
