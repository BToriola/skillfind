import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
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

  // Use getUser() instead of getSession() — more reliable on server side
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;

  // Protect /admin route
  if (pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth?mode=login", req.url));
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Protect /profile and /register
  if (pathname.startsWith("/profile") || pathname.startsWith("/register")) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth?mode=login", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/profile/:path*", "/register/:path*"],
};
