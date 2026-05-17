import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();

  // Check for auth-session cookie first (set by client)
  const authCookie = req.cookies.get("auth-session")?.value;
  let hasSession = false;

  if (authCookie) {
    try {
      const authData = JSON.parse(atob(authCookie));
      hasSession = !!(authData.access_token && authData.user_id);
    } catch (error) {
      console.error("Failed to parse auth-session cookie:", error);
    }
  }

  const { pathname } = req.nextUrl;

  // Protect /admin route
  if (pathname.startsWith("/admin")) {
    if (!hasSession) {
      return NextResponse.redirect(new URL("/auth?mode=login", req.url));
    }

    // Verify admin role with database
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              req.cookies.set(name, value);
              res.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    try {
      const authData = JSON.parse(atob(authCookie!));
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user_id)
        .single();

      if (!profile || profile.role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    } catch (error) {
      console.error("Admin check failed:", error);
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Protect /profile and /register
  if (pathname.startsWith("/profile") || pathname.startsWith("/register")) {
    if (!hasSession) {
      return NextResponse.redirect(new URL("/auth?mode=login", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/profile/:path*", "/register/:path*"],
};
