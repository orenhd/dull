// עמוד הבית (docs/SCREENS_INVENTORY.md מסך 1) - גלריית הקטלוג המלאה (בלי
// סינון קטגוריה, זה תפקיד CollectionPage.tsx). אין מצב "ריק" כאן (הקטלוג
// תמיד מציג משהו) - רק טעינה/שגיאה/הצלחה, בדיוק כמו שהמסמך מפרט.
//
// עד כה זה היה stub עם קישור ידני לעמוד הפריט (לצורך בדיקה בזמן שרק הוא
// היה בנוי) - הוחלף עכשיו ברשת מוצרים אמיתית מול GET /products.
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/lib/api/products";
import { resolveMediaUrl } from "@/lib/api/client";
import { useApiLocale } from "@/hooks/useApiLocale";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { CatalogGridSkeleton } from "@/components/feedback/Skeletons";

// באנר עמוד-הבית (docs/PRD.md סעיף 29) - תמונה סטטית, לא קשורה למוצר/DB
// (בניגוד ל-Media של מוצרים, ראו types/product.ts) - אז אין endpoint/שדה
// ב-API בשבילה. מוגשת בכל זאת דרך אותו "/images" סטטי כמו כל תמונה אחרת
// באתר (backend/src/index.ts, express.static על PUBLIC_IMAGES_DIR) - שני
// הקבצים המקוריים (hi-res/group-homepage-shirts-{light,dark}.jpg) עוברים
// המרה אוטומטית ל-webp דרך `npm run images:generate` (backend/scripts/
// generate-web-images.ts, לפי שם-קובץ בלבד - לא תלוי DB/seed), שרץ ממילא
// בכל build ב-Render (backend/README.md, "Build Command"). resolveMediaUrl
// (כמו כל media.url אחר) כדי לעבוד גם מול :4000 מקומי וגם מול production.
const HOMEPAGE_BANNER_LIGHT_URL = "/images/group-homepage-shirts-light.webp";
const HOMEPAGE_BANNER_DARK_URL = "/images/group-homepage-shirts-dark.webp";

export function HomePage() {
  const { t } = useTranslation();
  const locale = useApiLocale();

  const query = useQuery({
    queryKey: ["products", locale],
    queryFn: ({ signal }) => getProducts(locale, signal),
  });

  return (
    <div className="flex flex-col gap-lg py-lg">
      {/* הכותרת הויזואלית "Dull" מעל הבאנר הוסרה (בקשת Oren, 2026-09-15,
          "מיותרת") - כפולה מול ה-wordmark שכבר קבוע ב-SiteHeader.tsx בכל
          עמוד. נשאר h1 אחד ל-sr-only בלבד: SiteHeader.tsx מציג "DULL"
          כ-<Link>, לא כ-h1 - בלעדיו לעמוד הבית לא היה שום h1 בכלל (רגרסיית
          a11y/SEO קטנה, מוסכמת "h1 אחד לעמוד" - לא ביקש להסיר את זה, רק
          את התצוגה הויזואלית). */}
      <h1 className="sr-only">{t("home.title")}</h1>

      {/* פס תמונה על כל רוחב החלון (בקשת Oren, 2026-09-08) - במקום התת-כותרת
          שהוסרה. יוצא במכוון מחוץ ל-max-w-[1200px] (בלי עטיפה) כדי להיות
          edge-to-edge - <main> עצמו לא מוסיף padding אופקי אז זה עובד
          "בחינם".

          שתי תמונות (docs/PRD.md סעיף 29, 2026-09-15) - light כברירת מחדל/
          ראשונה, dark מדוזלת מעליה בלולאה איטית (animate-homepage-banner-
          crossfade, styles/index.css). שכבת ה-light נשארת opacity קבוע -
          רק ה-dark מונפשת (0<->1) - כך תמונה אחת בלבד צריכה אנימציה.

          object-cover object-[center_68%] - **שני utilities נפרדים, שניהם
          חובה יחד** (object-cover=object-fit, object-[center_68%]=object-
          position בלבד - לא תחליף אחד לשני, ראו רגרסיה 2026-09-15 #2
          שקרתה בדיוק מזה).

          aspect-[2.8/1] (עדכון 2026-09-15 #3, **לא** aspect-[3/1] כמו קודם)
          + object-[center_68%] (**לא** 85% כמו קודם) - עדכון #2 (85%,
          aspect 3/1) יצא שגוי: 85% קרוב מדי ל-100% (=כל החיתוך מהראש),
          וחתך את הראש של כולם, לא רק של אלון כמתוכנן. הסיבה האמיתית עמוקה
          יותר מטעות בערך בודד - היא מתמטית: ב-aspect-[3/1] וברזולוציית
          המקור (3168x1344, יחס 2.357:1) חובה לחתוך 288px אנכית (21.4%
          מהגובה) כדי למלא את הקופסה. אבל השוליים ה"בטוחים" בתמונה עצמה -
          מראש הדמות השנייה (לא אלון) ועד לסוליה הכי-נמוכה מכל הסנדלים -
          הם רק כ-231px ביחד (145 למעלה + 86 למטה, נמדד ב-Python/PIL על שתי
          התמונות hi-res). 288 > 231 - אין שום ערך position שיכול לחתוך רק
          את אלון בלי לגעת גם בראש מישהו אחר או בסנדל של מישהו - זו לא
          טעות-מדידה, זה חוסר-התאמה מובנה בין יחס-התמונה (3:1) לתוכן. הפתרון:
          הורדת יחס-הרוחב-לגובה ל-2.8:1 (הבאנר גבוה ב~7% יותר) מקטינה את
          החיתוך הנדרש ל~213px - נכנס בנוח בתוך תקציב 231px השוליים
          הבטוחים. ב-68% (144.5px מלמעלה / 68px מלמטה): נחתכות רק כ-15px
          משיער אלון (בתמונה הכהה בלבד - בתמונה הבהירה אף אחד לא נחתך כלל),
          כל שאר הראשים שלמים, וכל הסנדלים נשארים עם שוליים (בין 18px ל-
          הסנדל הנמוך ביותר). אומת חזותית עם Playwright על ה-CSS המקומפל
          בפועל (לא רק הדמיה ב-PIL) בשני הרוחבים 390 ו-1920px, ועל שתי
          התמונות בנפרד - ראו הסבר מלא + מדידות מדויקות בסעיף 32 ב-
          docs/PRD.md. */}
      <div aria-hidden="true" className="relative aspect-[2.8/1] w-full overflow-hidden bg-surface-sunken">
        <img
          src={resolveMediaUrl(HOMEPAGE_BANNER_LIGHT_URL)}
          alt=""
          className="absolute inset-0 size-full object-cover object-[center_68%]"
        />
        <img
          src={resolveMediaUrl(HOMEPAGE_BANNER_DARK_URL)}
          alt=""
          className="absolute inset-0 size-full animate-homepage-banner-crossfade object-cover object-[center_68%]"
        />
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
