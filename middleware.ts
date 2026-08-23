/**
 * Global route protection middleware.
 * Any route outside auth entry points requires an active Supabase session.
 */
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { AUTH_ROUTES } from "@/constants/auth";

const PUBLIC_PATHS = new Set<string>([
  AUTH_ROUTES.LOGIN,
  AUTH_ROUTES.CREATE_COMPANY,
  AUTH_ROUTES.LOGOUT,
  AUTH_ROUTES.FORGOT_PASSWORD,
  AUTH_ROUTES.RESET_PASSWORD,
  AUTH_ROUTES.VERIFY_EMAIL,
]);

const ALLOWED_PATHS_WITHOUT_COMPANY = new Set<string>([
  AUTH_ROUTES.CREATE_COMPANY,
  AUTH_ROUTES.LOGIN,
  AUTH_ROUTES.LOGOUT,
]);

function isAuthPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname);
}

async function hasCompanyMembership(userId: string, supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data?.company_id);
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const cookie of cookiesToSet) {
            request.cookies.set(cookie.name, cookie.value);
          }

          response = NextResponse.next({
            request,
          });

          for (const cookie of cookiesToSet) {
            response.cookies.set(cookie.name, cookie.value, cookie.options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const authPath = isAuthPath(pathname);

  if (!authPath && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = AUTH_ROUTES.LOGIN;
    return NextResponse.redirect(redirectUrl);
  }

  if (!user) {
    return response;
  }

  const userHasCompany = await hasCompanyMembership(user.id, supabase);

  if (!userHasCompany && !ALLOWED_PATHS_WITHOUT_COMPANY.has(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = AUTH_ROUTES.CREATE_COMPANY;
    return NextResponse.redirect(redirectUrl);
  }

  if (userHasCompany && pathname === AUTH_ROUTES.CREATE_COMPANY) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = AUTH_ROUTES.DASHBOARD;
    return NextResponse.redirect(redirectUrl);
  }

  if (userHasCompany && pathname === AUTH_ROUTES.LOGIN) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = AUTH_ROUTES.DASHBOARD;
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
