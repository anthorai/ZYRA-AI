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
    
    // Don't logout if user is on password reset flow
    const currentPath = window.location.pathname;
    const isPasswordResetFlow = currentPath.startsWith('/reset-password') || 
                                 currentPath.startsWith('/forgot-password');
    if (isPasswordResetFlow) {
      console.log('⏰ Skipping inactivity logout - user is on password reset flow');
      return;
    }
    
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
        setLoading(false);
      }
    }, 5000); // 5 second timeout (faster)

    // Get initial session
    const initializeAuth = async () => {
      try {
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
        
        // Fetch app user profile if user is authenticated (pass token directly to avoid state race condition)
        if (session?.user && session?.access_token && mounted) {
          fetchAppUser(session.access_token).catch(() => {
            // Silent catch - don't fail auth flow if app user fetch fails
          });
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;

        try {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Fetch app user profile after sign in (pass token directly to avoid state race condition)
          if (event === 'SIGNED_IN' && session?.user && session?.access_token && mounted) {
            fetchAppUser(session.access_token).catch(() => {
              // Silent catch - don't block auth flow
            });
          }
          if (event === 'SIGNED_OUT' && mounted) {
            setAppUser(null);
            // Redirect to login page if not on auth-related pages
            const currentPath = window.location.pathname;
            const isAuthRelated = currentPath.startsWith('/auth') || 
                                  currentPath.startsWith('/reset-password') || 
                                  currentPath.startsWith('/forgot-password');
            if (!isAuthRelated && currentPath !== '/') {
              window.location.href = '/auth';
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

  // Fetch app user profile from backend API with timeout (reduced retries for speed)
  // Accept optional token parameter to avoid race condition with React state
  const fetchAppUser = async (tokenOverride?: string, retries = 1) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Use provided token or fall back to current session state
        const token = tokenOverride || session?.access_token;
        
        if (!token) {
          setAppUser(null);
          return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout (faster)

        const response = await fetch('/api/me', {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          setAppUser(data.user || data);
          return;
        } else if (response.status === 401) {
          setAppUser(null);
          return;
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error: any) {
        if (attempt === retries) {
          setAppUser(null);
        } else {
          // Quick retry with minimal backoff
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }
  };

  // Server-side auth proxy methods (fixes CORS/CSP issues)
  const login = async (credentials: { email: string; password: string }) => {
    setIsLoggingIn(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return { data: null, error: result };
      }
      
      // Store session in Supabase client - this triggers auth state change
      if (result.data?.session) {
        // Set session (Supabase will trigger onAuthStateChange)
        await supabase.auth.setSession(result.data.session);
      }
      
      return result;
    } catch (error: any) {
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
      
      // Store session - triggers auth state change for fast redirect
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
      // Get token synchronously from current session state (faster than await)
      const token = session?.access_token;
      
      // Fire-and-forget backend logout call (don't wait for it)
      if (token) {
        fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => {}); // Silent catch
      }
      
      // Immediately clear local session (don't wait for backend)
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
      const redirectTo = `${window.location.origin}/auth/callback`;
      console.log('🔐 Google OAuth redirect URL:', redirectTo);
      return await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo,
        }
      });
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