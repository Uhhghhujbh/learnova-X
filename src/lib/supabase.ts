import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: window.localStorage,
    storageKey: 'learnova-x-auth',
    debug: import.meta.env.DEV
  },
  global: {
    headers: {
      'X-Client-Info': 'learnova-x@1.0.0'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Enhanced session management
export const sessionManager = {
  // Track session activity
  trackActivity: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase
        .from('user_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('session_token', session.access_token);
    }
  },

  // Create new session record
  createSession: async (userId: string, token: string) => {
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language
    };

    await supabase
      .from('user_sessions')
      .insert([{
        user_id: userId,
        session_token: token,
        device_info: deviceInfo,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }]);
  },

  // Cleanup expired sessions
  cleanupSessions: async () => {
    await supabase
      .from('user_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString());
  },

  // Get active sessions
  getActiveSessions: async (userId: string) => {
    const { data } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .order('last_activity', { ascending: false });
    
    return data || [];
  },

  // Revoke session
  revokeSession: async (sessionId: string) => {
    await supabase
      .from('user_sessions')
      .delete()
      .eq('id', sessionId);
  }
};

// Auto-track activity every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    sessionManager.trackActivity();
  }, 5 * 60 * 1000);
}
