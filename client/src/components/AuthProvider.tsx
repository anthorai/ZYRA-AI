import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

// App user type for backend user profiles
interface AppUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  plan: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}

interface AuthContextType {
  user: User | null; // Supabase user
  appUser: AppUser | null; // Backend app user profile
  session: Session | null;
  loading: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  isLoggingIn: boolean;
  isRegistering: boolean;
  isLoggingOut: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signOut: () => Promise<any>;
  // Aliases for compatibility with old auth system
  login: (credentials: { email: string; password: string }) => Promise<any>;
  register: (userData: { email: string; password: string; fullName: string }) => Promise<any>;
  logout: () => Promise<any>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    let initTimeoutId: NodeJS.Timeout;

    // Set a maximum timeout for initial auth setup to prevent infinite loading
    const initTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⚠️ Auth initialization timeout - setting loading to false');
        setLoading(false);
      }
    }, 15000); // 15 second timeout

    // Get initial session with enhanced error handling
    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing authentication...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error('❌ Error getting initial session:', error);
          setSession(null);
          setUser(null);
          setAppUser(null);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch app user profile if user is authenticated
        if (session?.user && mounted) {
          // Add a small delay to ensure session is fully established
          setTimeout(async () => {
            try {
              await fetchAppUser();
            } catch (fetchError) {
              console.error('❌ Error fetching app user:', fetchError);
              // Don't fail the entire auth flow if app user fetch fails
            }
          }, 100);
        }
      } catch (error: any) {
        if (mounted) {
          console.error('❌ Error during initial session setup:', error);
          setSession(null);
          setUser(null);
          setAppUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(initTimeout);
        }
      }
    };

    // Start initialization
    initializeAuth();

    // Listen for auth changes with better error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;

        try {
          console.log('🔄 Auth state change:', event, !!session);
          setSession(session);
          setUser(session?.user ?? null);
          
          // Fetch app user profile after sign in
          if (event === 'SIGNED_IN' && session?.user && mounted) {
            // Add a delay to ensure the session is fully established
            setTimeout(async () => {
              try {
                await fetchAppUser();
              } catch (fetchError) {
                console.error('❌ Error fetching app user on sign in:', fetchError);
              }
            }, 200);
          }
          if (event === 'SIGNED_OUT' && mounted) {
            setAppUser(null);
          }
        } catch (error: any) {
          if (mounted) {
            console.error('❌ Error during auth state change:', error);
          }
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(initTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Fetch app user profile from backend API with timeout and retry logic
  const fetchAppUser = async (retries = 2) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          console.warn('⚠️ No access token available for fetching app user');
          setAppUser(null);
          return;
        }

        // Validate token format before making request
        if (!session.access_token.startsWith('eyJ')) {
          console.error('❌ Invalid JWT token format');
          setAppUser(null);
          return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch('/api/me', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          setAppUser(data.user || data); // Handle different response formats
          console.log('✅ App user fetched successfully');
          return;
        } else if (response.status === 401) {
          console.warn('⚠️ Unauthorized - user may need to re-authenticate');
          setAppUser(null);
          return;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error: any) {
        console.error(`❌ Attempt ${attempt + 1} - Error fetching app user:`, error.message || error);
        
        if (attempt === retries) {
          console.error('❌ All attempts failed - setting app user to null');
          setAppUser(null);
        } else if (attempt < retries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
        }
      }
    }
  };

  // Compatibility methods for old auth system
  const login = async (credentials: { email: string; password: string }) => {
    setIsLoggingIn(true);
    try {
      const result = await supabase.auth.signInWithPassword({ email: credentials.email, password: credentials.password });
      return result;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const register = async (userData: { email: string; password: string; fullName: string }) => {
    setIsRegistering(true);
    try {
      const result = await supabase.auth.signUp({ email: userData.email, password: userData.password, options: { data: { full_name: userData.fullName } } });
      return result;
    } finally {
      setIsRegistering(false);
    }
  };

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      const result = await supabase.auth.signOut();
      return result;
    } finally {
      setIsLoggingOut(false);
    }
  };

  const value = {
    user,
    appUser,
    session,
    loading,
    isLoading: loading,
    isAuthenticated: !!user,
    isLoggingIn,
    isRegistering,
    isLoggingOut,
    signUp: async (email: string, password: string, fullName: string) => {
      setIsRegistering(true);
      try {
        return await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
      } finally {
        setIsRegistering(false);
      }
    },
    signIn: async (email: string, password: string) => {
      return await supabase.auth.signInWithPassword({ email, password });
    },
    signInWithGoogle: async () => {
      return await supabase.auth.signInWithOAuth({ provider: 'google' });
    },
    signOut: async () => {
      setIsLoggingOut(true);
      try {
        return await supabase.auth.signOut();
      } finally {
        setIsLoggingOut(false);
      }
    },
    // Compatibility aliases
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Remove useAuth from here to fix Fast Refresh - it's now in separate file