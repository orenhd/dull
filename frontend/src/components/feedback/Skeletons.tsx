export function GallerySkeleton() {
  return (
    <div className="grid w-full grid-cols-1 gap-md desktop:grid-cols-2" aria-hidden="true">
      <div className="aspect-[5/4] animate-pulse-soft rounded-sm bg-surface-sunken desktop:aspect-[4/5]" />
      <div className="aspect-[5/4] animate-pulse-soft rounded-sm bg-surface-sunken desktop:aspect-[4/5]" />
    </div>
  );
}

export function ContentSkeleton() {
  return (
    <div className="flex flex-col gap-md" aria-hidden="true">
      <span className="block h-xl w-[70%] animate-pulse-soft rounded-sm bg-surface-sunken" />
      <span className="block h-md w-[40%] animate-pulse-soft rounded-sm bg-surface-sunken" />
      <span className="block h-md animate-pulse-soft rounded-sm bg-surface-sunken" />
      <span className="block h-md animate-pulse-soft rounded-sm bg-surface-sunken" />
      <span className="block h-[120px] animate-pulse-soft rounded-sm bg-surface-sunken" />
      <span className="block h-[52px] animate-pulse-soft rounded-sm bg-surface-sunken" />
    </div>
  );
}

// שלד טעינה לרשת קטלוג (HomePage/CollectionPage) - אותה רשת 2/4 עמודות
// כמו ProductGrid.tsx עצמו, כדי שלא תהיה קפיצת layout כשהתוכן האמיתי נטען.
export function CatalogGridSkeleton() {
  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-md p-0 desktop:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <li key={i} className="flex flex-col gap-xs">
          <div className="aspect-square animate-pulse-soft rounded-sm bg-surface-sunken" />
          <span className="block h-md w-[80%] animate-pulse-soft rounded-sm bg-surface-sunken" />
          <span className="block h-sm w-[40%] animate-pulse-soft rounded-sm bg-surface-sunken" />
        </li>
      ))}
    </ul>
  );
}
