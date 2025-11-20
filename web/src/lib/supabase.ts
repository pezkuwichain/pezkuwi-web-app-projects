import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  if (import.meta.env.DEV) console.warn('Supabase credentials not found in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };