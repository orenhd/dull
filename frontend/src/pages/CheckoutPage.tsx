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
import { useState, useRef, useEffect, type FormEvent, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { useCartStore, selectCartTotalAgorot } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { useFreshCartItems } from "@/hooks/useFreshCartItems";
import { useStickyBottomOffset } from "@/hooks/useStickyBottomOffset";
import { useElementHeight } from "@/hooks/useElementHeight";
import { createOrder } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";
import { formatAgorot } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { OutOfStockNotice } from "@/components/checkout/OutOfStockNotice";
import { trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics";
import type { Order, OrderErrorBody, ShippingAddress } from "@/types/order";

// מצב ה-"אזל מהמלאי" האינפורמטיבי (docs/PRD.md, בקשת Oren 2026-09-13) -
// snapshot מלא (לא רק variantId) שנלקח מ-freshItems *ברגע השליחה* (לפני
// שה-cartStore מתעדכן ל-availableQty, ראו handleSubmit) - כדי שהתמונה/שם/
// מפרט שמוצגים בהודעה תמיד יהיו של הפריט שבאמת נכשל, גם אחרי שהכמות בעגלה
// (ואולי הפריט כולו, אם availableQty===0) כבר השתנתה.
interface OutOfStockInfo {
  itemName: string;
  itemLabel: string;
  imageUrl: string | null;
  availableQty: number;
}

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
  const setQuantity = useCartStore((s) => s.setQuantity);
  const freshItems = useFreshCartItems();
  const bottomOffsetPx = useStickyBottomOffset();
  // תוקן 2026-09-23 (PRD.md סעיף 53, דיווח אורן: "אי אפשר לגלול את התוכן
  // בכלל" במובייל) - ראו useElementHeight.ts להסבר המלא. חמור יותר כאן
  // מאשר ב-CartPage.tsx כי הבר הדביק גבוה משמעותית (כותרת+רשימת פריטים+
  // סה"כ+כפתור) - בלי המדידה הזו, שדות טופס בפועל (כתובת/מיקוד) יכולים
  // להיחבא לגמרי מתחת לסיכום עם אפס דרך לגלול אליהם.
  const summaryRef = useRef<HTMLDivElement>(null);
  const summaryHeightPx = useElementHeight(summaryRef);

  const [shipping, setShipping] = useState<ShippingAddress>(EMPTY_SHIPPING);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [outOfStockInfo, setOutOfStockInfo] = useState<OutOfStockInfo | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  // docs/PRD.md סעיף 20 - "Checkout Started". יורה פעם אחת בלבד (ref, לא
  // state - אין צורך ברינדור נוסף) ברגע שכל התנאים האמיתיים מתקיימים: יש
  // פריטים בעגלה, בדיקת ה-session הסתיימה, והמשתמש בפועל מחובר (כלומר
  // ה-checkout "האמיתי", לא אחד מהמצבים הזמניים/חוסמים למעלה). מוצב לפני
  // כל return מוקדם - חובה לפי Rules of Hooks.
  const trackedCheckoutStarted = useRef(false);
  useEffect(() => {
    if (trackedCheckoutStarted.current) return;
    if (order || items.length === 0 || authStatus !== "ready" || !user) return;
    trackedCheckoutStarted.current = true;
    trackEvent(ANALYTICS_EVENTS.checkoutStarted, { itemCount: items.length, totalAgorot: total });
  }, [order, items, authStatus, user, total]);

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

  // תוקן 2026-09-23 (PRD.md סעיף 59, דיווח אורן): הטקסט הישן ("Guest
  // browsing and your bag are saved — signing in is only needed to place
  // the order." / העברית המקבילה) דווח כ"טכני מדי" וכ"שבירות שורה שנראות
  // שרירותיות" - עם text-center במיכל 480px, משפט ארוך עם מקף-אמצע ופסוקית
  // הסברית שנייה נשבר בנקודות לא-אינטואיטיביות; בעברית זה הוחמר עוד יותר
  // ע"י "אורח/ת" (נטיית מגדר עם / באמצע מילה) - שבירת שורה בדיוק אחרי ה-"/"
  // הייתה משאירה "ת" בודדת בתחילת שורה. הפתרון: קיצור דרסטי לשתי פסוקיות
  // קצרות בלי מקף-אמצע ובלי מונחים טכניים (לא מוסבר "למה זה בטוח" - רק
  // מה לעשות ולמה זה מהיר) - לא אמור להישבר בכלל ברוב רוחבי המסך, ואם כן,
  // בנקודה טבעית (בין המשפטים, לא באמצע מילה/מקף).
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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setOutOfStockInfo(null);
    try {
      const { order: placedOrder } = await createOrder({
        items: items.map((item) => ({ productVariantId: item.variantId, quantity: item.quantity })),
        shippingAddress: shipping,
      });
      clearCart();
      setOrder(placedOrder);
      // docs/PRD.md סעיף 20 - "Order Placed".
      trackEvent(ANALYTICS_EVENTS.orderPlaced, {
        orderId: placedOrder.id,
        totalAgorot: placedOrder.totalAgorot,
        itemCount: items.length,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        // ה-session פג/בוטל בפועל בין הרגע שה-authStore חשב שהמשתמש מחובר
        // (למשל בדיקת GET /auth/me שהצליחה בעבר) לבין רגע השליחה - מחזירים
        // ל-UI "לא מחובר" כדי שיוצג שוב כפתור ה-Sign-In.
        setUser(null);
        setFormError(t("checkout.sessionExpired"));
      } else if (error instanceof ApiError && error.status === 400) {
        const body = error.body as OrderErrorBody | null;
        if (body?.error === "OUT_OF_STOCK" && typeof body.availableQty === "number") {
          // freshItems כאן הוא ה-snapshot מרגע השליחה (לפני ה-setQuantity
          // למטה) - ראו הערה על OutOfStockInfo למעלה. אם הפריט לא נמצא
          // (לא אמור לקרות בפועל - נפילה חזרה להודעה הגנרית הישנה, בלי
          // תמונה/שם/מפרט ריקים).
          const failedItem = freshItems.find((i) => i.variantId === body.productVariantId);
          if (failedItem) {
            setOutOfStockInfo({
              itemName: failedItem.displayName,
              itemLabel: failedItem.displayLabel,
              imageUrl: failedItem.imageUrl,
              availableQty: body.availableQty,
            });
            // מעדכן את הכמות בעגלה בפועל ל-availableQty (בקשת Oren: "לא
            // ביקש במפורש אבל נשמע כמו שיפור UX טבעי") - 0 מסיר את הפריט
            // מהעגלה לגמרי (setQuantity הקיים כבר עושה את זה, ראו
            // cartStore.ts), לא משאיר כמות שגויה שהמשתמש צריך לתקן ידנית.
            setQuantity(body.productVariantId, body.availableQty);
          } else {
            setFormError(t("checkout.outOfStock"));
          }
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
    <div
      // תוקן 2026-09-23 (PRD.md סעיף 53) - אותה טכניקה בדיוק כמו
      // CartPage.tsx: py-lg האחיד הוחלף ל-pt-lg + pb דינמי (מובייל בלבד,
      // desktop:pb-lg מחזיר להתנהגות המקורית).
      className="mx-auto flex w-full max-w-[1200px] min-w-0 flex-col gap-lg px-md pt-lg pb-[var(--checkout-bottom-reserve)] desktop:flex-row desktop:items-start desktop:gap-xl desktop:pb-lg"
      style={{ "--checkout-bottom-reserve": `calc(var(--space-lg) + ${summaryHeightPx + bottomOffsetPx}px)` } as CSSProperties}
    >
      <form id="checkout-form" onSubmit={handleSubmit} className="flex min-w-0 flex-1 flex-col gap-md">
        <h1 className="m-0 font-headline text-h3 font-black text-text-base">{t("checkout.title")}</h1>

        {/* תוקן 2026-09-22 (בקשת אורן): כפתור "Sign out" הוסר מכאן - נשאר
            רק המשפט "מחובר כ-X" בלי אופציה לפעולה. אורן: "הוא באמת לא
            מכניס וייב של רכישה לשם" - התנתקות באמצע checkout היא פעולה
            הרסנית לזרימת הקנייה (מוחקת session, לא רק "לצאת מהתפריט"),
            ולא ברור שום תרחיש legitimate שבו משתמש עם עגלה מלאה, שני צעדים
            מסיום הזמנה, ירצה בכלל להתנתק כאן - הסרת הפיתוי עדיפה על
            השארתו "ליתר ביטחון". ה-Sign out הגלובלי (UserMenu.tsx בהדר,
            t("checkout.signOut") - אותו מפתח i18n, ראו הערה שם "משותף לא
            כפול") עדיין קיים וזמין תמיד דרך ההדר, לכל עמוד כולל זה - לא
            אבד שום capability, רק לא מוצע כאן באופן שמעודד שימוש בו.
            handleLogout/logout import הוסרו - קוד מת אחרי ההסרה. */}
        <p className="m-0 text-caption text-text-muted">{t("checkout.signedInAs", { name: user.name })}</p>

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

        {outOfStockInfo && (
          <OutOfStockNotice
            imageUrl={outOfStockInfo.imageUrl}
            itemName={outOfStockInfo.itemName}
            itemLabel={outOfStockInfo.itemLabel}
            availableQty={outOfStockInfo.availableQty}
          />
        )}

        {formError && (
          <p role="alert" className="m-0 text-caption text-feedback-error">
            {formError}
          </p>
        )}

        <p className="m-0 text-caption text-text-muted">{t("checkout.noRealChargeNote")}</p>
      </form>

      {/* עמודת סיכום+דימוי (PRD.md סעיף 58 - עדכון ספק על סעיף 56, בקשת
          אורן אחרי התייעצות): הספק הקודם היה שלוש עמודות נפרדות (טופס,
          סיכום, דימוי-צר-לצד). אורן שינה: בלי דימוי בכלל במובייל (הוסר
          למעלה), ובדסקטופ דימוי *ריבועי* שיושב *מתחת* לעמודת הסיכום -
          לא לידה כעמודה נפרדת - ברוחב זהה לה בדיוק. לכן שתיהן (כרטיס
          הסיכום + הדימוי) עברו להיות יחד תחת עטיפת-flex-col אחת, שהיא
          עכשיו העמודה היחידה השלישית בשורת ה-flex החיצונית (אחרונה
          ב-DOM - עדיין נוחתת בקצה ה"סוף" הלוגי, ימין באנגלית/שמאל
          בעברית, אותה מוסכמת RTL כמו קודם). ברוחב שהעטיפה קובעת
          (320px, אותו ערך כמו קודם) - כרטיס הסיכום עצמו עבר מ-`w-[320px]`
          ל-`w-full` (ממלא את רוחב העטיפה במקום לקבוע רוחב עצמאי).
          במובייל העטיפה לא משפיעה (בלי flex/width - ברירת מחדל block) -
          כרטיס הסיכום עדיין `fixed` (בורח מהזרימה הרגילה כרגיל, לא
          מושפע מהעטיפה סביבו), והדימוי `hidden` שם (לא רק aspect-ratio
          קטן כמו הגרסה הקודמת - עכשיו אין אותו בכלל, per §1 בבקשת אורן). */}
      <div className="desktop:flex desktop:w-[320px] desktop:flex-none desktop:flex-col desktop:gap-lg">
        {/* תוקן 2026-09-22 (PRD סעיף 52, דיווח אורן): fixed לא sticky, אותו
            מנגנון/הסבר מלא כמו CartPage.tsx ו-StickyAddToBagBar.tsx.
            תוקן 2026-09-23 (PRD סעיף 53): max-h/overflow-y-auto במובייל
            בלבד - הגנה נוספת מעבר לתיקון ה-padding: בעגלה עם הרבה פריטים
            הסיכום הזה (כותרת+רשימה+סה"כ+כפתור) יכול תיאורטית לצמוח לגובה
            שגדול מהמסך עצמו - הגבלה + גלילה פנימית מבטיחה שתמיד יישאר שטח
            פנוי למעלה למגע/גלילה של <main>, גם בעגלה גדולה. לא נוגע
            בדסקטופ (desktop:max-h-none/desktop:overflow-visible) - שם זה
            כרטיס-צד קבוע, לא צף מעל תוכן. */}
        <div
          ref={summaryRef}
          className="fixed inset-x-0 bottom-[var(--sticky-bottom-offset)] z-10 flex max-h-[70dvh] flex-col gap-sm overflow-y-auto border-t border-border-base bg-surface-base px-md py-md desktop:sticky desktop:inset-x-auto desktop:top-lg desktop:bottom-auto desktop:max-h-none desktop:w-full desktop:overflow-visible desktop:rounded-sm desktop:border"
          style={{ "--sticky-bottom-offset": `${bottomOffsetPx}px` } as CSSProperties}
        >
          <h2 className="m-0 text-body-strong font-bold text-text-base">{t("checkout.summaryTitle")}</h2>
          <ul className="m-0 flex list-none flex-col gap-xs p-0">
            {freshItems.map((item) => (
              <li
                key={item.variantId}
                className="flex items-center justify-between gap-sm text-caption text-text-muted"
              >
                {/* <bdi> רק סביב השם (לא סביב "× qty" - אומת ויזואלית שבידוד
                    רק השם מספיק, docs/PRD.md סעיף 28) - אותה מחלקת-באג bidi
                    כמו ProductPage.tsx h1 (ראו הערה שם), חמורה יותר כאן כי
                    בלי בידוד גם ה-"×" והכמות מתערבבים לסדר שגוי לגמרי. */}
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  <bdi>{item.displayName}</bdi> × {item.quantity}
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

        {/* דימוי עריכתי טליה+סל - ריבועי, מתחת לכרטיס הסיכום, דסקטופ בלבד
            (PRD.md סעיף 58, בקשת אורן [ג]). placeholder אפור בינתיים - ראו
            הערה מקבילה ב-AboutPage.tsx (סעיף 35) לאותה מוסכמה. תוכן
            הדימוי בפועל (לפי תיאור אורן): טליה יושבת, סל לידה עם כמה
            חולצות מזדקרות ממנו - הידיים עשויות להסתיר חלק מהחולצה (בניגוד
            לתמונות עמוד הפריט, שם התצוגה המלאה קריטית). כיוון-מבט/הטיית-
            גוף טליה (פנייה ימינה/שמאלה) עדיין בבירור מול אורן - ייתכן
            שיידרשו שתי גרסאות תמונה (לא שיקוף CSS - עלול להפוך טקסט/הדפס
            על החולצות אחורה) כדי שהיא תפנה פנימה לתוכן בשתי השפות; ראו
            הדיון בסלאק/הצ'אט. */}
        <div
          aria-hidden="true"
          className="hidden desktop:block desktop:aspect-square desktop:w-full desktop:rounded-sm desktop:bg-surface-sunken"
        />
      </div>
    </div>
  );
}
