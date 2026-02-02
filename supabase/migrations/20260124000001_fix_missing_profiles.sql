-- Comprehensive fix for missing profiles issue
-- This ensures all users always have a profile, regardless of OAuth provider

-- 1. Update the trigger function to be more robust and handle all OAuth scenarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _username TEXT;
BEGIN
  -- Try multiple fallback strategies to get a username
  _username := COALESCE(
    NEW.raw_user_meta_data->>'username',           -- Custom username field
    NEW.raw_user_meta_data->>'full_name',          -- Google OAuth full_name
    NEW.raw_user_meta_data->>'name',               -- Other OAuth providers
    NEW.raw_user_meta_data->>'preferred_username', -- Some OAuth providers
    split_part(NEW.email, '@', 1),                 -- Email prefix
    'User' || substr(NEW.id::text, 1, 8)           -- Last resort: User + first 8 chars of UUID
  );

  -- Ensure username is not empty
  IF _username IS NULL OR trim(_username) = '' THEN
    _username := 'User' || substr(NEW.id::text, 1, 8);
  END IF;

  -- Insert profile (ON CONFLICT DO NOTHING to prevent errors)
  INSERT INTO public.profiles (id, username, total_points, avatar_url)
  VALUES (
    NEW.id,
    _username,
    0,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert user role (ON CONFLICT DO NOTHING to prevent errors)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 2. Recreate the trigger to ensure it's properly connected
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Create profiles for ALL existing users who don't have one
INSERT INTO public.profiles (id, username, total_points, avatar_url)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'username',
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1),
    'User' || substr(u.id::text, 1, 8)
  ) as username,
  0 as total_points,
  u.raw_user_meta_data->>'avatar_url' as avatar_url
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- 4. Create user_roles for ALL existing users who don't have one
INSERT INTO public.user_roles (user_id, role)
SELECT
  u.id,
  'user'::app_role
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id
)
ON CONFLICT (user_id, role) DO NOTHING;

-- 5. Update any profiles with NULL or empty usernames
UPDATE public.profiles
SET username = COALESCE(
  (SELECT
    COALESCE(
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      split_part(u.email, '@', 1),
      'User' || substr(u.id::text, 1, 8)
    )
   FROM auth.users u
   WHERE u.id = profiles.id
  ),
  'User' || substr(id::text, 1, 8)
)
WHERE username IS NULL OR trim(username) = '';

-- 6. Verification query (commented out, but can be run manually)
-- SELECT
--   COUNT(*) as total_users,
--   COUNT(p.id) as users_with_profiles,
--   COUNT(r.user_id) as users_with_roles
-- FROM auth.users u
-- LEFT JOIN public.profiles p ON p.id = u.id
-- LEFT JOIN public.user_roles r ON r.user_id = u.id;
