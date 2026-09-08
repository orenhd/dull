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
