-- =============================================================================
-- Saut Ul Quran — 008_auth_helpers.sql
-- Auth helpers note (comment-only / documentation migration)
-- =============================================================================
-- Password reset is handled entirely by Supabase Auth:
--   - Client: supabase.auth.resetPasswordForEmail(...)
--   - Client: supabase.auth.updateUser({ password })
-- Do NOT create a public.request_password_reset RPC — it is unnecessary and
-- would widen the attack surface.
--
-- Profile sync on signup is already provided by public.handle_new_user()
-- (see 001_schema.sql): inserts profiles + default student role.
--
-- Optional: keep email on profiles in sync when Auth email changes.
-- Uncomment if you need email updates to mirror into public.profiles.

/*
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email,
      updated_at = now()
  WHERE id = NEW.id
    AND email IS DISTINCT FROM NEW.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sync_profile_email();
*/

COMMENT ON FUNCTION public.handle_new_user() IS
  'Creates profiles + default student role on auth.users insert. Password reset uses Supabase Auth APIs only — no custom RPC.';
