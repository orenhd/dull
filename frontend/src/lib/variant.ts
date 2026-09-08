// לוגיקת ההצלבה בין בחירת המשתמש (Fit+Colorway+Size...) לבין ה-variant/media
// הנכונים. ראו docs/API_CONTRACT.md: "לכל בחירת המשתמש - למצוא את ה-variant
// שה-axisValueIds שלו הם בדיוק אותה קבוצת ה-id-ים שנבחרו (חיתוך/השוואת
// סטים), ואת ה-media הרלוונטית לפי אותה שיטה (יכולה להיות subset)".
//
// אותה לוגיקה בדיוק קיימת גם בצד השרת (backend/src/lib/media.ts,
// findFlatMediaUrl) - שם זה משמש לצירוף תמונת thumbnail למייל אישור הזמנה,
// כאן זה משמש להצגה בעמוד הפריט. לא צירוף קוד בין frontend/backend (ריפואים
// נפרדים לגמרי), אבל אותו חוזה בדיוק - אם אחד מהם משתנה, השני צריך להשתנות איתו.
import type { AxisValue, Media, MediaRole, Product, ProductVariant, VariantAxis } from "@/types/product";

export type AxisSelection = Record<string, string>; // axis.key -> axisValueId

function isAvailable(value: AxisValue, selectedIds: ReadonlySet<string>): boolean {
  return value.dependsOnValueId == null || selectedIds.has(value.dependsOnValueId);
}

export function getAvailableAxisValues(axis: VariantAxis, selectedIds: ReadonlySet<string>): AxisValue[] {
  return axis.values.filter((v) => isAvailable(v, selectedIds));
}

// בונה בחירה תקפה מלאה, ציר-אחר-ציר (לפי sortOrder, כפי שה-API כבר ממיין):
// לכל ציר - אם הערך הרצוי ב-`desired` עדיין זמין נוכח מה שנבחר בצירים
// הקודמים, משאירים אותו; אחרת נופלים לערך הזמין הראשון. זו גם הדרך לקבל
// בחירת ברירת מחדל (desired={}) וגם לטפל בשינוי ציר יחיד בלי "לשבור" ציר
// תלוי (למשל: מחליפים Fit -> המידה שנבחרה קודם כבר לא בהכרח קיימת בגזרה
// החדשה, אז נופלים למידה הראשונה הזמינה בגזרה החדשה).
export function deriveSelection(axes: VariantAxis[], desired: AxisSelection): AxisSelection {
  const result: AxisSelection = {};
  const selectedIds = new Set<string>();

  for (const axis of axes) {
    const available = getAvailableAxisValues(axis, selectedIds);
    const desiredValue = available.find((v) => v.id === desired[axis.key]);
    const chosen = desiredValue ?? available[0];
    if (!chosen) continue; // אין ערך זמין לציר הזה בכלל - מצב לא צפוי בנתונים תקינים
    result[axis.key] = chosen.id;
    selectedIds.add(chosen.id);
  }

  return result;
}

export function selectionToIdSet(selection: AxisSelection): Set<string> {
  return new Set(Object.values(selection));
}

// התאמה מדויקת: ל-variant יש בדיוק את אותם axisValueIds כמו הבחירה הנוכחית
// (לא subset - וריאנט חייב ערך לכל ציר, כולל Size).
export function findVariant(variants: ProductVariant[], selectedIds: ReadonlySet<string>): ProductVariant | undefined {
  return variants.find(
    (v) => v.axisValueIds.length === selectedIds.size && v.axisValueIds.every((id) => selectedIds.has(id)),
  );
}

// התאמה חלקית (subset): ה-media עשויה להיות תלויה רק בחלק מהצירים (למשל
// Fit+Colorway, בלי Size - אותה תמונת flat משרתת את כל המידות).
export function findMedia(media: Media[], role: MediaRole, selectedIds: ReadonlySet<string>): Media | undefined {
  return media.find(
    (m) => m.role === role && m.axisValueIds.length > 0 && m.axisValueIds.every((id) => selectedIds.has(id)),
  );
}

export interface ResolvedSelection {
  selection: AxisSelection;
  selectedIds: Set<string>;
  variant: ProductVariant | undefined;
}

