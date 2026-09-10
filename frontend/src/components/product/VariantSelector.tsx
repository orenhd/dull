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
  onChange: (axisKey: string, valueId: string) => void;
  sizeError: boolean;
}

export function VariantSelector({
  nonSizeAxes,
  sizeAxis,
  selection,
  selectedIds,
  availableSizeValues,
  onChange,
  sizeError,
}: VariantSelectorProps) {
  const { t } = useTranslation();

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
          <select
            id="size"
            name="size"
            required
            aria-describedby="size-error"
            aria-invalid={sizeError || undefined}
            value={selection.size ?? ""}
            onChange={(event) => onChange("size", event.target.value)}
            className="select-caret w-full rounded-sm border border-border-base bg-surface-base px-md py-sm text-body text-text-base"
          >
            <option value="">{t("variant.selectSize")}</option>
            {availableSizeValues.map((value) => (
              <option key={value.id} value={value.id}>
                {value.label}
              </option>
            ))}
          </select>
          {/* תוקן 2026-09-10 (docs/PRD.md סעיף 12.16, דיווח Oren) - היה margin
              עליון שלילי (mt-[calc(-1*var(--space-sm))]) שמשך את שורת השגיאה
              *מעלה*, לתוך גבול ה-select במקום ליצור רווח מתחתיו. mt-xs חיובי
              (--space-xs, 4px) - רווח צר וסביר מתחת לתיבה, לא נוגע ב-margin
              האופקי/RTL בכלל (margin-top לא תלוי כיוון כתיבה). */}
          <p id="size-error" role="alert" hidden={!sizeError} className="mt-xs text-caption text-feedback-error">
            {t("variant.sizeRequired")}
          </p>
        </div>
      )}
    </>
  );
}
