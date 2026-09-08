// עמוד הפריט - ראו docs/PRD.md סעיף 8א למפרט המלא (גלריה כפולה, בורר
// וריאנט, מדריך מידות, קרדיטים, חומרים) ו-docs/SCREENS_INVENTORY.md מסך 5
// למצבי הקצה (טעינה/ריק/שגיאה). מבוסס ישירות על github.com/orenhd/dull-demo
// (index.html + style.css + script.js) - ראו הערות בקומפוננטות הבנות
// לכל מקום שבו המימוש האמיתי (מול API אמיתי) חייב לסטות מהדמו הסטטי.
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { productRoute } from "@/router";
import { getProduct } from "@/lib/api/products";
import { ApiError } from "@/lib/api/client";
import { getStartingPriceAgorot } from "@/lib/variant";
import { useVariantSelection } from "@/hooks/useVariantSelection";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProductGallery } from "@/components/product/ProductGallery";
import { AddToBagForm } from "@/components/product/AddToBagForm";
import { BandCredit } from "@/components/product/BandCredit";
import { SoldOutNotice } from "@/components/product/SoldOutNotice";
import { GallerySkeleton, ContentSkeleton } from "@/components/feedback/Skeletons";
import { formatAgorot } from "@/lib/money";
import { PRODUCT_CATEGORY, type Locale } from "@/constants";
import type { Product } from "@/types/product";

function useApiLocale(): Locale {
  const { i18n } = useTranslation();
  const resolved = i18n.resolvedLanguage ?? i18n.language;
  return resolved === "he" ? "he" : "en";
}

function categoryLabel(category: Product["category"], t: (key: string) => string): string {
  return category === PRODUCT_CATEGORY.footwear ? t("nav.footwear") : t("nav.shirts");
}

function ProductPageContent({ product }: { product: Product }) {
  const { t } = useTranslation();
  const selection = useVariantSelection(product);
  const { variant, selectedIds, isColorwaySoldOut } = selection;

  // אין תת-כותרת דינאמית "בהיר/כהה" מתחת לשם המוצר (הוסר בכוונה,
  // 2026-09-08) - הסימון על ה-chip הנבחר בבורר הווריאנט כבר מספיק.
  const priceAgorot = variant?.priceAgorot ?? getStartingPriceAgorot(product.variants);

  return (
    <>
      <Breadcrumb
        items={[
          { label: t("breadcrumb.home"), to: "/" },
          { label: categoryLabel(product.category, t) },
          { label: product.name },
        ]}
      />

      <section aria-busy="false" className="mx-auto flex max-w-[1200px] min-w-0 flex-col gap-lg px-md pb-xl desktop:flex-row desktop:items-start desktop:gap-xl desktop:pt-md">
        <ProductGallery media={product.media} selectedIds={selectedIds} dimmed={isColorwaySoldOut} />

        <div className="flex min-w-0 flex-col gap-lg desktop:flex-1 desktop:basis-[400px]">
          <div className="flex flex-col gap-sm">
            <h1 className="m-0 [overflow-wrap:anywhere] font-headline text-h2 font-black text-text-base">
              {product.name}
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

  if (query.isPending) {
    return (
      <section aria-busy="true" className="mx-auto flex max-w-[1200px] min-w-0 flex-col gap-lg px-md pt-md pb-xl desktop:flex-row desktop:items-start desktop:gap-xl">
        <p role="status" aria-live="polite" className="sr-only">
          {t("states.loading")}
        </p>
        <GallerySkeleton />
        <div className="min-w-0 desktop:flex-1 desktop:basis-[400px]">
          <ContentSkeleton />
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
