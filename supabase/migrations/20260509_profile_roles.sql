-- Add multi-role support to profiles
-- roles: any of 'agency', 'talent', 'admin' (or other future roles)
-- persona_type: secondary categorization within roles (e.g. talent persona = 'actor', 'musician')
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS roles text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS persona_type text;

-- Backfill: admin vertical = roles array contains 'admin'
UPDATE public.profiles
SET roles = ARRAY['admin']::text[]
WHERE vertical = 'admin' AND NOT (roles @> ARRAY['admin']::text[]);

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_roles ON public.profiles USING GIN (roles);
CREATE INDEX IF NOT EXISTS idx_profiles_persona_type ON public.profiles (persona_type) WHERE persona_type IS NOT NULL;

COMMENT ON COLUMN public.profiles.roles IS 'Multi-role: agency, talent, admin. Empty array = no special role.';
COMMENT ON COLUMN public.profiles.persona_type IS 'Secondary categorization: actor, musician, composer, etc.';
