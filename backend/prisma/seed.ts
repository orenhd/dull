// ממלא את ה-DB בנתוני המוצרים האמיתיים של Dull. מריצים עם `npm run seed`.
// אידמפוטנטי חלקית: מוחק ומחדש הכל בכל הרצה (מתאים לשלב הפיתוח הנוכחי -
// לא להריץ נגד DB עם הזמנות אמיתיות בעתיד בלי לחשוב על זה מחדש).
import { PrismaClient, ProductCategory, MediaRole } from "@prisma/client";

const prisma = new PrismaClient();

type LocaleText = { en: string; he: string };

// כל חולצה חולקת את אותו מבנה: 2 גזרות x 2 גוונים x (5 מידות גברים / 5 מידות נשים).
// המידות תלויות בגזרה (womens sizes שונה מ-mens sizes) - בדיוק המקרה ש-
// dependsOnValueId בסכימה נועד לפתור.
const MENS_SIZES = ["S", "M", "L", "XL", "XXL"];
const WOMENS_SIZES = ["Petite", "S", "M", "L", "XL"];

// מידות סנדלים - EU (המוסכמה שהכי מוכרת לקהל הישראלי, לא US/UK) - גם כאן
// תלויות בגזרה בדיוק כמו מידות החולצות (dependsOnValueId), כי הטווח שונה
// בין גברים לנשים.
const SANDALS_MENS_EU_SIZES = ["40", "41", "42", "43", "44", "45", "46"];
const SANDALS_WOMENS_EU_SIZES = ["36", "37", "38", "39", "40", "41"];

type ShirtMediaFile = {
  fit: "mens" | "womens";
  colorway: "light" | "dark";
  role: keyof typeof MediaRole;
  file: string; // שם קובץ בלי סיומת, תואם ל-backend/public/images/<file>.webp
};

