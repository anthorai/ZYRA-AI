import { createClient } from '@supabase/supabase-js';

// Session storage key for mock client
const MOCK_SESSION_KEY = 'zyra_mock_session';

// Enhanced mock client for when Supabase config is invalid
function createMockClient() {
  // Store auth state change listeners
  const authListeners: Function[] = [];
  
  // Get stored session from localStorage
  const getStoredSession = () => {
    try {
      const stored = localStorage.getItem(MOCK_SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };
  
  // Store session in localStorage
  const storeSession = (session: any) => {
    try {
      if (session) {
        localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
      } else {
        localStorage.removeItem(MOCK_SESSION_KEY);
      }
    } catch (e) {
      console.error('Failed to store session:', e);
    }
  };
  
  // Notify all auth listeners
  const notifyListeners = (event: string, session: any) => {
    authListeners.forEach(callback => {
      try {
        callback(event, session);
      } catch (e) {
        console.error('Auth listener error:', e);
      }
    });
  };
  
  return {
    auth: {
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Direct signup not supported. Use backend API.') }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Direct signin not supported. Use backend API.') }),
      signInWithOAuth: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('OAuth not configured') }),
      signOut: () => {
        storeSession(null);
        notifyListeners('SIGNED_OUT', null);
        return Promise.resolve({ error: null });
      },
      getSession: () => {
        const session = getStoredSession();
        return Promise.resolve({ data: { session }, error: null });
      },
      getUser: () => {
        const session = getStoredSession();
        return Promise.resolve({ data: { user: session?.user || null }, error: null });
      },
      refreshSession: () => {
        const session = getStoredSession();
        if (session) {
          return Promise.resolve({ data: { session, user: session.user }, error: null });
        }
        return Promise.resolve({ data: { session: null, user: null }, error: null });
      },
      setSession: (sessionData: { access_token: string; refresh_token: string }) => {
        // Build session object from tokens
        const session = {
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token,
          user: null as any
        };
        
        // Try to decode user from JWT (basic decode, not validation)
        try {
          const payload = sessionData.access_token.split('.')[1];
          const decoded = JSON.parse(atob(payload));
          session.user = {
            id: decoded.sub || decoded.userId,
            email: decoded.email,
            aud: 'authenticated',
            role: 'authenticated'
          };
        } catch (e) {
          console.warn('Could not decode JWT for mock session');
        }
        
        storeSession(session);
        notifyListeners('SIGNED_IN', session);
        return Promise.resolve({ data: { user: session.user, session }, error: null });
      },
      onAuthStateChange: (callback: Function) => {
        authListeners.push(callback);
        
        // Check for existing session and notify
        const existingSession = getStoredSession();
        setTimeout(() => {
          if (existingSession) {
            callback('INITIAL_SESSION', existingSession);
          } else {
            callback('SIGNED_OUT', null);
          }
        }, 0);
        
        return { 
          data: { 
            subscription: { 
              unsubscribe: () => {
                const index = authListeners.indexOf(callback);
                if (index > -1) authListeners.splice(index, 1);
              } 
            } 
          } 
        };
      }
    },
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: new Error('Database not configured') }),
      update: () => Promise.resolve({ data: null, error: new Error('Database not configured') }),
      delete: () => Promise.resolve({ data: null, error: new Error('Database not configured') })
    }),
    // Mock realtime channel methods
    channel: (name: string) => {
      const mockChannel = {
        on: () => mockChannel,
        subscribe: (callback?: (status: string) => void) => {
          if (callback) {
            setTimeout(() => callback('SUBSCRIBED'), 0);
          }
          return mockChannel;
        },
        unsubscribe: () => Promise.resolve()
      };
      return mockChannel;
    },
    removeChannel: () => Promise.resolve()
  } as any;
}

// Supabase configuration with enhanced error handling
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log only in development
if (import.meta.env.DEV) {
  console.log('🔧 Supabase Client Initialization:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlValid: supabaseUrl && (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'))
  });
}

// Enhanced validation for environment variables
const hasValidConfig = Boolean(
  supabaseUrl && 
  typeof supabaseUrl === 'string' && 
  supabaseUrl.length > 0 &&
  (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://')) &&
  supabaseAnonKey && 
  typeof supabaseAnonKey === 'string' &&
  supabaseAnonKey.length > 0
);

if (!hasValidConfig) {
  const errorMsg = '❌ Supabase configuration missing or invalid';
  console.error(errorMsg);
  console.error('  VITE_SUPABASE_URL:', supabaseUrl || 'MISSING');
  console.error('  VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');
  
  // In production, fail loudly to prevent silent failures
  if (import.meta.env.PROD) {
    console.error('⚠️ PRODUCTION BUILD ERROR: Supabase environment variables were not set at build time!');
    console.error('   Fix: Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Vercel and redeploy');
  }
}

// Create and export the Supabase client with error handling
let supabaseClient;
try {
  supabaseClient = hasValidConfig 
    ? createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storage: typeof window !== 'undefined' ? window.localStorage : undefined
        },
        realtime: {
          params: {
            eventsPerSecond: 2
          }
        }
      })
    : createMockClient();
  
  if (import.meta.env.DEV) {
    console.log('✅ Supabase client created:', hasValidConfig ? 'Real client' : 'Mock client');
  }
} catch (error) {
  console.error('❌ Failed to create Supabase client:', error);
  supabaseClient = createMockClient();
}

export const supabase = supabaseClient;


// Export the client as default for convenience
export default supabase;