/**
 * Reusable primary action button for authentication screens.
 * It centralizes button presentation so every auth form keeps the same sizing and accessibility focus styles.
 */
import type { ButtonHTMLAttributes } from "react";

type AuthActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function AuthActionButton({ className, children, ...props }: AuthActionButtonProps) {
  const mergedClassName =
    "w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/25" +
    (className ? ` ${className}` : "");

  return (
    <button className={mergedClassName} {...props}>
      {children}
    </button>
  );
}
