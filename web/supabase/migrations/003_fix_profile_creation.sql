-- ========================================
-- Fix Profile Creation Issue
-- ========================================
-- Adds INSERT policy and makes username nullable

-- Make username nullable and add default (must be done before policies)
ALTER TABLE public.profiles
  ALTER COLUMN username DROP NOT NULL;

ALTER TABLE public.profiles
  ALTER COLUMN username SET DEFAULT '';

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Recreate policies with proper permissions
-- SELECT: Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- INSERT: Users can create their own profile only
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update their own profile only
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- PUBLIC SELECT: Allow everyone to view public profile info
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Profile creation fix applied successfully!';
  RAISE NOTICE 'Users can now create and update their profiles.';
  RAISE NOTICE '========================================';
END $$;