async function createShirtProduct(opts: {
  slug: string;
  name: LocaleText;
  description: LocaleText;
  bandCreditName: string;
  bandCreditUrl: string;
  priceAgorot: number;
  isActive: boolean;
  media: ShirtMediaFile[]; // רק מה שבאמת קיים היום - לא חובה שכל השילובים יהיו מכוסים
}) {
  const product = await prisma.product.create({
    data: {
      slug: opts.slug,
      category: ProductCategory.SHIRT,
      name: opts.name,
      description: opts.description,
      bandCreditName: opts.bandCreditName,
      bandCreditUrl: opts.bandCreditUrl,
      isActive: opts.isActive,
    },
  });

  const fitAxis = await prisma.variantAxis.create({
    data: { productId: product.id, key: "fit", label: { en: "Fit", he: "גזרה" }, sortOrder: 0 },
  });
  const colorwayAxis = await prisma.variantAxis.create({
    data: { productId: product.id, key: "colorway", label: { en: "Colorway", he: "גוון" }, sortOrder: 1 },
  });
  const sizeAxis = await prisma.variantAxis.create({
    data: { productId: product.id, key: "size", label: { en: "Size", he: "מידה" }, sortOrder: 2 },
  });

  const mensFit = await prisma.variantAxisValue.create({
    data: { axisId: fitAxis.id, key: "mens", label: { en: "Men's", he: "גברים" }, sortOrder: 0 },
  });
  const womensFit = await prisma.variantAxisValue.create({
    data: { axisId: fitAxis.id, key: "womens", label: { en: "Women's", he: "נשים" }, sortOrder: 1 },
  });

  const lightColorway = await prisma.variantAxisValue.create({
    data: {
      axisId: colorwayAxis.id,
      key: "light",
      label: { en: "Light", he: "בהיר" },
      sortOrder: 0,
    },
  });
  const darkColorway = await prisma.variantAxisValue.create({
    data: {
      axisId: colorwayAxis.id,
      key: "dark",
      label: { en: "Dark", he: "כהה" },
      sortOrder: 1,
    },
  });

  const colorwayByKey = { light: lightColorway, dark: darkColorway };
  const fitByKey = { mens: mensFit, womens: womensFit };

  // מידות - key ייחודי per-axis, לכן מקדימים בגזרה (mens-s / womens-s וכו')
  // כדי שלא יתנגשו למרות שיש להן אותו label ("S") בשתי הגזרות.
  const mensSizeValues = await Promise.all(
    MENS_SIZES.map((label, i) =>
      prisma.variantAxisValue.create({
        data: {
          axisId: sizeAxis.id,
          key: `mens-${label.toLowerCase()}`,
          label: { en: label, he: label }, // מידות נשארות בלועזית - מוסכמה בענף
          sortOrder: i,
          dependsOnValueId: mensFit.id,
        },
      })
    )
  );
  const womensSizeValues = await Promise.all(
    WOMENS_SIZES.map((label, i) =>
      prisma.variantAxisValue.create({
        data: {
          axisId: sizeAxis.id,
          key: `womens-${label.toLowerCase()}`,
          label: { en: label, he: label },
          sortOrder: i,
          dependsOnValueId: womensFit.id,
        },
      })
    )
  );
  const sizesByFitKey = { mens: mensSizeValues, womens: womensSizeValues };

  // מדיה - רק מה שבאמת קיים (מועבר מבחוץ ב-opts.media)
  for (const m of opts.media) {
    const media = await prisma.media.create({
      data: {
        productId: product.id,
        role: MediaRole[m.role],
        url: `/images/${m.file}.webp`,
        sortOrder: 0,
      },
    });
    await prisma.mediaAxisValue.createMany({
      data: [
        { mediaId: media.id, axisValueId: fitByKey[m.fit].id },
        { mediaId: media.id, axisValueId: colorwayByKey[m.colorway].id },
      ],
    });
  }

  // וריאנטים - כל צירוף Fit x Colorway x Size הוא SKU נפרד עם מלאי משלו
  const skuPrefix = opts.slug.split("-")[0].toUpperCase();
  for (const [fitKey, fit] of Object.entries(fitByKey)) {
    for (const [colorwayKey, colorway] of Object.entries(colorwayByKey)) {
      for (const size of sizesByFitKey[fitKey as "mens" | "womens"]) {
        const variant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku: `${skuPrefix}-${fitKey}-${colorwayKey}-${size.key}`.toUpperCase(),
            priceAgorot: opts.priceAgorot,
            stockQty: 10, // מלאי דמו - placeholder, לעדכן דרך ה-CMS העתידי
          },
        });
        await prisma.variantAxisSelection.createMany({
          data: [
            { variantId: variant.id, axisValueId: fit.id },
            { variantId: variant.id, axisValueId: colorway.id },
            { variantId: variant.id, axisValueId: size.id },
          ],
        });
      }
    }
  }

  return product;
}

