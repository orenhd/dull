// עגלה - client-only, stateless מול ה-backend (TECH_SPEC.md סעיף 1: "נשלחת
// בשלמותה ב-checkout, אין Cart table"). persist ל-localStorage כדי שהעגלה
// לא תיעלם ברענון דף - ה-backend לא יודע על קיומה עד POST /orders בפועל.
//
// עמוד הפריט הוא ה-caller היחיד כרגע (AddToBagForm) - עמוד עגלה ייעודי
// (docs/SCREENS_INVENTORY.md מסך 10) עוד לא נבנה, אבל ה-store כבר שלם
// ומוכן לצריכה משם בלי שינוי.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CART_STORAGE_KEY } from "@/constants";

export interface CartItem {
  variantId: string;
  productSlug: string;
  productName: string;
  sku: string;
  priceAgorot: number;
  quantity: number;
  imageUrl: string | null;
  // תווית קריאה-לבנאדם של הבחירה, למשל "Women's · Faded Batik · M" -
  // נבנית פעם אחת בזמן ההוספה כי אז יש לנו את כל תוויות הצירים ביד; לא
  // משוחזרת מ-axisValueIds בעמוד העגלה כדי לא להיתלות שם שוב ב-API.
  selectionLabel: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId ? { ...i, quantity: i.quantity + quantity } : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
        }),

      removeItem: (variantId) =>
        set((state) => ({ items: state.items.filter((i) => i.variantId !== variantId) })),

      setQuantity: (variantId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.variantId !== variantId)
              : state.items.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)),
        })),

      clear: () => set({ items: [] }),
    }),
    { name: CART_STORAGE_KEY },
  ),
);

export function selectCartTotalAgorot(state: CartState): number {
  return state.items.reduce((sum, item) => sum + item.priceAgorot * item.quantity, 0);
}

export function selectCartItemCount(state: CartState): number {
  return state.items.reduce((sum, item) => sum + item.quantity, 0);
}
