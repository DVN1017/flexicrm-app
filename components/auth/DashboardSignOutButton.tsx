/**
 * Dashboard sign-out action.
 * This client component performs a real Supabase sign-out in the browser and redirects to login.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AUTH_MESSAGES, AUTH_ROUTES } from "@/constants/auth";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/services/auth.service";

export function DashboardSignOutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    const supabase = createClient();
    await signOut(supabase);

    setIsLoading(false);
    router.push(AUTH_ROUTES.LOGIN);
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isLoading}
      className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/25 sm:w-auto"
    >
      {isLoading ? AUTH_MESSAGES.SIGNING_OUT : AUTH_MESSAGES.SIGN_OUT}
    </button>
  );
}
