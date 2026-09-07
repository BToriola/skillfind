import { supabase } from "./supabase";
import { generateSlug } from "./slug";

// Ranking, in order: listings that show real work, then verified ones, then
// newest. Ordered here rather than on the client so it survives pagination
// later, and so every consumer gets the same grid. nullsFirst is required on
// is_verified — it's nullable, and Postgres puts nulls first on a DESC sort,
// which would rank legacy rows above genuinely verified ones.
// See 006_portfolio_rank.sql for why the bucket is has_portfolio and not the
// raw count.
export async function getFreelancers() {
  const ranked = await supabase
    .from("freelancers")
    .select("*")
    .eq("is_approved", true)
    .order("has_portfolio", { ascending: false, nullsFirst: false })
    .order("is_verified", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (!ranked.error) return ranked.data || [];

  // Ordering by a column that doesn't exist fails the whole query, so if this
  // ships before 006_portfolio_rank.sql is applied the directory would come
  // back empty — the worst possible failure for the one page that has to work.
  // Retry on the pre-006 ordering instead, verified-first sort included, so
  // deploy order stops mattering. Delete this branch once 006 is applied.
  console.error(ranked.error);

  const fallback = await supabase
    .from("freelancers")
    .select("*")
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (fallback.error) { console.error(fallback.error); return []; }

  // sort is stable, so this only lifts verified listings without disturbing
  // the newest-first order within each group.
  return (fallback.data || []).sort(
    (a, b) => Number(!!b.is_verified) - Number(!!a.is_verified)
  );
}

export async function saveFreelancer(freelancer: {
  name: string;
  skill: string;
  category: string;
  state: string;
  city?: string;
  bio: string;
  rate_type: string | null;
  rate_min: number | null;
  rate_max: number | null;
  whatsapp: string;
  portfolio: string;
  video_intro?: string;
  user_id: string;
}) {
  // Generate a temporary id for slug
  const tempId = crypto.randomUUID();
  const slug = generateSlug(freelancer.name, tempId);

  // Callers no longer send the legacy `rate` column — pricing now lives in
  // rate_type/rate_min/rate_max. Whether `rate` is NOT NULL at the DB level
  // wasn't possible to confirm from here, so this guarantees a value is
  // always sent regardless, rather than risking an insert failure on it.
  const { data, error } = await supabase
    .from("freelancers")
    .insert([{ rate: "", ...freelancer, id: tempId, slug }])
    .select()
    .single();

  if (error) { console.error(error); return null; }
  return data;
}

export async function getFreelancerBySlug(slug: string) {
  const { data } = await supabase
    .from("freelancers")
    .select("*")
    .eq("slug", slug)
    .single();
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

/** head + exact count — asks Postgres for the number only, never the rows. */
export async function getPortfolioCount(freelancerId: string) {
  const { count } = await supabase
    .from("portfolio_items")
    .select("id", { count: "exact", head: true })
    .eq("freelancer_id", freelancerId);
  return count || 0;
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

  // The object path never changes between uploads (always {userId}/avatar.ext),
  // so without a cache-buster the public URL is identical every time and
  // browsers/CDNs keep serving whichever photo they first cached — a new
  // upload silently never shows up anywhere the old one was already cached.
  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
  return `${data.publicUrl}?v=${Date.now()}`;
}