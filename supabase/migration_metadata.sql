-- Run in Supabase: Dashboard > SQL Editor > New Query

-- Add metadata columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS page_title  TEXT,
  ADD COLUMN IF NOT EXISTS favicon_url TEXT,
  ADD COLUMN IF NOT EXISTS og_image_url TEXT;

-- Storage bucket for profile media (run separately if bucket doesn't exist)
-- Go to Supabase Dashboard > Storage > New Bucket
-- Name: profile-media
-- Public: YES

-- Storage RLS policies (run after creating the bucket)
CREATE POLICY "Users can upload their own media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view profile media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-media');
