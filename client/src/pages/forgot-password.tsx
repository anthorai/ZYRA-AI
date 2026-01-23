import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import zyraLogoUrl from "@assets/zyra logo_1758694880266.png";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsSubmitting(true);
    try {
      console.log('Sending password reset request to backend:', data.email);
      
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();
      console.log('Backend response:', result);

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send reset email');
      }

      setEmailSent(true);
      toast({
        title: "Reset email sent!",
        description: "Check your inbox (and spam folder) for password reset instructions.",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      
      let errorMessage = error.message || "Please try again later";
      if (error.message?.includes('rate limit')) {
        errorMessage = "Too many requests. Please wait a few minutes and try again.";
      }
      
      toast({
        title: "Failed to send reset email",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-sm sm:max-w-md w-full">
        <Card className="gradient-card border-0" data-testid="card-forgot-password">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <div className="mx-auto mb-3 sm:mb-4">
                <img src={zyraLogoUrl} alt="Zyra AI" className="w-16 h-16 sm:w-20 sm:h-20 object-contain mx-auto" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white" data-testid="text-forgot-password-title">
                Reset Password
              </h2>
              <p className="text-slate-400 mt-2">
                Enter your email and we'll send you a reset link
              </p>
            </div>

            {!emailSent ? (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Label htmlFor="email" className="text-sm text-white">Email</Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      className="form-input pl-10"
                      placeholder="Enter your email"
                      {...form.register("email")}
                      data-testid="input-email"
                    />
                  </div>
                  {form.formState.errors.email && (
                    <p className="text-destructive text-sm mt-1">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-button"
                  disabled={isSubmitting}
                  data-testid="button-send-reset"
                >
                  {isSubmitting ? "Sending..." : "Send Reset Link"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-slate-300 hover:text-white"
                  onClick={() => setLocation("/auth")}
                  data-testid="button-back-to-login"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Check your email</h3>
                  <p className="text-slate-400">
                    We've sent a password reset link to{" "}
                    <span className="text-white font-medium">{form.getValues("email")}</span>
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-slate-400">
                    Didn't receive the email? Check your spam folder or
                  </p>
                  <Button
                    onClick={() => setEmailSent(false)}
                    variant="outline"
                    className="w-full border-slate-600 text-white hover:bg-slate-800"
                    data-testid="button-resend"
                  >
                    Try Again
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-slate-300 hover:text-white"
                  onClick={() => setLocation("/auth")}
                  data-testid="button-back-to-login-success"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
