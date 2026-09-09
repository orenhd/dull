// קובע איזו תמונת FLAT (רקע אפור) תואמת לוריאנט נתון - נדרש לצירוף
// thumbnail במייל אישור הזמנה, כי שם (בניגוד ל-frontend מול GET
// /products/:slug) אין דפדפן שיכול לעשות את ההצלבה בעצמו.
//
// "תואמת" = כל ערכי-הציר שהתמונה משויכת אליהם (בד"כ Fit+Colorway, בלי
// Size - כי אותה תמונת flat משרתת את כל המידות) מופיעים גם בין ערכי-הציר
// של הוריאנט הספציפי (שכולל גם Size). אותה לוגיקה בדיוק, רק בצד השרת.
import type { Media, MediaAxisValue, MediaRole, VariantAxisSelection, VariantAxisValue } from "@prisma/client";

type MediaWithAxisValues = Media & { axisValues: MediaAxisValue[] };

export function findFlatMediaUrl(
  media: MediaWithAxisValues[],
  variantAxisSelections: Pick<VariantAxisSelection, "axisValueId">[],
): string | null {
  const variantAxisValueIds = new Set(variantAxisSelections.map((s) => s.axisValueId));

  const match = media.find(
    (m) =>
      m.role === "FLAT" &&
      m.axisValues.length > 0 &&
      m.axisValues.every((av) => variantAxisValueIds.has(av.axisValueId)),
  );

  return match?.url ?? null;
}

// "וריאנט ברירת מחדל" כשאין בחירה ספציפית - כרטיס קטלוג (GET /products)
// ו-og:image ל-meta-injection (docs/PRD.md סעיף 6, הוכרע 12.9.2026: גברים,
// בהיר). לא הארדקוד של "mens"/"light" בשום מקום - מדורג לפי סכום ה-
// sortOrder הקיים כבר על ערכי-הציר עצמם (VariantAxisValue.sortOrder, למשל
// Men's=0/Women's=1, Light=0/Dark=1) - נמוך יותר = "ברירת מחדל" יותר. כך
// שינוי ברירת המחדל בעתיד הוא שינוי *נתונים* (sortOrder ב-DB), לא קוד.
type MediaWithRankedAxisValues = Media & {
  axisValues: Array<MediaAxisValue & { axisValue: Pick<VariantAxisValue, "sortOrder"> }>;
};

function findDefaultMediaUrl(media: MediaWithRankedAxisValues[], role: MediaRole): string | null {
  const candidates = media.filter((m) => m.role === role);
  if (candidates.length === 0) return null;

  const [best] = [...candidates].sort((a, b) => {
    const rankA = a.axisValues.reduce((sum, av) => sum + av.axisValue.sortOrder, 0);
    const rankB = b.axisValues.reduce((sum, av) => sum + av.axisValue.sortOrder, 0);
    return rankA - rankB;
  });

  return best.url;
}

export function findDefaultFlatMediaUrl(media: MediaWithRankedAxisValues[]): string | null {
  return findDefaultMediaUrl(media, "FLAT");
}

export function findDefaultCampaignMediaUrl(media: MediaWithRankedAxisValues[]): string | null {
  return findDefaultMediaUrl(media, "CAMPAIGN");
}
