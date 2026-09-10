// פירוט הזמנה בודדת (GET /orders/:id) - נגישה מ-OrdersPage (כפתור "צפייה
// בפרטים") וגם ממסך האישור ב-CheckoutPage ("צפייה בהזמנה") מיד אחרי ביצוע
// הזמנה. אותה מוסכמת auth כמו OrdersPage/CheckoutPage - ראו הערה שם.
//
// 404 (ORDER_NOT_FOUND) מטופל בדיוק כמו PRODUCT_NOT_FOUND ב-ProductPage.tsx -
// גם אם ההזמנה קיימת בפועל אבל שייכת למשתמש אחר (docs/API_CONTRACT.md:
// "לא 403, בכוונה - לא לחשוף קיום") היא מוצגת כ"לא נמצאה", לא כשגיאת הרשאה.
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { orderDetailRoute } from "@/router";
import { useAuthStore } from "@/stores/authStore";
import { useApiLocale } from "@/hooks/useApiLocale";
import type { Locale } from "@/constants";
import { getOrder } from "@/lib/api/orders";
import { ApiError, resolveMediaUrl } from "@/lib/api/client";
import { localizeText } from "@/lib/localize";
import { joinSelectionLabelParts } from "@/lib/variant";
import { formatAgorot } from "@/lib/money";
import { formatOrderDate } from "@/lib/date";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { OrderDetailSkeleton } from "@/components/feedback/Skeletons";
import type { OrderRecord, OrderLineItem } from "@/types/order";

// סדר תצוגה קבוע לשדות הכתובת (types/order.ts, ShippingAddress) - לא
// מסתמכים על סדר המפתחות ב-Json כפי שחזר מהשרת.
const SHIPPING_FIELD_KEYS = ["fullName", "phone", "addressLine", "city", "postalCode"] as const;

