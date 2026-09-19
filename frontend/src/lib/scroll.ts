// עוזר משותף קטן ל-2 נקודות-שימוש (Marketing feedback - PDP buy box A1/A2,
// 2026-09-19): קישור "מדריך מידות" שגולל אל המגירה (VariantSelector.tsx/
// ProductPage.tsx), וגלילה+פוקוס לבורר המידה כשנשלחת הטופס בלי מידה
// (AddToBagForm.tsx). מרוכז כאן במקום כפילות - שני המקומות צריכים לכבד
// prefers-reduced-motion (הבריף, סעיף 2: "prefers-reduced-motion נשמר").
export function scrollIntoViewRespectingMotion(
  el: Element | null | undefined,
  options: Omit<ScrollIntoViewOptions, "behavior"> = { block: "start" },
): void {
  if (!el) return;
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  el.scrollIntoView({ ...options, behavior: prefersReducedMotion ? "auto" : "smooth" });
}
