import { useTranslation } from "react-i18next";
import { Chip } from "@/components/ui/Chip";
import { getAvailableAxisValues } from "@/lib/variant";
import type { AxisSelection } from "@/lib/variant";
import type { AxisValue, VariantAxis } from "@/types/product";

interface VariantSelectorProps {
  nonSizeAxes: VariantAxis[];
  sizeAxis: VariantAxis | undefined;
  selection: AxisSelection;
  selectedIds: ReadonlySet<string>;
  availableSizeValues: AxisValue[];
  soldOutSizeIds: ReadonlySet<string>;
  onChange: (axisKey: string, valueId: string) => void;
  sizeError: boolean;
}

export function VariantSelector({
  nonSizeAxes,
  sizeAxis,
  selection,
  selectedIds,
  availableSizeValues,
  soldOutSizeIds,
  onChange,
  sizeError,
}: VariantSelectorProps) {
  const { t } = useTranslation();

  // docs/PRD.md סעיף 26 (בקשת Oren) - "המידה שנבחרת *עכשיו* אזלה?" (לא כל
  // מידה זמינה-מבנית - זה soldOutSizeIds עצמו, המשמש לסימון בתוך ה-<option>-ים
  // למטה). קדימות ל-sizeError (לא נבחרה מידה בכלל) - שתי ההודעות חולקות את
  // אותו <p> מתחת ל-select, בדיוק כבקשת Oren ("על אותו שטנץ").
  //
  // תוקן 2026-09-14 (דיווח Oren, build שבר): AxisSelection הוא Record<string,
  // string> - selection.size מוקלד string|undefined (noUncheckedIndexedAccess
  // ב-tsconfig, אותה סיבה ש-selection[axis.key] בשאר הקובץ תמיד עובר דרך
  // .find()/אופרטורים בטוחים). Boolean(selection.size) בודק truthy, אבל לא
  // מצמצם (narrow) את הטיפוס בגישה השנייה (soldOutSizeIds.has(selection.size))
  // - כל גישה ל-property מבוסס index signature נבדקת בנפרד ב-TS. הפתרון:
  // ללכוד בשם קבוע (selectedSize) ולהשתמש בביטוי שמצמצם בפועל (ternary על
  // המשתנה עצמו), לא בקריאה ל-Boolean().
  const selectedSize = selection.size;
  const selectedSizeSoldOut = selectedSize ? soldOutSizeIds.has(selectedSize) : false;
  const sizeMessageKey = sizeError ? "variant.sizeRequired" : selectedSizeSoldOut ? "variant.sizeSoldOut" : null;

  return (
    <>
      {nonSizeAxes.map((axis) => (
        <fieldset key={axis.key} className="m-0 flex flex-col gap-sm border-0 p-0">
          <legend className="p-0 text-caption font-bold tracking-[0.08em] text-text-muted uppercase">
            {axis.label}
          </legend>
          <div className="flex flex-wrap gap-sm">
            {getAvailableAxisValues(axis, selectedIds).map((value) => (
              <Chip
                key={value.id}
                name={axis.key}
                value={value.id}
                label={value.label}
                checked={selection[axis.key] === value.id}
                onChange={(valueId) => onChange(axis.key, valueId)}
              />
            ))}
          </div>
        </fieldset>
      ))}

      {sizeAxis && (
        <div>
          <label htmlFor="size" className="mb-sm block text-body text-text-muted">
            {sizeAxis.label}
          </label>
          {/* תוקן 2026-09-18 (docs/PRD.md, דיווח Oren - סעיף ד.5) - עטיפה
              relative חדשה, נדרשת כדי למקם את ה-chevron הדקורטיבי (span
              נפרד, ראו הערה ב-index.css) מעל ה-<select>. appearance-none
              (יוטיליטי של Tailwind, לא .select-caret הישן) מכבה את חץ
              ברירת המחדל של הדפדפן בכל שלושת ה-prefixes - כולל -moz-,
              שהיה חסר קודם וגרם לחץ כפול בפיירפוקס. pe-xl כדי שטקסט
              המידה הארוך ביותר לא ייגע ב-chevron. */}
          <div className="relative">
            <select
              id="size"
              name="size"
              required
              aria-describedby="size-error"
              aria-invalid={sizeError || selectedSizeSoldOut || undefined}
              value={selection.size ?? ""}
              onChange={(event) => onChange("size", event.target.value)}
              className="w-full appearance-none rounded-sm border border-border-base bg-surface-base px-md py-sm pe-xl text-body text-text-base"
            >
              <option value="">{t("variant.selectSize")}</option>
              {/* docs/PRD.md סעיף 26 - <option> תקני לא תומך בעיצוב פנימי (אין
                  span/בולד חלקי בתוך הטקסט, אין רכיבי ילד בכלל) - לכן "לייבל
                  בפונט קטן יותר אך בולט" (בקשת Oren, עדיפות 1) לא ניתן למימוש
                  אמין ב-<option> בין דפדפנים. כפיצוי חלקי - טקסט רגיל מצורף
                  לתווית עצמה ("- אזל מהמלאי"), בנוסף להודעה מתחת ל-select
                  (עדיפות 2 של Oren, המימוש המלא). */}
              {availableSizeValues.map((value) => {
                const isSoldOut = soldOutSizeIds.has(value.id);
                return (
                  <option key={value.id} value={value.id}>
                    {isSoldOut ? t("variant.sizeSoldOutOption", { size: value.label }) : value.label}
                  </option>
                );
              })}
            </select>
            {/* span דקורטיבי (לא בתוך ה-<select>, שלא תומך ברכיבי ילד) -
                ממוקם מעל ה-select בצד ה"סוף" הלוגי (end-md - הופך אוטומטית
                ב-RTL, בלי [dir="rtl"] ידני כמו הגישה הישנה). pointer-events-none
                כדי שהקליק "יעבור מבעד" לתיבה האמיתית מתחתיו.
                עודכן 2026-09-18 (בקשת אורן, המשך ד.5, ניסיון שני) - size-5
                (20px) הועבר חזרה ל-size-3.5 (14px, בין 12px המקורי ל-20px
                שנוסה) - אורן דיווח שה-20px "מאוד שונה" מה-"+", דומיננטי
                מדי לתפקיד-עזר בתוך שדה קומפקטי. "פאדינג נאה" (הבקשה
                השנייה) - הועבר מ-end-sm ל-end-md: אותו מרווח בדיוק
                (16px, --space-md) שיש ל-"+" עצמו מקצה הכפתור שלו
                (p-md ב-SizeGuideAccordion.tsx), לא רק אותו גודל/צבע.
                נבדק: ה-span (16px..30px ממקצה ה-select) עדיין לא נוגע
                בגבול תוכן הטקסט (32px, pe-xl) גם בתווית הכי ארוכה
                ("XL - אזל מהמלאי"). */}
            <span
              aria-hidden="true"
              className="select-chevron pointer-events-none absolute end-md top-1/2 size-3.5 -translate-y-1/2 text-text-muted"
            />
          </div>
          {/* תוקן 2026-09-10 (docs/PRD.md סעיף 12.16, דיווח Oren) - היה margin
              עליון שלילי (mt-[calc(-1*var(--space-sm))]) שמשך את שורת השגיאה
              *מעלה*, לתוך גבול ה-select במקום ליצור רווח מתחתיו. mt-xs חיובי
              (--space-xs, 4px) - רווח צר וסביר מתחת לתיבה, לא נוגע ב-margin
              האופקי/RTL בכלל (margin-top לא תלוי כיוון כתיבה). */}
          {/* docs/PRD.md סעיף 26 - אותו <p> בדיוק משרת שתי הודעות ("לא נבחרה
              מידה" ו-"המידה הנבחרת אזלה"), לפי sizeMessageKey - אותו id/מבנה/
              עיצוב שביקש Oren ("על אותו שטנץ"). */}
          <p id="size-error" role="alert" hidden={!sizeMessageKey} className="mt-xs text-caption text-feedback-error">
            {sizeMessageKey ? t(sizeMessageKey) : null}
          </p>
        </div>
      )}
    </>
  );
}
