import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';
const placeholderPattern = /placeholder|your-project|your-anon-key/i;

function isValidSupabaseUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !placeholderPattern.test(url.hostname);
  } catch {
    return false;
  }
}

export const isSupabaseConfigured =
  isValidSupabaseUrl(supabaseUrl) &&
  supabasePublishableKey.length > 0 &&
  !placeholderPattern.test(supabasePublishableKey);

// Keep the client constructible so the app can render setup guidance before auth is configured.
const supabase = createClient(
  isSupabaseConfigured
    ? supabaseUrl
    : typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost',
  isSupabaseConfigured ? supabasePublishableKey : 'not-configured',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  },
);

export { supabase };
