-- Store attempt expiry so client + server can enforce time limits.
ALTER TABLE public.test_attempts
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

COMMENT ON COLUMN public.test_attempts.expires_at IS
  'UTC deadline = started_at + tests.duration_minutes; null means unlimited';
