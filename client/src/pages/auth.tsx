import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { FcGoogle } from "react-icons/fc";
import zyraLogoUrl from "@assets/zyra logo_1758694880266.png";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  terms: z.boolean().refine(val => val, "You must agree to the terms"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function Auth() {
  const { user, login, register, isLoggingIn, isRegistering } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  // Use loading states from auth hook
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema), 
    defaultValues: { email: "", password: "", fullName: "", terms: false },
  });

  const onLoginSubmit = async (data: LoginForm) => {
    try {
      const result = await login(data);
      
      // Check if login was successful
      if (result.error) {
        throw result.error;
      }
      
      toast({ 
        title: "Welcome back!", 
        description: "Successfully logged in." 
      });
      
      // Don't manually redirect - let the useEffect handle it when user state updates
      // This ensures the auth state is fully updated before navigation
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    }
  };

  const onRegisterSubmit = async (data: RegisterForm) => {
    try {
      const { terms, ...registerData } = data;
      const result = await register(registerData);
      
      // Check if registration was successful
      if (result.error) {
        throw result.error;
      }
      
      toast({ 
        title: "Welcome to Zyra AI!", 
        description: "Account created successfully!" 
      });
      
      // Don't manually redirect - let the useEffect handle it when user state updates
      // This ensures the auth state is fully updated before navigation
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    }
  };

  // Google sign-in removed - using session-based auth only

  // Show session expired message if redirected
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirectReason = params.get('redirected');
    
    if (redirectReason === 'session_expired') {
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please sign in again.",
        variant: "destructive",
      });
      
      // Clean up the URL parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [toast]);

  // Redirect if user is already logged in
  useEffect(() => {
    console.log('🔍 Auth page - user state:', { hasUser: !!user, userId: user?.id });
    if (user) {
      console.log('🚀 Redirecting to dashboard...');
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-sm sm:max-w-md w-full">
        <Card className="gradient-card border-0" data-testid="card-auth">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <div className="mx-auto mb-3 sm:mb-4">
                <img src={zyraLogoUrl} alt="Zyra AI" className="w-16 h-16 sm:w-20 sm:h-20 object-contain mx-auto" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold" data-testid="text-auth-title">
                {mode === 'login' ? 'Welcome Back' : 'Get Started'}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground" data-testid="text-auth-subtitle">
                {mode === 'login' ? 'Sign in to your Zyra AI account' : 'Create your free Zyra AI account'}
              </p>
            </div>

            {/* Google Sign In Button removed - using session auth only */}

            {mode === 'login' ? (
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4 sm:space-y-6">
                <div>
                  <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="form-input mt-1 sm:mt-2 text-sm sm:text-base"
                    placeholder="Enter your email"
                    {...loginForm.register("email")}
                    data-testid="input-email"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-destructive text-xs sm:text-sm mt-1">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm sm:text-base">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    className="form-input mt-1 sm:mt-2 text-sm sm:text-base"
                    placeholder="Enter your password"
                    {...loginForm.register("password")}
                    data-testid="input-password"
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-destructive text-xs sm:text-sm mt-1">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" />
                    <Label htmlFor="remember" className="text-xs sm:text-sm text-muted-foreground">Remember me</Label>
                  </div>
                  <button 
                    type="button" 
                    className="text-xs sm:text-sm text-primary hover:underline"
                    onClick={() => setLocation("/forgot-password")}
                    data-testid="button-forgot-password"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button 
                  type="submit" 
                  className="w-full gradient-button text-sm sm:text-base py-2 sm:py-3"
                  disabled={isLoggingIn}
                  data-testid="button-login"
                >
                  {isLoggingIn ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            ) : (
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4 sm:space-y-6">
                <div>
                  <Label htmlFor="fullName" className="text-sm sm:text-base">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    className="form-input mt-1 sm:mt-2 text-sm sm:text-base"
                    placeholder="Enter your full name"
                    {...registerForm.register("fullName")}
                    data-testid="input-fullname"
                  />
                  {registerForm.formState.errors.fullName && (
                    <p className="text-destructive text-xs sm:text-sm mt-1">{registerForm.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="form-input mt-1 sm:mt-2 text-sm sm:text-base"
                    placeholder="Enter your email"
                    {...registerForm.register("email")}
                    data-testid="input-email"
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-destructive text-xs sm:text-sm mt-1">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm sm:text-base">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    className="form-input mt-1 sm:mt-2 text-sm sm:text-base"
                    placeholder="Create a password"
                    {...registerForm.register("password")}
                    data-testid="input-password"
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-destructive text-xs sm:text-sm mt-1">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="flex items-start space-x-2">
                  <Controller
                    name="terms"
                    control={registerForm.control}
                    render={({ field }) => (
                      <Checkbox 
                        id="terms"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-0.5"
                        data-testid="checkbox-terms"
                      />
                    )}
                  />
                  <Label htmlFor="terms" className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    I agree to the <button type="button" className="text-primary hover:underline">Terms of Service</button> and <button type="button" className="text-primary hover:underline">Privacy Policy</button>
                  </Label>
                </div>
                {registerForm.formState.errors.terms && (
                  <p className="text-destructive text-xs sm:text-sm">{registerForm.formState.errors.terms.message}</p>
                )}

                <Button 
                  type="submit" 
                  className="w-full gradient-button text-sm sm:text-base py-2 sm:py-3"
                  disabled={isLoggingIn}
                  data-testid="button-register"
                >
                  {isRegistering ? "Creating Account..." : "Start Free Trial"}
                </Button>
              </form>
            )}

            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">
                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button 
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="text-primary hover:underline"
                  data-testid="button-switch-mode"
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
