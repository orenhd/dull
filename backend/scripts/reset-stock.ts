// מאפס את המלאי (stockQty) של *כל* הוריאנטים הקיימים ל-10 - נועד לשימוש
// אחרי בדיקות ידניות של מקרי-קצה "אזל המלאי" (Oren מאפס/מוריד מלאי של
// וריאנטים ספציפיים ידנית ב-Prisma Studio כדי לבדוק את זרימת ה-
// OUT_OF_STOCK/SoldOutNotice בפועל), כדי להחזיר את ה-DB למצב "תקין" בלי
// לחזור על כל תהליך ה-seed. לא רץ אוטומטית בשום build/deploy step - רק
// ידנית, לפי צורך (2026-09-10).
//
// למה סקריפט נפרד ולא `npm run seed` מחדש: seed.ts מוחק ומחדש את כל
// הקטלוג מאפס (כולל id-ים חדשים לגמרי לכל שורה - Product/VariantAxisValue/
// ProductVariant) - זה שובר כל עגלה מקומית (localStorage, מצביעה על
// variantId ישן) והזמנה קיימת שמצביעה על productVariantId שכבר לא קיים.
// reset-stock.ts רק מעדכן את השדה stockQty על השורות הקיימות - בטוח
// להריץ נגד DB עם הזמנות/session אמיתיים.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const RESET_STOCK_QTY = 10;

async function main() {
  const result = await prisma.productVariant.updateMany({
    data: { stockQty: RESET_STOCK_QTY },
  });
  console.log(`Reset stockQty to ${RESET_STOCK_QTY} for ${result.count} variant(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
