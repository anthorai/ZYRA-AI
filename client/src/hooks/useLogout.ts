import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

/**
 * Standardized logout hook with comprehensive error handling,
 * loading states, and consistent user feedback across all components
 */
export const useLogout = () => {
  const { logout, isLoggingOut } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  /**
   * Enhanced logout function with comprehensive error handling
   * @param redirectTo - Optional redirect path (defaults to landing page)
   * @param showSuccessToast - Whether to show success notification (default: true)
   */
  const handleLogout = async (redirectTo: string = "/", showSuccessToast: boolean = true) => {
    try {
      console.log('🔄 Starting logout process...');
      const { error } = await logout();
      
      if (error) {
        console.error('❌ Logout error:', error);
        toast({
          title: "Logout Failed",
          description: error.message || "An error occurred during logout. Please try again.",
          variant: "destructive",
        });
        return { success: false, error };
      } else {
        console.log('✅ Logout successful');
        
        if (showSuccessToast) {
          toast({
            title: "Logged Out Successfully",
            description: "You have been securely logged out.",
          });
        }
        
        // Redirect after successful logout
        setLocation(redirectTo);
        return { success: true, error: null };
      }
    } catch (error: any) {
      console.error('❌ Unexpected logout error:', error);
      toast({
        title: "Logout Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  return {
    handleLogout,
    isLoggingOut
  };
};