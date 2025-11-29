import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create client with fallback empty strings to prevent app crash
// The app will still work, but auth features won't function without proper env vars
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

