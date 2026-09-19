// "כרטיסיה" נבחרת - input radio מוסתר + span מעוצב, עם peer כדי שה-span
// יגיב למצב ה-input (checked/hover/focus-visible) בלי JS. אותה טכניקה
// שהדמו השתמש בה ב-CSS גולמי (chip input:checked + span) - כאן דרך
// Tailwind peer-* variants.
//
// תוקן 2026-09-19 (Marketing feedback - PDP buy box A3: מידה כצ'יפים
// במקום <select>): נוסף `disabled` אופציונלי - מידה שאזלה מהמלאי (נתון
// אמיתי, `variant.stockQty`, ראו lib/variant.ts getSoldOutSizeIds) הופכת
// ללא-לחיצה לגמרי (input עם disabled אמיתי - לא רק ויזואלי, גם לא בר-מיקוד
// ב-Tab), עם קו-חוצה+עמעום על ה-span, ו-`title` לקריאות במקלדת/עכבר
// (הבריף: "קריא למקלדת - הודעה או title"). לא מוסתרת - עדיין מוצגת ברשימה,
// רק לא ניתנת לבחירה.
interface ChipProps {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
  title?: string;
}

export function Chip({ name, value, label, checked, onChange, disabled, title }: ChipProps) {
  return (
    <label className="relative" title={title}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="peer absolute start-0 top-0 size-full m-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
      <span className="block rounded-sm border border-border-base px-md py-sm text-body transition-colors duration-(--motion-duration-fast) ease-standard peer-hover:border-border-strong peer-checked:border-text-base peer-checked:bg-text-base peer-checked:font-bold peer-checked:text-surface-base peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-primary peer-disabled:cursor-not-allowed peer-disabled:border-border-base peer-disabled:text-text-muted peer-disabled:line-through peer-disabled:opacity-60">
        {label}
      </span>
    </label>
  );
}
