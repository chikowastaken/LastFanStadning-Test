-- Fix NULL fields in existing profiles by pulling data from auth.users
UPDATE public.profiles p
SET
  email = COALESCE(p.email, u.email),
  first_name = COALESCE(p.first_name, u.raw_user_meta_data ->> 'given_name', split_part(COALESCE(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'), ' ', 1)),
  last_name = COALESCE(p.last_name, u.raw_user_meta_data ->> 'family_name'),
  full_name = COALESCE(p.full_name, u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  avatar_url = COALESCE(p.avatar_url, u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR p.first_name IS NULL OR p.full_name IS NULL);
