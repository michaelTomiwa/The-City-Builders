import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Page = {
  id: string;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  nav_label: string | null;
  nav_order: number;
};

export type Series = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
};

export type Sermon = {
  id: string;
  title: string;
  slug: string;
  speaker: string;
  series_id: string | null;
  youtube_url: string | null;
  youtube_video_id: string | null;
  thumbnail_url: string | null;
  description: string | null;
  duration_seconds: number | null;
  streamed_at: string;
  series?: Series | null;
};

export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  views?: number;
  likes?: number;
  tags?: string[];
  featured?: boolean;
  updated_at?: string;
};

export type PostComment = {
  id: string;
  post_id: string;
  name: string;
  body: string;
  approved: boolean;
  created_at: string;
};

export type SiteSettings = {
  id: number;
  announcement: string | null;
  announcement_link: string | null;
  announcement_active: boolean;
  logo_url?: string | null;
  pastor_image_url?: string | null;
};

export type ChurchEvent = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  cover_image_url: string | null;
};

export type GivingLink = {
  id: string;
  label: string;
  url: string;
  is_active: boolean;
};
