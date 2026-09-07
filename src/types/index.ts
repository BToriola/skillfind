export type RateType = "hourly" | "daily" | "project" | "item" | "negotiable";

export type Freelancer = {
  id: string;
  user_id: string;
  name: string;
  skill: string;
  category: string;
  state: string;
  city: string | null;
  bio: string;
  /** @deprecated Legacy free-text rate. Only read when rate_type is null
   *  (a row that predates 005_backfill_pricing.sql). New writes set the
   *  three structured fields below instead. */
  rate: string;
  rate_type: RateType | null;
  rate_min: number | null;
  rate_max: number | null;
  whatsapp: string;
  portfolio: string;
  avatar_url: string | null;
  video_intro: string | null;
  slug: string | null;
  is_approved: boolean;
  is_verified?: boolean;
  verified_at?: string | null;
  /** Maintained by the sync_portfolio_count trigger (006) — never written
   *  from the client, which the protect_freelancer_columns trigger enforces. */
  portfolio_count?: number;
  /** Generated column: portfolio_count > 0. The directory's primary sort. */
  has_portfolio?: boolean;
  created_at: string;
};

export type VerificationStatus = "pending" | "approved" | "rejected";

export type VerificationRequest = {
  id: string;
  freelancer_id: string;
  user_id: string;
  id_type: string;
  // Object paths in the PRIVATE `verification` bucket — never public URLs.
  // Read them with createSignedUrl(), not getPublicUrl().
  document_path: string | null;
  selfie_path: string | null;
  status: VerificationStatus;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type PortfolioItem = {
  id: string;
  freelancer_id: string;
  title: string;
  description: string;
  image_url: string | null;
  project_url: string | null;
  tools_used: string | null;
  created_at: string;
};