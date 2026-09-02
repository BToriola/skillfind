import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Every approved freelancer becomes an indexable URL here automatically —
// this is what makes the directory grow its own search footprint as people
// sign up, with no manual step. Suspended/unapproved listings are excluded
// the same way the public directory and freelancer page already are.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { data } = await supabase
    .from("freelancers")
    .select("slug, created_at")
    .eq("is_approved", true)
    .not("slug", "is", null);

  const profilePages: MetadataRoute.Sitemap = (data || []).map(f => ({
    url: `${siteUrl}/freelancer/${f.slug}`,
    // No updated_at column exists yet, so created_at is the closest available
    // freshness signal — a stale lastmod costs nothing, it just under-hints.
    lastModified: new Date(f.created_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...profilePages,
  ];
}
