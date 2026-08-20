/**
 * Reusable authentication input field.
 * This component keeps labels and input styling consistent across auth pages while staying presentational only.
 */
import type { InputHTMLAttributes } from "react";

type AuthInputFieldProps = {
  label: string;
  id: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function AuthInputField({ label, id, className, ...props }: AuthInputFieldProps) {
  const mergedClassName =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" +
    (className ? ` ${className}` : "");

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-text">
        {label}
      </label>
      <input id={id} className={mergedClassName} {...props} />
    </div>
  );
}
