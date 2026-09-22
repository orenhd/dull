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
  // תוקן 2026-09-19 (Marketing feedback - PDP buy box A1): קישור טקסט קטן
  // ליד תווית "מידה" שפותח (ולא רק מציג) את SizeGuideAccordion, שעבר
  // למתחת לכפתור Add to Bag - רחוק פיזית משורת הבחירה. אופציונלי בכוונה
  // (undefined = אין קישור מוצג) - אם בעתיד ייקרא רכיב הזה מהקשר בלי
  // מדריך מידות זמין בכלל.
  onOpenSizeGuide?: () => void;
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
  onOpenSizeGuide,
}: VariantSelectorProps) {
  const { t } = useTranslation();

  // docs/PRD.md סעיף 26 (בקשת Oren) - "המידה שנבחרת *עכשיו* אזלה?" (לא כל
  // מידה זמינה-מבנית - זה soldOutSizeIds עצמו, המשמש לסימון הצ'יפים
  // למטה). קדימות ל-sizeError (לא נבחרה מידה בכלל) - שתי ההודעות חולקות את
  // אותו <p> מתחת לצ'יפים, בדיוק כבקשת Oren ("על אותו שטנץ").
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
          <legend className="mb-sm p-0 text-caption font-bold tracking-[0.08em] text-text-muted uppercase">
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

      {/* תוקן 2026-09-19 (Marketing feedback - PDP buy box A3: מידה ככפתורים
          גלויים במקום <select> נייטיב) - אותו מבנה fieldset+legend+chips
          בדיוק כמו Fit/Colorway למעלה ("אותה שפה חזותית", בקשת הבריף
          מפורשת), לא רכיב נפרד. המלאי-לפי-מידה (soldOutSizeIds) הוא נתון
          אמיתי שכבר היה קיים ומחושב (lib/variant.ts getSoldOutSizeIds,
          variant.stockQty) - רק המשיך לזרום ל-Chip.disabled החדש במקום
          לטקסט "- אזל מהמלאי" בתוך <option>. id="size-group" משמש target
          ל-focus/scroll כשנשלחת הטופס בלי מידה נבחרת (AddToBagForm.tsx). */}
      {sizeAxis && (
        <fieldset id="size-group" className="m-0 flex flex-col gap-sm border-0 p-0">
          {/* legend מכיל גם את הכותרת וגם את קישור "מדריך מידות" - שניהם
              phrasing content תקין בתוך <legend> (כולל <button>), כך
              שה-legend נשאר הילד-הראשון-האמיתי של ה-fieldset (חובה לרינדור
              UA תקין ולשם הנגיש שנגזר ממנו), בזמן שה-flex הפנימי מיישר את
              שני החלקים לשני קצוות השורה - מתהפך אוטומטית ב-RTL (הקישור
              יושב בצד הנגדי בעברית, בדיוק כבקשת הבריף, בלי קוד ייעודי
              לכיוון). */}
          <legend className="mb-sm flex w-full items-baseline justify-between gap-sm p-0 text-caption font-bold tracking-[0.08em] text-text-muted uppercase">
            <span>{sizeAxis.label}</span>
            {onOpenSizeGuide && (
              <button
                type="button"
                onClick={onOpenSizeGuide}
                className="-my-xs px-xs py-xs text-caption font-normal normal-case tracking-normal text-text-muted underline hover:text-text-base desktop:hidden"
              >
                {t("sizeGuide.summary")}
              </button>
            )}
          </legend>
          <div role="radiogroup" aria-label={sizeAxis.label} aria-describedby="size-error" className="flex flex-wrap gap-sm">
            {availableSizeValues.map((value) => {
              const isSoldOut = soldOutSizeIds.has(value.id);
              return (
                <Chip
                  key={value.id}
                  name="size"
                  value={value.id}
                  label={value.label}
                  checked={selection.size === value.id}
                  onChange={(valueId) => onChange("size", valueId)}
                  disabled={isSoldOut}
                  title={isSoldOut ? t("variant.sizeSoldOutOption", { size: value.label }) : undefined}
                />
              );
            })}
          </div>
          {/* תוקן 2026-09-10 (docs/PRD.md סעיף 12.16, דיווח Oren) - היה margin
              עליון שלילי (mt-[calc(-1*var(--space-sm))]) שמשך את שורת השגיאה
              *מעלה*, לתוך גבול ה-select במקום ליצור רווח מתחתיו. mt-xs חיובי
              (--space-xs, 4px) - רווח צר וסביר מתחת לתיבה, לא נוגע ב-margin
              האופקי/RTL בכלל (margin-top לא תלוי כיוון כתיבה).
              docs/PRD.md סעיף 26 - אותו <p> בדיוק משרת שתי הודעות ("לא נבחרה
              מידה" ו-"המידה הנבחרת אזלה"), לפי sizeMessageKey - אותו id/מבנה/
              עיצוב שביקש Oren ("על אותו שטנץ"). */}
          <p id="size-error" role="alert" hidden={!sizeMessageKey} className="mt-xs text-caption text-feedback-error">
            {sizeMessageKey ? t(sizeMessageKey) : null}
          </p>
        </fieldset>
      )}
    </>
  );
}
