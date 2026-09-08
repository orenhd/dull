// עמוד הבית (docs/SCREENS_INVENTORY.md מסך 1) - גלריית הקטלוג המלאה (בלי
// סינון קטגוריה, זה תפקיד CollectionPage.tsx). אין מצב "ריק" כאן (הקטלוג
// תמיד מציג משהו) - רק טעינה/שגיאה/הצלחה, בדיוק כמו שהמסמך מפרט.
//
// עד כה זה היה stub עם קישור ידני לעמוד הפריט (לצורך בדיקה בזמן שרק הוא
// היה בנוי) - הוחלף עכשיו ברשת מוצרים אמיתית מול GET /products.
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/lib/api/products";
import { useApiLocale } from "@/hooks/useApiLocale";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { CatalogGridSkeleton } from "@/components/feedback/Skeletons";
import { wordmarkClassName } from "@/lib/wordmark";

export function HomePage() {
  const { t } = useTranslation();
  const locale = useApiLocale();

  const query = useQuery({
    queryKey: ["products", locale],
    queryFn: ({ signal }) => getProducts(locale, signal),
  });

  return (
    <div className="flex flex-col gap-lg py-lg">
      <div className="mx-auto w-full max-w-[1200px] px-md">
        <h1 className={wordmarkClassName("h1")}>{t("home.title")}</h1>
      </div>

      {/* פס תמונה על כל רוחב החלון (בקשת Oren, 2026-09-08) - במקום התת-כותרת
          שהוסרה. פלייסהולדר בלבד: התמונה האמיתית (כל 6 הדוגמנים לצד זה) עוד
          לא קיימת - להחליף ל-<img> אמיתי כשהיא תגיע, ולשמור על אותו aspect
          לא לגרום ל-layout shift. יוצא במכוון מחוץ ל-max-w-[1200px] (בלי
          עטיפה) כדי להיות edge-to-edge - <main> עצמו לא מוסיף padding אופקי
          אז זה עובד "בחינם". */}
      <div
        aria-hidden="true"
        className="flex aspect-[3/1] w-full items-center justify-center bg-surface-sunken"
      >
        <span className="px-md text-center text-caption text-text-muted">
          {t("home.campaignBannerPlaceholder")}
        </span>
      </div>

      <div className="mx-auto flex w-full max-w-[1200px] min-w-0 flex-col gap-lg px-md">
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

        {query.isSuccess && <ProductGrid products={query.data.items} />}
      </div>
    </div>
  );
}
