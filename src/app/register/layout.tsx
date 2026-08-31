import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { createServerSupabase } from "@/utils/supabase-server";

export default async function RegisterLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?mode=login");

  return <>{children}</>;
}
