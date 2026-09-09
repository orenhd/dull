// שליפת מוצר בודד לפי slug, עם כל הכלולים (axes/values, variants+
// axisSelections, media+axisValues) - נקודת אמת יחידה שגם ה-JSON API
// (routes/products.ts, GET /products/:slug) וגם שכבת ה-meta-injection
// (lib/metaInjection.ts, docs/PRD.md סעיף 12.10) קוראות לה, כדי לא לשכפל
// את אותה שאילתת Prisma בשני מקומות.
import { prisma } from "./prisma.js";

export function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      axes: {
        orderBy: { sortOrder: "asc" },
        include: { values: { orderBy: { sortOrder: "asc" } } },
      },
      variants: {
        where: { isActive: true },
        include: { axisSelections: true },
      },
      media: {
        orderBy: { sortOrder: "asc" },
        include: { axisValues: true },
      },
    },
  });
}

export type ProductWithRelations = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;
