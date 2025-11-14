-- ========================================
-- Add Missing Columns to Profiles Table
-- ========================================
-- Run this in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste & Run

-- Add bio column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add phone column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add language column (default: 'en')
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- Add theme column (default: 'dark')
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark';

-- Add notification preferences
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notifications_email BOOLEAN DEFAULT true;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notifications_push BOOLEAN DEFAULT false;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notifications_sms BOOLEAN DEFAULT false;

-- Add 2FA column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;

-- Add location and website columns (for completeness)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS location TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS website TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS recovery_email TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS recovery_email_verified BOOLEAN DEFAULT false;

-- Add email_verified (for compatibility, though we prefer user.email_confirmed_at)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Add joined_at column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- Add role column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Member';

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_language ON public.profiles(language);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location);

-- Update existing users' joined_at to their created_at if null
UPDATE public.profiles
SET joined_at = created_at
WHERE joined_at IS NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Profile columns added successfully!';
END $$;
