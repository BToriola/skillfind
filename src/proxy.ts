import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

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

  // ── ADMIN ROUTE GUARD ──
  if (pathname.startsWith("/admin")) {
    const { data: { user } } = await supabase.auth.getUser();

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

  // ── PROTECTED ROUTES (/profile) ──
  if (pathname.startsWith("/profile")) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL("/auth?mode=login", req.url));
    }
  }

  // ── FORCE FREELANCERS TO COMPLETE PROFILE ──
  const publicPaths = [
    "/auth",
    "/register",
    "/reset-password",
    "/freelancer",
    "/api",
    "/admin",
  ];
  const isPublicPath = publicPaths.some(p => pathname.startsWith(p));

  if (!isPublicPath) {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", user.id)
        .single();

      if (profile?.user_type === "freelancer") {
        const { data: freelancer } = await supabase
          .from("freelancers")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!freelancer) {
          return NextResponse.redirect(
            new URL("/register?welcome=true", req.url)
          );
        }
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};