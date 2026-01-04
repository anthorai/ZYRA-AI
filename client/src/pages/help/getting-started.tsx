import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, Circle, Rocket, Settings, Package, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

export default function GettingStartedPage() {
  const [, setLocation] = useLocation();

  const onboardingSteps = [
    {
      id: "step-1",
      title: "Connect Your Shopify Store",
      description: "Link your Shopify store to Zyra AI to start optimizing your products",
      icon: <Settings className="w-5 h-5 text-primary" />,
      completed: false
    },
    {
      id: "step-2",
      title: "Generate AI Product Descriptions",
      description: "Use our AI to create compelling, SEO-optimized product descriptions",
      icon: <Package className="w-5 h-5 text-primary" />,
      completed: false
    },
    {
      id: "step-3",
      title: "Set Up Abandoned Cart Recovery",
      description: "Configure automated email campaigns to recover lost sales",
      icon: <TrendingUp className="w-5 h-5 text-primary" />,
      completed: false
    }
  ];

  const faqs = [
    {
      question: "How do I connect my Shopify store?",
      answer: "Navigate to Settings > Store Connection and click 'Connect Shopify Store'. You'll be redirected to Shopify to authorize Zyra AI. Once authorized, your products will automatically sync."
    },
    {
      question: "How long does product optimization take?",
      answer: "AI-powered product description generation typically takes 2-5 seconds per product. Bulk optimization processes run in the background, and you'll receive a notification when complete."
    },
    {
      question: "Can I customize the AI-generated content?",
      answer: "Absolutely! All AI-generated content can be reviewed and edited before publishing to your store. You can also configure brand voice and tone preferences in Settings."
    },
    {
      question: "What's included in the free trial?",
      answer: "The 7-day free trial includes access to all features: AI product descriptions, SEO optimization, abandoned cart recovery, and analytics dashboard with 100 AI generation credits."
    }
  ];

  return (
    <PageShell
      title="Getting Started with Zyra AI"
      subtitle="Follow these steps to set up your account and start boosting sales"
      maxWidth="xl"
      spacing="normal"
      backTo="/settings/support"
    >
      {/* Quick Start Checklist */}
      <DashboardCard
        title="Quick Start Checklist"
        description="Complete these steps to get the most out of Zyra AI"
        headerAction={<Rocket className="w-5 h-5 text-primary" />}
        testId="card-onboarding-checklist"
      >
        <div className="space-y-4">
          {onboardingSteps.map((step, index) => (
            <div
              key={step.id}
              className="flex items-start space-x-4 p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <div className="flex-shrink-0 mt-1">
                {step.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                ) : (
                  <Circle className="w-6 h-6 text-slate-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-semibold text-slate-400">STEP {index + 1}</span>
                </div>
                <h4 className="text-white font-medium text-lg mb-1">{step.title}</h4>
                <p className="text-sm text-slate-400 mb-3">{step.description}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary text-primary hover:bg-primary/10"
                  onClick={() => {
                    if (index === 0) setLocation('/settings/integrations');
                    if (index === 1) setLocation('/products');
                    if (index === 2) setLocation('/campaigns');
                  }}
                  data-testid={`button-${step.id}`}
                >
                  Start This Step
                </Button>
              </div>
              <div className="flex-shrink-0">
                {step.icon}
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>

      {/* Key Features Overview */}
      <DashboardCard
        title="Key Features"
        description="Discover what you can do with Zyra AI"
        testId="card-key-features"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <h4 className="text-white font-semibold mb-2">AI Product Descriptions</h4>
            <p className="text-sm text-slate-400 mb-3">
              Generate professional, SEO-optimized product descriptions in seconds using GPT-4.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:bg-primary/10"
              onClick={() => setLocation('/products')}
              data-testid="button-feature-descriptions"
            >
              Try It Now
            </Button>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <h4 className="text-white font-semibold mb-2">SEO Optimization</h4>
            <p className="text-sm text-slate-400 mb-3">
              Improve search rankings with AI-powered meta titles, descriptions, and alt text.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:bg-primary/10"
              onClick={() => setLocation('/products')}
              data-testid="button-feature-seo"
            >
              Optimize Products
            </Button>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <h4 className="text-white font-semibold mb-2">Cart Recovery</h4>
            <p className="text-sm text-slate-400 mb-3">
              Automated email and SMS campaigns to recover abandoned shopping carts.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:bg-primary/10"
              onClick={() => setLocation('/campaigns')}
              data-testid="button-feature-recovery"
            >
              Set Up Campaigns
            </Button>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <h4 className="text-white font-semibold mb-2">Analytics Dashboard</h4>
            <p className="text-sm text-slate-400 mb-3">
              Track performance, conversions, and ROI with real-time analytics.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:bg-primary/10"
              onClick={() => setLocation('/analytics')}
              data-testid="button-feature-analytics"
            >
              View Analytics
            </Button>
          </div>
        </div>
      </DashboardCard>

      {/* FAQs */}
      <DashboardCard
        title="Frequently Asked Questions"
        description="Quick answers to common questions"
        testId="card-faqs"
      >
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-slate-800/50 border-slate-700 rounded-lg px-4"
            >
              <AccordionTrigger className="text-white hover:text-primary">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-slate-400">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </DashboardCard>

      {/* Next Steps */}
      <DashboardCard className="bg-primary/5" testId="card-next-steps">
        <div className="flex items-start space-x-4">
          <div className="p-2 rounded-lg bg-primary/20">
            <Rocket className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-2">Ready to Get Started?</h3>
            <p className="text-slate-400 text-sm mb-4">
              Complete the onboarding checklist above and explore our video tutorials to master Zyra AI.
            </p>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setLocation('/help/tutorials')}
                className="gradient-button"
                data-testid="button-watch-tutorials"
              >
                Watch Tutorials
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation('/settings/support')}
                className="border-primary text-primary hover:bg-primary/10"
                data-testid="button-contact-support"
              >
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </DashboardCard>
    </PageShell>
  );
}
