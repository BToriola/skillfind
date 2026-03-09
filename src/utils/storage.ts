import { supabase } from "./supabase";

export async function getFreelancers() {
  const { data, error } = await supabase
    .from("freelancers")
    .select("*")
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (error) { console.error(error); return []; }
  return data || [];
}

export async function saveFreelancer(freelancer: {
  name: string;
  skill: string;
  category: string;
  state: string;
  bio: string;
  rate: string;
  whatsapp: string;
  portfolio: string;
  user_id: string;
}) {
  const { data, error } = await supabase
    .from("freelancers")
    .insert([freelancer])
    .select()
    .single();

  if (error) { console.error(error); return null; }
  return data;
}

export async function getUserFreelancerProfile(userId: string) {
  const { data } = await supabase
    .from("freelancers")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data;
}

export async function deleteFreelancer(id: string) {
  const { error } = await supabase
    .from("freelancers")
    .delete()
    .eq("id", id);
  return { error };
}