// MVP capability 1 (docs/PRD.md סעיף 5) - משולב בתוך עמוד הפריט כמגירה
// נפתחת, לא עמוד/קישור נפרד. רק חלק טבלת המידות מהדמו - חלק "How it fits,
// on real bodies" (תמונות דוגמנים מתויגות) הוסר בכוונה, ראו
// src/content/sizeCharts.ts להסבר המלא ולדיווח שסומן ל-Oren.
//
// תוקן 2026-09-10 (docs/PRD.md סעיף 12.19, בקשת Oren): נוסף ענף שני
// לנעליים/סנדלים, עם טבלת מידות אמיתית משלו (Size EU + אורך כף רגל בס"מ,
// src/content/sizeCharts.ts - SANDALS_SIZE_CHART_MENS/WOMENS) - לא רק רשימת
// "אילו מידות קיימות" כמו בגרסה הקודמת של הרכיב הזה. שני הענפים (חולצות/
// נעליים) מפוצלים לפי `category`, לא לפי `fitKey` בלבד - ל-fit axis value
// יש אותו key בדיוק ("mens"/"womens") בשתי הקטגוריות (backend/prisma/
// seed.ts), אז חובה קטגוריה כדי לדעת לאיזו טבלה לפנות.
//
// תוקן 2026-09-18 (docs/PRD.md, דיווח Oren - סעיף ד.4): הומר מ-<details>/
// <summary> טבעי (בלי state בכלל) לרכיב נשלט (useState), כדי לתמוך בסגירה
// בקליק מחוץ למדריך - בדיוק הבקשה של Oren, "רק אם זה לא יקפיץ את כל העמוד
// במובייל": הרכיב הזה *אינו* overlay/מודאל שצף מעל שאר העמוד (בניגוד
// ל-UserMenu.tsx, שממנו הועתק הדפדוף הבא) - הוא מגירה שמכילה את עצמה
// ותופסת שטח בזרימת העמוד הרגילה (לא position:fixed/absolute, לא מכסה
// תוכן אחר) - כך שהתנאי של Oren מתקיים מאליו, גם במובייל. דפוס הנגישות
// (aria-expanded/aria-controls על <button>, בלי role="menu") עוקב אחרי
// אותה מוסכמה כבר קיימת ב-UserMenu.tsx/SiteHeader.tsx (hamburger) - לא
// role חדש, לא ניווט חצים במקלדת.
//
// תוקן 2026-09-19 (Marketing feedback - PDP buy box A1): ה-state (open)
// עבר מ-internal ל-controlled (props open/onOpenChange) - הרכיב עצמו עבר
// למתחת לכפתור Add to Bag, רחוק מקישור "מדריך מידות" החדש ליד תווית
// "מידה" (VariantSelector.tsx). כך הקישור יכול גם לפתוח את המגירה וגם
// (דרך ref, React 19 - ref כ-prop רגיל בלי forwardRef) לגלול אליה, בזמן
// שהכותרת של המגירה עצמה עדיין מתפקדת כ-toggle עצמאי (שני נתיבים, אותו
// state יחיד - לא לוגיקה כפולה).
import { useEffect, useRef, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { getSizeChartForFitKey, getSandalsSizeChartForFitKey } from "@/content/sizeCharts";
import { PRODUCT_CATEGORY } from "@/constants";
import type { ProductCategory } from "@/types/product";

interface SizeGuideAccordionProps {
  category: ProductCategory;
  fitKey: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ref?: Ref<HTMLDivElement>;
}

export function SizeGuideAccordion({ category, fitKey, open, onOpenChange, ref }: SizeGuideAccordionProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const isFootwear = category === PRODUCT_CATEGORY.footwear;

  const shirtChart = !isFootwear && fitKey ? getSizeChartForFitKey(fitKey) : null;
  const footwearChart = isFootwear && fitKey ? getSandalsSizeChartForFitKey(fitKey) : null;
  const hasContent = isFootwear ? Boolean(footwearChart) : Boolean(shirtChart);

  // סגירה בלחיצה מחוץ למדריך או ב-Escape - אותה גישה בדיוק כמו UserMenu.tsx
  // (pointerdown מחוץ ל-containerRef, Escape תמיד סוגר).
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) onOpenChange(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      onOpenChange(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <div
      ref={(node) => {
        containerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      className="rounded-md border border-border-base bg-surface-base"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="size-guide-panel"
        onClick={() => onOpenChange(!open)}
        className="flex w-full cursor-pointer items-center justify-between gap-sm p-md text-start text-body-strong font-bold"
      >
        <span>{t("sizeGuide.summary")}</span>
        <span aria-hidden="true" className="text-h3 leading-none text-text-muted">
          +
        </span>
      </button>

      {open && (
        <div id="size-guide-panel" className="flex flex-col gap-md px-md pb-md">
          {!hasContent && <p className="m-0 text-body text-text-base">{t("sizeGuide.unavailable")}</p>}

          {isFootwear && footwearChart && (
            <>
              <p className="m-0 text-body text-text-base">{t("sizeGuide.introFootwear")}</p>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[200px] border-collapse text-body">
                  <caption className="sr-only">{t("sizeGuide.summary")}</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="border-b border-border-base px-sm py-sm text-start text-caption tracking-[0.08em] text-text-muted uppercase">
                        {t("sizeGuide.columns.sizeEu")}
                      </th>
                      <th scope="col" className="border-b border-border-base px-sm py-sm text-start text-caption tracking-[0.08em] text-text-muted uppercase">
                        {t("sizeGuide.columns.footLength")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {footwearChart.map((row) => (
                      <tr key={row.size}>
                        <th scope="row" className="border-b border-border-base px-sm py-sm text-start font-bold">
                          {row.size}
                        </th>
                        <td className="border-b border-border-base px-sm py-sm">{row.footLengthCm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="m-0 text-caption text-text-muted">{t("sizeGuide.noteFootwear")}</p>
            </>
          )}

          {!isFootwear && shirtChart && (
            <>
              <p className="m-0 text-body text-text-base">{t("sizeGuide.intro")}</p>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[280px] border-collapse text-body">
                  <caption className="sr-only">{t("sizeGuide.summary")}</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="border-b border-border-base px-sm py-sm text-start text-caption tracking-[0.08em] text-text-muted uppercase">
                        {t("sizeGuide.columns.size")}
                      </th>
                      <th scope="col" className="border-b border-border-base px-sm py-sm text-start text-caption tracking-[0.08em] text-text-muted uppercase">
                        {t("sizeGuide.columns.chest")}
                      </th>
                      <th scope="col" className="border-b border-border-base px-sm py-sm text-start text-caption tracking-[0.08em] text-text-muted uppercase">
                        {t("sizeGuide.columns.length")}
                      </th>
                      <th scope="col" className="border-b border-border-base px-sm py-sm text-start text-caption tracking-[0.08em] text-text-muted uppercase">
                        {t("sizeGuide.columns.sleeve")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {shirtChart.map((row) => (
                      <tr key={row.size}>
                        <th scope="row" className="border-b border-border-base px-sm py-sm text-start font-bold">
                          {row.size}
                        </th>
                        <td className="border-b border-border-base px-sm py-sm">{row.chestCm}</td>
                        <td className="border-b border-border-base px-sm py-sm">{row.lengthCm}</td>
                        <td className="border-b border-border-base px-sm py-sm">{row.sleeveCm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="m-0 text-caption text-text-muted">{t("sizeGuide.note")}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