// שורת פריט בהזמנה - כולל תמונת flat ותיאור בחירה (docs/API_CONTRACT.md,
// "צורת OrderItem", נוסף 2026-09-09 בעקבות בקשת Oren). שני השדות (`flatImageUrlSnapshot`/
// `selectionLabelSnapshot`) הם `null` בהזמנות שבוצעו לפני ה-migration - מטפלים
// בזה בחן (מסתירים את התמונה/השורה השנייה, לא מציגים placeholder/שגיאה),
// לא כמצב שגיאה.
function OrderItemRow({ item, locale }: { item: OrderLineItem; locale: Locale }) {
  const selectionLabel = item.selectionLabelSnapshot
    ? joinSelectionLabelParts(item.selectionLabelSnapshot[locale])
    : null;

  return (
    <li className="flex items-center gap-sm border-b border-border-base py-xs">
      {item.flatImageUrlSnapshot && (
        <img
          src={resolveMediaUrl(item.flatImageUrlSnapshot)}
          alt=""
          width={64}
          height={64}
          className="size-16 flex-none rounded-sm bg-surface-sunken object-cover"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-xs">
        <span className="min-w-0 [overflow-wrap:anywhere] text-body text-text-base">
          {localizeText(item.productNameSnapshot, locale)} × {item.quantity}
        </span>
        {selectionLabel && <span className="text-caption text-text-muted">{selectionLabel}</span>}
      </div>
      <span className="flex-none text-body text-text-base">{formatAgorot(item.unitPriceAgorot * item.quantity)}</span>
    </li>
  );
}

function OrderDetailContent({ order, locale }: { order: OrderRecord; locale: Locale }) {
  const { t } = useTranslation();

  const shippingLine = SHIPPING_FIELD_KEYS.map((key) => order.shippingAddress[key])
    .filter((value): value is string => Boolean(value))
    .join(", ");

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-lg px-md py-lg">
      <div className="flex flex-col gap-xs">
        <Link
          to="/orders"
          className="self-start px-xs py-xs text-caption text-text-muted underline hover:text-text-base"
        >
          ← {t("orders.backToOrders")}
        </Link>
        {/* <bdi> (Bidirectional Isolation) עוטף את "#<id>" כיחידה מבודדת מכיוון
            הטקסט הסובב - בלי זה, בממשק העברי (RTL) הסולמית "#" (תו ניטרלי)
            ממוקמת ע"י אלגוריתם ה-bidi בהתאם להקשר, לא עקבי בין id ל-id
            (תלוי בתו הראשון בפועל של כל אחד) - דיווח Oren, 2026-09-09. אותו
            תיקון גם ב-OrdersPage.tsx (OrderRow). */}
        <h1 className="m-0 font-headline text-h3 font-black text-text-base">
          {t("orders.orderIdLabel")} <bdi>#{order.id.slice(-8)}</bdi>
        </h1>
        <span className="text-caption text-text-muted">
          {t("orders.placedOn", { date: formatOrderDate(order.createdAt, locale) })}
        </span>
        <span className="text-caption text-text-muted">{t(`orders.status.${order.status}`)}</span>
      </div>

      <div className="flex flex-col gap-sm">
        <h2 className="m-0 text-body-strong font-bold text-text-base">{t("orders.itemsTitle")}</h2>
        <ul className="m-0 flex list-none flex-col gap-xs p-0">
          {order.items.map((item) => (
            <OrderItemRow key={item.id} item={item} locale={locale} />
          ))}
        </ul>
        <div className="flex items-center justify-between text-body-strong font-bold text-text-base">
          <span>{t("orders.total")}</span>
          <span>{formatAgorot(order.totalAgorot)}</span>
        </div>
      </div>

      {shippingLine && (
        <div className="flex flex-col gap-xs">
          <h2 className="m-0 text-body-strong font-bold text-text-base">{t("orders.shippingTitle")}</h2>
          <p className="m-0 text-body text-text-muted [overflow-wrap:anywhere]">{shippingLine}</p>
        </div>
      )}
    </div>
  );
}

export function OrderDetailPage() {
  const { t } = useTranslation();
  const { orderId } = orderDetailRoute.useParams();
  const locale = useApiLocale();
  const user = useAuthStore((s) => s.user);
  const authStatus = useAuthStore((s) => s.status);
  const setUser = useAuthStore((s) => s.setUser);

  const query = useQuery({
    queryKey: ["order", orderId],
    queryFn: ({ signal }) => getOrder(orderId, signal),
    enabled: user !== null,
  });

  useEffect(() => {
    if (query.error instanceof ApiError && query.error.status === 401) {
      setUser(null);
    }
  }, [query.error, setUser]);

  if (authStatus === "checking") {
    return (
      <div aria-busy="true" className="mx-auto flex max-w-[480px] flex-col items-center gap-md px-md py-xl text-center">
        <p className="m-0 text-body text-text-muted">{t("orders.checkingSession")}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex max-w-[480px] flex-col items-center gap-md px-md py-xl text-center">
        <h1 className="m-0 font-headline text-h3 font-black text-text-base">{t("orders.signInTitle")}</h1>
        <p className="m-0 text-body text-text-muted">{t("orders.signInBody")}</p>
        <GoogleSignInButton />
        <Link to="/orders" className="px-xs py-xs text-caption text-text-muted underline hover:text-text-base">
          {t("orders.backToOrders")}
        </Link>
      </div>
    );
  }

  if (query.isPending) {
    // תוקן 2026-09-10 (docs/PRD.md סעיף 12.17): היה ContentSkeleton המשותף
    // עם עמוד הפריט - צורה שונה לגמרי מפירוט הזמנה (form עם chips/select
    // מול רשימת פריטים+תמונות+סיכום). OrderDetailSkeleton הייעודי כבר כולל
    // בעצמו את כל ה-className של המעטפת האמיתית (OrderDetailContent) - אין
    // צורך בעטיפה נוספת כאן מעבר ל-aria-busy עצמו.
    return (
      <div aria-busy="true">
        <OrderDetailSkeleton />
      </div>
    );
  }

  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div className="mx-auto flex max-w-[640px] flex-col gap-md px-md py-xl">
        <h1 className="font-headline text-h3 font-black text-text-base">
          {notFound ? t("orders.notFoundTitle") : t("orders.errorTitle")}
        </h1>
        <p className="m-0 text-body text-text-base">{notFound ? t("orders.notFoundBody") : t("orders.errorBody")}</p>
        <div className="flex gap-md">
          {!notFound && (
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="px-xs py-xs text-body-strong text-brand-primary underline"
            >
              {t("orders.retry")}
            </button>
          )}
          <Link to="/orders" className="px-xs py-xs text-body-strong text-brand-primary underline">
            {t("orders.backToOrders")}
          </Link>
        </div>
      </div>
    );
  }

  return <OrderDetailContent order={query.data.order} locale={locale} />;
}
