import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import SettingsLayout from "@/components/layouts/SettingsLayout";
import { SkipLink } from "@/components/ui/skip-link";
import { NetworkStatus } from "@/components/NetworkStatus";
import { Suspense, lazy } from "react";
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
const ManageProducts = lazy(() => import("@/pages/products/manage"));
const Profile = lazy(() => import("@/pages/profile"));
const Billing = lazy(() => import("@/pages/billing"));
const Settings = lazy(() => import("@/pages/settings"));
const CheckoutPage = lazy(() => import("@/pages/CheckoutPage"));
const SubscriptionManagement = lazy(() => import("@/pages/subscription-management"));

// Settings subpages
const AIPreferencesPage = lazy(() => import("@/pages/settings/ai-preferences"));
const NotificationsPage = lazy(() => import("@/pages/settings/notifications"));
const AdvancedNotificationSettings = lazy(() => import("@/pages/notifications/advanced-settings"));
const IntegrationsPage = lazy(() => import("@/pages/settings/integrations"));
const SecurityPage = lazy(() => import("@/pages/settings/security"));
const SupportPage = lazy(() => import("@/pages/settings/support"));

// Admin pages
const AdminSupportInboxPage = lazy(() => import("@/pages/admin/support-inbox"));
const AdminSubscriptions = lazy(() => import("@/pages/admin/subscriptions"));

// Help/Documentation pages
const GettingStartedPage = lazy(() => import("@/pages/help/getting-started"));
const TutorialsPage = lazy(() => import("@/pages/help/tutorials"));
const APIDocumentationPage = lazy(() => import("@/pages/help/api"));
const BestPracticesPage = lazy(() => import("@/pages/help/best-practices"));

// Analytics pages
const OptimizedProducts = lazy(() => import("@/pages/optimized-products"));
const EmailPerformance = lazy(() => import("@/pages/email-performance"));
const SmsConversion = lazy(() => import("@/pages/sms-conversion"));
const CartRecovery = lazy(() => import("@/pages/cart-recovery"));
const SeoKeywordDensity = lazy(() => import("@/pages/seo-keyword-density"));
const ContentROI = lazy(() => import("@/pages/content-roi"));
const RevenueImpact = lazy(() => import("@/pages/revenue-impact"));
const SeoRankingTracker = lazy(() => import("@/pages/seo-ranking-tracker"));
const SeoHealthDashboard = lazy(() => import("@/pages/seo-health-dashboard"));
const ABTestResults = lazy(() => import("@/pages/ab-test-results"));

// Feature pages
const AIUpsellSuggestionsPage = lazy(() => import("@/pages/ai-upsell-suggestions"));
const DynamicSegmentationPage = lazy(() => import("@/pages/dynamic-segmentation"));
const MultiChannelRepurposingPage = lazy(() => import("@/pages/multi-channel-repurposing"));
const UpsellEmailReceiptsPage = lazy(() => import("@/pages/upsell-email-receipts"));
const AbandonedCartSMSPage = lazy(() => import("@/pages/abandoned-cart-sms"));
const CustomTemplatesPage = lazy(() => import("@/pages/custom-templates"));
const BehavioralTriggersPage = lazy(() => import("@/pages/behavioral-triggers"));

// Campaign pages
const CreateCampaignPage = lazy(() => import("@/pages/campaigns/create"));
const CampaignListPage = lazy(() => import("@/pages/campaigns/list"));
const CampaignDetailPage = lazy(() => import("@/pages/campaigns/detail"));
const CampaignEditPage = lazy(() => import("@/pages/campaigns/edit"));
const TemplatesPage = lazy(() => import("@/pages/templates"));

// AI Tools pages
const ProductSeoEngine = lazy(() => import("@/pages/ai-tools/product-seo-engine"));
const BulkOptimization = lazy(() => import("@/pages/ai-tools/bulk-optimization"));
const AIImageAltText = lazy(() => import("@/pages/ai-tools/ai-image-alt-text"));
const DynamicTemplates = lazy(() => import("@/pages/ai-tools/dynamic-templates"));
const BrandVoiceMemory = lazy(() => import("@/pages/ai-tools/brand-voice-memory"));
const MultimodalAI = lazy(() => import("@/pages/ai-tools/multimodal-ai"));
const ABTestingCopy = lazy(() => import("@/pages/ai-tools/ab-testing-copy"));
const ScheduledRefresh = lazy(() => import("@/pages/ai-tools/scheduled-refresh"));
const AutopilotSettings = lazy(() => import("@/pages/ai-tools/autopilot"));
const ActivityTimeline = lazy(() => import("@/pages/ai-tools/activity-timeline"));
const PricingSettings = lazy(() => import("@/pages/ai-tools/pricing-settings"));
const CompetitorsPage = lazy(() => import("@/pages/ai-tools/competitors"));
const PricingAnalytics = lazy(() => import("@/pages/ai-tools/pricing-analytics"));
const StrategyInsights = lazy(() => import("@/pages/strategy-insights"));

// Automation pages
const CSVImportExport = lazy(() => import("@/pages/automation/csv-import-export"));
const ShopifyPublish = lazy(() => import("@/pages/automation/shopify-publish"));
const SmartBulkSuggestions = lazy(() => import("@/pages/automation/smart-bulk-suggestions"));
const RollbackChanges = lazy(() => import("@/pages/automation/rollback-changes"));
const PendingApprovals = lazy(() => import("@/pages/pending-approvals"));


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
            <ManageProducts />
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
      <Route path="/checkout" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <CheckoutPage />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/subscription" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <SubscriptionManagement />
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
      <Route path="/analytics/email-performance" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <EmailPerformance />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/analytics/sms-conversion" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <SmsConversion />
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
      <Route path="/analytics/seo-keyword-density" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <SeoKeywordDensity />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/analytics/content-roi" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <ContentROI />
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
      <Route path="/analytics/seo-ranking-tracker" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <SeoRankingTracker />
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
      <Route path="/analytics/ab-test-results" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <ABTestResults />
          </Suspense>
        </ProtectedRoute>
      )} />
      
      {/* Campaign routes */}
      <Route path="/campaigns" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <CampaignListPage />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/campaigns/create" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <CreateCampaignPage />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/campaigns/:id/edit" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <CampaignEditPage />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/campaigns/:id" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <CampaignDetailPage />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/templates" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <TemplatesPage />
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
      <Route path="/dynamic-segmentation" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <DynamicSegmentationPage />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/multi-channel-repurposing" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <MultiChannelRepurposingPage />
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
      <Route path="/custom-templates" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <CustomTemplatesPage />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/behavioral-triggers" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <BehavioralTriggersPage />
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
      <Route path="/ai-tools/dynamic-templates" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <DynamicTemplates />
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
      <Route path="/ai-tools/multimodal-ai" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <MultimodalAI />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/ai-tools/ab-testing-copy" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <ABTestingCopy />
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
      <Route path="/ai-tools/pricing-settings" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <PricingSettings />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/ai-tools/competitors" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <CompetitorsPage />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/ai-tools/pricing-analytics" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <PricingAnalytics />
          </Suspense>
        </ProtectedRoute>
      )} />
      <Route path="/strategy-insights" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <StrategyInsights />
          </Suspense>
        </ProtectedRoute>
      )} />
      
      {/* Automation routes */}
      <Route path="/automation/csv-import-export" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <CSVImportExport />
          </Suspense>
        </ProtectedRoute>
      )} />
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
      <Route path="/pending-approvals" component={() => (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <PendingApprovals />
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
          <TooltipProvider>
            <SkipLink />
            <NetworkStatus />
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
