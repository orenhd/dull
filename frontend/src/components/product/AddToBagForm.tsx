// תוקן 2026-09-19 (Marketing feedback - PDP buy box A1): הרכיב הזה כבר לא
// מכיל את SizeGuideAccordion/MaterialsCard - הם "משניים" לפי הבריף ועברו
// למתחת לכפתור (ProductPage.tsx, סדר: VariantSelector -> Button -> [image2
// במובייל] -> SizeGuideAccordion -> MaterialsCard). <form> כאן מסתיים
// מיד אחרי הכפתור - id={formId} קבוע (לא props.id, ProductPage.tsx צריך
// לדעת אותו כדי לחבר את פס ה-sticky, StickyAddToBagBar.tsx, עם
// form={formId} על כפתור-ה-submit השני שלו).
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { VariantSelector } from "./VariantSelector";
import { Button } from "@/components/ui/Button";
import { resolveMediaUrl } from "@/lib/api/client";
import { findMedia, buildSelectionLabel } from "@/lib/variant";
import { scrollIntoViewRespectingMotion } from "@/lib/scroll";
import { MEDIA_ROLE } from "@/constants";
import { useCartStore } from "@/stores/cartStore";
import { useToastStore } from "@/stores/toastStore";
import { trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics";
import type { Product } from "@/types/product";
import type { useVariantSelection } from "@/hooks/useVariantSelection";

export const ADD_TO_BAG_FORM_ID = "add-to-bag-form";

interface AddToBagFormProps {
  product: Product;
  selection: ReturnType<typeof useVariantSelection>;
  onOpenSizeGuide: () => void;
  buttonRef?: React.RefObject<HTMLDivElement | null>;
}

export function AddToBagForm({ product, selection, onOpenSizeGuide, buttonRef }: AddToBagFormProps) {
  const { t } = useTranslation();
  const {
    nonSizeAxes,
    sizeAxis,
    selection: axisSelection,
    selectedIds,
    availableSizeValues,
    soldOutSizeIds,
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

  function handleAxisChange(axisKey: string, valueId: string) {
    setAxisValue(axisKey, valueId);
    if (axisKey === "size") setSizeTouched(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (sizeMissing) {
      setSizeTouched(true);
      // תוקן 2026-09-19 (Marketing feedback - PDP buy box A2, סעיף
      // "התנהגות בלי מידה"): "גוללת ומעבירה פוקוס לקבוצת המידות" - קודם
      // רק focus (getElementById("size") - ה-<select> הישן). עכשיו המידה
      // היא fieldset של צ'יפים (id="size-group", VariantSelector.tsx),
      // אז גם גלילה (מכבדת prefers-reduced-motion) וגם focus על הצ'יפ
      // הראשון שאינו disabled (לא על ה-fieldset עצמו - fieldset לא בר-מיקוד
      // מטבעו, ותמיד עדיף למקד ישירות על הבקרה הראשונה שניתנת לבחירה).
      const sizeGroup = document.getElementById("size-group");
      scrollIntoViewRespectingMotion(sizeGroup, { block: "center" });
      sizeGroup?.querySelector<HTMLInputElement>('input[name="size"]:not(:disabled)')?.focus();
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

    // תוקן 2026-09-19 (Marketing feedback - PDP buy box A2, סעיף אנליטיקה):
    // property חדש `source` - "buy_box" או "sticky_bar", לפי איזה כפתור
    // בפועל שלח את הטופס (SubmitEvent.submitter - שני הכפתורים, כאן
    // ו-StickyAddToBagBar.tsx, מסומנים ב-data-source). לא state/prop נפרד
    // שצריך לתאם - נגזר ישירות מה-event, אותו handler משרת את שניהם.
    const submitter = event.nativeEvent instanceof SubmitEvent ? event.nativeEvent.submitter : null;
    const source = submitter?.getAttribute("data-source") === "sticky_bar" ? "sticky_bar" : "buy_box";

    // docs/PRD.md סעיף 20 - "Added to Bag".
    trackEvent(ANALYTICS_EVENTS.addedToBag, {
      productSlug: product.slug,
      productName: product.name,
      sku: variant.sku,
      priceAgorot: variant.priceAgorot,
      selectionLabel,
      source,
    });

    showToast(t("actions.addedToBagToast", { details: selectionLabel }));
  }

  return (
    <form
      id={ADD_TO_BAG_FORM_ID}
      noValidate
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-md desktop:max-w-[360px]"
    >
      <VariantSelector
        nonSizeAxes={nonSizeAxes}
        sizeAxis={sizeAxis}
        selection={axisSelection}
        selectedIds={selectedIds}
        availableSizeValues={availableSizeValues}
        soldOutSizeIds={soldOutSizeIds}
        onChange={handleAxisChange}
        sizeError={showSizeError}
        onOpenSizeGuide={onOpenSizeGuide}
      />

      {/* buttonRef - עוטף div, לא ref על עצמו Button.tsx (נמנע מהצורך
          לטפל ב-ref-forwarding על ButtonHTMLAttributes) - משמש כ-target
          ל-IntersectionObserver של StickyAddToBagBar.tsx (root=<main>,
          לא viewport, ראו הערה שם). */}
      <div ref={buttonRef}>
        <Button type="submit" data-source="buy_box" disabled={outOfStock}>
          {t("actions.addToBag")}
        </Button>
      </div>
    </form>
  );
}
