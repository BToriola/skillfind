export type Freelancer = {
  id: string;
  user_id: string;
  name: string;
  skill: string;
  category: string;
  state: string;
  city: string | null;
  bio: string;
  rate: string;
  whatsapp: string;
  portfolio: string;
  avatar_url: string | null;
  video_intro: string | null;
  slug: string | null;
  is_approved: boolean;
  is_verified?: boolean;
  verified_at?: string | null;
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