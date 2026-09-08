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

const routeTree = rootRoute.addChildren([
  homeRoute,
  productRoute,
  shirtsRoute,
  footwearRoute,
  aboutRoute,
  cartRoute,
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
