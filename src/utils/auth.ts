import { supabase } from "./supabase";

export async function signUp(email: string, password: string, fullName: string, businessName: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error || !data.user) return { data, error };

  // Save extra fields to profiles table
  await supabase
    .from("profiles")
    .update({ full_name: fullName, business_name: businessName })
    .eq("id", data.user.id);

  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile() {
  const user = await getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return data;
}