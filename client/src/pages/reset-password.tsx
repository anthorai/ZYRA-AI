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
import zyraLogoUrl from "@assets/zyra logo_1758694880266.png";

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
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
  const [tokenValid, setTokenValid] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const tokenParam = searchParams.get('token');
        
        console.log('[ResetPassword] Token from URL:', tokenParam ? 'present' : 'missing');
        
        if (!tokenParam) {
          setVerificationError('No reset token found. Please request a new password reset link.');
          setIsVerifying(false);
          return;
        }

        setToken(tokenParam);

        const response = await fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(tokenParam)}`);
        const result = await response.json();
        
        console.log('[ResetPassword] Token verification result:', result);

        if (result.valid) {
          setTokenValid(true);
          setUserEmail(result.email || '');
        } else {
          setVerificationError(result.message || 'Invalid or expired reset link.');
        }
      } catch (error: any) {
        console.error('[ResetPassword] Verification error:', error);
        setVerificationError('Failed to verify reset link. Please try again.');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, []);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      toast({
        title: "Error",
        description: "No reset token found. Please request a new link.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to reset password');
      }

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
                  Link Invalid
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
                {userEmail ? `Reset password for ${userEmail}` : 'Choose a strong password for your account'}
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
                      placeholder="Min 8 chars, uppercase, lowercase, number"
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