async function createSandalsProduct() {
  // מבנה שונה במכוון מהחולצות: אין Colorway (רק Fit + Size) - ולכן לא עובר
  // דרך createShirtProduct, אבל ה-Size כן קיים מעכשיו (2026-09, ה1 מהבריף
  // ל-Dull Creative) - EU sizing, תלוי-גזרה באותה מנגנון dependsOnValueId
  // בדיוק כמו מידות החולצות. אין תמונת קמפיין (per PRD) - flat בלבד.
  const product = await prisma.product.create({
    data: {
      slug: "dull-sandals",
      category: ProductCategory.FOOTWEAR,
      name: { en: "Dull Sandals", he: "סנדלי Dull" },
      // הוחלף (2026-09) ממשפט מוטו שיווקי ("The sandals designed for our
      // campaign models...") לפסקת חומרים/ייצור אמיתית - זה השדה שמוצג תחת
      // "Materials & Care" בעמוד המוצר (MaterialsCard.tsx), לא caption
      // שיווקי. עור עליון+בטנה / מדרס מרופד / סוליית גומי - מפרט זהה בין
      // Men's ל-Women's (נבדק: קמעונאים בטווח מחיר דומה כמו Next/Aldo
      // משתמשים באותו מפרט חומרים לגברים ולנשים באותה קולקציית סנדלים -
      // ההבדל בין הגזרות הוא רק במידות/רצועות, לא בחומר עצמו - ולכן שדה
      // description יחיד למוצר, בלי תלות ב-Fit, נכון גם מבחינה עובדתית).
      description: {
        en: "Leather upper and lining, cushioned footbed, rubber outsole.",
        he: "עור בעליון ובבטנה, מדרס מרופד, סוליית גומי.",
      },
      isActive: true,
    },
  });

  const fitAxis = await prisma.variantAxis.create({
    data: { productId: product.id, key: "fit", label: { en: "Fit", he: "גזרה" }, sortOrder: 0 },
  });
  const sizeAxis = await prisma.variantAxis.create({
    data: { productId: product.id, key: "size", label: { en: "Size (EU)", he: "מידה (EU)" }, sortOrder: 1 },
  });

  const fits: Array<{ key: "mens" | "womens"; label: LocaleText; file: string; euSizes: string[] }> = [
    { key: "mens", label: { en: "Men's", he: "גברים" }, file: "sandals-mens", euSizes: SANDALS_MENS_EU_SIZES },
    { key: "womens", label: { en: "Women's", he: "נשים" }, file: "sandals-womens", euSizes: SANDALS_WOMENS_EU_SIZES },
  ];

  for (const [i, f] of fits.entries()) {
    const fitValue = await prisma.variantAxisValue.create({
      data: { axisId: fitAxis.id, key: f.key, label: f.label, sortOrder: i },
    });

    const media = await prisma.media.create({
      data: {
        productId: product.id,
        role: MediaRole.FLAT,
        url: `/images/${f.file}.webp`,
        sortOrder: 0,
      },
    });
    await prisma.mediaAxisValue.create({
      data: { mediaId: media.id, axisValueId: fitValue.id },
    });

    // מידות EU תלויות בגזרה (40-46 גברים / 36-41 נשים - שונה בין השתיים) -
    // key מקדים בגזרה כדי שלא יתנגש (mens-eu-40 מול womens-eu-40, שתיהן "40").
    const sizeValues = await Promise.all(
      f.euSizes.map((label, sizeIndex) =>
        prisma.variantAxisValue.create({
          data: {
            axisId: sizeAxis.id,
            key: `${f.key}-eu-${label}`,
            label: { en: label, he: label },
            sortOrder: sizeIndex,
            dependsOnValueId: fitValue.id,
          },
        }),
      ),
    );

    for (const sizeValue of sizeValues) {
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: `SANDALS-${f.key}-${sizeValue.key}`.toUpperCase(),
          priceAgorot: 17900, // ₪179 - מחיר סופי
          stockQty: 10,
        },
      });
      await prisma.variantAxisSelection.createMany({
        data: [
          { variantId: variant.id, axisValueId: fitValue.id },
          { variantId: variant.id, axisValueId: sizeValue.id },
        ],
      });
    }
  }

  return product;
}

