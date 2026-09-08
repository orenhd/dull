// עמוד קולקציה (docs/SCREENS_INVENTORY.md מסכים 3-4) - אותה קומפוננטה
// משותפת לשתי הקטגוריות (טי-שירטס / נעליים), פרמטרית לפי category+titleKey.
//
// יש רק שתי קטגוריות קולקציה בפועל - Shirts ו-Footwear (enum ProductCategory
// ב-backend/prisma/schema.prisma). PRD.md/SCREENS_INVENTORY.md תיארו במקור
// קטגוריה שלישית ("פריטי הלבשה קלילים נוספים") שמעולם לא תואמה ב-DB - זו
// הייתה סתירת תיעוד גרידא (סעיף PRD §12.2, תוקן 2026-09-08 אחרי אישור בעל
// המוצר), לא שינוי קוד - הקובץ הזה כבר היה בנוי נכון.
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/lib/api/products";
import { useApiLocale } from "@/hooks/useApiLocale";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { CatalogGridSkeleton } from "@/components/feedback/Skeletons";
import type { ProductCategory } from "@/types/product";

interface CollectionPageProps {
  category: ProductCategory;
  titleKey: "nav.shirts" | "nav.footwear";
}

export function CollectionPage({ category, titleKey }: CollectionPageProps) {
  const { t } = useTranslation();
  const locale = useApiLocale();

  const query = useQuery({
    queryKey: ["products", locale],
    queryFn: ({ signal }) => getProducts(locale, signal),
  });

  // סינון קטגוריה בצד הלקוח: GET /products מחזיר תמיד את כל הקטלוג הפעיל
  // בבת אחת, בלי query param לקטגוריה (ראו backend/src/routes/products.ts) -
  // קטלוג קטן מספיק (DEFAULT_PAGE_SIZE=24, ובפועל כרגע 3 מוצרים פעילים)
  // שזה לא עומס מיותר. אם הקטלוג יגדל משמעותית, שווה לחזור ולשקול פילטור
  // בצד השרת - לא נדרש היום.
  const items = query.data?.items.filter((item) => item.category === category) ?? [];

  return (
    <>
      <Breadcrumb items={[{ label: t("breadcrumb.home"), to: "/" }, { label: t(titleKey) }]} />

      <div className="mx-auto flex max-w-[1200px] min-w-0 flex-col gap-lg px-md pb-xl">
        {query.isPending && (
          <>
            <p role="status" aria-live="polite" className="sr-only">
              {t("catalog.loading")}
            </p>
            <CatalogGridSkeleton />
          </>
        )}

        {query.isError && (
          <div className="flex flex-col gap-md">
            <p className="m-0 text-body-strong text-text-base">{t("catalog.errorTitle")}</p>
            <p className="m-0 text-body text-text-muted">{t("catalog.errorBody")}</p>
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="self-start px-xs py-xs text-body-strong text-brand-primary underline"
            >
              {t("catalog.retry")}
            </button>
          </div>
        )}

        {query.isSuccess &&
          (items.length > 0 ? (
            <ProductGrid products={items} />
          ) : (
            <p className="m-0 text-body text-text-muted">{t("catalog.empty")}</p>
          ))}
      </div>
    </>
  );
}
