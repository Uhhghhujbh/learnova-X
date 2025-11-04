import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file');
}

if (supabaseUrl.includes('your-project-id') || supabaseKey.includes('your-anon-key')) {
  throw new Error('Please update .env.local with your actual Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: window.localStorage,
    storageKey: 'learnova-x-auth',
    debug: import.meta.env.DEV // Enable debug in development
  },
  global: {
    headers: {
      'X-Client-Info': 'learnova-x@1.0.0'
    }
  },
  db: {
    schema: 'public'
  }
});
