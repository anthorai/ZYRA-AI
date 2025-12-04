import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Lock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import zyraLogoUrl from "@assets/zyra logo_1758694880266.png";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        // Check for code or access_token in URL params (check both hash and search params)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        const code = hashParams.get('code') || searchParams.get('code');
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token') || '';
        const type = hashParams.get('type') || searchParams.get('type');
        const error = hashParams.get('error') || searchParams.get('error');
        const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');
        
        console.log('[ResetPassword] URL params:', { 
          hasCode: !!code, 
          hasAccessToken: !!accessToken, 
          type,
          error,
          errorDescription,
          fullHash: window.location.hash,
          fullSearch: window.location.search 
        });
        
        // Check for explicit errors from Supabase (expired link, etc.)
        if (error) {
          console.error('[ResetPassword] Supabase error:', error, errorDescription);
          setVerificationError(errorDescription || 'The password reset link has expired or is invalid.');
          setIsVerifying(false);
          return;
        }
        
        if (code) {
          // Exchange code for session (PKCE flow)
          console.log('[ResetPassword] Exchanging code for session...');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('[ResetPassword] Code exchange error:', exchangeError);
            throw exchangeError;
          }
          if (data.session) {
            console.log('[ResetPassword] Session established from code exchange');
            setHasValidSession(true);
          }
        } else if (accessToken) {
          // Set session directly if access_token is provided (implicit flow)
          console.log('[ResetPassword] Setting session with access token...');
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          if (sessionError) {
            console.error('[ResetPassword] Set session error:', sessionError);
            throw sessionError;
          }
          if (data.session) {
            console.log('[ResetPassword] Session established from access token');
            setHasValidSession(true);
          }
        } else if (type === 'recovery') {
          // Recovery type detected - Supabase processes these automatically via onAuthStateChange
          console.log('[ResetPassword] Recovery type detected, waiting for Supabase auth event...');
          
          // Listen for auth state change from Supabase processing the recovery token
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: unknown) => {
            console.log('[ResetPassword] Auth state change:', event, !!session);
            if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
              console.log('[ResetPassword] Recovery session established via auth event');
              setHasValidSession(true);
              setIsVerifying(false);
            }
          });
          
          // Also check for existing session
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            console.log('[ResetPassword] Existing session found');
            setHasValidSession(true);
            subscription.unsubscribe();
          } else {
            // Give Supabase time to process the recovery token
            await new Promise(resolve => setTimeout(resolve, 1000));
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession) {
              console.log('[ResetPassword] Session found after wait');
              setHasValidSession(true);
              subscription.unsubscribe();
            } else {
              // Keep the form visible - user may still be able to reset
              console.log('[ResetPassword] No session yet, showing form anyway');
              setHasValidSession(true); // Allow form submission attempt
              subscription.unsubscribe();
            }
          }
        } else {
          // Check if session already exists (user might have been redirected with session already set)
          console.log('[ResetPassword] No token params, checking existing session...');
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            console.log('[ResetPassword] Existing session found');
            setHasValidSession(true);
          } else {
            // No tokens and no session - show error but don't redirect
            console.log('[ResetPassword] No tokens and no session');
            setVerificationError('No password reset token found. Please request a new reset link.');
          }
        }
      } catch (error: any) {
        console.error('[ResetPassword] Verification error:', error);
        setVerificationError(error.message || 'Failed to verify reset link. Please try again.');
      } finally {
        setIsVerifying(false);
      }
    };
    handlePasswordReset();
  }, []);

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) throw error;

      setPasswordReset(true);
      toast({
        title: "Password reset successful!",
        description: "You can now log in with your new password.",
      });
      
      setTimeout(() => setLocation("/auth"), 3000);
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Failed to reset password",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while verifying
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-300">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Show error state with option to request new link
  if (verificationError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-sm sm:max-w-md w-full">
          <Card className="gradient-card border-0">
            <CardContent className="p-6 sm:p-8">
              <div className="text-center mb-6 sm:mb-8">
                <div className="mx-auto mb-3 sm:mb-4">
                  <img src={zyraLogoUrl} alt="Zyra AI" className="w-16 h-16 sm:w-20 sm:h-20 object-contain mx-auto" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  Link Expired
                </h2>
                <p className="text-slate-400 mt-2">
                  {verificationError}
                </p>
              </div>
              <Button
                onClick={() => setLocation("/forgot-password")}
                className="w-full gradient-button"
                data-testid="button-request-new-link"
              >
                Request New Reset Link
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-sm sm:max-w-md w-full">
        <Card className="gradient-card border-0" data-testid="card-reset-password">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <div className="mx-auto mb-3 sm:mb-4">
                <img src={zyraLogoUrl} alt="Zyra AI" className="w-16 h-16 sm:w-20 sm:h-20 object-contain mx-auto" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white" data-testid="text-reset-password-title">
                Set New Password
              </h2>
              <p className="text-slate-400 mt-2">
                Choose a strong password for your account
              </p>
            </div>

            {!passwordReset ? (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Label htmlFor="password" className="text-sm text-white">New Password</Label>
                  <div className="relative mt-2">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      className="form-input pl-10"
                      placeholder="Enter new password"
                      {...form.register("password")}
                      data-testid="input-password"
                    />
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-destructive text-sm mt-1">{form.formState.errors.password.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-sm text-white">Confirm Password</Label>
                  <div className="relative mt-2">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      className="form-input pl-10"
                      placeholder="Confirm new password"
                      {...form.register("confirmPassword")}
                      data-testid="input-confirm-password"
                    />
                  </div>
                  {form.formState.errors.confirmPassword && (
                    <p className="text-destructive text-sm mt-1">{form.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-button"
                  disabled={isSubmitting}
                  data-testid="button-reset-password"
                >
                  {isSubmitting ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Password Reset!</h3>
                  <p className="text-slate-400">
                    Your password has been successfully reset.
                    Redirecting to login...
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
