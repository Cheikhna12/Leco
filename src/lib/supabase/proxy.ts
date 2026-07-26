import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { resolveRouteAccess } from "@/features/auth/route-access";
import { readVerifiedSession } from "@/lib/supabase/session";
import type { Database } from "@/types/database";

import { getPublicSupabaseConfig, hasPublicSupabaseConfig } from "./config";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!hasPublicSupabaseConfig()) {
    const decision = resolveRouteAccess(request.nextUrl.pathname, null);

    if (!decision.allowed) {
      const destination = new URL(decision.destination, request.nextUrl);
      destination.searchParams.set(
        "retour",
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
      );
      return NextResponse.redirect(destination);
    }

    return response;
  }

  const { publishableKey, url } = getPublicSupabaseConfig();
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });

        for (const { name, options, value } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const session = await readVerifiedSession(supabase);
  const decision = resolveRouteAccess(request.nextUrl.pathname, session);

  if (!decision.allowed) {
    const destination = new URL(decision.destination, request.nextUrl);

    if (
      decision.destination === "/connexion" &&
      request.nextUrl.pathname !== "/connexion"
    ) {
      destination.searchParams.set(
        "retour",
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
      );
    }

    const redirect = NextResponse.redirect(destination);

    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }

    return redirect;
  }

  return response;
}
