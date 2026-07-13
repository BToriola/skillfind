import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const siteUrl = req.nextUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/auth?error=no_code`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.error("Callback error:", error);
    return NextResponse.redirect(`${siteUrl}/auth?error=callback_failed`);
  }

  const user = data.session.user;

  // Check if profile exists
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, user_type")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Brand new Google user — create profile
    await supabase.from("profiles").insert([{
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || "",
    }]);
    return NextResponse.redirect(`${siteUrl}/auth?mode=role`);
  }

  // Check if they have a freelancer profile
  const { data: freelancer } = await supabase
    .from("freelancers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profile.user_type === "freelancer" && !freelancer) {
    return NextResponse.redirect(`${siteUrl}/register?welcome=true`);
  }

  return NextResponse.redirect(`${siteUrl}/`);
}
