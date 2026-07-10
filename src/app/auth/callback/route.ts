import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;
  const code = searchParams.get("code");

  if (!code) {
    // No code — something went wrong; send to auth
    return NextResponse.redirect(`${siteUrl}/auth?mode=login`);
  }

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
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Exchange the OAuth code for a session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("OAuth callback error:", error?.message);
    return NextResponse.redirect(`${siteUrl}/auth?mode=login`);
  }

  // Check whether this Google user already has a profile row
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, user_type")
    .eq("id", data.user.id)
    .single();

  if (!profile) {
    // Brand-new Google user — create their profile row then ask for role
    await supabase.from("profiles").insert([
      {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || "",
      },
    ]);

    const redirect = NextResponse.redirect(`${siteUrl}/auth?mode=role`);
    // Carry the session cookies over to the redirect response
    res.cookies.getAll().forEach((c) => redirect.cookies.set(c.name, c.value));
    return redirect;
  }

  // Returning Google user — check if they're a freelancer who hasn't finished their profile
  if (profile.user_type === "freelancer") {
    const { data: freelancer } = await supabase
      .from("freelancers")
      .select("id")
      .eq("user_id", data.user.id)
      .single();

    if (!freelancer) {
      const redirect = NextResponse.redirect(`${siteUrl}/register?welcome=true`);
      res.cookies.getAll().forEach((c) => redirect.cookies.set(c.name, c.value));
      return redirect;
    }
  }

  // All good — send them home
  const redirect = NextResponse.redirect(`${siteUrl}/`);
  res.cookies.getAll().forEach((c) => redirect.cookies.set(c.name, c.value));
  return redirect;
}
