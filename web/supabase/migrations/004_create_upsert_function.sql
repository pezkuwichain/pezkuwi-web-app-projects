-- ========================================
-- Create Secure Upsert Function for Profiles
-- ========================================
-- Uses SECURITY DEFINER to bypass RLS for authenticated users

-- First, ensure username is nullable
ALTER TABLE public.profiles
  ALTER COLUMN username DROP NOT NULL;

ALTER TABLE public.profiles
  ALTER COLUMN username SET DEFAULT '';

-- Create secure upsert function
CREATE OR REPLACE FUNCTION public.upsert_user_profile(
  p_username TEXT DEFAULT '',
  p_full_name TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL,
  p_phone_number TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_website TEXT DEFAULT NULL,
  p_language TEXT DEFAULT 'en',
  p_theme TEXT DEFAULT 'dark',
  p_notifications_email BOOLEAN DEFAULT true,
  p_notifications_push BOOLEAN DEFAULT false,
  p_notifications_sms BOOLEAN DEFAULT false
)
RETURNS public.profiles AS $$
DECLARE
  result public.profiles;
BEGIN
  -- Use auth.uid() to ensure user can only upsert their own profile
  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    bio,
    phone_number,
    location,
    website,
    language,
    theme,
    notifications_email,
    notifications_push,
    notifications_sms,
    updated_at
  )
  VALUES (
    auth.uid(),
    p_username,
    p_full_name,
    p_bio,
    p_phone_number,
    p_location,
    p_website,
    p_language,
    p_theme,
    p_notifications_email,
    p_notifications_push,
    p_notifications_sms,
    NOW()
  )
  ON CONFLICT (id)
  DO UPDATE SET
    username = COALESCE(NULLIF(EXCLUDED.username, ''), profiles.username, ''),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    bio = COALESCE(EXCLUDED.bio, profiles.bio),
    phone_number = COALESCE(EXCLUDED.phone_number, profiles.phone_number),
    location = COALESCE(EXCLUDED.location, profiles.location),
    website = COALESCE(EXCLUDED.website, profiles.website),
    language = COALESCE(EXCLUDED.language, profiles.language),
    theme = COALESCE(EXCLUDED.theme, profiles.theme),
    notifications_email = COALESCE(EXCLUDED.notifications_email, profiles.notifications_email),
    notifications_push = COALESCE(EXCLUDED.notifications_push, profiles.notifications_push),
    notifications_sms = COALESCE(EXCLUDED.notifications_sms, profiles.notifications_sms),
    updated_at = NOW()
  RETURNING *
  INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION public.upsert_user_profile TO authenticated;

-- Revoke from public for security
REVOKE EXECUTE ON FUNCTION public.upsert_user_profile FROM PUBLIC;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Profile upsert function created successfully!';
  RAISE NOTICE 'Function: upsert_user_profile()';
  RAISE NOTICE 'This bypasses RLS using SECURITY DEFINER';
  RAISE NOTICE '========================================';
END $$;
