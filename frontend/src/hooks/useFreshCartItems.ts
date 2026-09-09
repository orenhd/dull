// מחלץ עבור פריטי העגלה שם/תווית-בחירה טריים בשפה הנוכחית, במקום הערכים
// שנשמרו ב-cartStore בזמן ה-"Add to Bag" (שם/תווית שם הם מחרוזות פשוטות,
// לא מפתחות i18n - לא מתעדכנים לבד בהחלפת שפה). הוצא לכאן מתוך CartPage.tsx
// (2026-09-08) כדי שגם CheckoutPage.tsx יוכל להציג סיכום הזמנה עם אותה
// לוגיקה, בלי לשכפל את ה-useQueries/Map.
//
// עדיפות לנתונים טריים; נופלים ל-cache השמור על ה-CartItem רק כל עוד
// ה-fetch עוד לא חזר, נכשל, או שהוריאנט כבר לא קיים במוצר (הוסר/הפך
// ללא-פעיל).
import { useQueries } from "@tanstack/react-query";
import { useCartStore, type CartItem } from "@/stores/cartStore";
import { useApiLocale } from "./useApiLocale";
import { getProduct } from "@/lib/api/products";
import { variantSelectionLabel } from "@/lib/variant";
import type { Product } from "@/types/product";

export interface FreshCartItem extends CartItem {
  displayName: string;
  displayLabel: string;
}

export function useFreshCartItems(): FreshCartItem[] {
  const locale = useApiLocale();
  const items = useCartStore((s) => s.items);
  const uniqueSlugs = [...new Set(items.map((item) => item.productSlug))];

  const productQueries = useQueries({
    queries: uniqueSlugs.map((slug) => ({
      queryKey: ["product", slug, locale],
      queryFn: ({ signal }: { signal: AbortSignal }) => getProduct(slug, locale, signal),
    })),
  });

  const freshProductBySlug = new Map<string, Product>();
  uniqueSlugs.forEach((slug, i) => {
    const product = productQueries[i]?.data?.product;
    if (product) freshProductBySlug.set(slug, product);
  });

  return items.map((item) => {
    const freshProduct = freshProductBySlug.get(item.productSlug);
    const freshVariant = freshProduct?.variants.find((v) => v.id === item.variantId);
    return {
      ...item,
      displayName: freshProduct?.name ?? item.productName,
      displayLabel:
        freshProduct && freshVariant ? variantSelectionLabel(freshProduct.axes, freshVariant) : item.selectionLabel,
    };
  });
}
