// עגלת קניות (docs/SCREENS_INVENTORY.md מסך 10). ה-store (Zustand,
// stores/cartStore.ts) כבר קיים ומלא מאז עמוד הפריט - זה רק המסך שקורא/
// כותב אליו. אין state של טעינה/שגיאה אמיתי כאן (בניגוד ל-HomePage/
// CollectionPage/ProductPage): הכל local state סינכרוני, בלי קריאת רשת
// (השם/התווית הטריים לכל פריט מגיעים דרך useFreshCartItems, לא נכשלים
// בצורה שדורשת מסך שגיאה נפרד).
//
// כפתור המעבר לתשלום (2026-09-08): מוביל עכשיו ל-/checkout בפועל (ראו
// src/pages/CheckoutPage.tsx) - הוחלף מ-Button מושבת ל-Link מעוצב כמו
// Button (buttonClassName, אותה טכניקה שכבר קיימת ב-SoldOutNotice.tsx),
// כי CheckoutPage הוא route אמיתי עכשיו, לא קישור מת.
//
// תיקון באג קודם (Oren, 2026-09-08): CartItem.productName/selectionLabel
// נשמרים ב-store פעם אחת, בזמן "Add to Bag", בשפה שהייתה פעילה אז - הם
// *לא* מתעדכנים לבד אם המשתמש מחליף שפה אחר כך. הפתרון (useFreshCartItems,
// src/hooks/useFreshCartItems.ts) הוצא מכאן ל-hook משותף (2026-09-08, לקראת
// CheckoutPage שצריך בדיוק את אותה לוגיקה לסיכום ההזמנה) - שולף מחדש כל
// מוצר ייחודי שיש בעגלה בשפה הנוכחית ומציג את זה במקום ה-cache השמור, עם
// נפילה חזרה ל-cache אם ה-fetch עוד לא חזר/נכשל/הוריאנט כבר לא קיים.
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { useCartStore, selectCartTotalAgorot } from "@/stores/cartStore";
import { useFreshCartItems } from "@/hooks/useFreshCartItems";
import { formatAgorot } from "@/lib/money";
import { buttonClassName } from "@/components/ui/Button";

export function CartPage() {
  const { t } = useTranslation();
  const total = useCartStore(selectCartTotalAgorot);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const freshItems = useFreshCartItems();

  if (freshItems.length === 0) {
    return (
      <div className="mx-auto flex max-w-[640px] flex-col gap-md px-md py-xl">
        <h1 className="m-0 font-headline text-h3 font-black text-text-base">{t("cart.emptyTitle")}</h1>
        <Link to="/" className="self-start px-xs py-xs text-body-strong text-brand-primary underline">
          {t("cart.backToCatalog")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] min-w-0 flex-col gap-lg px-md py-lg desktop:flex-row desktop:items-start desktop:gap-xl">
      <div className="min-w-0 flex-1">
        <h1 className="m-0 mb-md font-headline text-h3 font-black text-text-base">{t("cart.title")}</h1>

        <ul className="m-0 flex list-none flex-col gap-md p-0">
          {freshItems.map((item) => (
            <li key={item.variantId} className="flex gap-md border-b border-border-base pb-md">
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt=""
                  width={96}
                  height={96}
                  className="size-24 flex-none rounded-sm bg-surface-sunken object-cover"
                />
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-xs">
                <Link
                  to="/products/$slug"
                  params={{ slug: item.productSlug }}
                  className="text-body text-text-base [overflow-wrap:anywhere] hover:underline"
                >
                  {item.displayName}
                </Link>
                <span className="text-caption text-text-muted">{item.displayLabel}</span>
                <div className="flex items-center gap-sm">
                  <label className="text-caption text-text-muted" htmlFor={`qty-${item.variantId}`}>
                    {t("cart.quantity")}
                  </label>
                  <input
                    id={`qty-${item.variantId}`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={item.quantity}
                    onChange={(event) =>
                      setQuantity(item.variantId, Math.max(1, Math.trunc(Number(event.target.value)) || 1))
                    }
                    className="w-16 rounded-sm border border-border-base px-xs py-xs text-body text-text-base"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(item.variantId)}
                    className="px-xs py-xs text-caption text-text-muted underline hover:text-text-base"
                  >
                    {t("cart.remove")}
                  </button>
                </div>
              </div>
              <span className="flex-none text-body-strong font-bold text-text-base">
                {formatAgorot(item.priceAgorot * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* סיכום + CTA: מובייל - sticky לתחתית אזור הגלילה (<main>, לא ה-
          viewport - יש כבר footer קבוע שם, ראו RootLayout.tsx). דסקטופ -
          כרטיס "קבוע בצד" (docs/SCREENS_INVENTORY.md מסך 10), sticky לראש
          העמודה תוך כדי גלילת רשימת הפריטים. */}
      <div className="sticky bottom-0 z-10 -mx-md flex flex-col gap-sm border-t border-border-base bg-surface-base px-md py-md desktop:sticky desktop:top-lg desktop:bottom-auto desktop:mx-0 desktop:w-[320px] desktop:flex-none desktop:rounded-sm desktop:border">
        <div className="flex items-center justify-between text-body-strong font-bold text-text-base">
          <span>{t("cart.total")}</span>
          <span>{formatAgorot(total)}</span>
        </div>
        <Link to="/checkout" className={buttonClassName("primary")}>
          {t("cart.checkout")}
        </Link>
      </div>
    </div>
  );
}
