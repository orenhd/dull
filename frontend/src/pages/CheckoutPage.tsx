// עמוד ה-checkout (docs/SCREENS_INVENTORY.md מסכים 11-12, מוזגו למסך אחד
// כאן - ראו docs/PRD.md סעיף 12.4: אין תשלום אמיתי באיטרציה הזו (סעיף
// 11.2, מודל "רכישה חינמית"), אז טופס כרטיס-אשראי מדומה היה רק מטעה בלי
// לתת שום ערך אמיתי - במקום זאת, מסך אחד: פרטי משלוח + סיכום + כפתור
// "בצע הזמנה" ישיר.
//
// חמישה מצבים local, אותו route תמיד (אין ניווט נפרד ל-"תודה"):
//   1. הזמנה בוצעה הרגע (order !== null) - מסך אישור.
//   2. העגלה ריקה (ואין הזמנה שזה עתה בוצעה) - כמו המצב הריק ב-CartPage.
//      נבדק *לפני* מצב ההתחברות - לא צריך לחכות לבדיקת session בשביל
//      עגלה ריקה ממילא.
//   3. בדיקת ה-session עוד לא הסתיימה (authStore.status === "checking",
//      ראו hooks/useAuthBootstrap.ts) - מצב טעינה קצר, כדי לא "להבהב"
//      מסך Sign-In רגע לפני שמתברר שהמשתמש בעצם כבר מחובר.
//   4. אין משתמש מחובר (authStore.user === null) - הסבר קצר + כפתור Google.
//      login נדרש רק כאן, לא בשום שלב לפני (docs/PRD.md סעיף 11.4).
//   5. מחובר - טופס פרטי משלוח + סיכום הזמנה + שליחה.
//
// שדות טופס המשלוח (docs/API_CONTRACT.md: "כל מבנה - טופס המשלוח עוד לא
// נקבע סופית ב-PRD"): סט מינימלי - שם מלא, טלפון, כתובת, עיר, מיקוד - ראו
// docs/PRD.md סעיף 12.5 ו-src/types/order.ts.
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { useCartStore, selectCartTotalAgorot } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { useFreshCartItems } from "@/hooks/useFreshCartItems";
import { createOrder } from "@/lib/api/orders";
import { logout } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { formatAgorot } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import type { Order, OrderErrorBody, ShippingAddress } from "@/types/order";

const EMPTY_SHIPPING: ShippingAddress = {
  fullName: "",
  phone: "",
  addressLine: "",
  city: "",
  postalCode: "",
};

// [מפתח, type/inputMode] - לא רק שם השדה, כדי שמקלדת המובייל תתאים
// (מספרים לטלפון/מיקוד).
const SHIPPING_FIELDS = [
  { key: "fullName", type: "text" },
  { key: "phone", type: "tel" },
  { key: "addressLine", type: "text" },
  { key: "city", type: "text" },
  { key: "postalCode", type: "text" },
] as const;

