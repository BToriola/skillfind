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

export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  const fileExt = file.name.split(".").pop();
  const filePath = `${userId}/avatar.${fileExt}`;

  // Remove old avatar first
  await supabase.storage.from("avatars").remove([filePath]);

  const { error } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (error) { console.error(error); return null; }

  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
  return data.publicUrl;
}