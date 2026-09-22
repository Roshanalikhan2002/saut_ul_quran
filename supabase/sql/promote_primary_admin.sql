-- Run in Supabase SQL Editor AFTER:
-- 1) Migrations 001–004, 006–009 (skip 005)
-- 2) Auth → Users → Add user: fehmidataj27@gmail.com (auto-confirm ON)

-- Makes fehmidataj27@gmail.com the only admin
DO $$
DECLARE
  v_uid UUID;
BEGIN
  SELECT id INTO v_uid
  FROM auth.users
  WHERE lower(email) = lower('fehmidataj27@gmail.com')
  LIMIT 1;

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Create Auth user fehmidataj27@gmail.com first (Authentication → Users)';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  DELETE FROM public.user_roles
  WHERE user_id = v_uid AND role = 'student';

  UPDATE public.profiles
  SET
    email = 'fehmidataj27@gmail.com',
    full_name = COALESCE(NULLIF(full_name, ''), 'Fehmida Taj'),
    updated_at = now()
  WHERE id = v_uid;
END;
$$;
