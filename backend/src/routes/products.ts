// Routes לקטלוג המוצרים - קריאה בלבד (read-only). אין כאן עדיין הרשמה/הזמנות.
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { getProductBySlug } from "../lib/products.js";
import { localize, parseLocale } from "../lib/i18n.js";
import { DEFAULT_PAGE_SIZE } from "../constants/index.js";

export const productsRouter = Router();

// GET /products?locale=en|he
// רשימת קטלוג לדף listing: מוצרים פעילים בלבד, תמונת flat + תמונת campaign
// (אם קיימת) לצורך ה-hover-swap, וטווח מחיר. בלי פירוט וריאנטים מלא - זה
// נטען רק בדף הפריט עצמו (GET /products/:slug).
productsRouter.get("/", async (req, res, next) => {
  try {
    const locale = parseLocale(req.query.locale);

    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      take: DEFAULT_PAGE_SIZE,
      include: {
        variants: { where: { isActive: true }, select: { priceAgorot: true } },
        media: { orderBy: { sortOrder: "asc" } },
      },
    });

    const items = products.map((product) => {
      const prices = product.variants.map((v) => v.priceAgorot);
      const flatImage = product.media.find((m) => m.role === "FLAT") ?? null;
      const campaignImage = product.media.find((m) => m.role === "CAMPAIGN") ?? null;

      return {
        id: product.id,
        slug: product.slug,
        category: product.category,
        name: localize(product.name as Record<string, string>, locale),
        bandCreditName: product.bandCreditName,
        bandCreditUrl: product.bandCreditUrl,
        // null אם למוצר אין עדיין וריאנטים (כמו placeholder "45 Grave") -
        // גם אז הוא לא היה מגיע לכאן כי isActive=false, אבל נשארים מוגנים.
        priceAgorot: prices.length > 0 ? Math.min(...prices) : null,
        flatImageUrl: flatImage?.url ?? null,
        campaignImageUrl: campaignImage?.url ?? null,
      };
    });

    res.json({ locale, items });
  } catch (err) {
    next(err);
  }
});

// GET /products/:slug?locale=en|he
// דף פריט: כל הצירים+ערכים, כל הוריאנטים (עם איזה ערכי-ציר מרכיבים כל אחד),
// וכל המדיה (עם איזה ערכי-ציר היא תקפה עבורם). ה-frontend מצליב axisValueIds
// כדי למצוא את הוריאנט/תמונה הנכונים לבחירה נוכחית של המשתמש.
productsRouter.get("/:slug", async (req, res, next) => {
  try {
    const locale = parseLocale(req.query.locale);

    // שאילתת Prisma משותפת עם lib/metaInjection.ts (docs/PRD.md 12.10) -
    // לא כפילות מקומית, ראו lib/products.ts.
    const product = await getProductBySlug(req.params.slug);

    if (!product || !product.isActive) {
      res.status(404).json({ error: "PRODUCT_NOT_FOUND" });
      return;
    }

    res.json({
      locale,
      product: {
        id: product.id,
        slug: product.slug,
        category: product.category,
        name: localize(product.name as Record<string, string>, locale),
        description: localize(product.description as Record<string, string> | null, locale),
        bandCreditName: product.bandCreditName,
        bandCreditUrl: product.bandCreditUrl,
        axes: product.axes.map((axis) => ({
          key: axis.key,
          label: localize(axis.label as Record<string, string>, locale),
          values: axis.values.map((value) => ({
            id: value.id,
            key: value.key,
            label: localize(value.label as Record<string, string>, locale),
            dependsOnValueId: value.dependsOnValueId,
          })),
        })),
        variants: product.variants.map((variant) => ({
          id: variant.id,
          sku: variant.sku,
          priceAgorot: variant.priceAgorot,
          stockQty: variant.stockQty,
          axisValueIds: variant.axisSelections.map((s) => s.axisValueId),
        })),
        media: product.media.map((media) => ({
          role: media.role,
          url: media.url,
          altText: localize(media.altText as Record<string, string> | null, locale),
          axisValueIds: media.axisValues.map((a) => a.axisValueId),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});
