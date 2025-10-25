import { createClient } from '@supabase/supabase-js';

// Enhanced mock client for when Supabase config is invalid
function createMockClient() {
  const mockError = new Error('Supabase configuration is missing or invalid. Please check your environment variables.');
  
  return {
    auth: {
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: mockError }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: mockError }),
      signInWithOAuth: () => Promise.resolve({ data: { user: null, session: null }, error: mockError }),
      signOut: () => Promise.resolve({ error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      setSession: () => Promise.resolve({ data: { user: null, session: null }, error: mockError }),
      onAuthStateChange: (callback: Function) => {
        // Call callback immediately with signed out state
        setTimeout(() => callback('SIGNED_OUT', null), 0);
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
    },
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: mockError }),
      update: () => Promise.resolve({ data: null, error: mockError }),
      delete: () => Promise.resolve({ data: null, error: mockError })
    })
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