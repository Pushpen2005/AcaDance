import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Avoid initializing on the server during build/prerender when env may be absent
export const supabase: SupabaseClient =
  typeof window !== 'undefined' && supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : (null as unknown as SupabaseClient);

export function getSupabase(): SupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error('Supabase is only available in the browser for this app');
  }
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are not configured');
  }
  return supabase;
}
