import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

// App user type for backend user profiles
interface AppUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  plan: string;
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

// Session timeout constants (in milliseconds)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const WARNING_TIME = INACTIVITY_TIMEOUT - WARNING_BEFORE_TIMEOUT; // Show warning at 25 minutes

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Session timeout refs
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);
  const isMountedRef = useRef(true); // Track component mount state
  const hasHadActivityRef = useRef(false); // Track if user has had any activity

  // Clear all session timeout timers
  const clearSessionTimers = () => {
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current);
      logoutTimeoutRef.current = null;
    }
    warningShownRef.current = false;
  };

  // Handle automatic logout due to inactivity
  const handleInactivityLogout = async () => {
    // Guard against component unmount
    if (!isMountedRef.current) return;
    
    console.log('⏰ Session timeout - logging out due to inactivity');
    toast({
      title: "Session Expired",
      description: "You have been logged out due to inactivity.",
      variant: "destructive",
    });
    await supabase.auth.signOut();
  };

  // Show warning toast before logout
  const showInactivityWarning = () => {
    if (!warningShownRef.current) {
      warningShownRef.current = true;
      console.log('⚠️ Showing inactivity warning');
      toast({
        title: "Session Expiring Soon",
        description: "You will be logged out in 5 minutes due to inactivity. Move your mouse or click to stay logged in.",
        variant: "default",
      });
    }
  };

  // Reset session timeout timers on user activity
  const resetSessionTimeout = () => {
    // Only reset if user is authenticated
    if (!user) return;

    // Only start timers if we've had user activity (prevents premature timer start)
    if (!hasHadActivityRef.current) return;

    clearSessionTimers();

    // Set warning timeout (25 minutes)
    warningTimeoutRef.current = setTimeout(() => {
      showInactivityWarning();
    }, WARNING_TIME);

    // Set logout timeout (30 minutes)
    logoutTimeoutRef.current = setTimeout(() => {
      handleInactivityLogout();
    }, INACTIVITY_TIMEOUT);
  };

  // Track user activity for session timeout
  useEffect(() => {
    // Only set up activity tracking if user is authenticated
    if (!user) {
      clearSessionTimers();
      hasHadActivityRef.current = false; // Reset activity flag when user logs out
      return;
    }

    // Activity event types to track
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const eventOptions: AddEventListenerOptions = { passive: true }; // Store options to reuse for both add and remove

    // Reset timeout on any activity
    const handleActivity = () => {
      // Only start timers after first activity (prevents premature timer start)
      if (!hasHadActivityRef.current) {
        hasHadActivityRef.current = true;
        console.log('🎯 First user activity detected - starting session timers');
      }
      resetSessionTimeout();
    };

    // Don't initialize timeout immediately - wait for first user activity
    // This prevents timers from starting on page load/refresh before user interaction

    // Add event listeners for user activity
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, eventOptions);
    });

    // Cleanup function
    return () => {
      clearSessionTimers();
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity, eventOptions); // Now matches addEventListener
      });
    };
  }, [user]); // Re-run when user authentication state changes

  useEffect(() => {
    let mounted = true;
    isMountedRef.current = true; // Set to true on mount
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
            // Redirect to login page if not already there (handles token refresh failures)
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
              console.log('🔄 Redirecting to login page after sign out...');
              window.location.href = '/auth?redirected=session_expired';
            }
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
      isMountedRef.current = false; // Set to false on unmount
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
          const userProfile = data.user || data;
          console.log('✅ App user fetched successfully:', userProfile);
          setAppUser(userProfile);
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

  // Server-side auth proxy methods (fixes CORS/CSP issues)
  const login = async (credentials: { email: string; password: string }) => {
    setIsLoggingIn(true);
    try {
      console.log('🔑 Starting login process...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const result = await response.json();
      console.log('📥 Login response received:', { ok: response.ok, hasSession: !!result.data?.session });
      
      if (!response.ok) {
        console.error('❌ Login failed:', result);
        return { data: null, error: result };
      }
      
      // Store session in Supabase client for compatibility
      if (result.data?.session) {
        console.log('💾 Setting session in Supabase client...');
        await supabase.auth.setSession(result.data.session);
        console.log('✅ Session set successfully');
      } else {
        console.warn('⚠️ No session in login response');
      }
      
      return result;
    } catch (error: any) {
      console.error('❌ Login error:', error);
      return { data: null, error: { message: error.message } };
    } finally {
      setIsLoggingIn(false);
    }
  };

  const register = async (userData: { email: string; password: string; fullName: string }) => {
    setIsRegistering(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return { data: null, error: result };
      }
      
      // Store session in Supabase client for compatibility
      if (result.data?.session) {
        await supabase.auth.setSession(result.data.session);
      }
      
      return result;
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    } finally {
      setIsRegistering(false);
    }
  };

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      // Clear local Supabase session
      const result = await supabase.auth.signOut();
      return result;
    } catch (error: any) {
      return { error: { message: error.message } };
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