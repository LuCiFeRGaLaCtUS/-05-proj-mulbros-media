-- Hard cap: 60 messages per minute per sender across all channels they
-- belong to. RLS already prevents cross-channel posting; this stops a single
-- compromised account from flooding any channel they have access to.

CREATE OR REPLACE FUNCTION public.enforce_team_messages_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM public.team_messages
  WHERE sender_id = NEW.sender_id
    AND created_at > (now() - interval '1 minute');

  IF recent_count >= 60 THEN
    RAISE EXCEPTION 'team_messages: rate limit exceeded (60 msgs/minute/sender)'
      USING ERRCODE = '23505', HINT = 'Slow down.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_team_messages_rate_limit ON public.team_messages;
CREATE TRIGGER trg_team_messages_rate_limit
  BEFORE INSERT ON public.team_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_team_messages_rate_limit();
