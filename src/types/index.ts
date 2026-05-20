export type Freelancer = {
  id: string;
  user_id: string;
  name: string;
  skill: string;
  category: string;
  state: string;
  bio: string;
  rate: string;
  whatsapp: string;
  portfolio: string;
  avatar_url: string | null;
  video_intro: string | null;
  slug: string | null;
  is_approved: boolean;
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