export function resolveSelection(product: Product, desired: AxisSelection): ResolvedSelection {
  const selection = deriveSelection(product.axes, desired);
  const selectedIds = selectionToIdSet(selection);
  const variant = findVariant(product.variants, selectedIds);
  return { selection, selectedIds, variant };
}


// "האם צירוף Fit+Colorway (בלי Size) אזל *לגמרי* - כל המידות בו במלאי 0?"
// משמש להחלטה בין הצגת SoldOutNotice המלא (מחליף את כל בלוק הרכישה, ראו
// docs/PRD.md סעיף 8א) לבין אזהרת מלאי נקודתית על מידה בודדת. `partialIds`
// הוא רק הצירים *חוץ* מ-Size (לרוב Fit+Colorway) - ראו src/hooks/
// useVariantSelection.ts.
export function isCombinationSoldOut(variants: ProductVariant[], partialIds: ReadonlySet<string>): boolean {
  const matching = variants.filter((v) => [...partialIds].every((id) => v.axisValueIds.includes(id)));
  if (matching.length === 0) return false; // אין נתונים - לא טוענים "אזל" בלי הוכחה
  return matching.every((v) => v.stockQty <= 0);
}

// תווית קריאה-לבנאדם לצירוף שנבחר, למשל "Women's · Faded Batik · M" -
// נבנית בזמן "Add to Bag" (יש לנו את כל תוויות הצירים ביד) ונשמרת כ-cache
// על ה-CartItem עצמו (ראו src/stores/cartStore.ts), אבל זה קפוא בשפה שהייתה
// פעילה באותו רגע - ראו variantSelectionLabel() למטה לגרסה שמתעדכנת.
export function buildSelectionLabel(axes: VariantAxis[], selection: AxisSelection): string {
  return axes
    .map((axis) => axis.values.find((v) => v.id === selection[axis.key])?.label)
    .filter((label): label is string => Boolean(label))
    .join(" · ");
}

// בונה AxisSelection (axis.key -> valueId) מ-variant.axisValueIds הגולמי,
// לפי איזה axis.values[] כל id שייך אליו. variant.axisValueIds עצמם הם
// id-ים בלבד - קבועים בין שפות - אז זו הדרך היחידה לשחזר "איזה ציר שייך
// לאיזה id" בלי לשמור מיפוי נוסף.
function selectionFromVariant(axes: VariantAxis[], variant: ProductVariant): AxisSelection {
  const ids = new Set(variant.axisValueIds);
  const selection: AxisSelection = {};
  for (const axis of axes) {
    const value = axis.values.find((v) => ids.has(v.id));
    if (value) selection[axis.key] = value.id;
  }
  return selection;
}

// כמו buildSelectionLabel, אבל *לא* תלוי בבחירה חיה של המשתמש (AxisSelection)
// - מחזירה תווית טרייה, בשפה הנוכחית, ישירות מ-variant.axisValueIds. פותר
// באג אמיתי בעגלה (Oren, 2026-09-08): CartItem.selectionLabel נשמר פעם אחת
// בזמן ההוספה, בשפה שהייתה פעילה אז - אם המשתמש מחליף שפה אחר כך, התווית
// השמורה נשארת "תקועה" בשפה הישנה. src/pages/CartPage.tsx קורא ל-getProduct
// מחדש בשפה הנוכחית ומשתמש בזה במקום ב-cache השמור, כשה-fetch כבר חזר.
export function variantSelectionLabel(axes: VariantAxis[], variant: ProductVariant): string {
  return buildSelectionLabel(axes, selectionFromVariant(axes, variant));
}

// מחיר "החל מ-" - כשעדיין אין variant מלא (למשל לפני שנבחרה מידה). אותה
// לוגיקה בדיוק כמו GET /products (backend/src/routes/products.ts: "המחיר
// הזול מבין הוריאנטים"), רק בצד הלקוח ועל וריאנטים פעילים בודדי-מוצר.
export function getStartingPriceAgorot(variants: ProductVariant[]): number | null {
  if (variants.length === 0) return null;
  return Math.min(...variants.map((v) => v.priceAgorot));
}
