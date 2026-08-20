/**
 * Reusable text link for authentication navigation hints.
 * It provides consistent link appearance and focus visibility between auth pages.
 */
import Link from "next/link";
import type { ReactNode } from "react";

type AuthTextLinkProps = {
  href: string;
  children: ReactNode;
};

export function AuthTextLink({ href, children }: AuthTextLinkProps) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-primary underline-offset-4 transition-colors hover:text-primary/90 hover:underline focus:outline-none focus:ring-2 focus:ring-primary/25"
    >
      {children}
    </Link>
  );
}
