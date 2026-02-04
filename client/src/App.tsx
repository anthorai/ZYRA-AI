import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/AuthProvider";
import { ZyraActivityProvider } from "@/contexts/ZyraActivityContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import SettingsLayout from "@/components/layouts/SettingsLayout";
import { SkipLink } from "@/components/ui/skip-link";
import { NetworkStatus } from "@/components/NetworkStatus";
import { TrialWelcomeDialog } from "@/components/trial-welcome-dialog";
import { Suspense, lazy, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Immediate imports for critical pages only
import Landing from "@/pages/landing";
import Auth from "@/pages/auth";
import NotFound from "@/pages/not-found";

// Lazy load all other pages for better performance
const AboutPage = lazy(() => import("@/pages/about"));
const ContactPage = lazy(() => import("@/pages/contact"));
const HelpPage = lazy(() => import("@/pages/help"));
const TermsPage = lazy(() => import("@/pages/terms"));
const BlogPage = lazy(() => import("@/pages/blog"));
const BlogArticlePage = lazy(() => import("@/pages/blog-article"));
const PrivacyPolicyPage = lazy(() => import("@/pages/privacy-policy"));
const TermsOfServicePage = lazy(() => import("@/pages/TermsOfService"));
const AuthCallback = lazy(() => import("@/pages/AuthCallback"));
const ForgotPassword = lazy(() => import("@/pages/forgot-password"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const ProductsPage = lazy(() => import("@/pages/products"));
const Profile = lazy(() => import("@/pages/profile"));
const Billing = lazy(() => import("@/pages/billing"));
const BillingConfirm = lazy(() => import("@/pages/billing-confirm"));
const Settings = lazy(() => import("@/pages/settings"));
const SubscriptionManagement = lazy(() => import("@/pages/subscription-management"));
const Reports = lazy(() => import("@/pages/reports"));

// Settings subpages
const AIPreferencesPage = lazy(() => import("@/pages/settings/ai-preferences"));
const NotificationsPage = lazy(() => import("@/pages/settings/notifications"));
const AdvancedNotificationSettings = lazy(() => import("@/pages/notifications/advanced-settings"));
const IntegrationsPage = lazy(() => import("@/pages/settings/integrations"));
const SecurityPage = lazy(() => import("@/pages/settings/security"));
const SupportPage = lazy(() => import("@/pages/settings/support"));

// Admin pages
const AdminDashboard = lazy(() => import("@/pages/admin/index"));
const AdminSupportInboxPage = lazy(() => import("@/pages/admin/support-inbox"));
const AdminSubscriptions = lazy(() => import("@/pages/admin/subscriptions"));
const AdminFeatureToggles = lazy(() => import("@/pages/admin/feature-toggles"));
const AdminAIEngine = lazy(() => import("@/pages/admin/ai-engine"));
const AdminAnalytics = lazy(() => import("@/pages/admin/analytics"));
const AdminScheduler = lazy(() => import("@/pages/admin/scheduler"));
const AdminSecurityCenter = lazy(() => import("@/pages/admin/security"));
const AdminShopifyControls = lazy(() => import("@/pages/admin/shopify"));
const AdminAPIKeys = lazy(() => import("@/pages/admin/api-keys"));
const AdminEmailNotifications = lazy(() => import("@/pages/admin/email"));
const AdminContentModeration = lazy(() => import("@/pages/admin/moderation"));
const AdminContentManagement = lazy(() => import("@/pages/admin/content"));
const AdminFileManager = lazy(() => import("@/pages/admin/files"));
const AdminDatabaseControls = lazy(() => import("@/pages/admin/database"));
const AdminRevenueLoop = lazy(() => import("@/pages/admin/revenue-loop"));
const AdminMasterLoop = lazy(() => import("@/pages/admin/master-loop"));

// Help/Documentation pages
const GettingStartedPage = lazy(() => import("@/pages/help/getting-started"));
const TutorialsPage = lazy(() => import("@/pages/help/tutorials"));
const APIDocumentationPage = lazy(() => import("@/pages/help/api"));
const BestPracticesPage = lazy(() => import("@/pages/help/best-practices"));

// Analytics pages
const OptimizedProducts = lazy(() => import("@/pages/optimized-products"));
const CartRecovery = lazy(() => import("@/pages/cart-recovery"));
const RevenueImpact = lazy(() => import("@/pages/revenue-impact"));
const SeoHealthDashboard = lazy(() => import("@/pages/seo-health-dashboard"));

// Feature pages
const AIUpsellSuggestionsPage = lazy(() => import("@/pages/ai-upsell-suggestions"));
const UpsellEmailReceiptsPage = lazy(() => import("@/pages/upsell-email-receipts"));
const AbandonedCartSMSPage = lazy(() => import("@/pages/abandoned-cart-sms"));

// AI Tools pages
const ProductSeoEngine = lazy(() => import("@/pages/ai-tools/product-seo-engine"));
const BulkOptimization = lazy(() => import("@/pages/ai-tools/bulk-optimization"));
const AIImageAltText = lazy(() => import("@/pages/ai-tools/ai-image-alt-text"));
const BrandVoiceMemory = lazy(() => import("@/pages/ai-tools/brand-voice-memory"));
const ScheduledRefresh = lazy(() => import("@/pages/ai-tools/scheduled-refresh"));
const AutopilotSettings = lazy(() => import("@/pages/ai-tools/autopilot"));
const ActivityTimeline = lazy(() => import("@/pages/ai-tools/activity-timeline"));

// Comparison/SEO marketing pages
const ShopifySeoToolsComparison = lazy(() => import("@/pages/compare/shopify-seo-tools"));
const ShopifyAiAppsComparison = lazy(() => import("@/pages/compare/shopify-ai-apps"));
const CartRecoveryAppsComparison = lazy(() => import("@/pages/compare/cart-recovery-apps"));

// Automation pages
const ShopifyPublish = lazy(() => import("@/pages/automation/shopify-publish"));
const SmartBulkSuggestions = lazy(() => import("@/pages/automation/smart-bulk-suggestions"));
const RollbackChanges = lazy(() => import("@/pages/automation/rollback-changes"));
const RevenueLoopControls = lazy(() => import("@/pages/automation/revenue-loop-controls"));
const PowerModePage = lazy(() => import("@/pages/automation/power-mode"));
const ProductAutonomy = lazy(() => import("@/pages/automation/product-autonomy"));
const PricingPage = lazy(() => import("@/pages/pricing"));
const PendingApprovals = lazy(() => import("@/pages/pending-approvals"));
const ChangeControlDashboard = lazy(() => import("@/pages/change-control-dashboard"));
const ChangeDetailsPage = lazy(() => import("@/pages/change-details"));

// Shopify installation onboarding
const ShopifyOnboarding = lazy(() => import("@/pages/ShopifyOnboarding"));

// Loading fallback component - optimized for fast appearance
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center dark-theme-bg">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="text-slate-300 text-sm">Loading...</p>
    </div>
  </div>
);

// Global password recovery handler - detects recovery tokens in URL and redirects
function PasswordRecoveryHandler({ children }: { children: React.ReactNode }) {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check for password recovery tokens in URL hash or search params
    const hash = window.location.hash;
    const search = window.location.search;
    const currentPath = window.location.pathname;
    const fullUrl = window.location.href;
    
    // Already on reset-password page, no need to redirect
    if (currentPath === '/reset-password' || currentPath.startsWith('/reset-password')) {
      console.log('Already on reset-password page, skipping redirect');
      setIsChecking(false);
      return;
    }
    
    // Parse hash params (Supabase often puts tokens in hash)
    const hashParams = new URLSearchParams(hash.substring(1));
    const searchParams = new URLSearchParams(search);
    
    const type = hashParams.get('type') || searchParams.get('type');
    const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
    const code = hashParams.get('code') || searchParams.get('code');
    const error = hashParams.get('error') || searchParams.get('error');
    const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');
    
    console.log('Password Recovery Handler - Full URL check:', {
      fullUrl: fullUrl.substring(0, 100) + '...',
      currentPath,
      hashLength: hash.length,
      type,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      hasCode: !!code,
      error,
      errorDescription
    });
    
    // Handle errors from Supabase (e.g., expired links)
    if (error) {
      console.error('Supabase auth error:', error, errorDescription);
      // Use window.location for full redirect to preserve any error info
      window.location.href = '/forgot-password';
      return;
    }
    
    // Check if this is a password recovery flow
    if (type === 'recovery') {
      console.log('PASSWORD RECOVERY DETECTED! Redirecting to reset-password page...');
      // Use window.location.href to ensure hash is preserved
      window.location.href = `/reset-password${hash || search}`;
      return;
    }
    
    // Check for access_token with recovery type in the hash
    // IMPORTANT: Only redirect if type is explicitly 'recovery' to avoid catching Google OAuth
    if (accessToken && type === 'recovery') {
      console.log('Recovery access token detected! Redirecting to reset-password...');
      window.location.href = `/reset-password${hash}`;
      return;
    }
    
    // NOTE: We intentionally do NOT redirect tokens without type='recovery'
    // as those are typically OAuth logins (Google, etc.) not password resets
    
    setIsChecking(false);
  }, []);

  // Show loading while checking for recovery tokens
  if (isChecking) {
    return <PageLoader />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Public routes - no lazy loading for critical paths */}
      <Route path="/" component={Landing} />
      <Route path="/auth" component={Auth} />
      <Route path="/forgot-password" component={() => (
        <Suspense fallback={<PageLoader />}>
          <ForgotPassword />
        </Suspense>
      )} />
      <Route path="/reset-password" component={() => (
        <Suspense fallback={<PageLoader />}>
          <ResetPassword />
        </Suspense>
      )} />
      <Route path="/about" component={() => (
        <Suspense fallback={<PageLoader />}>
          <AboutPage />
        </Suspense>
      )} />
      <Route path="/contact" component={() => (
        <Suspense fallback={<PageLoader />}>
          <ContactPage />
        </Suspense>
      )} />
      <Route path="/help" component={() => (
        <Suspense fallback={<PageLoader />}>
          <HelpPage />
        </Suspense>
      )} />
      <Route path="/terms" component={() => (
        <Suspense fallback={<PageLoader />}>
          <TermsPage />
        </Suspense>
      )} />
      <Route path="/blog" component={() => (
        <Suspense fallback={<PageLoader />}>
          <BlogPage />
        </Suspense>
      )} />
      <Route path="/blog/:slug" component={() => (
        <Suspense fallback={<PageLoader />}>
          <BlogArticlePage />
        </Suspense>
      )} />
      
      {/* SEO/Marketing comparison pages - public */}
      <Route path="/compare/shopify-seo-tools" component={() => (
        <Suspense fallback={<PageLoader />}>
          <ShopifySeoToolsComparison />
        </Suspense>
      )} />
      <Route path="/compare/shopify-ai-apps" component={() => (
        <Suspense fallback={<PageLoader />}>
          <ShopifyAiAppsComparison />
        </Suspense>
      )} />
      <Route path="/compare/cart-recovery-apps" component={() => (
        <Suspense fallback={<PageLoader />}>
          <CartRecoveryAppsComparison />
        </Suspense>
      )} />
      
      <Route path="/privacy-policy" component={() => (
        <Suspense fallback={<PageLoader />}>
          <PrivacyPolicyPage />
        </Suspense>
      )} />
      <Route path="/terms-of-service" component={() => (
        <Suspense fallback={<PageLoader />}>
          <TermsOfServicePage />
        </Suspense>
      )} />
      <Route path="/auth/callback" component={() => (
        <Suspense fallback={<PageLoader />}>
          <AuthCallback />
        </Suspense>
      )} />
      <Route path="/pricing" component={() => (
        <Suspense fallback={<PageLoader />}>
          <PricingPage />
        </Suspense>
      )} />
      
      {/* Shopify onboarding - public route for app installation */}
      <Route path="/shopify/install" component={() => (
        <Suspense fallback={<PageLoader />}>
          <ShopifyOnboarding />
        </Suspense>
      )} />
      
      {/* Protected routes with lazy loading */}
      <Route path="/dashboard" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <Dashboard />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/products" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <ProductsPage />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/profile" component={() => (
        <ProtectedRoute>
          <SettingsLayout>
            <Suspense fallback={<PageLoader />}>
              <Profile />
            </Suspense>
          </SettingsLayout>
        </ProtectedRoute>
      )} />
      <Route path="/billing" component={() => (
        <ProtectedRoute>
          <SettingsLayout>
            <Suspense fallback={<PageLoader />}>
              <Billing />
            </Suspense>
          </SettingsLayout>
        </ProtectedRoute>
      )} />
      <Route path="/billing/upgrade">
        {() => {
          const shop = localStorage.getItem('shopify_shop') || "";
          window.location.href = `/billing/upgrade?shop=${shop}`;
          return null;
        }}
      </Route>
      <Route path="/api/billing/shopify-callback" component={() => (
        <ProtectedRoute>
          <SettingsLayout>
            <Suspense fallback={<PageLoader />}>
              <Billing />
            </Suspense>
          </SettingsLayout>
        </ProtectedRoute>
      )} />
      <Route path="/billing/confirm" component={() => (
        <ProtectedRoute>
          <SettingsLayout>
            <Suspense fallback={<PageLoader />}>
              <BillingConfirm />
            </Suspense>
          </SettingsLayout>
        </ProtectedRoute>
      )} />
      {/* Welcome route - Shopify redirects here after plan approval */}
      <Route path="/welcome">
        {() => {
          // Redirect to billing page with success flag
          const params = new URLSearchParams(window.location.search);
          const shop = params.get('shop') || '';
          const chargeId = params.get('charge_id') || '';
          window.location.href = `/billing?success=true${shop ? `&shop=${encodeURIComponent(shop)}` : ''}${chargeId ? `&charge_id=${chargeId}` : ''}`;
          return null;
        }}
      </Route>
      {/* Shopify billing callback routes */}
      <Route path="/api/shopify/billing/callback" component={() => (
        <ProtectedRoute>
          <SettingsLayout>
            <Suspense fallback={<PageLoader />}>
              <Billing />
            </Suspense>
          </SettingsLayout>
        </ProtectedRoute>
      )} />
      <Route path="/subscription" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <SubscriptionManagement />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/reports" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <Reports />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/settings" component={() => (
        <ProtectedRoute>
          <SettingsLayout>
            <Suspense fallback={<PageLoader />}>
              <Settings />
            </Suspense>
          </SettingsLayout>
        </ProtectedRoute>
      )} />
      <Route path="/settings/ai-preferences" component={() => (
        <ProtectedRoute>
          <SettingsLayout>
            <Suspense fallback={<PageLoader />}>
              <AIPreferencesPage />
            </Suspense>
          </SettingsLayout>
        </ProtectedRoute>
      )} />
      <Route path="/settings/notifications" component={() => (
        <ProtectedRoute>
          <SettingsLayout>
            <Suspense fallback={<PageLoader />}>
              <NotificationsPage />
            </Suspense>
          </SettingsLayout>
        </ProtectedRoute>
      )} />
      <Route path="/notifications/advanced" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <AdvancedNotificationSettings />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/settings/integrations" component={() => (
        <ProtectedRoute>
          <SettingsLayout>
            <Suspense fallback={<PageLoader />}>
              <IntegrationsPage />
            </Suspense>
          </SettingsLayout>
        </ProtectedRoute>
      )} />
      <Route path="/settings/security" component={() => (
        <ProtectedRoute>
          <SettingsLayout>
            <Suspense fallback={<PageLoader />}>
              <SecurityPage />
            </Suspense>
          </SettingsLayout>
        </ProtectedRoute>
      )} />
      <Route path="/settings/support" component={() => (
        <ProtectedRoute>
          <SettingsLayout>
            <Suspense fallback={<PageLoader />}>
              <SupportPage />
            </Suspense>
          </SettingsLayout>
        </ProtectedRoute>
      )} />

      {/* Admin routes */}
      <Route path="/admin" component={() => (
        <ProtectedRoute requireAdmin>
          <Suspense fallback={<PageLoader />}>
            <AdminDashboard />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/admin/support-inbox" component={() => (
        <ProtectedRoute requireAdmin>
          <Suspense fallback={<PageLoader />}>
            <AdminSupportInboxPage />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/admin/subscriptions" component={() => (
        <ProtectedRoute requireAdmin>
          <Suspense fallback={<PageLoader />}>
            <AdminSubscriptions />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/admin/feature-toggles" component={() => (
        <ProtectedRoute requireAdmin>
          <Suspense fallback={<PageLoader />}>
            <AdminFeatureToggles />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/admin/ai-engine" component={() => (
        <ProtectedRoute requireAdmin>
          <Suspense fallback={<PageLoader />}>
            <AdminAIEngine />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/admin/analytics" component={() => (
        <ProtectedRoute requireAdmin>
          <Suspense fallback={<PageLoader />}>
            <AdminAnalytics />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/admin/scheduler" component={() => (
        <ProtectedRoute requireAdmin>
          <Suspense fallback={<PageLoader />}>
            <AdminScheduler />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/admin/security" component={() => (
        <ProtectedRoute requireAdmin>
          <Suspense fallback={<PageLoader />}>
            <AdminSecurityCenter />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/admin/shopify" component={() => (
        <ProtectedRoute requireAdmin>
          <Suspense fallback={<PageLoader />}>
            <AdminShopifyControls />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/admin/api-keys" component={() => (
        <ProtectedRoute requireAdmin>
          <Suspense fallback={<PageLoader />}>
            <AdminAPIKeys />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/admin/email" component={() => (
        <ProtectedRoute requireAdmin>
          <Suspense fallback={<PageLoader />}>
            <AdminEmailNotifications />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/admin/moderation" component={() => (
        <ProtectedRoute requireAdmin>
          <Suspense fallback={<PageLoader />}>
            <AdminContentModeration />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/admin/content" component={() => (
        <ProtectedRoute requireAdmin>
          <Suspense fallback={<PageLoader />}>
            <AdminContentManagement />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/admin/files" component={() => (
        <ProtectedRoute requireAdmin>
          <Suspense fallback={<PageLoader />}>
            <AdminFileManager />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/admin/database" component={() => (
        <ProtectedRoute requireAdmin>
          <Suspense fallback={<PageLoader />}>
            <AdminDatabaseControls />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/admin/revenue-loop" component={() => (
        <ProtectedRoute requireAdmin>
          <Suspense fallback={<PageLoader />}>
            <AdminRevenueLoop />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/admin/master-loop" component={() => (
        <ProtectedRoute requireAdmin>
          <Suspense fallback={<PageLoader />}>
            <AdminMasterLoop />
          </Suspense>
        </ProtectedRoute>
      )} />

      {/* Help/Documentation routes */}
      <Route path="/help/getting-started" component={() => (
        <ProtectedRoute>
          <SettingsLayout>
            <Suspense fallback={<PageLoader />}>
              <GettingStartedPage />
            </Suspense>
          </SettingsLayout>
        </ProtectedRoute>
      )} />
      <Route path="/help/tutorials" component={() => (
        <ProtectedRoute>
          <SettingsLayout>
            <Suspense fallback={<PageLoader />}>
              <TutorialsPage />
            </Suspense>
          </SettingsLayout>
        </ProtectedRoute>
      )} />
      <Route path="/help/api" component={() => (
        <ProtectedRoute>
          <SettingsLayout>
            <Suspense fallback={<PageLoader />}>
              <APIDocumentationPage />
            </Suspense>
          </SettingsLayout>
        </ProtectedRoute>
      )} />
      <Route path="/help/best-practices" component={() => (
        <ProtectedRoute>
          <SettingsLayout>
            <Suspense fallback={<PageLoader />}>
              <BestPracticesPage />
            </Suspense>
          </SettingsLayout>
        </ProtectedRoute>
      )} />

      {/* Analytics routes */}
      <Route path="/analytics/optimized-products" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <OptimizedProducts />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/analytics/cart-recovery" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <CartRecovery />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/analytics/revenue-impact" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <RevenueImpact />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/seo-health" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <SeoHealthDashboard />
          </Suspense>
        </ProtectedRoute>
      )} />
      
      {/* Feature routes */}
      <Route path="/ai-upsell-suggestions" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <AIUpsellSuggestionsPage />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/upsell-email-receipts" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <UpsellEmailReceiptsPage />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/abandoned-cart-sms" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <AbandonedCartSMSPage />
          </Suspense>
        </ProtectedRoute>
      )} />
      
      {/* AI Tools routes */}
      <Route path="/ai-tools/product-seo-engine" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <ProductSeoEngine />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/ai-tools/bulk-optimization" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <BulkOptimization />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/ai-tools/ai-image-alt-text" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <AIImageAltText />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/ai-tools/brand-voice-memory" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <BrandVoiceMemory />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/ai-tools/scheduled-refresh" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <ScheduledRefresh />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/ai-tools/autopilot" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <AutopilotSettings />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/ai-tools/activity-timeline" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <ActivityTimeline />
          </Suspense>
        </ProtectedRoute>
      )} />
      {/* Automation routes */}
      <Route path="/automation/shopify-publish" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <ShopifyPublish />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/automation/smart-bulk-suggestions" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <SmartBulkSuggestions />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/automation/rollback-changes" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <RollbackChanges />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/automation/revenue-loop" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <RevenueLoopControls />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/automation/power-mode" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <PowerModePage />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/automation/product-autonomy" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <ProductAutonomy />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/pending-approvals" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <PendingApprovals />
          </Suspense>
        </ProtectedRoute>
      )} />
      
      {/* Change Control Dashboard */}
      <Route path="/change-control" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <ChangeControlDashboard />
          </Suspense>
        </ProtectedRoute>
      )} />
      
      {/* Change Details Page */}
      <Route path="/change-control/:id" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <ChangeDetailsPage />
          </Suspense>
        </ProtectedRoute>
      )} />
      
      {/* 404 route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ZyraActivityProvider>
            <TooltipProvider>
              <PasswordRecoveryHandler>
                <SkipLink />
                <NetworkStatus />
                <TrialWelcomeDialog />
                <Toaster />
                <Router />
              </PasswordRecoveryHandler>
            </TooltipProvider>
          </ZyraActivityProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
