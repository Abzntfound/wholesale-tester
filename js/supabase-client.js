/**
 * Supabase browser client — anon key only (safe for frontend).
 */
import { ENV } from './env.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

let client = null;

export function isSupabaseConfigured() {
  return Boolean(ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY);
}

export function getSupabase() {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
  return client;
}
