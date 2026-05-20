import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import FreelancerProfileClient from "./FreelancerProfileClient";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  params: Promise<{ slug: string }>;
};

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: freelancer } = await supabase
    .from("freelancers")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!freelancer) {
    return { title: "Freelancer Not Found | SkillFind" };
  }

  return {
    title: `${freelancer.name} — ${freelancer.skill} in ${freelancer.state} | SkillFind`,
    description: freelancer.bio,
    openGraph: {
      title: `${freelancer.name} | SkillFind 🇳🇬`,
      description: `${freelancer.skill} based in ${freelancer.state}, Nigeria. ${freelancer.bio}`,
      images: freelancer.avatar_url ? [freelancer.avatar_url] : [],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `${freelancer.name} | SkillFind 🇳🇬`,
      description: `${freelancer.skill} in ${freelancer.state}, Nigeria`,
    },
  };
}

export default async function FreelancerPage({ params }: Props) {
  const { slug } = await params;
  const { data: freelancer } = await supabase
    .from("freelancers")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!freelancer) notFound();

  return <FreelancerProfileClient freelancer={freelancer} />;
}
