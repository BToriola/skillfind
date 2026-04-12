import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

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

  // Get session
  const { data: { session } } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Protect /admin route
  if (pathname.startsWith("/admin")) {
    // Not logged in at all
    if (!session) {
      return NextResponse.redirect(new URL("/auth?mode=login", req.url));
    }

    // Logged in but check if admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    // Not an admin
    if (!profile || profile.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Protect /profile and /register routes — must be logged in
  if (pathname.startsWith("/profile") || pathname.startsWith("/register")) {
    if (!session) {
      return NextResponse.redirect(new URL("/auth?mode=login", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/profile/:path*", "/register/:path*"],
};
