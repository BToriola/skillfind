import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { formatLocation } from "@/utils/helpers";
import FreelancerProfileClient from "./FreelancerProfileClient";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  params: Promise<{ slug: string }>;
};

// Cached per request so generateMetadata and the page share one query.
// Unapproved profiles stay unreachable here too, otherwise suspending a
// freelancer would only hide them from the directory listing.
const getFreelancer = cache(async (slug: string) => {
  const { data } = await supabase
    .from("freelancers")
    .select("*")
    .eq("slug", slug)
    .eq("is_approved", true)
    .single();
  return data;
});

// Google's structured-data guidelines prohibit an aggregateRating with no
// real reviews behind it — so this only ever returns a value when count > 0,
// and the JSON-LD below omits the field entirely otherwise.
const getRatingSummary = cache(async (freelancerId: string) => {
  const { data } = await supabase
    .from("reviews")
    .select("rating")
    .eq("freelancer_id", freelancerId);

  if (!data || data.length === 0) return null;
  const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
  return { average: avg, count: data.length };
});

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const freelancer = await getFreelancer(slug);

  if (!freelancer) {
    return { title: "Freelancer Not Found | SkillFind" };
  }

  // A city-level location ("in Bodija, Ibadan" vs. just "in Oyo") is more
  // specific than what most competing listings can offer, which is the
  // actual SEO edge of going hyperlocal — worth it here, not just on-page.
  const location = formatLocation(freelancer.city, freelancer.state);

  return {
    title: `${freelancer.name} — ${freelancer.skill} in ${location} | SkillFind`,
    description: freelancer.bio,
    openGraph: {
      title: `${freelancer.name} | SkillFind 🇳🇬`,
      description: `${freelancer.skill} based in ${location}, Nigeria. ${freelancer.bio}`,
      images: freelancer.avatar_url
        ? [{ url: freelancer.avatar_url, alt: `${freelancer.name} — ${freelancer.skill}` }]
        : [],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `${freelancer.name} | SkillFind 🇳🇬`,
      description: `${freelancer.skill} in ${location}, Nigeria`,
    },
  };
}

export default async function FreelancerPage({ params }: Props) {
  const { slug } = await params;
  const freelancer = await getFreelancer(slug);

  if (!freelancer) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const rating = await getRatingSummary(freelancer.id);

  // LocalBusiness (rather than Person) is what Google's rich results
  // actually support with star ratings in search — the closer fit for a
  // directory whose whole pitch is "a local service provider," which most
  // of these listings are (plumbers, tailors, designers), even where the
  // freelancer is technically a sole individual rather than a company.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: freelancer.name,
    description: freelancer.bio,
    url: `${siteUrl}/freelancer/${freelancer.slug}`,
    ...(freelancer.avatar_url ? { image: freelancer.avatar_url } : {}),
    address: {
      "@type": "PostalAddress",
      ...(freelancer.city ? { addressLocality: freelancer.city } : {}),
      addressRegion: freelancer.state,
      addressCountry: "NG",
    },
    ...(rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating.average.toFixed(1),
            reviewCount: rating.count,
          },
        }
      : {}),
  };

  return (
    <>
      {/* Static JSON built above, not user-supplied HTML. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FreelancerProfileClient freelancer={freelancer} />
    </>
  );
}
