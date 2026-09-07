// Routes להזמנות - כולן דורשות משתמש מחובר (requireAuth), מותקן ב-index.ts
// על כל הראוטר. העגלה עצמה חיה רק ב-frontend (localStorage) עד checkout -
// כל הבקשה נשלחת בבת אחת ל-POST /, אין טבלת Cart בסכמה בכוונה.
import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const ordersRouter = Router();

ordersRouter.use(requireAuth);

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productVariantId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  // שדות חופשיים כרגע (Json בסכמה) - עדיין לא הוגדר טופס משלוח סופי ב-PRD.
  shippingAddress: z.record(z.string(), z.unknown()),
});

// POST /orders - יוצר הזמנה. המחיר תמיד מחושב כאן משרת מה-DB (variant.priceAgorot),
// אף פעם לא נלקח מהלקוח - אחרת כל אחד יכול "לשלוח" מחיר 1 אגורה מה-devtools.
ordersRouter.post("/", async (req, res, next) => {
  try {
    const body = createOrderSchema.parse(req.body);
    const userId = req.user!.id;

    const variantIds = body.items.map((item) => item.productVariantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds }, isActive: true },
      include: { product: true },
    });
    const variantById = new Map(variants.map((v) => [v.id, v]));

    for (const item of body.items) {
      const variant = variantById.get(item.productVariantId);
      if (!variant) {
        res.status(400).json({ error: "VARIANT_NOT_FOUND", productVariantId: item.productVariantId });
        return;
      }
      if (variant.stockQty < item.quantity) {
        res.status(400).json({ error: "OUT_OF_STOCK", productVariantId: item.productVariantId });
        return;
      }
    }

    const totalAgorot = body.items.reduce((sum, item) => {
      const variant = variantById.get(item.productVariantId)!;
      return sum + variant.priceAgorot * item.quantity;
    }, 0);

    // טרנזקציה אחת: יוצרים את ההזמנה + כל השורות + מורידים מלאי, הכל-או-כלום.
    // isSimulatedPayment נשאר בברירת המחדל true (schema) - v1 אין סליקה אמיתית.
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId,
          totalAgorot,
          shippingAddress: body.shippingAddress as Prisma.InputJsonValue,
          items: {
            create: body.items.map((item) => {
              const variant = variantById.get(item.productVariantId)!;
              return {
                productVariantId: variant.id,
                quantity: item.quantity,
                unitPriceAgorot: variant.priceAgorot,
                productNameSnapshot: variant.product.name as Prisma.InputJsonValue,
              };
            }),
          },
        },
        include: { items: true },
      });

      for (const item of body.items) {
        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { stockQty: { decrement: item.quantity } },
        });
      }

      return created;
    });

    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
});

// GET /orders - היסטוריית הזמנות של המשתמש המחובר בלבד (לא כל ההזמנות בטבלה!)
ordersRouter.get("/", async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

// GET /orders/:id - מוגבל לבעלים. מחזירים 404 גם אם ההזמנה קיימת אבל שייכת
// למשתמש אחר (לא 403) - כדי לא לחשוף בכלל שה-id הזה קיים במערכת.
ordersRouter.get("/:id", async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      include: { items: true },
    });
    if (!order) {
      res.status(404).json({ error: "ORDER_NOT_FOUND" });
      return;
    }
    res.json({ order });
  } catch (err) {
    next(err);
  }
});