export function CheckoutPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const authStatus = useAuthStore((s) => s.status);
  const setUser = useAuthStore((s) => s.setUser);
  const items = useCartStore((s) => s.items);
  const total = useCartStore(selectCartTotalAgorot);
  const clearCart = useCartStore((s) => s.clear);
  const freshItems = useFreshCartItems();

  const [shipping, setShipping] = useState<ShippingAddress>(EMPTY_SHIPPING);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  if (order) {
    return (
      <div className="mx-auto flex max-w-[640px] flex-col gap-md px-md py-xl">
        <h1 className="m-0 font-headline text-h3 font-black text-text-base">{t("checkout.successTitle")}</h1>
        <p className="m-0 text-body text-text-base">
          {t("checkout.successBody", { total: formatAgorot(order.totalAgorot) })}
        </p>
        <p className="m-0 text-caption text-text-muted">{t("checkout.successEmailNote")}</p>
        {/* קישור להזמנה עצמה (docs/SCREENS_INVENTORY.md מסך 9, OrderDetailPage.tsx) -
            נוסף עם בניית היסטוריית ההזמנות (2026-09-09), אחרי שכבר יש מסך
            פירוט אמיתי להוביל אליו. */}
        <Link
          to="/orders/$orderId"
          params={{ orderId: order.id }}
          className="self-start px-xs py-xs text-body-strong text-brand-primary underline"
        >
          {t("orders.viewOrder")}
        </Link>
        <Link to="/" className="self-start px-xs py-xs text-body-strong text-brand-primary underline">
          {t("cart.backToCatalog")}
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-[640px] flex-col gap-md px-md py-xl">
        <h1 className="m-0 font-headline text-h3 font-black text-text-base">{t("cart.emptyTitle")}</h1>
        <Link to="/" className="self-start px-xs py-xs text-body-strong text-brand-primary underline">
          {t("cart.backToCatalog")}
        </Link>
      </div>
    );
  }

  if (authStatus === "checking") {
    return (
      <div aria-busy="true" className="mx-auto flex max-w-[480px] flex-col items-center gap-md px-md py-xl text-center">
        <p className="m-0 text-body text-text-muted">{t("checkout.checkingSession")}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex max-w-[480px] flex-col items-center gap-md px-md py-xl text-center">
        <h1 className="m-0 font-headline text-h3 font-black text-text-base">{t("checkout.signInTitle")}</h1>
        <p className="m-0 text-body text-text-muted">{t("checkout.signInBody")}</p>
        {/* אם הגענו לכאן בעקבות 401 מ-handleSubmit (ראו setUser(null) שם) -
            formError עדיין מכיל את ההודעה הרלוונטית. בלי זה המשתמש היה
            "מוקפץ" לכאן בלי שום הסבר - ראו דיווח Oren, 2026-09-09. */}
        {formError && (
          <p role="alert" className="m-0 text-caption text-feedback-error">
            {formError}
          </p>
        )}
        <GoogleSignInButton />
        <Link to="/cart" className="px-xs py-xs text-caption text-text-muted underline hover:text-text-base">
          {t("checkout.backToCart")}
        </Link>
      </div>
    );
  }

  function handleFieldChange(field: keyof ShippingAddress, value: string) {
    setShipping((prev) => ({ ...prev, [field]: value }));
  }

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // best-effort - מנקים את המצב המקומי בכל מקרה (finally), כדי שהמשתמש
      // תמיד יוכל לנסות להתחבר עם חשבון אחר גם אם קריאת ה-logout עצמה נכשלה.
    } finally {
      setUser(null);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const { order: placedOrder } = await createOrder({
        items: items.map((item) => ({ productVariantId: item.variantId, quantity: item.quantity })),
        shippingAddress: shipping,
      });
      clearCart();
      setOrder(placedOrder);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        // ה-session פג/בוטל בפועל בין הרגע שה-authStore חשב שהמשתמש מחובר
        // (למשל בדיקת GET /auth/me שהצליחה בעבר) לבין רגע השליחה - מחזירים
        // ל-UI "לא מחובר" כדי שיוצג שוב כפתור ה-Sign-In.
        setUser(null);
        setFormError(t("checkout.sessionExpired"));
      } else if (error instanceof ApiError && error.status === 400) {
        const body = error.body as OrderErrorBody | null;
        if (body?.error === "OUT_OF_STOCK") {
          setFormError(t("checkout.outOfStock"));
        } else if (body?.error === "VARIANT_NOT_FOUND") {
          setFormError(t("checkout.variantNotFound"));
        } else {
          setFormError(t("checkout.genericError"));
        }
      } else {
        setFormError(t("checkout.genericError"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] min-w-0 flex-col gap-lg px-md py-lg desktop:flex-row desktop:items-start desktop:gap-xl">
      <form id="checkout-form" onSubmit={handleSubmit} className="flex min-w-0 flex-1 flex-col gap-md">
        <h1 className="m-0 font-headline text-h3 font-black text-text-base">{t("checkout.title")}</h1>

        <div className="flex items-center justify-between gap-sm text-caption text-text-muted">
          <span>{t("checkout.signedInAs", { name: user.name })}</span>
          <button type="button" onClick={handleLogout} className="underline hover:text-text-base">
            {t("checkout.signOut")}
          </button>
        </div>

        <fieldset className="m-0 flex flex-col gap-sm border-0 p-0">
          <legend className="mb-xs text-body-strong font-bold text-text-base">{t("checkout.shippingTitle")}</legend>
          {/* נוסף 2026-09-10 (docs/PRD.md סעיף 12.17, בקשת Oren: "פיתרון UI
              אלגנטי ולא תוקפני... בלי חזרתיות יתר") - הערה תמציתית אחת מתחת
              ל-legend, במקום כוכבית "*" חוזרת על כל label (שדורשת גם מקרא
              נפרד להסבר מה "*" אומר) או טקסט "(חובה)" שחוזר חמש פעמים. כל
              השדות כבר מסומנים required ב-<input> בפועל (ולידציה דפדפנית
              אמיתית) - זו רק הבהרה ויזואלית קדימה, לא באג בהיעדרה. */}
          <p className="m-0 text-caption text-text-muted">{t("checkout.allFieldsRequired")}</p>
          {SHIPPING_FIELDS.map(({ key, type }) => (
            <div key={key} className="flex flex-col gap-xs">
              <label htmlFor={key} className="text-caption text-text-muted">
                {t(`checkout.fields.${key}`)}
              </label>
              <input
                id={key}
                type={type}
                required
                value={shipping[key]}
                onChange={(event) => handleFieldChange(key, event.target.value)}
                className="rounded-sm border border-border-base px-sm py-xs text-body text-text-base"
              />
            </div>
          ))}
        </fieldset>

        {formError && (
          <p role="alert" className="m-0 text-caption text-feedback-error">
            {formError}
          </p>
        )}

        <p className="m-0 text-caption text-text-muted">{t("checkout.noRealChargeNote")}</p>
      </form>

      <div className="sticky bottom-0 z-10 -mx-md flex flex-col gap-sm border-t border-border-base bg-surface-base px-md py-md desktop:sticky desktop:top-lg desktop:bottom-auto desktop:mx-0 desktop:w-[320px] desktop:flex-none desktop:rounded-sm desktop:border">
        <h2 className="m-0 text-body-strong font-bold text-text-base">{t("checkout.summaryTitle")}</h2>
        <ul className="m-0 flex list-none flex-col gap-xs p-0">
          {freshItems.map((item) => (
            <li
              key={item.variantId}
              className="flex items-center justify-between gap-sm text-caption text-text-muted"
            >
              <span className="min-w-0 [overflow-wrap:anywhere]">
                {item.displayName} × {item.quantity}
              </span>
              <span className="flex-none text-text-base">{formatAgorot(item.priceAgorot * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between text-body-strong font-bold text-text-base">
          <span>{t("cart.total")}</span>
          <span>{formatAgorot(total)}</span>
        </div>
        <Button type="submit" form="checkout-form" disabled={submitting}>
          {submitting ? t("checkout.placingOrder") : t("checkout.placeOrder")}
        </Button>
      </div>
    </div>
  );
}
