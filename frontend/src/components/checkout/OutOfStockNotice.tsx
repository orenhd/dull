// הודעת "אזל מהמלאי" אינפורמטיבית ב-checkout (docs/PRD.md, בקשת Oren
// 2026-09-13) - שונה מ-components/product/SoldOutNotice.tsx: זו לא "כל
// הצבע אזל" (שמחליף את כל טופס ה-AddToBagForm בעמוד הפריט), אלא מצב חד-פעמי
// שיכול לקרות רק בגלל הפער בין תקרת הכמות בעגלה (MAX_LINE_ITEM_QUANTITY)
// לבין המלאי האמיתי, שלא נבדק בעמוד הסל עצמו - ראו CheckoutPage.tsx,
// handleSubmit, לתיעוד המלא של התרחיש. בסטייל האתר (תמונת flat + שם +
// מפרט), לא Alert דפדפן גנרי.
import { useTranslation } from "react-i18next";

interface OutOfStockNoticeProps {
  imageUrl: string | null;
  itemName: string;
  itemLabel: string;
  // המלאי האמיתי הנוכחי של הוריאנט (מגיע מהשרת, routes/orders.ts) - 0
  // אומר שהפריט כבר הוסר מהעגלה (CheckoutPage.tsx כבר קרא ל-setQuantity),
  // לא רק שהכמות עודכנה.
  availableQty: number;
}

export function OutOfStockNotice({ imageUrl, itemName, itemLabel, availableQty }: OutOfStockNoticeProps) {
  const { t } = useTranslation();

  return (
    <div role="alert" className="flex items-center gap-sm rounded-md border border-border-strong p-sm">
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          width={56}
          height={56}
          className="size-14 flex-none rounded-sm bg-surface-sunken object-cover"
        />
      )}
      <div className="flex min-w-0 flex-col gap-xs">
        <p className="m-0 text-caption font-bold text-feedback-error">
          {availableQty > 0
            ? t("checkout.outOfStockDetail.reduced", { count: availableQty })
            : t("checkout.outOfStockDetail.removed")}
        </p>
        {/* <bdi> סביב itemName (2026-09-15, docs/PRD.md סעיף 28) - אותה
            מחלקת-באג bidi כמו OrdersPage.tsx (ראו הערה שם): itemName צמוד
            ישירות ל-itemLabel באותו text node בלי בידוד. */}
        {(itemName || itemLabel) && (
          <p className="m-0 text-caption text-text-muted [overflow-wrap:anywhere]">
            <bdi>{itemName}</bdi>
            {itemName && itemLabel ? " · " : ""}
            {itemLabel}
          </p>
        )}
      </div>
    </div>
  );
}
