import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { FcGoogle } from "react-icons/fc";
import { Store } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
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
  const { user, login, register, signInWithGoogle, isLoggingIn, isRegistering } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  // Use loading states from auth hook
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Shopify installation flow state
  const [shopifyInstallState, setShopifyInstallState] = useState<string | null>(null);
  const [shopifyShopName, setShopifyShopName] = useState<string | null>(null);
  const [isAssociatingShopify, setIsAssociatingShopify] = useState(false);
  const hasAssociatedRef = useRef(false);

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
        title: "Check your email!", 
        description: "We've sent you a confirmation link. Please verify your email before logging in." 
      });
      
      // Switch to login mode after successful registration
      setMode('login');
      registerForm.reset();
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    }
  };

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        throw result.error;
      }
      // OAuth will redirect to callback page automatically
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast({
        title: "Sign in failed",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
  };

  // Check for Shopify installation flow parameters - must run before any redirect
  // Using layout effect to ensure this runs synchronously before render
  const shopifyInstallRef = useRef<string | null>(null);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shopifyInstall = params.get('shopify_install');
    const shop = params.get('shop');
    
    console.log('Auth page URL params:', { 
      shopifyInstall, 
      shop, 
      fullSearch: window.location.search,
      hasUser: !!user
    });
    
    if (shopifyInstall) {
      console.log('Shopify installation flow detected:', { shopifyInstall, shop });
      shopifyInstallRef.current = shopifyInstall;
      setShopifyInstallState(shopifyInstall);
      setShopifyShopName(shop);
      // Default to register for new Shopify installations
      setMode('register');
    }
  }, [user]);

  // Show messages based on URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirectReason = params.get('redirected');
    const confirmed = params.get('confirmed');
    
    if (redirectReason === 'session_expired') {
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please sign in again.",
        variant: "destructive",
      });
    }
    
    if (confirmed === 'true') {
      toast({
        title: "Email Confirmed!",
        description: "Your email has been verified. You can now log in.",
      });
    }
    
    // Clean up the URL parameters (but keep shopify_install for association)
    if (redirectReason || confirmed) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [toast]);

  // Handle user authentication - associate Shopify if needed, then redirect
  useEffect(() => {
    const associateAndRedirect = async () => {
      if (!user || hasAssociatedRef.current) return;
      
      // Check for shopify_install param directly from URL (in case state wasn't set yet)
      const params = new URLSearchParams(window.location.search);
      const urlShopifyInstall = params.get('shopify_install');
      const pendingState = shopifyInstallState || urlShopifyInstall || shopifyInstallRef.current;
      
      console.log('Associate check:', { 
        user: user?.email, 
        shopifyInstallState, 
        urlShopifyInstall,
        refValue: shopifyInstallRef.current,
        pendingState,
        hasAssociated: hasAssociatedRef.current
      });
      
      // If we have a pending Shopify installation, associate it first
      if (pendingState && !isAssociatingShopify) {
        hasAssociatedRef.current = true;
        setIsAssociatingShopify(true);
        console.log('Associating pending Shopify connection:', pendingState);
        
        try {
          const response = await apiRequest('POST', '/api/shopify/associate-pending', {
            pendingState: pendingState
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('Shopify connection associated successfully:', data);
            toast({
              title: "Store Connected!",
              description: `${data.shopName || 'Your Shopify store'} has been connected to Zyra AI.`,
            });
            // Redirect to dashboard with success indicator
            setLocation("/dashboard?shopify=connected");
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Failed to associate Shopify connection:', errorData);
            toast({
              title: "Store Connection Issue",
              description: errorData.error || "Your store connection may have expired. Please try reinstalling from Shopify.",
              variant: "destructive",
            });
            // Still redirect to dashboard, store connection can be done manually
            setLocation("/dashboard");
          }
        } catch (error) {
          console.error('Error associating Shopify connection:', error);
          toast({
            title: "Connection Error",
            description: "Failed to connect your store. Please try again from the integrations page.",
            variant: "destructive",
          });
          setLocation("/dashboard");
        } finally {
          setIsAssociatingShopify(false);
        }
      } else if (!pendingState) {
        // No pending Shopify installation, just redirect
        console.log('No pending Shopify installation, redirecting to dashboard');
        setLocation("/dashboard");
      }
    };
    
    associateAndRedirect();
  }, [user, shopifyInstallState, isAssociatingShopify, toast, setLocation]);

  // Show loading state while associating Shopify
  if (isAssociatingShopify) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-sm sm:max-w-md w-full">
          <Card className="gradient-card border-0">
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="mx-auto mb-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                  <Store className="w-8 h-8 text-primary animate-pulse" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Connecting Your Store</h2>
              <p className="text-muted-foreground mb-4">
                Setting up {shopifyShopName || 'your Shopify store'} with Zyra AI...
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                <span className="text-sm text-muted-foreground">Please wait</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-sm sm:max-w-md w-full">
        {/* Shopify Installation Banner */}
        {shopifyInstallState && (
          <Alert className="mb-4 bg-primary/10 border-primary/30">
            <Store className="h-4 w-4" />
            <AlertDescription>
              <strong>Almost there!</strong> {shopifyShopName ? `Sign up to connect ${shopifyShopName}` : 'Create an account to complete your Shopify store connection'}
            </AlertDescription>
          </Alert>
        )}
        
        <Card className="gradient-card border-0" data-testid="card-auth">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <div className="mx-auto mb-3 sm:mb-4">
                <img src={zyraLogoUrl} alt="Zyra AI" className="w-16 h-16 sm:w-20 sm:h-20 object-contain mx-auto" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold" data-testid="text-auth-title">
                {shopifyInstallState 
                  ? 'Complete Setup' 
                  : (mode === 'login' ? 'Welcome Back' : 'Get Started')}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground" data-testid="text-auth-subtitle">
                {shopifyInstallState 
                  ? 'Sign in or create an account to connect your store'
                  : (mode === 'login' ? 'Sign in to your Zyra AI account' : 'Create your free Zyra AI account')}
              </p>
            </div>

            {/* Google Sign In */}
            <Button
              type="button"
              variant="outline"
              className="w-full text-sm sm:text-base py-2 sm:py-3"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoggingIn || isRegistering}
              data-testid="button-google-signin"
            >
              {isGoogleLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2" />
              ) : (
                <FcGoogle className="w-5 h-5 mr-2" />
              )}
              Continue with Google
            </Button>

            <div className="relative my-4 sm:my-6">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs sm:text-sm text-muted-foreground">
                or
              </span>
            </div>

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
