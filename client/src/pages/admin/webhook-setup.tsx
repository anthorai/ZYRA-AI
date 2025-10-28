import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, CheckCircle2, ExternalLink, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function WebhookSetup() {
  const { toast } = useToast();
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Get the base URL from the current window location
  const baseUrl = window.location.origin;

  // Verify webhook registration status
  const { data: verificationStatus, refetch: refetchVerification, isLoading: isVerifying } = useQuery<{
    allRegistered: boolean;
    missing: string[];
  }>({
    queryKey: ['/api/shopify/webhooks/verify'],
    enabled: false, // Only fetch when manually triggered
  });

  // Manual webhook registration
  const registerWebhooksMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/shopify/webhooks/register');
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "✅ Webhooks Registered Successfully!",
          description: `All ${data.registered?.length || 4} mandatory webhooks are now configured.`,
        });
        refetchVerification();
      } else {
        toast({
          title: "⚠️ Partial Registration",
          description: data.message || "Some webhooks failed to register. Check console for details.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "❌ Registration Failed",
        description: error.message || "Failed to register webhooks. Make sure you're connected to Shopify.",
        variant: "destructive",
      });
    },
  });

  const webhooks = [
    {
      id: "app_uninstalled",
      title: "App Uninstalled",
      topic: "app/uninstalled",
      url: `${baseUrl}/api/webhooks/shopify/app_uninstalled`,
      description: "Triggered when a merchant uninstalls your app",
      required: true,
      gdpr: false,
    },
    {
      id: "customer_data_request",
      title: "Customer Data Request (GDPR)",
      topic: "customers/data_request",
      url: `${baseUrl}/api/webhooks/shopify/customers/data_request`,
      description: "GDPR compliance - customer requests their data",
      required: true,
      gdpr: true,
    },
    {
      id: "customer_redact",
      title: "Customer Redact (GDPR)",
      topic: "customers/redact",
      url: `${baseUrl}/api/webhooks/shopify/customers/redact`,
      description: "GDPR compliance - customer data deletion request",
      required: true,
      gdpr: true,
    },
    {
      id: "shop_redact",
      title: "Shop Redact (GDPR)",
      topic: "shop/redact",
      url: `${baseUrl}/api/webhooks/shopify/shop/redact`,
      description: "GDPR compliance - shop data deletion (48hrs after uninstall)",
      required: true,
      gdpr: true,
    },
  ];

  const copyToClipboard = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(id);
      toast({
        title: "Copied!",
        description: "Webhook URL copied to clipboard",
      });
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL manually",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Shopify Webhook Configuration</h1>
          <p className="text-slate-400">
            Configure these webhook URLs in your Shopify Partner Dashboard to pass app review
          </p>
        </div>

        {/* Important Notice */}
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-200">
            <strong>Required for App Review:</strong> These webhook URLs must be configured in your Shopify Partner Dashboard
            before submitting your app for review. The automated checks will verify these endpoints are accessible and
            properly secured with HMAC verification.
          </AlertDescription>
        </Alert>

        {/* Setup Instructions */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              📋 Setup Instructions
            </CardTitle>
            <CardDescription className="text-slate-400">
              Follow these steps to configure webhooks in Shopify Partner Dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-slate-300">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold">1</span>
                <div>
                  <p className="font-medium text-white">Go to Shopify Partner Dashboard</p>
                  <p className="text-sm text-slate-400">Navigate to Apps → Your App</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold">2</span>
                <div>
                  <p className="font-medium text-white">For GDPR Webhooks (Required for Review)</p>
                  <p className="text-sm text-slate-400 mt-1">Click "App setup" tab → Scroll to "Protected customer data access" section</p>
                  <ul className="text-sm text-slate-400 mt-2 space-y-1 ml-4 list-disc">
                    <li>Paste "Customer data request endpoint" URL</li>
                    <li>Paste "Customer data erasure endpoint" URL</li>
                    <li>Paste "Shop data erasure endpoint" URL</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold">3</span>
                <div>
                  <p className="font-medium text-white">For App Uninstalled Webhook</p>
                  <p className="text-sm text-slate-400 mt-1">Click "Configuration" tab → "Webhook subscriptions" → "Work with versioned webhooks"</p>
                  <ul className="text-sm text-slate-400 mt-2 space-y-1 ml-4 list-disc">
                    <li>Click "Add webhook"</li>
                    <li>Event: Select "app/uninstalled"</li>
                    <li>Format: JSON</li>
                    <li>API Version: 2025-10 (Latest)</li>
                    <li>Paste the URL from below</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold">4</span>
                <div>
                  <p className="font-medium text-white">Save and Test</p>
                  <p className="text-sm text-slate-400">Click Save → Go to Distribution tab → Run automated checks</p>
                </div>
              </div>
            </div>

            <Button
              className="w-full mt-4"
              variant="outline"
              onClick={() => window.open("https://partners.shopify.com", "_blank")}
              data-testid="button-open-partner-dashboard"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Shopify Partner Dashboard
            </Button>
          </CardContent>
        </Card>

        {/* Webhook URLs */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Required Webhook URLs</h2>
          
          {webhooks.map((webhook) => (
            <Card key={webhook.id} className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl bg-slate-900">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 min-w-0 flex-1">
                    <CardTitle className="text-base sm:text-lg md:text-xl text-white flex items-center gap-2">
                      <span className="truncate">{webhook.title}</span>
                      {webhook.gdpr && (
                        <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                          GDPR
                        </span>
                      )}
                      {webhook.required && (
                        <span className="text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded-full">
                          Required
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs md:text-sm text-slate-400">{webhook.description}</CardDescription>
                    <p className="text-sm text-slate-500 mt-2">Topic: <code className="text-slate-300">{webhook.topic}</code></p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex gap-2">
                  <div className="flex-1 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <code className="text-sm text-slate-300 break-all" data-testid={`text-webhook-url-${webhook.id}`}>
                      {webhook.url}
                    </code>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(webhook.url, webhook.id)}
                    className="flex-shrink-0"
                    data-testid={`button-copy-${webhook.id}`}
                  >
                    {copiedUrl === webhook.id ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Technical Details */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">🔒 Security Information</CardTitle>
            <CardDescription className="text-slate-400">
              All webhooks are secured with HMAC verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-300">
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">✅ Your webhooks include:</p>
              <ul className="text-sm space-y-1 ml-4 list-disc text-slate-400">
                <li>HMAC signature verification using <code className="text-slate-300">X-Shopify-Hmac-SHA256</code> header</li>
                <li>Timing-safe comparison to prevent timing attacks</li>
                <li>Raw body verification for cryptographic authenticity</li>
                <li>Automatic 401 Unauthorized response for invalid signatures</li>
                <li>200 OK response for valid webhook requests</li>
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <p className="text-sm font-medium text-white mb-2">📝 HMAC Secret Configuration:</p>
              <p className="text-sm text-slate-400">
                Your <code className="text-slate-300">SHOPIFY_API_SECRET</code> environment variable is used for HMAC verification.
                Make sure this matches your "Client Secret" from the Shopify Partner Dashboard.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Webhook Management */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">🔧 Webhook Management</CardTitle>
            <CardDescription className="text-slate-400">
              Programmatically register webhooks with your connected Shopify store
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-blue-500/50 bg-blue-500/10">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-200">
                <strong>For Custom Apps:</strong> Webhooks are automatically registered during the OAuth connection flow.
                Use the buttons below to re-register or verify webhook status.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                onClick={() => registerWebhooksMutation.mutate()}
                disabled={registerWebhooksMutation.isPending}
                className="flex-1"
                data-testid="button-register-webhooks"
              >
                {registerWebhooksMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Re-register Webhooks
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => refetchVerification()}
                disabled={isVerifying}
                className="flex-1"
                data-testid="button-verify-webhooks"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Verify Registration
                  </>
                )}
              </Button>
            </div>

            {verificationStatus && (
              <div className="mt-4 p-4 bg-slate-950 rounded-lg border border-slate-800">
                {verificationStatus.allRegistered ? (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">All webhooks are registered!</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-amber-400">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">Missing webhooks detected</span>
                    </div>
                    <ul className="text-sm text-slate-400 ml-7 space-y-1">
                      {verificationStatus.missing?.map((topic: string) => (
                        <li key={topic}>• {topic}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-200">
            <strong>Ready for Review:</strong> Once webhooks are registered (check with "Verify Registration"),
            go to Partner Dashboard → Distribution → Run automated checks. All compliance checks should pass! ✨
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
