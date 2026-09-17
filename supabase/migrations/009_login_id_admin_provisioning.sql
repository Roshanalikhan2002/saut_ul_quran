-- =============================================================================
-- Saut Ul Quran — 009_login_id_admin_provisioning.sql
-- Admin assigns login_id + password for teachers/students (no personal email required).
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS login_id TEXT;

-- Unique case-insensitive login ids (nullable for legacy rows)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_login_id_lower_uidx
  ON public.profiles (lower(login_id))
  WHERE login_id IS NOT NULL;

COMMENT ON COLUMN public.profiles.login_id IS
  'Admin-assigned login ID (e.g. STU-001, TCH-01). Maps to auth email login_id@suq.local';

-- Resolve login_id → auth email for client login (safe: returns only email string)
CREATE OR REPLACE FUNCTION public.resolve_login_email(p_login TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_raw TEXT := lower(trim(p_login));
  v_email TEXT;
BEGIN
  IF v_raw IS NULL OR v_raw = '' THEN
    RETURN NULL;
  END IF;

  -- Real email (admin) — pass through
  IF position('@' IN v_raw) > 0 THEN
    RETURN v_raw;
  END IF;

  SELECT p.email INTO v_email
  FROM public.profiles p
  WHERE p.login_id IS NOT NULL
    AND lower(p.login_id) = v_raw
  LIMIT 1;

  IF v_email IS NOT NULL THEN
    RETURN lower(v_email);
  END IF;

  -- Convention fallback used by Edge Function provisioning
  RETURN v_raw || '@suq.local';
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_login_email(TEXT) TO anon, authenticated;

-- Only admins may change login_id (students/teachers cannot rename their ID)
CREATE OR REPLACE FUNCTION public.guard_login_id_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.login_id IS DISTINCT FROM OLD.login_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can change login_id';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_login_id_update ON public.profiles;
CREATE TRIGGER trg_guard_login_id_update
  BEFORE UPDATE OF login_id ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_login_id_update();
