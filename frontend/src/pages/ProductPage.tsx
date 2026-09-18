// עמוד הפריט - ראו docs/PRD.md סעיף 8א למפרט המלא (גלריה כפולה, בורר
// וריאנט, מדריך מידות, קרדיטים, חומרים) ו-docs/SCREENS_INVENTORY.md מסך 5
// למצבי הקצה (טעינה/ריק/שגיאה). מבוסס ישירות על github.com/orenhd/dull-demo
// (index.html + style.css + script.js) - ראו הערות בקומפוננטות הבנות
// לכל מקום שבו המימוש האמיתי (מול API אמיתי) חייב לסטות מהדמו הסטטי.
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { productRoute } from "@/router";
import { getProduct } from "@/lib/api/products";
import { ApiError } from "@/lib/api/client";
import { buildSearchFromSelection, deriveDesiredFromSearch, getStartingPriceAgorot } from "@/lib/variant";
import { useVariantSelection } from "@/hooks/useVariantSelection";
import { useApiLocale } from "@/hooks/useApiLocale";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProductGallery } from "@/components/product/ProductGallery";
import { AddToBagForm } from "@/components/product/AddToBagForm";
import { BandCredit } from "@/components/product/BandCredit";
import { SoldOutNotice } from "@/components/product/SoldOutNotice";
import { GallerySkeleton, ProductContentSkeleton } from "@/components/feedback/Skeletons";
import { formatAgorot } from "@/lib/money";
import { trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics";
import { PRODUCT_CATEGORY } from "@/constants";
import type { Product } from "@/types/product";

function categoryLabel(category: Product["category"], t: (key: string) => string): string {
  return category === PRODUCT_CATEGORY.footwear ? t("nav.footwear") : t("nav.shirts");
}

// תוקן 2026-09-18 (docs/PRD.md, דיווח Oren - סעיף ד.2): פריט הקטגוריה
// ב-breadcrumb הוצג בלי href בכלל (Breadcrumb.tsx מרנדר <span> ולא <Link>
// כשלא מועבר `to` - זה הרכיב עצמו עבד נכון, החוסר היה כאן בקריאה לו).
// אותם שני נתיבים בדיוק כמו ב-NAV_ITEMS (SiteHeader.tsx) - "/shirts"/
// "/footwear" - לא ערך חדש, רק ממופה לפי אותה קטגוריה כמו categoryLabel למעלה.
function categoryHref(category: Product["category"]): string {
  return category === PRODUCT_CATEGORY.footwear ? "/footwear" : "/shirts";
}

function ProductPageContent({ product }: { product: Product }) {
  const { t } = useTranslation();
  const navigate = productRoute.useNavigate();

  // docs/PRD.md סעיף 13 - קישור משותף ל-Fit/Colorway דרך query params
  // (?fit=<key>&colorway=<key>, docs/API_CONTRACT.md). כיוון URL->state:
  // נקרא **רק פעם אחת**, כ-initialDesired ל-useVariantSelection (הלאה,
  // דרך ה-lazy initializer של useState שם) - לא memoized בכוונה (זול
  // לחשב, ומכוון לא-להיכנס ל-dependency array של שום אפקט, ראו למטה).
  const search = productRoute.useSearch();
  const initialDesired = deriveDesiredFromSearch(product.axes, search);
  const selection = useVariantSelection(product, initialDesired);
  const { variant, selectedIds, isColorwaySoldOut } = selection;

  // כיוון ההפוך state->URL: כתיבה רציפה של הבחירה החיה לשורת הכתובת בכל
  // שינוי (כולל מיד ב-mount, עם ברירת המחדל/מה-URL שנקלט - כך שהכתובת
  // תמיד מדויקת ומוכנה להעתקה/שיתוף בלי צורך בכפתור "העתק קישור" נפרד).
  // replace:true חובה - כל שינוי בחירה לא אמור ליצור entry חדש בהיסטוריית
  // הדפדפן (חוויית "אחורה" גרועה אחרת). קריטי: תלוי רק ב-selection.selection
  // (לא ב-search כלל) - כדי לא ליצור לולאה מול הכיוון ההפוך למעלה.
  useEffect(() => {
    const nextSearch = buildSearchFromSelection(product.axes, selection.selection);
    // תוקן 2026-09-18 (docs/PRD.md, דיווח Oren - סעיף ד.3): resetScroll:false
    // נוסף. ברירת המחדל של TanStack Router ל-navigate() היא resetScroll:true -
    // מיועדת לניווט "אמיתי" בין עמודים (שם רצוי לחזור לראש העמוד), אבל
    // כאן ה-navigate הזה הוא רק סנכרון state->URL של אותו עמוד עצמו (בחירת
    // גיזרה/גוון/מידה, ראו הערה למעלה) - כל שינוי בחירה גרר גם איפוס
    // גלילה לא-רצוי, בדסקטופ ובמובייל כאחד (בדיוק כפי שדיווח אורן). אין
    // סיכון ל-replace:true עצמו (עדיין חובה, ראו הערה למעלה) - שני
    // האופציות עצמאיות זו מזו ב-API של TanStack Router.
    void navigate({ search: nextSearch, replace: true, resetScroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- product.axes קבוע לכל חיי הקומפוננטה; navigate יציב (route-scoped)
  }, [selection.selection]);

  // אין תת-כותרת דינאמית "בהיר/כהה" מתחת לשם המוצר (הוסר בכוונה,
  // 2026-09-08) - הסימון על ה-chip הנבחר בבורר הווריאנט כבר מספיק.
  const priceAgorot = variant?.priceAgorot ?? getStartingPriceAgorot(product.variants);

  return (
    <>
      <Breadcrumb
        items={[
          { label: t("breadcrumb.home"), to: "/" },
          { label: categoryLabel(product.category, t), to: categoryHref(product.category) },
          { label: product.name },
        ]}
      />

      <section aria-busy="false" className="mx-auto flex max-w-[1200px] min-w-0 flex-col gap-lg px-md pb-xl desktop:flex-row desktop:items-start desktop:gap-xl desktop:pt-md">
        <ProductGallery media={product.media} selectedIds={selectedIds} dimmed={isColorwaySoldOut} />

        <div className="flex min-w-0 flex-col gap-lg desktop:flex-1 desktop:basis-[400px]">
          <div className="flex flex-col gap-sm">
            {/* <bdi> (2026-09-15, docs/PRD.md סעיף 28) - אומת ויזואלית
                (Playwright) ש-h1 עצמאי (ללא dir), בלי שום Hebrew מעורב
                באותו text node, עדיין מציג שם-להקה שמתחיל בספרה הפוך
                ("Grave Tee 45" במקום "45 Grave Tee") ב-RTL - זה *לא* דרש
                טקסט עברי סמוך, בניגוד להנחה הראשונית; אלמנט block לבדו
                לא מבודד bidi paragraph כמצופה. אותה מחלקת-באג כמו
                BandCredit.tsx/Breadcrumb.tsx (ראו הערה שם). */}
            <h1 className="m-0 [overflow-wrap:anywhere] font-headline text-h2 font-black text-text-base">
              <bdi>{product.name}</bdi>
            </h1>
            {priceAgorot != null && (
              <p className="text-body-strong font-bold text-text-base">{formatAgorot(priceAgorot)}</p>
            )}
            <BandCredit bandCreditName={product.bandCreditName} bandCreditUrl={product.bandCreditUrl} />
          </div>

          {isColorwaySoldOut ? <SoldOutNotice /> : <AddToBagForm product={product} selection={selection} />}
        </div>
      </section>
    </>
  );
}

export function ProductPage() {
  const { t } = useTranslation();
  const { slug } = productRoute.useParams();
  const locale = useApiLocale();

  const query = useQuery({
    queryKey: ["product", slug, locale],
    queryFn: ({ signal }) => getProduct(slug, locale, signal),
  });

  // docs/PRD.md סעיף 20 - "Product Viewed". תלוי ב-id (לא ב-query.data
  // עצמו כ-reference) כדי לא להסתמך על structural-sharing של React Query
  // בשביל נכונות - יורה פעם אחת לכל מוצר-בפועל שבאמת נטען, גם אם ה-object
  // יוחלף ברענון locale (slug/id לא משתנים).
  const productId = query.data?.product.id;
  useEffect(() => {
    const product = query.data?.product;
    if (!product) return;
    trackEvent(ANALYTICS_EVENTS.productViewed, { slug: product.slug, name: product.name, category: product.category });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- productId (למעלה) הוא ה-dep האמיתי, לא query.data
  }, [productId]);

  if (query.isPending) {
    // תוקן 2026-09-10 (docs/PRD.md סעיף 12.17): ה-section הזה היה עם pt-md
    // קבוע (כל הרוחבים) - ה-section האמיתי למטה (ProductPageContent) מוסיף
    // ריפוד עליון רק בדסקטופ (desktop:pt-md). במובייל זה גרם ל-16px קפיצה
    // כלפי מעלה כשהתוכן האמיתי נטען - עכשיו זהה בדיוק לשורת ה-className
    // של ה-section האמיתי.
    return (
      <section aria-busy="true" className="mx-auto flex max-w-[1200px] min-w-0 flex-col gap-lg px-md pb-xl desktop:flex-row desktop:items-start desktop:gap-xl desktop:pt-md">
        <p role="status" aria-live="polite" className="sr-only">
          {t("states.loading")}
        </p>
        <GallerySkeleton />
        <div aria-hidden="true" className="flex min-w-0 flex-col gap-lg desktop:flex-1 desktop:basis-[400px]">
          <ProductContentSkeleton />
        </div>
      </section>
    );
  }

  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div className="mx-auto flex max-w-[640px] flex-col gap-md px-md py-xl">
        <h1 className="font-headline text-h3 font-black text-text-base">
          {notFound ? t("states.notFoundTitle") : t("states.errorTitle")}
        </h1>
        <p className="m-0 text-body text-text-base">{notFound ? t("states.notFoundBody") : t("states.errorBody")}</p>
        <div className="flex gap-md">
          {!notFound && (
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="px-xs py-xs text-body-strong text-brand-primary underline"
            >
              {t("states.retry")}
            </button>
          )}
          <Link to="/" className="px-xs py-xs text-body-strong text-brand-primary underline">
            {t("states.backLink")}
          </Link>
        </div>
      </div>
    );
  }

  return <ProductPageContent product={query.data.product} />;
}
