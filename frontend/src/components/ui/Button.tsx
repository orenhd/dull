import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

const BASE =
  "block w-full text-center rounded-sm px-xl py-md text-body-strong font-bold transition-opacity duration-150 ease-out disabled:cursor-not-allowed";

const VARIANTS = {
  primary: "bg-text-base text-surface-base hover:opacity-90 disabled:bg-border-base disabled:text-text-muted",
  secondary: "w-auto! inline-block bg-surface-base text-text-base border border-text-base hover:bg-surface-sunken",
} as const;

// מיוצא בנפרד כדי שאפשר יהיה להלביש את אותו עיצוב על אלמנט שהוא לא
// <button> (בעיקר <Link> של TanStack Router - "חזרה לקולקציה" ב-
// SoldOutNotice) בלי סמנטיקת HTML לא-תקינה של buttonבתוך button.
export function buttonClassName(variant: ButtonProps["variant"] = "primary", className = ""): string {
  return `${BASE} ${VARIANTS[variant]} ${className}`.trim();
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button className={buttonClassName(variant, className)} {...props} />;
}
