// כרטיס מוצר - משותף ל-HomePage (כל הקטלוג) ול-CollectionPage (מסונן
// לפי קטגוריה). התנהגות ה-hover-swap (flat -> campaign בדסקטופ) לפי
// docs/PRD.md סעיף 11.6 / docs/SCREENS_INVENTORY.md סעיף 13: תמונת ה-flat
// היא ברירת המחדל תמיד; ב-hover בדסקטופ בלבד היא מוחלפת לתמונת הקמפיין
// (אם קיימת - לא לכל מוצר יש אחת, ראו backend/prisma/seed.ts). במובייל
// (אין hover) מוצגת רק ה-flat, תמיד - בדיוק כפי שה-CSS למטה עושה (group-
// hover עם prefix desktop: בלבד, בלי שום JS/state).
//
// alt="" בכוונה על שתי התמונות: שם המוצר כבר מופיע כטקסט גלוי מתחת לתמונה
// וה-<Link> כולו הוא הקישור - alt מתאר היה כפול/מיותר לקורא מסך.
import { Link } from "@tanstack/react-router";
import { resolveMediaUrl } from "@/lib/api/client";
import { formatAgorot } from "@/lib/money";
import type { ProductListItem } from "@/types/product";

export function ProductCard({ product }: { product: ProductListItem }) {
  const flatUrl = product.flatImageUrl ? resolveMediaUrl(product.flatImageUrl) : null;
  const campaignUrl = product.campaignImageUrl ? resolveMediaUrl(product.campaignImageUrl) : null;

  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.slug }}
      className="group flex min-w-0 flex-col gap-xs rounded-sm"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-surface-sunken">
        {flatUrl && (
          <img
            src={flatUrl}
            alt=""
            width={1200}
            height={1200}
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
        )}
        {campaignUrl && (
          <img
            src={campaignUrl}
            alt=""
            width={1200}
            height={1200}
            loading="lazy"
            className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-(--motion-duration-base) ease-standard desktop:group-hover:opacity-100"
          />
        )}
      </div>
      <span className="text-body text-text-base [overflow-wrap:anywhere] group-hover:underline">
        {product.name}
      </span>
      {product.priceAgorot != null && (
        <span className="text-caption text-text-muted">{formatAgorot(product.priceAgorot)}</span>
      )}
    </Link>
  );
}
