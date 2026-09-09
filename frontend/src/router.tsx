// TanStack Router - routing עם code-based routes (לא file-based/router-plugin
// בכוונה: זה נמנע מצעד codegen נוסף (routeTree.gen.ts) בזמן ש-מבנה הנתיבים
// עוד קטן ובתנועה - TECH_SPEC.md סעיף 5 מתכנן להוסיף עמודים אחד-אחד. עדיין
// type-safe במלואו: `Route.useParams()` בעמוד הפריט מוקלד `{ slug: string }`
// בזכות ה-module augmentation בתחתית הקובץ, לא בזכות codegen).
import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { RootLayout } from "@/components/layout/RootLayout";
import { HomePage } from "@/pages/HomePage";
import { ProductPage } from "@/pages/ProductPage";
import { CollectionPage } from "@/pages/CollectionPage";
import { AboutPage } from "@/pages/AboutPage";
import { CartPage } from "@/pages/CartPage";
import { CheckoutPage } from "@/pages/CheckoutPage";
import { OrdersPage } from "@/pages/OrdersPage";
import { OrderDetailPage } from "@/pages/OrderDetailPage";
import { DisclaimerPage } from "@/pages/DisclaimerPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PRODUCT_CATEGORY } from "@/constants";

const rootRoute = createRootRoute({
  component: () => (
    <RootLayout>
      <Outlet />
    </RootLayout>
  ),
  notFoundComponent: NotFoundPage,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

// /products/$slug - $slug הוא path param מוקלד. ראו src/pages/ProductPage.tsx.
export const productRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products/$slug",
  component: ProductPage,
});

// שני עמודי קולקציה (docs/SCREENS_INVENTORY.md מסכים 3-4) - אותה
// CollectionPage.tsx, פרמטרית לפי category. ראו הערה בראש אותו קובץ.
const shirtsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shirts",
  component: () => <CollectionPage category={PRODUCT_CATEGORY.shirt} titleKey="nav.shirts" />,
});

const footwearRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/footwear",
  component: () => <CollectionPage category={PRODUCT_CATEGORY.footwear} titleKey="nav.footwear" />,
});

// /about - עימוד הכנה בלבד (docs/SCREENS_INVENTORY.md מסך 6), ראו הערה
// ב-AboutPage.tsx.
const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: AboutPage,
});

// /cart - docs/SCREENS_INVENTORY.md מסך 10. שם קובע: הכל local (Zustand
// cartStore), אין fetch/params.
const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cart",
  component: CartPage,
});

// /checkout - docs/SCREENS_INVENTORY.md מסכים 11-12 (מוזגו למסך אחד, ראו
// הערה בראש CheckoutPage.tsx). אין guard ברמת ה-router (למשל beforeLoad
// שבודק authStore) - הבדיקה "האם מחובר" (מסונכרנת מול GET /auth/me, ראו
// stores/authStore.ts ו-hooks/useAuthBootstrap.ts) קורית בתוך הקומפוננטה
// עצמה (מציגה מסך Sign-In/טעינה במקום הטופס), לא כניתוב-מחדש ברמת ה-route.
const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/checkout",
  component: CheckoutPage,
});

// /orders - היסטוריית הזמנות (docs/SCREENS_INVENTORY.md מסך 9, MVP-גבוהה
// מאז סעיף 13). אותה מוסכמת auth כמו /checkout ממש למעלה - אין guard
// ברמת ה-router, הבדיקה קורית בתוך OrdersPage עצמה.
const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders",
  component: OrdersPage,
});

// /orders/$orderId - פירוט הזמנה בודדת. מיוצא (כמו productRoute למעלה)
// כי OrderDetailPage.tsx צריך את ה-route object עצמו בשביל useParams()
// המוקלד ({ orderId: string }, ראו module augmentation בתחתית הקובץ).
export const orderDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders/$orderId",
  component: OrderDetailPage,
});

// /disclaimer - Disclaimer זכויות להקות + באנר חד-פעמי (docs/SCREENS_INVENTORY.md
// מסך 7). מגיעים לכאן משני מקומות: DisclaimerBanner.tsx (הבאנר החד-פעמי
// בכניסה הראשונה) ו-Footer.tsx (קישור קבוע "לפרטים נוספים", לחזרה גם אחרי
// שהבאנר נסגר). אין auth/params - עמוד תוכן סטטי לחלוטין.
const disclaimerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/disclaimer",
  component: DisclaimerPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  productRoute,
  shirtsRoute,
  footwearRoute,
  aboutRoute,
  cartRoute,
  checkoutRoute,
  ordersRoute,
  orderDetailRoute,
  disclaimerRoute,
]);

export const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFoundPage,
  // אין preloading אגרסיבי (intent) בשלב הזה - לא קריטי לדף יחיד, אפשר
  // להדק ביצועים כשיהיו כמה עמודים אמיתיים לנווט ביניהם.

  // איפוס scroll במעבר עמוד (בקשת Oren, 2026-09-08). ה-router מאפס scroll
  // ל-window אוטומטית תמיד (התנהגות ברירת מחדל, לא תלויה ב-scrollRestoration),
  // אבל מאז ה-app-shell ב-RootLayout.tsx ה-scroll "חי" בתוך <main> ולא
  // בחלון עצמו - אז צריך לפרש ל-router באיזה אלמנט נוסף לאפס. אימתתי את
  // ההתנהגות הזו בקריאת המקור בפועל (node_modules/@tanstack/router-core/
  // src/scroll-restoration.ts) - לא בהרצה, בהתאם למחויבות שלא להריץ build
  // דרך ה-bridge - אז שווה לוודא ויזואלית שזה עובד כצפוי.
  scrollToTopSelectors: ["#main"],
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
