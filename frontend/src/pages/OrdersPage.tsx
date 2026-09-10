// היסטוריית הזמנות (docs/SCREENS_INVENTORY.md מסך 9, MVP-גבוהה מאז סעיף 13).
// דורש login בדיוק כמו CheckoutPage - אין guard ברמת ה-route (ראו הערה
// ב-router.tsx), הבדיקה קורית כאן בתוך הקומפוננטה, עם אותה מוסכמה בדיוק:
//   1. authStatus === "checking" - מסך טעינה קצר (כמו checkout), כדי לא
//      "להבהב" מסך Sign-In למשתמש שבפועל כבר מחובר.
//   2. !user - הסבר קצר + כפתור Google (GoogleSignInButton, אותה קומפוננטה
//      כמו ב-checkout - אין מסך Sign-In "כללי" נפרד, כל מסך שדורש login
//      מטמיע את הכפתור בעצמו).
//   3. query בטעינה/שגיאה/ריק/מלא - אותה מוסכמה כמו HomePage/ProductPage.
//
// אם GET /orders מחזיר 401 בכל זאת (session פג בין הרגע שה-authStore חשב
// "מחובר" לרגע הקריאה בפועל - תרחיש נדיר אבל אפשרי, אותו מקרה בדיוק
// שתועד ב-CheckoutPage) - מאפסים את authStore.user, מה שגורם לרינדור הבא
// להציג את מסך ה-Sign-In במקום הודעת שגיאה גנרית.
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";
import { useApiLocale } from "@/hooks/useApiLocale";
import { getOrders } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";
import { localizeText } from "@/lib/localize";
import { formatAgorot } from "@/lib/money";
import { formatOrderDate } from "@/lib/date";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { LINE_BODY_STRONG, LINE_CAPTION, PULSE } from "@/components/feedback/Skeletons";
import type { OrderRecord } from "@/types/order";

function OrderRow({ order }: { order: OrderRecord }) {
  const { t } = useTranslation();
  const locale = useApiLocale();
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const firstItemName = order.items[0] ? localizeText(order.items[0].productNameSnapshot, locale) : "";

  return (
    <li className="flex flex-col gap-xs border-b border-border-base py-md">
      <div className="flex items-start justify-between gap-sm">
        <div className="flex min-w-0 flex-col gap-xs">
          {/* מציגים רק 8 התווים האחרונים של ה-id (cuid, ראו schema.prisma) -
              מספיק כמזהה קריא/קצר למשתמש, לא צריך את המזהה המלא כאן.
              <bdi> (Bidirectional Isolation, לא רק עיצוב - ראו הערה מקבילה
              ב-OrderDetailPage.tsx) עוטף את "#<id>" כיחידה אחת מבודדת מכיוון
              הטקסט הסובב - בלעדיו, בממשק העברי (RTL) הסולמית "#" היא תו
              ניטרלי שאלגוריתם ה-bidi ממקם לפי הקשר לא-עקבי (משתנה לפי התו
              הראשון בפועל של כל id - ראו דיווח Oren, 2026-09-09), ולכן
              "#" הופיעה לפעמים לפני ה-id ולפעמים אחריו. */}
          <span className="text-body-strong font-bold text-text-base">
            {t("orders.orderIdLabel")} <bdi>#{order.id.slice(-8)}</bdi>
          </span>
          <span className="text-caption text-text-muted">
            {t("orders.placedOn", { date: formatOrderDate(order.createdAt, locale) })}
          </span>
          <span className="text-caption text-text-muted [overflow-wrap:anywhere]">
            {firstItemName}
            {" · "}
            {itemCount === 1 ? t("orders.itemsCountOne") : t("orders.itemsCountOther", { count: itemCount })}
          </span>
        </div>
        <span className="flex-none text-body-strong font-bold text-text-base">{formatAgorot(order.totalAgorot)}</span>
      </div>
      <div className="flex items-center justify-between gap-sm">
        <span className="text-caption text-text-muted">{t(`orders.status.${order.status}`)}</span>
        <Link
          to="/orders/$orderId"
          params={{ orderId: order.id }}
          className="px-xs py-xs text-body-strong text-brand-primary underline"
        >
          {t("orders.viewDetails")}
        </Link>
      </div>
    </li>
  );
}