async function main() {
  console.log("Clearing existing data...");
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.variantAxisSelection.deleteMany();
  await prisma.mediaAxisValue.deleteMany();
  await prisma.media.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.variantAxisValue.deleteMany();
  await prisma.variantAxis.deleteMany();
  await prisma.product.deleteMany();

  console.log("Seeding Darkthrone Tee (full assets: flat + campaign)...");
  await createShirtProduct({
    slug: "darkthrone-tee",
    name: { en: "Darkthrone Tee", he: "חולצת דארקת'רון" },
    description: {
      en: "100% combed cotton, 180 gsm, pre-shrunk. Water-based ink print.",
      he: "כותנה 100% מסורקת, 180 גרם, כביסה מוקדמת. הדפסה בדיו מבוססת מים.",
    },
    bandCreditName: "Darkthrone",
    bandCreditUrl: "https://peaceville.com/bands/darkthrone/", // הלייבל הוותיק שלהם, לא Metal Archives
    priceAgorot: 8900, // ₪89 - מחיר סופי
    isActive: true,
    media: [
      { fit: "mens", colorway: "light", role: "FLAT", file: "darkthrone-shirt-mens-light" },
      { fit: "mens", colorway: "dark", role: "FLAT", file: "darkthrone-shirt-mens-dark" },
      { fit: "womens", colorway: "light", role: "FLAT", file: "darkthrone-shirt-womens-light" },
      { fit: "womens", colorway: "dark", role: "FLAT", file: "darkthrone-shirt-womens-dark" },
      { fit: "mens", colorway: "light", role: "CAMPAIGN", file: "yonatan-darkthrone-shirt-mens-light" },
      { fit: "mens", colorway: "dark", role: "CAMPAIGN", file: "yonatan-darkthrone-shirt-mens-dark" },
      { fit: "womens", colorway: "light", role: "CAMPAIGN", file: "sarah-darkthrone-shirt-womens-light" },
      { fit: "womens", colorway: "dark", role: "CAMPAIGN", file: "sarah-darkthrone-shirt-womens-dark" },
    ],
  });

  console.log("Seeding Immortal Tee (flat only - campaign shoot in progress)...");
  await createShirtProduct({
    slug: "immortal-tee",
    name: { en: "Immortal Tee", he: "חולצת אימורטל" },
    description: {
      en: "100% combed cotton, 180 gsm, pre-shrunk. Water-based ink print.",
      he: "כותנה 100% מסורקת, 180 גרם, כביסה מוקדמת. הדפסה בדיו מבוססת מים.",
    },
    bandCreditName: "Immortal",
    bandCreditUrl: "https://www.immortalofficial.com/", // האתר הרשמי
    priceAgorot: 8900, // ₪89 - מחיר סופי
    isActive: true,
    media: [
      { fit: "mens", colorway: "light", role: "FLAT", file: "immortal-shirt-mens-light" },
      { fit: "mens", colorway: "dark", role: "FLAT", file: "immortal-shirt-mens-dark" },
      { fit: "womens", colorway: "light", role: "FLAT", file: "immortal-shirt-womens-light" },
      { fit: "womens", colorway: "dark", role: "FLAT", file: "immortal-shirt-womens-dark" },
      // אין עדיין CAMPAIGN - הפרונטאנד יצטרך fallback לעמוד פריט של המוצר הזה
    ],
  });

  console.log("Seeding 45 Grave Tee placeholder (no assets yet - inactive)...");
  await prisma.product.create({
    data: {
      slug: "45-grave-tee",
      category: ProductCategory.SHIRT,
      name: { en: "45 Grave Tee", he: "חולצת 45 גרייב" },
      // אותו מפרט בדיוק כמו Darkthrone/Immortal (אושר ע"י Oren, 2026-09) -
      // אותה עובדת ייצור בפועל (כל החולצות מאותו קו ייצור), אין סיבה
      // שהמפרט יהיה שונה רק כי אין עדיין נכסים חזותיים למוצר הזה.
      description: {
        en: "100% combed cotton, 180 gsm, pre-shrunk. Water-based ink print.",
        he: "כותנה 100% מסורקת, 180 גרם, כביסה מוקדמת. הדפסה בדיו מבוססת מים.",
      },
      bandCreditName: "45 Grave",
      bandCreditUrl: "https://en.wikipedia.org/wiki/45_Grave", // אין לייבל יציב/דיסקוגרפיה מרכזית - ויקיפדיה כמקור הכי יציב
      isActive: false, // אין עדיין שום חומר חזותי - לא מוצג באתר עד שיהיה
    },
  });

  console.log("Seeding Dull Sandals (flat only, no campaign per PRD)...");
  await createSandalsProduct();

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
