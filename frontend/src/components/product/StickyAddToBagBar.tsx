// Marketing feedback - PDP buy box A2 (2026-09-19): פס Add to Bag דביק
// שמופיע במובייל בלבד כשהכפתור המקורי (ב-buy box) לא נראה. שני עקרונות
// מרכזיים מהבריף:
//
// 1. **אין לוגיקה מקבילה** - הכפתור כאן הוא `type="submit" form={formId}`,
//    בדיוק כמו שכפתור ה-submit ב-CheckoutPage.tsx כבר עושה מול הטופס שלו
//    (form="checkout-form") - שולח את אותו <form> בדיוק שהכפתור הרגיל
//    שולח, אז handleSubmit ב-AddToBagForm.tsx (ולידציה/הוספה לעגלה/toast/
//    אנליטיקה) רץ פעם אחת, בלי שום שכפול. ה-`data-source` על שני הכפתורים
//    (כאן ו-AddToBagForm.tsx) מבחין בין המקורות ב-handleSubmit דרך
//    SubmitEvent.submitter, לא state/prop נפרד.
//
// 2. **בלי מנגנון scroll ידני** - IntersectionObserver בלבד (לא
//    `scroll` listener), עם root=<main id="main"> (ה-scroller היחיד
//    ב-app shell, ראו RootLayout.tsx) - לא ה-viewport, אחרת הפס לא
//    יופיע נכון (הבריף, סעיף 2).
//
// מיקום/z: `position: sticky bottom-0` **בזרימת ה-DOM של <main>** (לא
// `fixed` לחלון!) - זה הרכיב האחרון שמוחזר מ-ProductPage.tsx, ולכן הוא
// נעצר בדיוק בגבול התחתון של <main>, שמתלכד בדיוק עם המקום שבו הפוטר
// הקבוע (Footer.tsx, מחוץ ל-<main> לגמרי) מתחיל - כך "לא מכסה את הפוטר"
// מתקיים מבנית, בלי חישוב offset ידני.
//
// אין אנימציית הופעה/היעלמות (הבריף מתיר במפורש: "אנימציה עדינה בלבד, או
// בלי") - נבחרה האופציה הפשוטה/הבטוחה יותר: mount/unmount מלא לפי
// `visible`, לא CSS transition. כך "בלי tab stop כשמוסתר" ו-"בלי הכרזה
// כפולה" (הבריף, סעיף 2) מתקיימים אוטומטית - אלמנט שלא קיים ב-DOM לא
// צריך inert/aria-hidden בכלל, ולא נדרש state נוסף לתאם ביניהם.
import { useEffect, useState, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { formatAgorot } from "@/lib/money";
import { buildSelectionLabel, getStartingPriceAgorot } from "@/lib/variant";
import type { Product } from "@/types/product";
import type { useVariantSelection } from "@/hooks/useVariantSelection";

interface StickyAddToBagBarProps {
  product: Product;
  selection: ReturnType<typeof useVariantSelection>;
  anchorRef: RefObject<HTMLElement | null>;
  formId: string;
  outOfStock: boolean;
}

export function StickyAddToBagBar({ product, selection, anchorRef, formId, outOfStock }: StickyAddToBagBarProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const anchor = anchorRef.current;
    const root = document.getElementById("main");
    if (!anchor || !root) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), { root, threshold: 0 });
    observer.observe(anchor);
    return () => observer.disconnect();
  }, [anchorRef]);

  if (!visible) return null;

  const { variant, selection: axisSelection, sizeAxis } = selection;
  const priceAgorot = variant?.priceAgorot ?? getStartingPriceAgorot(product.variants);
  // "Men's · Light · L" - אותה buildSelectionLabel בדיוק שכבר משמשת את
  // ה-toast/CartItem.selectionLabel (lib/variant.ts) - לא הרכבה חדשה.
  // כשלא נבחרה מידה: t("variant.selectSize") ("Select size"), אותו מפתח
  // i18n שכבר משמש כ-placeholder בבורר המידה עצמו (הבריף, סעיף 2).
  const sizeMissing = Boolean(sizeAxis) && !axisSelection.size;
  const selectionLabel = sizeMissing ? t("variant.selectSize") : buildSelectionLabel(product.axes, axisSelection);

  return (
    <div
      className="sticky bottom-0 z-10 flex items-center justify-between gap-sm border-t border-border-base bg-surface-base px-md py-sm desktop:hidden"
      style={{ paddingBottom: "calc(var(--space-sm) + env(safe-area-inset-bottom))" }}
    >
      <div className="flex min-w-0 flex-col">
        {priceAgorot != null && <span className="text-body-strong font-bold text-text-base">{formatAgorot(priceAgorot)}</span>}
        <span className="truncate text-caption text-text-muted">{selectionLabel}</span>
      </div>
      {/* min-h-11 (44px) - שטח מגע מינימלי (הבריף, סעיף 2). type="submit"
          form={formId} - ראו הערת הקובץ למעלה: אותו handler בדיוק. */}
      <Button
        type="submit"
        form={formId}
        data-source="sticky_bar"
        disabled={outOfStock}
        className="w-auto! min-h-11 flex-none px-lg"
      >
        {t("actions.addToBag")}
      </Button>
    </div>
  );
}
