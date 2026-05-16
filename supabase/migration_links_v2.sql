-- Run in Supabase: Dashboard > SQL Editor > New Query
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT true;
