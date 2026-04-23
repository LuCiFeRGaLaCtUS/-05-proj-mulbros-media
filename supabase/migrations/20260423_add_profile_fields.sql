-- Add optional display_name + organization columns to profiles
-- Run in Supabase SQL editor, or via: supabase db push
-- Safe: additive only, no data touched.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS organization text;

-- Optional: refresh PostgREST schema cache so API recognizes new columns
NOTIFY pgrst, 'reload schema';
