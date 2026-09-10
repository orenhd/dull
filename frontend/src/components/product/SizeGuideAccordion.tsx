// MVP capability 1 (docs/PRD.md סעיף 5) - משולב בתוך עמוד הפריט כמגירה
// נפתחת (<details>), לא עמוד/קישור נפרד. רק חלק טבלת המידות מהדמו -
// חלק "How it fits, on real bodies" (תמונות דוגמנים מתויגות) הוסר בכוונה,
// ראו src/content/sizeCharts.ts להסבר המלא ולדיווח שסומן ל-Oren.
//
// תוקן 2026-09-10 (docs/PRD.md סעיף 12.19, בקשת Oren): נוסף ענף שני
// לנעליים/סנדלים, עם טבלת מידות אמיתית משלו (Size EU + אורך כף רגל בס"מ,
// src/content/sizeCharts.ts - SANDALS_SIZE_CHART_MENS/WOMENS) - לא רק רשימת
// "אילו מידות קיימות" כמו בגרסה הקודמת של הרכיב הזה. שני הענפים (חולצות/
// נעליים) מפוצלים לפי `category`, לא לפי `fitKey` בלבד - ל-fit axis value
// יש אותו key בדיוק ("mens"/"womens") בשתי הקטגוריות (backend/prisma/
// seed.ts), אז חובה קטגוריה כדי לדעת לאיזו טבלה לפנות.
import { useTranslation } from "react-i18next";
import { getSizeChartForFitKey, getSandalsSizeChartForFitKey } from "@/content/sizeCharts";
import { PRODUCT_CATEGORY } from "@/constants";
import type { ProductCategory } from "@/types/product";

interface SizeGuideAccordionProps {
  category: ProductCategory;
  fitKey: string | undefined;
}

export function SizeGuideAccordion({ category, fitKey }: SizeGuideAccordionProps) {
  const { t } = useTranslation();
  const isFootwear = category === PRODUCT_CATEGORY.footwear;

  const shirtChart = !isFootwear && fitKey ? getSizeChartForFitKey(fitKey) : null;
  const footwearChart = isFootwear && fitKey ? getSandalsSizeChartForFitKey(fitKey) : null;
  const hasContent = isFootwear ? Boolean(footwearChart) : Boolean(shirtChart);

  return (
    <details className="rounded-md border border-border-base bg-surface-base">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-sm p-md text-body-strong font-bold marker:content-none [&::-webkit-details-marker]:hidden">
        <span>{t("sizeGuide.summary")}</span>
        <span aria-hidden="true" className="text-h3 leading-none text-text-muted">
          +
        </span>
      </summary>

      <div className="flex flex-col gap-md px-md pb-md">
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
    </details>
  );
}
