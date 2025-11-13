import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Key, Zap, Shield, BookOpen, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function APIDocumentationPage() {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(id);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const endpoints = [
    {
      id: "generate-description",
      method: "POST",
      path: "/api/ai/generate-description",
      description: "Generate AI-powered product descriptions",
      requestBody: `{
  "productId": "abc123",
  "title": "Premium Wireless Headphones",
  "features": ["Noise cancellation", "40hr battery"],
  "tone": "professional"
}`,
      responseBody: `{
  "success": true,
  "description": "Experience premium audio...",
  "seoKeywords": ["wireless", "headphones"],
  "creditsUsed": 1
}`
    },
    {
      id: "optimize-seo",
      method: "POST",
      path: "/api/ai/optimize-seo",
      description: "Optimize product SEO metadata",
      requestBody: `{
  "productId": "abc123",
  "title": "Premium Wireless Headphones",
  "currentDescription": "Great headphones"
}`,
      responseBody: `{
  "success": true,
  "metaTitle": "Premium Wireless Headphones - 40hr...",
  "metaDescription": "Shop premium wireless...",
  "suggestedKeywords": ["wireless", "noise-cancelling"]
}`
    },
    {
      id: "bulk-optimize",
      method: "POST",
      path: "/api/ai/bulk-optimize",
      description: "Bulk optimize multiple products",
      requestBody: `{
  "productIds": ["abc123", "def456", "ghi789"],
  "optimizationType": "description",
  "tone": "professional"
}`,
      responseBody: `{
  "success": true,
  "jobId": "job_xyz",
  "status": "processing",
  "estimatedCompletion": "2024-01-15T10:30:00Z"
}`
    },
    {
      id: "get-analytics",
      method: "GET",
      path: "/api/analytics/performance",
      description: "Retrieve performance analytics",
      requestBody: "N/A",
      responseBody: `{
  "success": true,
  "period": "last_30_days",
  "metrics": {
    "conversions": 234,
    "revenue": 45678.90,
    "roi": 3.4
  }
}`
    }
  ];

  const authExample = `// Authentication using API Key
const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer YOUR_API_KEY',
  'X-API-Version': '1.0'
};

fetch('https://api.zyra.ai/api/ai/generate-description', {
  method: 'POST',
  headers: headers,
  body: JSON.stringify({
    productId: 'abc123',
    title: 'Premium Wireless Headphones'
  })
});`;

  const webhookExample = `{
  "event": "product.optimized",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "productId": "abc123",
    "optimizationType": "description",
    "creditsUsed": 1,
    "status": "completed"
  }
}`;

  return (
    <PageShell
      title="API Documentation"
      subtitle="Integrate Zyra AI with your applications and workflows"
      maxWidth="xl"
      spacing="normal"
    >
      {/* Quick Start */}
      <DashboardCard
        title="Quick Start"
        description="Get started with the Zyra AI API in minutes"
        headerAction={<Zap className="w-5 h-5 text-primary" />}
        testId="card-api-quickstart"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Key className="w-4 h-4 text-primary" />
                </div>
                <h4 className="text-white font-semibold">1. Get API Key</h4>
              </div>
              <p className="text-sm text-slate-400 mb-3">
                Generate your API key from Settings → API Keys
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-primary text-primary hover:bg-primary/10 w-full"
                data-testid="button-get-api-key"
              >
                Get API Key
              </Button>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Code className="w-4 h-4 text-primary" />
                </div>
                <h4 className="text-white font-semibold">2. Make Request</h4>
              </div>
              <p className="text-sm text-slate-400 mb-3">
                Use your API key to authenticate requests
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-primary text-primary hover:bg-primary/10 w-full"
                data-testid="button-view-examples"
              >
                View Examples
              </Button>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <h4 className="text-white font-semibold">3. Test & Deploy</h4>
              </div>
              <p className="text-sm text-slate-400 mb-3">
                Test in sandbox mode before going live
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-primary text-primary hover:bg-primary/10 w-full"
                data-testid="button-test-api"
              >
                API Playground
              </Button>
            </div>
          </div>
        </div>
      </DashboardCard>

      {/* Authentication */}
      <DashboardCard
        title="Authentication"
        description="Secure your API requests with authentication"
        testId="card-authentication"
      >
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">AUTHENTICATION EXAMPLE</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(authExample, 'auth')}
              className="text-slate-400 hover:text-white"
              data-testid="button-copy-auth"
            >
              {copiedEndpoint === 'auth' ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <pre className="text-sm text-slate-300 overflow-x-auto">
            <code>{authExample}</code>
          </pre>
        </div>
        <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-sm text-yellow-200">
            <strong>Important:</strong> Never expose your API key in client-side code. Always make API calls from your server.
          </p>
        </div>
      </DashboardCard>

      {/* API Endpoints */}
      <DashboardCard
        title="API Endpoints"
        description="Explore available endpoints and their usage"
        testId="card-api-endpoints"
      >
        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 mb-6">
            <TabsTrigger value="ai" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              AI
            </TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              Products
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              Webhooks
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="ai" className="space-y-4">
            {endpoints.slice(0, 3).map((endpoint) => (
              <div key={endpoint.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      endpoint.method === 'POST' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {endpoint.method}
                    </span>
                    <code className="text-sm text-primary">{endpoint.path}</code>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(endpoint.path, endpoint.id)}
                    className="text-slate-400 hover:text-white"
                    data-testid={`button-copy-${endpoint.id}`}
                  >
                    {copiedEndpoint === endpoint.id ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-slate-400 mb-4">{endpoint.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-xs font-semibold text-slate-400 mb-2">REQUEST</h5>
                    <pre className="text-xs text-slate-300 bg-slate-900 rounded p-3 overflow-x-auto">
                      <code>{endpoint.requestBody}</code>
                    </pre>
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-400 mb-2">RESPONSE</h5>
                    <pre className="text-xs text-slate-300 bg-slate-900 rounded p-3 overflow-x-auto">
                      <code>{endpoint.responseBody}</code>
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="products">
            <div className="bg-slate-800/50 rounded-lg p-6 text-center">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h4 className="text-white font-semibold mb-2">Product Endpoints</h4>
              <p className="text-sm text-slate-400">
                Access product management endpoints for CRUD operations and syncing.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-500/20 text-blue-400">
                    GET
                  </span>
                  <code className="text-sm text-primary">{endpoints[3].path}</code>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(endpoints[3].path, endpoints[3].id)}
                  className="text-slate-400 hover:text-white"
                  data-testid={`button-copy-${endpoints[3].id}`}
                >
                  {copiedEndpoint === endpoints[3].id ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-slate-400 mb-4">{endpoints[3].description}</p>
              <div>
                <h5 className="text-xs font-semibold text-slate-400 mb-2">RESPONSE</h5>
                <pre className="text-xs text-slate-300 bg-slate-900 rounded p-3 overflow-x-auto">
                  <code>{endpoints[3].responseBody}</code>
                </pre>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="webhooks">
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Webhook Events</h4>
                <p className="text-sm text-slate-400 mb-4">
                  Subscribe to real-time events from Zyra AI to keep your application in sync.
                </p>
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                  <h5 className="text-xs font-semibold text-slate-400 mb-3">WEBHOOK PAYLOAD EXAMPLE</h5>
                  <pre className="text-xs text-slate-300 overflow-x-auto">
                    <code>{webhookExample}</code>
                  </pre>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DashboardCard>

      {/* Rate Limits & Best Practices */}
      <DashboardCard className="bg-primary/5" testId="card-api-limits">
        <div className="flex items-start space-x-4">
          <div className="p-2 rounded-lg bg-primary/20">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-2">Rate Limits & Best Practices</h3>
            <ul className="text-sm text-slate-400 space-y-2 mb-4">
              <li>• <strong>Rate Limit:</strong> 1000 requests per minute per API key</li>
              <li>• <strong>Burst Limit:</strong> 100 concurrent requests</li>
              <li>• <strong>Timeouts:</strong> All requests timeout after 30 seconds</li>
              <li>• <strong>Retries:</strong> Implement exponential backoff for failed requests</li>
            </ul>
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10"
              data-testid="button-view-best-practices"
            >
              View Full Documentation
            </Button>
          </div>
        </div>
      </DashboardCard>
    </PageShell>
  );
}
