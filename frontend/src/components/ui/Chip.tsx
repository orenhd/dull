// "כרטיסיה" נבחרת - input radio מוסתר + span מעוצב, עם peer כדי שה-span
// יגיב למצב ה-input (checked/hover/focus-visible) בלי JS. אותה טכניקה
// שהדמו השתמש בה ב-CSS גולמי (chip input:checked + span) - כאן דרך
// Tailwind peer-* variants.
interface ChipProps {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: (value: string) => void;
}

export function Chip({ name, value, label, checked, onChange }: ChipProps) {
  return (
    <label className="relative">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="peer absolute start-0 top-0 size-full m-0 cursor-pointer opacity-0"
      />
      <span className="block rounded-sm border border-border-base px-md py-sm text-body transition-colors duration-(--motion-duration-fast) ease-standard peer-hover:border-border-strong peer-checked:border-text-base peer-checked:bg-text-base peer-checked:font-bold peer-checked:text-surface-base peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-primary">
        {label}
      </span>
    </label>
  );
}
