-- =============================================================================
-- Saut Ul Quran — 010_single_admin.sql
-- Exactly one admin account: fehmidataj27@gmail.com
-- Teachers/students are provisioned by that admin with login_id + password.
-- =============================================================================

-- Promote primary admin by email (safe to re-run)
DO $$
DECLARE
  v_uid UUID;
BEGIN
  SELECT id INTO v_uid
  FROM auth.users
  WHERE lower(email) = lower('fehmidataj27@gmail.com')
  LIMIT 1;

  IF v_uid IS NULL THEN
    RAISE NOTICE 'Admin auth user not found yet. Create fehmidataj27@gmail.com in Authentication → Users first, then re-run this migration.';
    RETURN;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Remove default student role from the jamia admin
  DELETE FROM public.user_roles
  WHERE user_id = v_uid AND role = 'student';

  -- Ensure profile email/name are set
  UPDATE public.profiles
  SET
    email = 'fehmidataj27@gmail.com',
    full_name = COALESCE(NULLIF(full_name, ''), 'Fehmida Taj'),
    updated_at = now()
  WHERE id = v_uid;
END;
$$;

-- Block assigning admin role to anyone except the primary admin email
CREATE OR REPLACE FUNCTION public.guard_single_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  IF NEW.role <> 'admin' THEN
    RETURN NEW;
  END IF;

  SELECT lower(email) INTO v_email
  FROM auth.users
  WHERE id = NEW.user_id;

  IF v_email IS DISTINCT FROM lower('fehmidataj27@gmail.com') THEN
    RAISE EXCEPTION 'Only fehmidataj27@gmail.com may hold the admin role';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_single_admin_role ON public.user_roles;
CREATE TRIGGER trg_guard_single_admin_role
  BEFORE INSERT OR UPDATE OF role ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.guard_single_admin_role();

-- Strip any accidental extra admin roles (keep only primary email)
DELETE FROM public.user_roles ur
USING auth.users u
WHERE ur.user_id = u.id
  AND ur.role = 'admin'
  AND lower(u.email) IS DISTINCT FROM lower('fehmidataj27@gmail.com');
