// טיפוסים מקבילים לתגובת ה-API (docs/API_CONTRACT.md ו-backend/src/routes/
// products.ts). בכוונה *לא* זהים לסכימת ה-DB (backend/prisma/schema.prisma):
// ה-API כבר מבצע localize() בצד השרת, כך ששדות כמו `name`/`label` מגיעים
// כ-string פשוט (בשפת ה-`locale` שביקשנו), לא כ-{ en, he } - הריבוי-לשוני
// הוא פרט מימוש של ה-backend, לא חלק מהחוזה.

import type { PRODUCT_CATEGORY, MEDIA_ROLE } from "@/constants";

export type ProductCategory = (typeof PRODUCT_CATEGORY)[keyof typeof PRODUCT_CATEGORY];
export type MediaRole = (typeof MEDIA_ROLE)[keyof typeof MEDIA_ROLE];

export interface ProductListItem {
  id: string;
  slug: string;
  category: ProductCategory;
  name: string;
  bandCreditName: string | null;
  bandCreditUrl: string | null;
  priceAgorot: number | null;
  flatImageUrl: string | null;
  campaignImageUrl: string | null;
}

export interface ProductsListResponse {
  locale: string;
  items: ProductListItem[];
}

export interface AxisValue {
  id: string;
  key: string;
  label: string;
  // ה-id של ערך-הציר שהערך הזה תלוי בו (למשל מידה תלויה בגזרה) - null אם
  // הערך תמיד רלוונטי. ראו schema.prisma / VariantAxisValue.dependsOnValueId.
  dependsOnValueId: string | null;
}

export interface VariantAxis {
  key: string; // "fit" | "colorway" | "size" - לא נעול בקוד, מגיע מה-DB
  label: string;
  values: AxisValue[];
}

export interface ProductVariant {
  id: string;
  sku: string;
  priceAgorot: number;
  stockQty: number;
  // אילו ערכי-ציר (מכל הצירים) מרכיבים את הוריאנט הזה - ראו src/lib/variant.ts
  // ללוגיקת ההצלבה מול בחירת המשתמש.
  axisValueIds: string[];
}

export interface Media {
  role: MediaRole;
  url: string;
  altText: string | null;
  // בד"כ subset של הצירים (למשל רק Fit+Colorway, בלי Size) - אותה תמונה
  // משרתת כמה וריאנטים. ראו src/lib/variant.ts.
  axisValueIds: string[];
}

export interface Product {
  id: string;
  slug: string;
  category: ProductCategory;
  name: string;
  description: string | null;
  bandCreditName: string | null;
  bandCreditUrl: string | null;
  axes: VariantAxis[];
  variants: ProductVariant[];
  media: Media[];
}

export interface ProductResponse {
  locale: string;
  product: Product;
}