export function OrdersPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const authStatus = useAuthStore((s) => s.status);
  const setUser = useAuthStore((s) => s.setUser);

  const query = useQuery({
    queryKey: ["orders"],
    queryFn: ({ signal }) => getOrders(signal),
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
        <Link to="/" className="px-xs py-xs text-caption text-text-muted underline hover:text-text-base">
          {t("orders.backToCatalog")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-md px-md py-lg">
      <h1 className="m-0 font-headline text-h3 font-black text-text-base">{t("orders.title")}</h1>

      {query.isPending && (
        <>
          <p role="status" aria-live="polite" className="sr-only">
            {t("orders.loading")}
          </p>
          {/* תוקן 2026-09-10 (docs/PRD.md סעיף 12.17): השלד הקודם היה רק 2
              בארים גנריים (h-md/h-sm) - חסר לגמרי את השורה השנייה של
              OrderRow (סטטוס + קישור "צפייה בפרטים") ואת הסכום המיושר לימין
              בשורה הראשונה, ובנוסף השתמש בגבהי-סולם-ריווח שלא תאמו את
              גובה-השורה האמיתי של text-body-strong/text-caption. עכשיו ממפה
              את שתי השורות של OrderRow במדויק (משתמש ב-LINE_BODY_STRONG/
              LINE_CAPTION/PULSE המיוצאים מ-Skeletons.tsx, כדי לא לשכפל את
              נוסחת ה-calc() כמחרוזת). */}
          <ul className="m-0 flex list-none flex-col p-0" aria-hidden="true">
            {Array.from({ length: 3 }, (_, i) => (
              <li key={i} className="flex flex-col gap-xs border-b border-border-base py-md">
                <div className="flex items-start justify-between gap-sm">
                  <div className="flex min-w-0 flex-col gap-xs">
                    <span className={`block w-32 ${LINE_BODY_STRONG} ${PULSE}`} />
                    <span className={`block w-24 ${LINE_CAPTION} ${PULSE}`} />
                    <span className={`block w-[60%] ${LINE_CAPTION} ${PULSE}`} />
                  </div>
                  <span className={`w-16 flex-none ${LINE_BODY_STRONG} ${PULSE}`} />
                </div>
                <div className="flex items-center justify-between gap-sm">
                  <span className={`block w-20 ${LINE_CAPTION} ${PULSE}`} />
                  <span className={`w-24 ${LINE_BODY_STRONG} ${PULSE}`} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {query.isError && !(query.error instanceof ApiError && query.error.status === 401) && (
        <div className="flex flex-col gap-md">
          <p className="m-0 text-body-strong text-text-base">{t("orders.errorTitle")}</p>
          <p className="m-0 text-body text-text-muted">{t("orders.errorBody")}</p>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="self-start px-xs py-xs text-body-strong text-brand-primary underline"
          >
            {t("orders.retry")}
          </button>
        </div>
      )}

      {query.isSuccess && query.data.orders.length === 0 && (
        <div className="flex flex-col gap-md">
          <p className="m-0 text-body text-text-base">{t("orders.emptyTitle")}</p>
          <p className="m-0 text-body text-text-muted">{t("orders.emptyBody")}</p>
          <Link to="/" className="self-start px-xs py-xs text-body-strong text-brand-primary underline">
            {t("orders.backToCatalog")}
          </Link>
        </div>
      )}

      {query.isSuccess && query.data.orders.length > 0 && (
        <ul className="m-0 flex list-none flex-col p-0">
          {query.data.orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </ul>
      )}
    </div>
  );
}
