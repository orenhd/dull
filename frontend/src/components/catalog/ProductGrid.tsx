// רשת מוצרים - משותפת ל-HomePage ול-CollectionPage. מובייל: 2 עמודות (עונה
// גם על "עמודה אחת-שתיים" של הבית וגם על "רשת 2 עמודות" של הקולקציה,
// docs/SCREENS_INVENTORY.md מסכים 1+3). דסקטופ: 4 עמודות.
import { ProductCard } from "./ProductCard";
import type { ProductListItem } from "@/types/product";

export function ProductGrid({ products }: { products: ProductListItem[] }) {
  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-md p-0 desktop:grid-cols-4">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
