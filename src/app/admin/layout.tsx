import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { createServerSupabase } from "@/utils/supabase-server";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?mode=login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/");

  return <>{children}</>;
}
