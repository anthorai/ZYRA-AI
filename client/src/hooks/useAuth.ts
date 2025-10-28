import { useContext } from 'react';
import { AuthContext } from '@/components/AuthProvider';

// Separate useAuth hook to fix Fast Refresh compatibility
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // During development hot reloads, context might be temporarily undefined
    // Return a safe default instead of throwing to prevent crashes
    if (import.meta.env.DEV) {
      console.warn('⚠️ AuthContext temporarily undefined (likely due to hot reload)');
      return {
        user: null,
        appUser: null,
        session: null,
        loading: true,
        isLoading: true,
        isAuthenticated: false,
        isLoggingIn: false,
        isRegistering: false,
        isLoggingOut: false,
        signUp: async () => ({ data: null, error: null }),
        signIn: async () => ({ data: null, error: null }),
        signInWithGoogle: async () => ({ data: null, error: null }),
        signOut: async () => ({ data: null, error: null }),
        login: async () => ({ data: null, error: null }),
        register: async () => ({ data: null, error: null }),
        logout: async () => ({ data: null, error: null }),
      };
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};