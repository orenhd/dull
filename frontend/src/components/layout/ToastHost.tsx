import { useToastStore } from "@/stores/toastStore";

export function ToastHost() {
  const message = useToastStore((state) => state.message);

  return (
    <div
      role="status"
      aria-live="polite"
      hidden={!message}
      className="fixed inset-x-0 bottom-lg mx-auto w-fit max-w-[calc(100%-var(--space-xl))] rounded-sm bg-text-base px-lg py-sm text-center text-body text-surface-base"
    >
      {message}
    </div>
  );
}
