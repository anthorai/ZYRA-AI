import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Star, TrendingUp, ShoppingCart, Mail, Search, BarChart3, Cog, ArrowRight, Play, Check, Gift, Crown, Award, Settings, FileText, Network, Activity, Shield, Palette, LogOut } from "lucide-react";
import ResponsiveNavbar from "@/components/responsive-navbar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import zyraLogoUrl from "@assets/zyra logo_1758694880266.png";

export default function Landing() {
  const { isAuthenticated, loading, logout, isLoggingOut } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Handle logout functionality
  const handleLogout = async () => {
    try {
      const { error } = await logout();
      
      if (error) {
        console.error('❌ Logout error:', error);
        toast({
          title: "Logout Failed",
          description: error.message || "An error occurred during logout. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Logged Out Successfully",
          description: "You have been securely logged out.",
        });
        // Redirect to landing page
        setLocation("/");
      }
    } catch (error: any) {
      console.error('❌ Unexpected logout error:', error);
      toast({
        title: "Logout Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };
  const features = [
    {
      icon: <Settings className="w-6 h-6" />,
      title: "Smart Product Optimization",
      description: "Automatically improves your product titles, descriptions, and SEO for maximum visibility."
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "SEO & Content Automation",
      description: "Generate smart SEO titles, meta tags, and image alt-text in seconds."
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "AI-Powered Growth Intelligence",
      description: "Discover which products, campaigns, and customer segments drive the most revenue."
    },
    {
      icon: <Network className="w-6 h-6" />,
      title: "Multi-Channel Automation",
      description: "Repurpose content & campaigns across email, SMS, blogs, ads, and Shopify instantly."
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: "Advanced Analytics & Insights",
      description: "Track every metric that matters: sales, content ROI, email & SMS performance."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Workflow & Safety Tools",
      description: "Streamline your workflow while keeping your data safe and reversible."
    },
    {
      icon: <Palette className="w-6 h-6" />,
      title: "Brand & Creative AI",
      description: "Keep your messaging and visuals consistent with AI-assisted creativity."
    }
  ];

  const plans = [
    {
      name: "7-Day Free Trial",
      price: "$0",
      period: "7 days",
      icon: <Gift className="w-8 h-8" />,
      description: "Try ZYRA risk-free for 7 days.",
      whoItsFor: "",
      features: [
        "✨ 100 credits / 7 days",
        "• Product Optimization & SEO:",
        "• Optimized Products – 20 credits",
        "• SEO Keyword Density Analysis – 10 credits",
        "• Conversion Boosting & Sales Automation:",
        "• AI-Powered Growth Intelligence – 20 credits",
        "• Basic A/B Testing – 10 credits",
        "• Content & Branding at Scale:",
        "• Smart Product Descriptions – 20 credits",
        "• Limited Dynamic Templates – 10 credits",
        "• Performance Tracking & ROI Insights:",
        "• Email Performance Analytics – 10 credits",
        "• Workflow & Integration Tools:",
        "• One-Click Shopify Publish – 10 credits",
        "• Rollback Button – included"
      ],
      popular: false
    },
    {
      name: "Starter",
      price: "$49",
      period: "per month",
      icon: <Zap className="w-8 h-8" />,
      description: "Best for new Shopify stores just getting started.",
      whoItsFor: "Best for new Shopify stores just getting started.",
      features: [
        "✨ 1,000 credits / month",
        "• Product Optimization & SEO:",
        "• Optimized Products – 200 credits",
        "• SEO Keyword Density Analysis – 100 credits",
        "• AI Image Alt-Text Generator – 100 credits",
        "• Smart SEO Titles & Meta Tags – 100 credits",
        "• Conversion Boosting & Sales Automation:",
        "• AI-Powered Growth Intelligence – 150 credits",
        "• A/B Testing – 50 credits",
        "• Upsell Email Receipts – 100 credits",
        "• Abandoned Cart SMS – 50 credits",
        "• Content & Branding at Scale:",
        "• Smart Product Descriptions – 100 credits",
        "• Dynamic Templates – 50 credits",
        "• Brand Voice Memory – included",
        "• Performance Tracking & ROI Insights:",
        "• Email & SMS Conversion Analytics – included",
        "• Workflow & Integration Tools:",
        "• CSV Import/Export – included",
        "• One-Click Shopify Publish – included",
        "• Rollback Button – included",
        "• Smart Bulk Suggestions – included"
      ],
      popular: false
    },
    {
      name: "Growth",
      price: "$299",
      period: "per month",
      icon: <Award className="w-8 h-8" />,
      description: "Made for scaling merchants ready to grow.",
      whoItsFor: "Made for scaling merchants ready to grow.",
      features: [
        "✨ 5,000 credits / month",
        "• Product Optimization & SEO:",
        "• All Starter features +",
        "• SEO Ranking Tracker – 200 credits",
        "• Bulk Optimization & Smart Bulk Suggestions – 500 credits",
        "• Scheduled Refresh for Content & SEO Updates – 300 credits",
        "• Conversion Boosting & Sales Automation:",
        "• AI Upsell Suggestions & Triggers – 300 credits",
        "• Dynamic Segmentation of Customers – 200 credits",
        "• Behavioral Targeting – 200 credits",
        "• Full A/B Test Results Dashboard – included",
        "• Content & Branding at Scale:",
        "• Custom Templates – included",
        "• Multimodal AI (text + image + insights) – 300 credits",
        "• Multi-Channel Content Repurposing – 300 credits",
        "• Performance Tracking & ROI Insights:",
        "• Full Email & SMS tracking – included",
        "• Content ROI Tracking – included",
        "• Revenue Impact Attribution – included",
        "• Product Management Dashboard – included",
        "• Workflow & Integration Tools:",
        "• Unlimited Starter workflow tools"
      ],
      popular: true
    },
    {
      name: "Pro",
      price: "$999",
      period: "per month",
      icon: <Crown className="w-8 h-8" />,
      description: "Perfect for high-revenue brands & enterprises.",
      whoItsFor: "Perfect for high-revenue brands & enterprises.",
      features: [
        "✨ 20,000 credits / month",
        "• Product Optimization & SEO:",
        "• All Growth features + priority processing",
        "• Conversion Boosting & Sales Automation:",
        "• Full AI-driven automation for campaigns, upsells, and behavioral targeting",
        "• Content & Branding at Scale:",
        "• Full template library, advanced brand voice memory, multimodal AI insights, multi-channel automation",
        "• Performance Tracking & ROI Insights:",
        "• Enterprise-grade analytics and revenue attribution dashboard",
        "• Workflow & Integration Tools:",
        "• Enterprise bulk management, CSV import/export, rollback, smart bulk suggestions at scale"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <ResponsiveNavbar
        navItems={[
          { label: "Features", href: "#features", external: true },
          { label: "Pricing", href: "#pricing", external: true },
          // Dynamic nav items based on authentication state
          ...(loading ? [
            { label: "Log in", href: "/auth" } // Show login during loading state
          ] : isAuthenticated ? [
            { 
              label: isLoggingOut ? "Logging out..." : "Logout", 
              onClick: handleLogout,
              disabled: isLoggingOut
            }
          ] : [
            { label: "Log in", href: "/auth" }
          ])
        ]}
        actionButton={{
          label: "Get Started",
          href: "/auth"
        }}
      />

      {/* Hero Section */}
      <section className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent" data-testid="text-hero-title">
            Smarter Sales, Faster Growth
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-6 sm:mb-8 leading-relaxed px-2 sm:px-0" data-testid="text-hero-subtitle">
            AI-powered Shopify optimization that boosts sales, recovers carts, and automates your growth with intelligent product descriptions and SEO.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12 px-4 sm:px-0">
            <Button asChild className="gradient-button w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold" data-testid="button-start-trial">
              <Link href="/auth">
                Start 7-Day Free Trial
              </Link>
            </Button>
            <Button variant="outline" className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold" data-testid="button-watch-demo">
              <Play className="w-4 h-4 mr-2" />
              Watch Demo
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-2xl mx-auto">
            <div className="text-center p-4 sm:p-0">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary" data-testid="text-stat-sales">300%</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Sales Increase</div>
            </div>
            <div className="text-center p-4 sm:p-0">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary" data-testid="text-stat-recovery">85%</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Cart Recovery</div>
            </div>
            <div className="text-center p-4 sm:p-0">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary" data-testid="text-stat-setup">10min</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Setup Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="container mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4" data-testid="text-features-title">Powerful AI Features</h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground px-4 sm:px-0">Everything you need to optimize your Shopify store</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="gradient-card border-0 h-full" data-testid={`card-feature-${index}`}>
                <CardContent className="p-4 sm:p-6 h-full flex flex-col">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4 text-primary flex-shrink-0">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3" data-testid={`text-feature-title-${index}`}>{feature.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground flex-grow" data-testid={`text-feature-description-${index}`}>{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="container mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4" data-testid="text-pricing-title">Choose Your Plan</h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground px-4 sm:px-0">Start with a 7-day free trial, upgrade anytime</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto mb-12 sm:mb-16">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`pricing-card border-0 relative h-full ${plan.popular ? 'border-primary/50 lg:scale-105' : ''}`}
                data-testid={`card-plan-${index}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Popular</Badge>
                  </div>
                )}
                <CardContent className="p-4 sm:p-6 h-full flex flex-col">
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="flex justify-center text-primary mb-2">{plan.icon}</div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2" data-testid={`text-plan-name-${index}`}>{plan.name}</h3>
                    <div className="text-2xl sm:text-3xl font-bold" data-testid={`text-plan-price-${index}`}>{plan.price}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3" data-testid={`text-plan-period-${index}`}>{plan.period}</div>
                    {plan.whoItsFor && (
                      <p className="text-xs sm:text-sm text-primary/80 font-medium px-2 sm:px-0" data-testid={`text-plan-target-${index}`}>
                        Who it's for: {plan.whoItsFor}
                      </p>
                    )}
                  </div>
                  <div className="flex-1">
                    <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start text-xs sm:text-sm" data-testid={`text-plan-feature-${index}-${featureIndex}`}>
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button 
                    asChild
                    className={`w-full ${plan.popular ? 'gradient-button' : 'border border-border hover:bg-muted'}`}
                    variant={plan.popular ? "default" : "outline"}
                    data-testid={`button-choose-plan-${index}`}
                  >
                    <Link href="/auth">
                      {index === 0 ? "Start Trial" : "Choose Plan"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="max-w-6xl mx-auto px-2 sm:px-4">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-6 sm:mb-8" data-testid="text-comparison-title">Feature Comparison</h3>
            <Card className="gradient-card border-0">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-2 sm:p-3 lg:p-4 text-xs sm:text-sm font-semibold">Features</th>
                        <th className="text-center p-2 sm:p-3 lg:p-4 text-xs sm:text-sm font-semibold bg-blue-500/10 text-blue-400">Free Trial</th>
                        <th className="text-center p-2 sm:p-3 lg:p-4 text-xs sm:text-sm font-semibold bg-green-500/10 text-green-400">🟢 Starter<br/>($49/mo)</th>
                        <th className="text-center p-2 sm:p-3 lg:p-4 text-xs sm:text-sm font-semibold bg-yellow-500/10 text-yellow-400">🟡 Growth<br/>($299/mo)</th>
                        <th className="text-center p-2 sm:p-3 lg:p-4 text-xs sm:text-sm font-semibold bg-red-500/10 text-red-400">🔴 Pro<br/>($999/mo)</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs sm:text-sm">
                      {/* Credits Section */}
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 font-semibold bg-slate-500/5">Credits / Month</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-blue-500/5">Limited</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-green-500/5">1,000</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-yellow-500/5">10,000</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-red-500/5">Unlimited</td>
                      </tr>
                      
                      {/* Product Optimization & SEO Section */}
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 font-semibold bg-slate-500/5">Product Optimization & SEO</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-blue-500/5">✅ Core only</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-green-500/5">✅ Full</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-yellow-500/5">✅ Full</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-red-500/5">✅ Full + Enterprise-level</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 pl-6">Optimized Products (AI)</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 pl-6">SEO Keyword Density Analysis</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 pl-6">SEO Ranking Tracker</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 pl-6">AI Image Alt-Text Generator</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 pl-6">Smart SEO Titles & Meta Tags</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 pl-6">Bulk Optimization & Smart Suggestions</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 pl-6">Scheduled Content Refresh</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 pl-6">One-Click Shopify Publish</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 pl-6">Rollback Button</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                      </tr>
                      
                      {/* Conversion Boosting & Sales Automation Section */}
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 font-semibold bg-slate-500/5">Conversion Boosting & Sales Automation</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-blue-500/5">❌</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-green-500/5">✅ Basic</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-yellow-500/5">✅ Advanced</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-red-500/5">✅ Advanced + Full AI Growth</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 pl-6">A/B Testing</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">❌</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">❌</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 pl-6">AI Upsell Suggestions & Triggers</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">❌</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅ Basic</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅ Advanced</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅ Advanced</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 pl-6">Abandoned Cart SMS & Emails</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">❌</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅ Basic</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅ Advanced</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅ Advanced</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 pl-6">Customer Segmentation & Behavioral Targeting</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">❌</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">❌</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                      </tr>
                      
                      {/* Content & Branding Section */}
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 font-semibold bg-slate-500/5">Content & Branding</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-blue-500/5">❌</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-green-500/5">✅ Basic</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-yellow-500/5">✅ Advanced</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-red-500/5">✅ Full + Multimodal AI</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 pl-6">Smart Product Descriptions</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">❌</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 pl-6">Dynamic & Custom Templates</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">❌</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅ Basic</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅ Advanced</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅ Advanced</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 pl-6">Multi-Channel Content Repurposing</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">❌</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">❌</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 pl-6">Brand Voice Memory</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">❌</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅ Full</td>
                      </tr>
                      
                      {/* Performance Tracking & ROI Insights Section */}
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 font-semibold bg-slate-500/5">Performance Tracking & ROI Insights</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-blue-500/5">❌</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-green-500/5">✅ Basic</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-yellow-500/5">✅ Advanced</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-red-500/5">✅ Full Advanced</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 pl-6">Email & SMS Analytics</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">❌</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅ Basic</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅ Advanced</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅ Full Advanced</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 pl-6">Content ROI Tracking</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">❌</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅ Basic</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅ Advanced</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅ Full Advanced</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 pl-6">Revenue Impact Attribution</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">❌</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">❌</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅ Full Advanced</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 pl-6">Product Management Dashboard</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">❌</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅ Full Advanced</td>
                      </tr>
                      
                      {/* Workflow & Integration Tools Section */}
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 font-semibold bg-slate-500/5">Workflow & Integration Tools</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-blue-500/5">❌</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-green-500/5">✅ Basic</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-yellow-500/5">✅ Advanced</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-red-500/5">✅ Full Advanced</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 pl-6">CSV Import/Export</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">❌</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 pl-6">Smart Bulk Suggestions</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">❌</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 pl-6">Priority Support</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">❌</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">❌</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">❌</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✅</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4" data-testid="text-cta-title">Ready to Transform Your Shopify Store?</h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 px-4 sm:px-0">Join thousands of merchants already using Zyra AI to boost their sales</p>
          <Button asChild className="gradient-button w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold" data-testid="button-cta-start">
            <Link href="/auth">
              Start Your Free Trial Today
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 sm:py-8 px-4 sm:px-6 border-t border-border">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-3 sm:mb-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
              <img src={zyraLogoUrl} alt="Zyra AI" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
            </div>
            <span className="text-lg sm:text-xl font-bold">Zyra AI</span>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">© 2024 Zyra AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
