import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lightbulb, Target, TrendingUp, Zap, CheckCircle2, AlertTriangle } from "lucide-react";

export default function BestPracticesPage() {
  const productOptimizationTips = [
    {
      title: "Use Descriptive, Keyword-Rich Titles",
      description: "Include primary keywords in your product titles. Aim for 50-60 characters for optimal display.",
      do: "Premium Wireless Noise-Cancelling Headphones - 40Hr Battery",
      dont: "Headphones",
      impact: "High"
    },
    {
      title: "Write Compelling Product Descriptions",
      description: "Focus on benefits, not just features. Use AI to generate customer-centric copy.",
      do: "Experience crystal-clear audio with our premium headphones. Active noise cancellation blocks distractions, while 40-hour battery life keeps you listening all week.",
      dont: "These headphones have noise cancellation and good battery.",
      impact: "High"
    },
    {
      title: "Optimize Product Images",
      description: "Use high-quality images with descriptive alt text for SEO and accessibility.",
      do: "alt='Premium wireless headphones with noise cancellation and carrying case'",
      dont: "alt='image1.jpg'",
      impact: "Medium"
    }
  ];

  const campaignTips = [
    {
      title: "Send Cart Recovery Emails Within 1 Hour",
      description: "The first email should go out 30-60 minutes after cart abandonment for maximum impact.",
      metric: "65% higher recovery rate",
      icon: <Zap className="w-5 h-5 text-yellow-400" />
    },
    {
      title: "Use Personalized Subject Lines",
      description: "Include product names and customer names in subject lines to increase open rates.",
      metric: "45% higher open rate",
      icon: <Target className="w-5 h-5 text-blue-400" />
    },
    {
      title: "A/B Test Your Campaigns",
      description: "Test different subject lines, send times, and offers to optimize performance.",
      metric: "30% improvement average",
      icon: <TrendingUp className="w-5 h-5 text-green-400" />
    }
  ];

  const seoChecklist = [
    "Use primary keywords in first 100 words of description",
    "Include 3-5 relevant keywords naturally throughout content",
    "Add descriptive alt text to all product images",
    "Optimize meta titles to 50-60 characters",
    "Write meta descriptions between 150-160 characters",
    "Use header tags (H1, H2, H3) to structure content",
    "Include customer reviews for fresh, keyword-rich content",
    "Create unique descriptions for each product (avoid duplicates)"
  ];

  return (
    <PageShell
      title="Best Practices"
      subtitle="Expert tips and strategies to maximize your ROI with Zyra AI"
      maxWidth="xl"
      spacing="normal"
      backTo="/settings/support"
    >
      {/* Quick Wins */}
      <DashboardCard
        title="Quick Wins"
        description="High-impact optimizations you can implement today"
        headerAction={<Lightbulb className="w-5 h-5 text-primary" />}
        testId="card-quick-wins"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <h4 className="text-white font-semibold">Bulk Optimize</h4>
            </div>
            <p className="text-sm text-slate-400 mb-3">
              Use bulk optimization to update all products at once. Save 90% of manual work time.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="border-green-500/30 text-green-400 hover:bg-green-500/10 w-full"
              data-testid="button-bulk-optimize"
            >
              Start Bulk Optimize
            </Button>
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Target className="w-5 h-5 text-blue-400" />
              <h4 className="text-white font-semibold">Enable Cart Recovery</h4>
            </div>
            <p className="text-sm text-slate-400 mb-3">
              Set up abandoned cart emails. Average stores recover 15-20% of lost sales.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 w-full"
              data-testid="button-setup-recovery"
            >
              Configure Campaigns
            </Button>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h4 className="text-white font-semibold">Track Performance</h4>
            </div>
            <p className="text-sm text-slate-400 mb-3">
              Monitor analytics daily to identify top-performing products and optimize further.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 w-full"
              data-testid="button-view-analytics"
            >
              View Analytics
            </Button>
          </div>
        </div>
      </DashboardCard>

      {/* Best Practices by Category */}
      <DashboardCard
        title="Best Practices by Category"
        description="Detailed optimization strategies for maximum impact"
        testId="card-best-practices"
      >
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 mb-6">
            <TabsTrigger value="products" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              Products
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="seo" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              SEO
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="products" className="space-y-4">
            {productOptimizationTips.map((tip, index) => (
              <div key={index} className="bg-slate-800/50 rounded-lg p-5 border border-slate-700">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-white font-semibold text-lg">{tip.title}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    tip.impact === 'High' 
                      ? 'bg-red-500/20 text-red-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {tip.impact} Impact
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-4">{tip.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span className="text-xs font-semibold text-green-400">DO</span>
                    </div>
                    <p className="text-sm text-slate-300">{tip.do}</p>
                  </div>
                  <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-semibold text-red-400">DON'T</span>
                    </div>
                    <p className="text-sm text-slate-300">{tip.dont}</p>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            {campaignTips.map((tip, index) => (
              <div key={index} className="flex items-start space-x-4 p-5 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex-shrink-0 p-3 rounded-lg bg-slate-700/50">
                  {tip.icon}
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold text-lg mb-2">{tip.title}</h4>
                  <p className="text-sm text-slate-400 mb-3">{tip.description}</p>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-semibold">
                    {tip.metric}
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="seo" className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700">
              <h4 className="text-white font-semibold text-lg mb-4">SEO Optimization Checklist</h4>
              <div className="space-y-3">
                {seoChecklist.map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-200">
                <strong>Pro Tip:</strong> Run a full SEO audit on your top 20 products monthly. 
                Use Zyra AI's bulk optimization to implement improvements at scale.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DashboardCard>

      {/* Success Metrics */}
      <DashboardCard
        title="Success Metrics to Track"
        description="Key performance indicators for optimized stores"
        testId="card-success-metrics"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { metric: "Conversion Rate", target: "3-5%", current: "Industry avg: 2.5%" },
            { metric: "Cart Recovery", target: "15-20%", current: "Your goal" },
            { metric: "Organic Traffic", target: "+30%", current: "After 3 months" },
            { metric: "ROI on AI Tools", target: "3-5x", current: "Expected return" }
          ].map((item, index) => (
            <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <h4 className="text-slate-400 text-xs font-semibold mb-2">{item.metric}</h4>
              <p className="text-white text-2xl font-bold mb-1">{item.target}</p>
              <p className="text-xs text-slate-500">{item.current}</p>
            </div>
          ))}
        </div>
      </DashboardCard>

      {/* Additional Resources */}
      <DashboardCard className="bg-primary/5" testId="card-additional-resources">
        <div className="flex items-start space-x-4">
          <div className="p-2 rounded-lg bg-primary/20">
            <Lightbulb className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-2">Need Personalized Guidance?</h3>
            <p className="text-slate-400 text-sm mb-4">
              Our team of e-commerce experts can review your store and provide customized optimization strategies.
            </p>
            <div className="flex items-center space-x-3">
              <Button
                className="gradient-button"
                data-testid="button-schedule-consultation"
              >
                Schedule Free Consultation
              </Button>
              <Button
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
                data-testid="button-join-community"
              >
                Join Community
              </Button>
            </div>
          </div>
        </div>
      </DashboardCard>
    </PageShell>
  );
}
