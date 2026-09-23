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
import { useRef, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { useCartStore, selectCartTotalAgorot } from "@/stores/cartStore";
import { useFreshCartItems } from "@/hooks/useFreshCartItems";
import { useStickyBottomOffset } from "@/hooks/useStickyBottomOffset";
import { useElementHeight } from "@/hooks/useElementHeight";
import { formatAgorot } from "@/lib/money";
import { buttonClassName } from "@/components/ui/Button";
import { MAX_LINE_ITEM_QUANTITY } from "@/constants";

export function CartPage() {
  const { t } = useTranslation();
  const total = useCartStore(selectCartTotalAgorot);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const freshItems = useFreshCartItems();
  const bottomOffsetPx = useStickyBottomOffset();
  // תוקן 2026-09-23 (PRD.md סעיף 53, דיווח אורן): מודד את הגובה בפועל של
  // הסיכום הדביק (למטה) כדי "לשמור" לו מקום בתחתית התוכן הגולל - ראו
  // useElementHeight.ts להסבר המלא למה זה נדרש אחרי המעבר ל-fixed (סעיף 52).
  const summaryRef = useRef<HTMLDivElement>(null);
  const summaryHeightPx = useElementHeight(summaryRef);

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
    <div
      // תוקן 2026-09-23 (PRD.md סעיף 53, דיווח אורן): py-lg האחיד הוחלף
      // ל-pt-lg + pb דינמי - במובייל בלבד (desktop:pb-lg מחזיר להתנהגות
      // המקורית) - כדי ש-<main> ידע שיש עוד תוכן "לגלול אליו" מתחת לסיכום
      // ה-fixed, בדיוק כמו ש-bottom-[var(--sticky-bottom-offset)] עצמו
      // נעשה (PRD סעיף 52) - אותה טכניקת CSS custom property + קלאס
      // ערך-שרירותי, מאותה סיבה (style ישיר ישבור את desktop:pb-lg).
      className="mx-auto flex w-full max-w-[1200px] min-w-0 flex-col gap-lg px-md pt-lg pb-[var(--cart-bottom-reserve)] desktop:flex-row desktop:items-start desktop:gap-xl desktop:pb-lg"
      style={{ "--cart-bottom-reserve": `calc(var(--space-lg) + ${summaryHeightPx + bottomOffsetPx}px)` } as CSSProperties}
    >
      <div className="min-w-0 flex-1">
        <h1 className="m-0 mb-md font-headline text-h3 font-black text-text-base">{t("cart.title")}</h1>

        <ul className="m-0 flex list-none flex-col gap-md p-0">
          {freshItems.map((item) => (
            <li key={item.variantId} className="flex flex-col gap-sm border-b border-border-base pb-md">
              {/* תוקן 2026-09-23 (PRD.md סעיף 53, דיווח אורן [ב]): שורה
                  עליונה = תמונה+שם+מחיר, שורה תחתונה נפרדת (רוחב מלא) =
                  stepper הכמות + הסרה. לפני התיקון הכל היה שורה אחת -
                  עמודת התוכן האמצעית (עם שם+שורת-כמות) התכווצה בלחץ מקום
                  מהמחיר (אומת חי: שדה ה-number הצטמצם מ-64px ל-40.6px
                  כשהמחיר הגיע ל-3 ספרות - shrink-0 בלבד על השדה רק מעביר
                  את הצפיפות לתווית/לכפתור ההסרה, לא פותר את זה מהותית).
                  שורה תחתונה נפרדת ברוחב מלא לא מתחרה עם המחיר על מקום
                  בכלל, ולכן פותרת את הבעיה מהשורש, לא רק מזיזה אותה. */}
              <div className="flex gap-md">
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
                    {/* <bdi> (2026-09-15, docs/PRD.md סעיף 28) - אותה מחלקת-באג
                        bidi כמו ProductPage.tsx h1 (ראו הערה שם) - item.displayName
                        יכול להיות שם-להקה שמתחיל בספרה. */}
                    <bdi>{item.displayName}</bdi>
                  </Link>
                  <span className="text-caption text-text-muted">{item.displayLabel}</span>
                </div>
                <span className="flex-none text-body-strong font-bold text-text-base">
                  {formatAgorot(item.priceAgorot * item.quantity)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-sm">
                {/* stepper -/+ (2026-09-23, PRD סעיף 53, בקשת אורן [ב]) -
                    מחליף <input type="number"> נייטיבי: שני כפתורים אמיתיים
                    (לא תלויי-hover כמו חיצי ה-spinner המקוריים - עובדים
                    מצוין במגע), תצוגת מספר לא-ניתנת-לעריכה. התווית "כמות"
                    עברה ל-sr-only בלבד - ה-stepper מובן מעצמו בלי תווית
                    ויזואלית, וזה גם מפנה עוד קצת רוחב. */}
                <div className="flex items-center gap-sm">
                  <label className="sr-only" htmlFor={`qty-${item.variantId}`}>
                    {t("cart.quantity")}
                  </label>
                  {/* תוקן 2026-09-23 (PRD.md סעיף 54, בקשת אורן): רוחב
                      הקונטיינר נעול ל-w-24 (96px) - זהה בכוונה לרוחב תמונת
                      הפריט (size-24 למעלה, גם 96px) - כל שליש (−/מספר/+)
                      מקבל flex-1, כלומר 32px בדיוק. לא magic number עצמאי -
                      נגזר ישירות מאותו טוקן (size-24/w-24), כך שאם התמונה
                      תשתנה בעתיד אפשר לעדכן את שניהם יחד. */}
                  <div className="flex h-9 w-24 items-center rounded-sm border border-border-base">
                    <button
                      type="button"
                      onClick={() => setQuantity(item.variantId, Math.max(1, item.quantity - 1))}
                      disabled={item.quantity <= 1}
                      aria-label={t("cart.decreaseQuantity")}
                      className="flex h-full flex-1 items-center justify-center text-body-strong text-text-base disabled:cursor-not-allowed disabled:text-text-muted"
                    >
                      −
                    </button>
                    {/* aria-live: קורא מסך מכריז את הכמות החדשה בכל שינוי -
                        שיפור נגישות אמיתי לעומת ה-input הקודם, לא רק תיקון
                        קוסמטי (בקשת אורן - "מה שלדעתך יהיה הכי תקני ונכון"). */}
                    <span
                      id={`qty-${item.variantId}`}
                      aria-live="polite"
                      className="flex h-full flex-1 items-center justify-center text-body text-text-base tabular-nums"
                    >
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(item.variantId, Math.min(MAX_LINE_ITEM_QUANTITY, item.quantity + 1))
                      }
                      disabled={item.quantity >= MAX_LINE_ITEM_QUANTITY}
                      aria-label={t("cart.increaseQuantity")}
                      className="flex h-full flex-1 items-center justify-center text-body-strong text-text-base disabled:cursor-not-allowed disabled:text-text-muted"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.variantId)}
                  className="px-xs py-xs text-caption text-text-muted underline hover:text-text-base"
                >
                  {t("cart.remove")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* סיכום + CTA: מובייל - fixed לתחתית המסך (לא sticky - ראו הערה
          מלאה/מאומתת ב-StickyAddToBagBar.tsx למה sticky עם offset דינמי
          לא אמין; useStickyBottomOffset דואג שזה "יפנה" את ConsentBanner.tsx/
          Footer.tsx בדיוק כמו שם). דסקטופ - כרטיס "קבוע בצד"
          (docs/SCREENS_INVENTORY.md מסך 10), sticky לראש העמודה תוך כדי
          גלילת רשימת הפריטים - לא נוגע בבאנר/בפוטר בכלל, לא צריך את
          המנגנון הזה (desktop:bottom-auto/desktop:inset-x-auto מנטרלים
          את ה-fixed ומחזירים להתנהגות המקורית). תוקן 2026-09-22 (PRD
          סעיף 52, דיווח אורן): קודם היה sticky+z-10 קבוע, מוסתר לגמרי
          מתחת לבאנר. */}
      <div
        ref={summaryRef}
        className="fixed inset-x-0 bottom-[var(--sticky-bottom-offset)] z-10 flex flex-col gap-sm border-t border-border-base bg-surface-base px-md py-md desktop:sticky desktop:inset-x-auto desktop:top-lg desktop:bottom-auto desktop:w-[320px] desktop:flex-none desktop:rounded-sm desktop:border"
        style={{ "--sticky-bottom-offset": `${bottomOffsetPx}px` } as CSSProperties}
      >
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
