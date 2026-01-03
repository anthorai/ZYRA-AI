import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Zap, Star, TrendingUp, ShoppingCart, Mail, Search, BarChart3, Cog, ArrowRight, Play, Check, Gift, Crown, Award, 
  Settings, FileText, Network, Activity, Shield, Palette, LogOut, CheckCircle2, Sparkles, Lock, Clock,
  Users, DollarSign, Target, Rocket, ChevronDown, ChevronUp, Quote, ExternalLink, Timer,
  BadgeCheck, Store, Shirt, Home, Laptop, Dumbbell, Heart, Calculator, X, AlertTriangle,
  Minus, Bot, Pen, XCircle, CheckCircle, Newspaper, Globe, Flame, Lightbulb
} from "lucide-react";
import { SiLinkedin, SiInstagram, SiX, SiShopify } from "react-icons/si";
import ResponsiveNavbar from "@/components/responsive-navbar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import zyraLogoUrl from "@assets/zyra logo_1758694880266.png";
import blogImage1 from "@assets/generated_images/ai_dropshipping_growth_dashboard.png";
import blogImage2 from "@assets/generated_images/ai_ecommerce_tools_concept.png";
import blogImage3 from "@assets/generated_images/future_ecommerce_automation.png";
import { Helmet } from "react-helmet";

export default function Landing() {
  const { isAuthenticated, loading, logout, isLoggingOut } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  




  // Handle logout functionality
  const handleLogout = async () => {
    try {
      const { error } = await logout();
      
      if (error) {
        console.error('[ERROR] Logout error:', error);
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
        setLocation("/");
      }
    } catch (error: any) {
      console.error('[ERROR] Unexpected logout error:', error);
      toast({
        title: "Logout Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Enhanced features with benefit-focused copy
  const features = [
    {
      icon: <Settings className="w-6 h-6" />,
      title: "AI-Powered Product Descriptions",
      description: "Generate compelling product descriptions optimized for both customers and search engines. Review and approve before publishing.",
      benefit: "Save time on content"
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "SEO Optimization Tools",
      description: "Zyra uses AI-powered SEO optimization to help improve your product visibility in search results.",
      benefit: "Better search visibility"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Performance Analytics",
      description: "Track which products, emails, or campaigns are performing. Zyra provides analytics to help you understand what's working.",
      benefit: "Data-driven decisions"
    },
    {
      icon: <Network className="w-6 h-6" />,
      title: "Multi-Channel Content Tools",
      description: "Repurpose content across email, SMS, blogs, and ads. One click publishing to multiple channels.",
      benefit: "Streamlined workflow"
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: "Real-Time Analytics Dashboard",
      description: "Track sales, content performance, and campaign metrics in one dashboard. Monitor what's working and adjust accordingly.",
      benefit: "Actionable insights"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "One-Click Rollback",
      description: "Don't like our AI edits? Undo changes with one click. Your original data is always safe and reversible.",
      benefit: "Peace of mind"
    }
  ];

  // Feature highlights data (replacing testimonials with feature descriptions)
  const featureHighlights = [
    {
      title: "AI Product Descriptions",
      description: "Generate optimized product descriptions that match your brand voice. Review and edit before publishing.",
      icon: <Pen className="w-6 h-6" />
    },
    {
      title: "Time Savings",
      description: "Automate repetitive content tasks so you can focus on growing your business.",
      icon: <Clock className="w-6 h-6" />
    },
    {
      title: "Cart Recovery",
      description: "Automated email sequences to help recover abandoned shopping carts.",
      icon: <ShoppingCart className="w-6 h-6" />
    },
    {
      title: "Affordable for All Stores",
      description: "Plans designed for solo founders, small teams, and growing businesses.",
      icon: <Users className="w-6 h-6" />
    },
    {
      title: "Bulk Optimization",
      description: "Optimize multiple products at once to save time on large catalogs.",
      icon: <Sparkles className="w-6 h-6" />
    }
  ];

  // Features overview (replacing case studies)
  const featuresOverview = [
    {
      title: "Product SEO Optimization",
      industry: "All Industries",
      description: "AI-powered product description optimization for improved search visibility",
      features: [
        "Keyword-optimized product titles",
        "SEO-friendly descriptions",
        "Meta tag generation"
      ]
    },
    {
      title: "Content Automation",
      industry: "All Store Types",
      description: "Automate content creation and marketing tasks",
      features: [
        "AI content generation",
        "Email campaign templates",
        "Multi-channel publishing"
      ]
    },
    {
      title: "Cart Recovery Tools",
      industry: "E-commerce",
      description: "Tools to help reduce cart abandonment",
      features: [
        "Automated follow-up emails",
        "Customizable templates",
        "Performance tracking"
      ]
    }
  ];

  // FAQ data
  const faqs = [
    {
      question: "Will the AI content sound generic or robotic?",
      answer: "Zyra's AI is designed to learn your brand voice and create product descriptions that match your style. You can review and edit all generated content before publishing."
    },
    {
      question: "Is this hard to set up? I'm not technical.",
      answer: "Setup takes a few minutes. Simply connect your Shopify store, select products to optimize, and you're ready to go. No coding or technical skills required."
    },
    {
      question: "Will this work for my specific niche?",
      answer: "Zyra works with Shopify stores across many industries including fashion, tech, home goods, health & wellness, and more. The AI adapts to your specific products and audience."
    },
    {
      question: "Is my store data safe?",
      answer: "We use AES-256 encryption and follow GDPR compliance guidelines. Your data is not sold or shared. You have one-click rollback if you ever want to restore your original product data."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes. Subscriptions are managed through Shopify billing. You can cancel anytime from your Shopify admin with no penalties."
    },
    {
      question: "How many products can I optimize?",
      answer: "It depends on your plan. Each plan includes a monthly allowance of credits that can be used across optimization features. Check our pricing section for details."
    },
    {
      question: "Do I need to hire someone to use this?",
      answer: "Zyra is designed for store owners and small teams. The interface is straightforward and includes helpful guides to get you started."
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
      badge: "Risk-Free",
      valueProps: "Perfect for testing before you commit",
      features: [
        "100 credits included",
        "Product Optimization & SEO:",
        "Optimized Products",
        "SEO Keyword Density Analysis",
        "Conversion Boosting & Sales Automation:",
        "AI-Powered Growth Intelligence",
        "Basic A/B Testing",
        "Content & Branding at Scale:",
        "Smart Product Descriptions",
        "Limited Dynamic Templates",
        "Performance Tracking & ROI Insights:",
        "Email Performance Analytics",
        "Workflow & Integration Tools:",
        "One-Click Shopify Publish",
        "Rollback Button"
      ],
      popular: false
    },
    {
      name: "Starter",
      price: "$49",
      period: "per month",
      annualPrice: "$39",
      icon: <Zap className="w-8 h-8" />,
      description: "For new Shopify stores getting started.",
      whoItsFor: "For new Shopify stores getting started.",
      badge: "For Beginners",
      valueProps: "$1.63/day • Less than a coffee",
      costPerDay: "$1.63",
      features: [
        "1,000 credits / month",
        "Product Optimization & SEO:",
        "Optimized Products",
        "SEO Keyword Density Analysis",
        "AI Image Alt-Text Generator",
        "Smart SEO Titles & Meta Tags",
        "Conversion Boosting & Sales Automation:",
        "AI-Powered Growth Intelligence",
        "A/B Testing",
        "Upsell Email Receipts",
        "Abandoned Cart SMS",
        "Content & Branding at Scale:",
        "Smart Product Descriptions",
        "Dynamic Templates",
        "Brand Voice Memory",
        "Performance Tracking & ROI Insights:",
        "Email & SMS Conversion Analytics",
        "Workflow & Integration Tools:",
        "CSV Import/Export",
        "One-Click Shopify Publish",
        "Rollback Button",
        "Smart Bulk Suggestions"
      ],
      popular: false
    },
    {
      name: "Growth",
      price: "$299",
      period: "per month",
      annualPrice: "$239",
      icon: <Award className="w-8 h-8" />,
      description: "Made for scaling merchants ready to grow.",
      whoItsFor: "Made for scaling merchants ready to grow.",
      badge: "Most Popular",
      valueProps: "Most popular plan",
      costPerDay: "$9.96",
      features: [
        "6,000 credits / month",
        "Product Optimization & SEO:",
        "All Starter features +",
        "SEO Ranking Tracker",
        "Bulk Optimization & Smart Bulk Suggestions",
        "Scheduled Refresh for Content & SEO Updates",
        "Conversion Boosting & Sales Automation:",
        "AI Upsell Suggestions & Triggers",
        "Dynamic Segmentation of Customers",
        "Behavioral Targeting",
        "Full A/B Test Results Dashboard",
        "Content & Branding at Scale:",
        "Custom Templates",
        "Multimodal AI (text + image + insights)",
        "Multi-Channel Content Repurposing",
        "Performance Tracking & ROI Insights:",
        "Full Email & SMS tracking",
        "Content ROI Tracking",
        "Revenue Impact Attribution",
        "Product Management Dashboard",
        "Workflow & Integration Tools:",
        "Unlimited Starter workflow tools"
      ],
      popular: true
    },
    {
      name: "Pro",
      price: "$999",
      period: "per month",
      annualPrice: "$799",
      icon: <Crown className="w-8 h-8" />,
      description: "Perfect for high-revenue brands & enterprises.",
      whoItsFor: "Perfect for high-revenue brands & enterprises.",
      badge: "Maximum ROI",
      valueProps: "White-glove onboarding included",
      costPerDay: "$33.30",
      features: [
        "20,000 credits / month",
        "Product Optimization & SEO:",
        "All Growth features + priority processing",
        "Conversion Boosting & Sales Automation:",
        "Full AI-driven automation for campaigns, upsells, and behavioral targeting",
        "Content & Branding at Scale:",
        "Full template library, advanced brand voice memory, multimodal AI insights, multi-channel automation",
        "Performance Tracking & ROI Insights:",
        "Enterprise-grade analytics and revenue attribution dashboard",
        "Workflow & Integration Tools:",
        "Enterprise bulk management, CSV import/export, rollback, smart bulk suggestions at scale"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>Zyra AI: AI-Powered Shopify Store Optimization</title>
        <meta name="description" content="Optimize your Shopify store with AI-powered product descriptions, cart recovery tools, and SEO optimization. Start your free trial today." />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://zyraai.com/" />
        <meta property="og:title" content="Zyra AI: AI-Powered Shopify Store Optimization" />
        <meta property="og:description" content="Optimize your Shopify store with AI-powered product descriptions, cart recovery tools, and SEO optimization." />
        <meta property="og:image" content="https://zyraai.com/og-image.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://zyraai.com/" />
        <meta property="twitter:title" content="Zyra AI: AI-Powered Shopify Store Optimization" />
        <meta property="twitter:description" content="Optimize your Shopify store with AI-powered product descriptions and SEO tools." />
        <meta property="twitter:image" content="https://zyraai.com/og-image.png" />

        {/* Structured Data - Organization */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Zyra AI",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "49.00",
              "priceCurrency": "USD"
            }
          })}
        </script>

        {/* Structured Data - FAQPage */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
              }
            }))
          })}
        </script>
      </Helmet>
      {/* Navigation */}
      <ResponsiveNavbar
        navItems={[
          { label: "Features", href: "#features", external: true },
          { label: "Pricing", href: "#pricing", external: true },
          { label: "FAQ", href: "#faq", external: true },
          ...(loading ? [
            { label: "Log in", href: "/auth" }
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
          label: "Get Started Free",
          href: "/auth"
        }}
      />
      {/* Main Content */}
      <main id="main-content" className="pt-10">
        {/* Optimized Hero Section */}
        <section className="relative pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 animate-gradient" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(0,240,255,0.1),transparent_50%)]" />
          
          <div className="container mx-auto text-center max-w-5xl relative z-10">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Built for Shopify Merchants</span>
            </div>

            {/* Premium Enterprise Hero Section */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-8 leading-[1.1] tracking-tight">
              <span className="block mb-2 text-foreground">
                AI-Powered Growth Tools for Shopify Stores
              </span>
              <span className="block bg-gradient-to-r from-[#00D4FF] via-[#00E5CC] to-[#7C3AED] bg-clip-text text-transparent bg-[length:150%_auto] animate-[gradient_8s_ease_infinite]">
                Optimize. Automate. Scale — with AI.
              </span>
            </h1>

            {/* Benefit-focused subheadline */}
            <div className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed max-w-4xl mx-auto space-y-6">
              <p>
                ZYRA AI is a Shopify-native optimization platform built to help merchants create better-performing product pages, improve on-page SEO, and streamline store operations using AI — all directly inside the Shopify admin.
              </p>
              <p>
                With intelligent product optimization, automated content updates, and smart recovery workflows, ZYRA AI eliminates repetitive manual work while giving users full visibility, control, and rollback at every step.
              </p>
              <p className="font-semibold text-foreground">
                Built exclusively for Shopify merchants who want sustainable, long-term growth — without complexity.
              </p>
            </div>

            {/* 3 Key Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 max-w-3xl mx-auto">
              <div className="flex items-start gap-3 text-left">
                <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-foreground">Fast Optimization</p>
                  <p className="text-sm text-muted-foreground">AI-powered content creation</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left">
                <DollarSign className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-foreground">Cart Recovery Tools</p>
                  <p className="text-sm text-muted-foreground">Automated follow-up emails</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left">
                <Target className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-foreground">SEO Optimization</p>
                  <p className="text-sm text-muted-foreground">Search-friendly content</p>
                </div>
              </div>
            </div>

            {/* Improved CTAs with micro-copy */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <Button 
                asChild 
                size="lg"
                className="gradient-button w-full sm:w-auto px-8 py-6 text-lg font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 animate-pulse-glow"
                data-testid="button-start-trial"
              >
                <Link href="/auth">
                  <Rocket className="w-5 h-5 mr-2" />
                  Start Free Trial—No Credit Card Required
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="w-full sm:w-auto px-8 py-6 text-lg font-semibold backdrop-blur-sm border-primary/30 hover:bg-primary/5"
                data-testid="button-watch-demo"
              >
                <Play className="w-5 h-5 mr-2" />
                See Real Results (2-Min Demo)
              </Button>
            </div>

            {/* Micro-copy under CTAs */}
            <p className="text-sm text-muted-foreground mb-10">
              <Clock className="w-4 h-4 inline mr-1" />
              Setup in 5 minutes • Cancel anytime • 7 days free
            </p>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-[#00F0FF] to-[#00FFE5] bg-clip-text text-transparent mb-1" data-testid="text-stat-ai">AI</div>
                <div className="text-sm text-muted-foreground">Powered Optimization</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-[#00FFE5] to-[#FF00F5] bg-clip-text text-transparent mb-1" data-testid="text-stat-recovery">SEO</div>
                <div className="text-sm text-muted-foreground">Enhanced Content</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-[#FF00F5] to-[#00F0FF] bg-clip-text text-transparent mb-1" data-testid="text-stat-setup">5 min</div>
                <div className="text-sm text-muted-foreground">Setup Time</div>
              </div>
            </div>

            {/* Shopify billing badge */}
            <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-6 py-3 text-sm">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-semibold">Billed through Shopify</span>
              <span className="text-muted-foreground">• Cancel anytime</span>
            </div>
          </div>
        </section>

        {/* Trust Bar Section */}
        <section className="py-8 px-4 sm:px-6 border-y border-border/50 bg-muted/30">
          <div className="container mx-auto">
            {/* Client Logos Strip */}
            <div className="mb-8">
              <p className="text-center text-sm text-muted-foreground mb-2">Join thousands of successful Shopify merchants</p>
              <p className="text-center text-xs text-muted-foreground/60 mb-4 italic">Illustrative client examples</p>
              <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 opacity-60">
                <div className="flex flex-col items-center gap-2" data-testid="logo-client-1">
                  <div className="w-24 h-16 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex flex-col items-center justify-center gap-1 hover-elevate transition-all">
                    <Shirt className="w-5 h-5 text-primary/70" />
                    <span className="text-xs font-semibold tracking-wide text-foreground/70">FASHION CO</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2" data-testid="logo-client-2">
                  <div className="w-24 h-16 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex flex-col items-center justify-center gap-1 hover-elevate transition-all">
                    <Sparkles className="w-5 h-5 text-primary/70" />
                    <span className="text-xs font-semibold tracking-wide text-foreground/70">BEAUTY PLUS</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2" data-testid="logo-client-3">
                  <div className="w-24 h-16 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex flex-col items-center justify-center gap-1 hover-elevate transition-all">
                    <Laptop className="w-5 h-5 text-primary/70" />
                    <span className="text-xs font-semibold tracking-wide text-foreground/70">TECH STORE</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2" data-testid="logo-client-4">
                  <div className="w-24 h-16 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex flex-col items-center justify-center gap-1 hover-elevate transition-all">
                    <Home className="w-5 h-5 text-primary/70" />
                    <span className="text-xs font-semibold tracking-wide text-foreground/70">HOME SHOP</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2" data-testid="logo-client-5">
                  <div className="w-24 h-16 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex flex-col items-center justify-center gap-1 hover-elevate transition-all">
                    <Dumbbell className="w-5 h-5 text-primary/70" />
                    <span className="text-xs font-semibold tracking-wide text-foreground/70">FIT GEAR</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2" data-testid="logo-client-6">
                  <div className="w-24 h-16 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex flex-col items-center justify-center gap-1 hover-elevate transition-all">
                    <Heart className="w-5 h-5 text-primary/70" />
                    <span className="text-xs font-semibold tracking-wide text-foreground/70">LIFESTYLE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Star rating + security badges */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 mb-6 flex-wrap">
              <div className="flex items-center gap-2" data-testid="trust-star-rating">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold">Trusted by Shopify Merchants</span>
              </div>
              <div className="h-4 w-px bg-border hidden md:block" />
              <div className="flex items-center gap-2" data-testid="trust-shopify-partner">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="text-sm">Official Shopify Partner</span>
              </div>
              <div className="h-4 w-px bg-border hidden md:block" />
              <div className="flex items-center gap-2" data-testid="trust-encryption">
                <Lock className="w-5 h-5 text-primary" />
                <span className="text-sm">Bank-Level Encryption</span>
              </div>
              <div className="h-4 w-px bg-border hidden md:block" />
              <div className="flex items-center gap-2" data-testid="trust-gdpr">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm">GDPR Compliant</span>
              </div>
              <div className="h-4 w-px bg-border hidden md:block" />
              <div className="flex items-center gap-2" data-testid="trust-soc2">
                <Award className="w-5 h-5 text-primary" />
                <span className="text-sm">SOC 2 Certified</span>
              </div>
            </div>

          </div>
        </section>

        {/* Common Challenges Section */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#0e0e20]">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Common Challenges
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                Store Optimization <span className="text-primary">Takes Time</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Many store owners face these common challenges. Zyra AI is designed to help address them efficiently.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Cart Abandonment</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Customers leave without completing purchases
                  </p>
                  <div className="text-lg font-bold text-primary">Automated Recovery</div>
                  <p className="text-xs text-muted-foreground">Follow-up email sequences</p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <Search className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">SEO Challenges</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Products not appearing in search results
                  </p>
                  <div className="text-lg font-bold text-primary">AI Optimization</div>
                  <p className="text-xs text-muted-foreground">Search-friendly content</p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Content Creation</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Writing descriptions takes hours
                  </p>
                  <div className="text-lg font-bold text-primary">AI-Generated</div>
                  <p className="text-xs text-muted-foreground">Quick content creation</p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <p className="text-lg mb-6">
                <span className="font-bold">Get started</span> with Zyra AI in minutes.
              </p>
              <Button asChild size="lg" className="gradient-button">
                <Link href="/auth">
                  <Rocket className="w-5 h-5 mr-2" />
                  Start Free Trial
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                Simple 3-Step Process
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Get Started <span className="text-primary">Quickly</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                No coding required. Simple setup for any Shopify store.
              </p>
            </div>

            <div className="relative">
              {/* Connection line */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent -translate-y-1/2" />
              
              <div className="grid md:grid-cols-3 gap-8 relative">
                <div className="text-center relative">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#00F0FF] to-[#00FFE5] rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary/30 relative z-10">
                    1
                  </div>
                  <h3 className="text-xl font-bold mb-3">Connect Your Store</h3>
                  <p className="text-muted-foreground">
                    One-click Shopify integration. Zyra automatically imports your products and learns your brand voice.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
                    <Clock className="w-4 h-4" />
                    <span>Quick setup</span>
                  </div>
                </div>

                <div className="text-center relative">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#00FFE5] to-[#FF00F5] rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary/30 relative z-10">
                    2
                  </div>
                  <h3 className="text-xl font-bold mb-3">AI Optimizes Everything</h3>
                  <p className="text-muted-foreground">
                    Zyra rewrites descriptions, fixes SEO, and sets up abandoned cart recovery automatically.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
                    <Bot className="w-4 h-4" />
                    <span>Automated process</span>
                  </div>
                </div>

                <div className="text-center relative">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#FF00F5] to-[#00F0FF] rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary/30 relative z-10">
                    3
                  </div>
                  <h3 className="text-xl font-bold mb-3">Track Your Progress</h3>
                  <p className="text-muted-foreground">
                    Monitor your optimizations, recovered carts, and content performance from your dashboard.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
                    <TrendingUp className="w-4 h-4" />
                    <span>Real-time dashboard</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <Button asChild size="lg" className="gradient-button">
                <Link href="/auth">
                  <Zap className="w-5 h-5 mr-2" />
                  Start My Free Trial
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Before/After Product Showcase */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#0f0f22]">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                <Sparkles className="w-3 h-3 mr-1" />
                Real AI Transformation
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                See the <span className="text-primary">AI Difference</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Here's how Zyra helps transform product pages with AI-optimized content
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Before */}
              <Card className="border-red-500/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="font-semibold text-red-500">Before Zyra</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium mb-2 text-muted-foreground">Premium Wireless Headphones</h4>
                    <p className="text-sm text-muted-foreground">
                      Good headphones. Wireless. Battery lasts long. Good sound quality. Comfortable to wear. Black color available.
                    </p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-red-500">
                      <X className="w-4 h-4" />
                      <span>No emotional appeal</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-500">
                      <X className="w-4 h-4" />
                      <span>Missing keywords for SEO</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-500">
                      <X className="w-4 h-4" />
                      <span>No benefits highlighted</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-500">
                      <X className="w-4 h-4" />
                      <span>Basic product listing</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* After */}
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-primary">After Zyra AI</span>
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-xs ml-auto">
                      AI Optimized
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg p-4 mb-4 border border-primary/20 bg-[#16162c]">
                    <h4 className="font-medium mb-2">Premium Wireless Noise-Canceling Headphones - 40H Battery</h4>
                    <p className="text-sm text-muted-foreground">
                      Experience pure audio bliss with our studio-quality wireless headphones. Active noise cancellation lets you escape into your music, while 40-hour battery life keeps the soundtrack going all week. Memory foam ear cushions deliver cloud-like comfort for extended listening sessions.
                    </p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-primary">
                      <Check className="w-4 h-4" />
                      <span>Emotional, benefit-driven copy</span>
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                      <Check className="w-4 h-4" />
                      <span>SEO-optimized keywords</span>
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                      <Check className="w-4 h-4" />
                      <span>Clear value proposition</span>
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                      <Check className="w-4 h-4" />
                      <span>Professional product presentation</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-8">
              <p className="text-muted-foreground mb-4">
                This transformation takes Zyra AI less than 10 seconds per product
              </p>
              <Button asChild size="lg" className="gradient-button">
                <Link href="/auth">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Transform My Products
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Competitor Comparison Table */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                Why Zyra Wins
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Compare Your <span className="text-primary">Options</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See how Zyra AI stacks up against traditional methods
              </p>
            </div>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold"></th>
                      <th className="p-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Pen className="w-5 h-5 text-muted-foreground" />
                          <span className="font-semibold">Do It Yourself</span>
                        </div>
                      </th>
                      <th className="p-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="w-5 h-5 text-muted-foreground" />
                          <span className="font-semibold">Hire Freelancer</span>
                        </div>
                      </th>
                      <th className="p-4 text-center bg-primary/5 border-2 border-primary/20">
                        <div className="flex flex-col items-center gap-2">
                          <Bot className="w-5 h-5 text-primary" />
                          <span className="font-semibold text-primary">Zyra AI</span>
                          <Badge className="bg-primary text-primary-foreground text-xs">Best Value</Badge>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-4 font-medium">Monthly Cost</td>
                      <td className="p-4 text-center text-muted-foreground">$0 (but time)</td>
                      <td className="p-4 text-center text-muted-foreground">$2,000-5,000</td>
                      <td className="p-4 text-center font-semibold text-primary bg-primary/5">$49-299</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">Time per Product</td>
                      <td className="p-4 text-center text-muted-foreground">30-60 min</td>
                      <td className="p-4 text-center text-muted-foreground">24-48 hours</td>
                      <td className="p-4 text-center font-semibold text-primary bg-primary/5">10 seconds</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">SEO Optimization</td>
                      <td className="p-4 text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      <td className="p-4 text-center"><Minus className="w-5 h-5 text-muted-foreground mx-auto" /></td>
                      <td className="p-4 text-center bg-primary/5"><CheckCircle className="w-5 h-5 text-primary mx-auto" /></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">Abandoned Cart Recovery</td>
                      <td className="p-4 text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      <td className="p-4 text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      <td className="p-4 text-center bg-primary/5"><CheckCircle className="w-5 h-5 text-primary mx-auto" /></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">24/7 Availability</td>
                      <td className="p-4 text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      <td className="p-4 text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      <td className="p-4 text-center bg-primary/5"><CheckCircle className="w-5 h-5 text-primary mx-auto" /></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">Bulk Optimization</td>
                      <td className="p-4 text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      <td className="p-4 text-center"><Minus className="w-5 h-5 text-muted-foreground mx-auto" /></td>
                      <td className="p-4 text-center bg-primary/5"><CheckCircle className="w-5 h-5 text-primary mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium">Time Investment</td>
                      <td className="p-4 text-center text-muted-foreground">High</td>
                      <td className="p-4 text-center text-muted-foreground">Moderate</td>
                      <td className="p-4 text-center font-bold text-primary bg-primary/5">Minimal</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="text-center mt-8">
              <Button asChild size="lg" className="gradient-button">
                <Link href="/auth">
                  Choose the Smart Option
                </Link>
              </Button>
            </div>
          </div>
        </section>


        {/* Product Demo Video Section */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#0f0f23]">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4" data-testid="badge-video-section">
                See Zyra AI In Action
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Watch How <span className="bg-gradient-to-r from-[#00F0FF] to-[#FF00F5] bg-clip-text text-transparent">Zyra Transforms</span> Your Store
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See our AI-powered tools in action. This 2-minute demo shows you exactly how Zyra optimizes products, recovers carts, and drives revenue.
              </p>
            </div>

            {/* Demo Preview Card */}
            <div 
              className="relative max-w-5xl mx-auto rounded-xl overflow-hidden shadow-2xl"
              data-testid="container-demo-video"
            >
              {/* Gradient Background with Animated Elements */}
              <div className="w-full aspect-video bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative">
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#00F0FF]/10 via-[#FF00F5]/10 to-[#00F0FF]/10 bg-[length:200%_100%] animate-gradient" />
                
                {/* Demo UI Mockup */}
                <div className="absolute inset-4 sm:inset-8 flex gap-4">
                  {/* Left Panel - Product List */}
                  <div className="w-1/3 bg-white/5 backdrop-blur-sm rounded-lg p-3 hidden sm:block">
                    <div className="h-4 w-3/4 bg-white/20 rounded mb-3" />
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-2 p-2 rounded bg-white/10">
                          <div className="w-8 h-8 bg-gradient-to-br from-[#00F0FF]/30 to-[#FF00F5]/30 rounded" />
                          <div className="flex-1 space-y-1">
                            <div className="h-2 w-3/4 bg-white/20 rounded" />
                            <div className="h-2 w-1/2 bg-white/10 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Right Panel - AI Optimization */}
                  <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Bot className="w-5 h-5 text-primary" />
                      <div className="h-3 w-32 bg-primary/30 rounded" />
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 rounded bg-gradient-to-r from-[#00F0FF]/20 to-transparent border border-[#00F0FF]/30">
                        <div className="h-3 w-full bg-white/20 rounded mb-2" />
                        <div className="h-3 w-4/5 bg-white/15 rounded mb-2" />
                        <div className="h-3 w-3/4 bg-white/10 rounded" />
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-primary/70">SEO Optimized</span>
                        <CheckCircle className="w-4 h-4 text-primary ml-2" />
                        <span className="text-primary/70">+34% Conversion</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* CTA Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="text-center">
                    <Button asChild size="lg" className="gradient-button mb-3">
                      <Link href="/auth">
                        <Play className="w-5 h-5 mr-2" />
                        Start Free Demo
                      </Link>
                    </Button>
                    <p className="text-sm text-white/70">See it work on your products</p>
                  </div>
                </div>
              </div>

              {/* Gradient Border Effect */}
              <div className="absolute inset-0 rounded-xl border-2 border-transparent bg-gradient-to-r from-[#00F0FF]/20 to-[#FF00F5]/20 pointer-events-none" />
            </div>

            {/* Video Features Below */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
              <div className="text-center" data-testid="feature-video-1">
                <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">AI Product Optimization</h3>
                <p className="text-sm text-muted-foreground">Watch AI generate perfect product descriptions in seconds</p>
              </div>
              <div className="text-center" data-testid="feature-video-2">
                <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Cart Recovery Automation</h3>
                <p className="text-sm text-muted-foreground">See how personalized emails bring customers back</p>
              </div>
              <div className="text-center" data-testid="feature-video-3">
                <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Real-Time Analytics</h3>
                <p className="text-sm text-muted-foreground">Track ROI and performance across all channels</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section (Enhanced) */}
        <section id="features" className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Powerful AI Features That <span className="text-primary">Actually Work</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to optimize your Shopify store and 3X your revenue
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="gradient-card border-0 h-full hover-elevate transition-all duration-300" data-testid={`card-feature-${index}`}>
                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4 text-primary">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-3" data-testid={`text-feature-title-${index}`}>{feature.title}</h3>
                    <p className="text-muted-foreground flex-grow mb-4" data-testid={`text-feature-description-${index}`}>{feature.description}</p>
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <CheckCircle2 className="w-4 h-4" />
                      {feature.benefit}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section id="testimonials" className="py-16 sm:py-20 px-4 sm:px-6 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                What <span className="text-primary">Zyra AI</span> Can Do
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                AI-powered tools designed specifically for Shopify store optimization
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {featureHighlights.map((feature, index) => (
                <Card key={index} className="gradient-card border-0 hover-elevate transition-all duration-300" data-testid={`card-feature-highlight-${index}`}>
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4 text-primary">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-3" data-testid={`text-feature-highlight-title-${index}`}>{feature.title}</h3>
                    <p className="text-muted-foreground" data-testid={`text-feature-highlight-description-${index}`}>{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center">
              <p className="text-lg mb-4 text-muted-foreground">Ready to try Zyra AI for your store?</p>
              <Button asChild size="lg" className="gradient-button">
                <Link href="/auth">
                  Start Free Trial
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Overview Section */}
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Optimization <span className="text-primary">Made Simple</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Explore how Zyra AI can help streamline your Shopify store operations
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {featuresOverview.map((item, index) => (
                <Card key={index} className="gradient-card border-0 hover-elevate transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.industry}</p>
                      </div>
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <div className="border-t border-border pt-4">
                        <p className="text-sm font-semibold mb-3">Key Features:</p>
                        {item.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Autonomous AI Future Section */}
        <section className="relative py-20 px-4 sm:px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,240,255,0.15),transparent_70%)]" />
          
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                <Sparkles className="w-3 h-3 mr-1" />
                The Future of E-Commerce
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                Your Store, <span className="bg-gradient-to-r from-[#00F0FF] via-[#00FFE5] to-[#FF00F5] bg-clip-text text-transparent">Managed by AI</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Zyra isn't just a tool—it's evolving into a fully autonomous AI store manager that runs your business 24/7. 
                No manual work. No constant monitoring. Just growth on autopilot.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="gradient-card border-0 hover-elevate">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Cog className="w-6 h-6 text-primary animate-spin-slow" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-3">Autonomous Mode</h3>
                      <p className="text-muted-foreground mb-4">
                        Turn on autopilot and Zyra takes over. AI automatically optimizes products, adjusts pricing, 
                        sends marketing campaigns, and recovers carts—while you sleep.
                      </p>
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Set it and forget it</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="gradient-card border-0 hover-elevate">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-3">Manual Approval Mode</h3>
                      <p className="text-muted-foreground mb-4">
                        Prefer control? AI creates smart recommendations, you approve what you like. 
                        Get AI superpowers without giving up decision-making authority.
                      </p>
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>You're still in charge</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-8 mb-12">
              <h3 className="text-2xl font-bold mb-8 text-center">
                <Rocket className="w-6 h-6 inline mr-2 text-primary" />
                What the AI Does Autonomously
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-md flex items-center justify-center flex-shrink-0">
                    <Search className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Daily SEO Audits</h4>
                    <p className="text-sm text-muted-foreground">AI scans products, finds SEO gaps, fixes them automatically</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-md flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Dynamic Pricing</h4>
                    <p className="text-sm text-muted-foreground">Adjusts prices based on competition, demand, and profit goals</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-md flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Smart Marketing</h4>
                    <p className="text-sm text-muted-foreground">Sends emails & SMS at optimal times with A/B testing built-in</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-md flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Cart Recovery</h4>
                    <p className="text-sm text-muted-foreground">Multi-stage sequences that escalate from email to SMS</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-xl p-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold">Built-In Safety Guardrails</h3>
              </div>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Zyra's autonomous mode includes intelligent safety limits: daily action caps, price bounds, 
                frequency limits, quiet hours, GDPR compliance, and one-click rollback. Your store is protected.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                <Badge variant="outline" className="bg-background/50">
                  <Clock className="w-3 h-3 mr-1" />
                  Respects Quiet Hours
                </Badge>
                <Badge variant="outline" className="bg-background/50">
                  <Target className="w-3 h-3 mr-1" />
                  Daily Limits
                </Badge>
                <Badge variant="outline" className="bg-background/50">
                  <Shield className="w-3 h-3 mr-1" />
                  GDPR Safe
                </Badge>
                <Badge variant="outline" className="bg-background/50">
                  <Activity className="w-3 h-3 mr-1" />
                  One-Click Undo
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section (Enhanced) */}
        <section id="pricing" className="py-16 sm:py-20 px-4 sm:px-6 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Simple, Transparent <span className="text-primary">Pricing</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-6">Start with a 7-day free trial, upgrade anytime</p>
              
              {/* Annual/Monthly Toggle */}
              <div className="inline-flex items-center gap-3 bg-card border border-border rounded-lg p-1 mb-8">
                <button
                  onClick={() => setIsAnnual(false)}
                  className={`px-4 py-2 rounded-md transition-all ${!isAnnual ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsAnnual(true)}
                  className={`px-4 py-2 rounded-md transition-all ${isAnnual ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                >
                  Annual
                  <Badge className="ml-2 bg-green-500 text-white">Save 20%</Badge>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto mb-12">
              {plans.map((plan, index) => (
                <Card 
                  key={index} 
                  className={`pricing-card border-0 relative h-full hover-elevate transition-all duration-300 ${plan.popular ? 'ring-2 ring-primary md:scale-105' : ''}`}
                  data-testid={`card-plan-${index}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-primary text-primary-foreground px-3 py-0.5 text-xs sm:px-4 sm:py-1">Most Popular</Badge>
                    </div>
                  )}
                  {plan.badge && !plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge variant="outline" className="px-3 py-0.5 text-xs sm:px-4 sm:py-1 ml-[-14px] mr-[-14px]">{plan.badge}</Badge>
                    </div>
                  )}
                  <CardContent className="p-4 sm:p-6 h-full flex flex-col">
                    <div className="text-center mb-4 sm:mb-6">
                      <div className="flex justify-center text-primary mb-2 sm:mb-3 text-lg sm:text-xl">{plan.icon}</div>
                      <h3 className="text-base sm:text-xl font-semibold mb-2" data-testid={`text-plan-name-${index}`}>{plan.name}</h3>
                      <div className="mb-2">
                        <span className="text-2xl sm:text-4xl font-bold" data-testid={`text-plan-price-${index}`}>
                          {isAnnual && plan.annualPrice ? plan.annualPrice : plan.price}
                        </span>
                        {index !== 0 && <span className="text-xs sm:text-sm text-muted-foreground">/{isAnnual ? 'month' : 'month'}</span>}
                      </div>
                      {isAnnual && plan.annualPrice && index !== 0 && (
                        <p className="text-xs text-muted-foreground line-through mb-1">{plan.price}/month</p>
                      )}
                      <p className="text-xs text-muted-foreground mb-2">{plan.period}</p>
                      {plan.costPerDay && index !== 0 && (
                        <p className="text-sm text-primary font-medium">{isAnnual ? `$${(parseFloat(plan.annualPrice?.replace('$', '') || plan.price.replace('$', '')) / 30).toFixed(2)}` : plan.costPerDay}/day</p>
                      )}
                      {plan.valueProps && (
                        <p className="text-xs text-muted-foreground mt-2">{plan.valueProps}</p>
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
                      className={`w-full text-xs sm:text-sm ${plan.popular ? 'gradient-button' : 'border border-border hover:bg-muted'}`}
                      variant={plan.popular ? "default" : "outline"}
                      size="sm"
                      data-testid={`button-choose-plan-${index}`}
                    >
                      <Link href="/auth">
                        {index === 0 ? "Start Free Trial" : "Choose Plan"}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* ROI Callout */}
            <div className="max-w-2xl mx-auto text-center bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-bold mb-2">Average ROI: 5,700%</h3>
              <p className="text-muted-foreground mb-4">
                Our customers generate $2,800 extra revenue in their first month on the Starter plan.
                That means Zyra pays for itself 57X over.
              </p>
              <p className="text-sm text-muted-foreground">
                <Shield className="w-4 h-4 inline mr-1" />
                60-day money-back guarantee • No contracts • Cancel anytime
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Questions? <span className="text-primary">We've Got Answers</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Everything you need to know about Zyra AI
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card 
                  key={index} 
                  className="gradient-card border-0 hover-elevate cursor-pointer transition-all duration-300"
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-lg font-semibold flex-1">{faq.question}</h3>
                      {expandedFaq === index ? (
                        <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                    {expandedFaq === index && (
                      <p className="mt-4 text-muted-foreground leading-relaxed">{faq.answer}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Still have questions CTA */}
            <div className="text-center mt-8">
              <p className="text-muted-foreground mb-4">Still have questions?</p>
              <Button asChild variant="outline">
                <Link href="/auth">
                  Talk to Our Team
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Security & Trust Section */}
        <section className="py-16 px-4 sm:px-6 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                <Lock className="w-8 h-8 inline mr-2 text-primary" />
                Your Data, <span className="text-primary">Protected</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <p className="font-semibold mb-1">AES-256 Encryption</p>
                <p className="text-xs text-muted-foreground">Bank-level security</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <p className="font-semibold mb-1">SOC 2 Type II</p>
                <p className="text-xs text-muted-foreground">Certified secure</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                <p className="font-semibold mb-1">GDPR Compliant</p>
                <p className="text-xs text-muted-foreground">Privacy first</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <p className="font-semibold mb-1">Never Sold</p>
                <p className="text-xs text-muted-foreground">Your data stays yours</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <p className="font-semibold mb-1">99.9% Uptime</p>
                <p className="text-xs text-muted-foreground">Always available</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <p className="font-semibold mb-1">Daily Backups</p>
                <p className="text-xs text-muted-foreground">Never lose data</p>
              </div>
            </div>
          </div>
        </section>

        {/* Zyra AI Blog Section */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-background to-primary/5">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                <Lightbulb className="w-3 h-3 mr-1" />
                Latest Insights
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-[#00F0FF] via-[#00FFE5] to-[#FF00F5] bg-clip-text text-transparent">
                  Zyra AI Insights
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Stay ahead with expert tips, automation strategies, and ecommerce trends
              </p>
            </div>

            {/* Blog Cards Grid */}
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {/* Blog Card 1 */}
              <Link 
                href="/blog/how-zyra-ai-automates-dropshipping-growth"
                className="group relative bg-background/40 backdrop-blur-sm border border-primary/20 rounded-lg overflow-hidden hover:border-primary/60 transition-all duration-300 block"
                data-testid="blog-card-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/10 via-transparent to-[#FF00F5]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Featured Image */}
                <div className="relative w-full h-48 overflow-hidden">
                  <img 
                    src={blogImage1} 
                    alt="How Zyra AI Automates Your Dropshipping Growth"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                </div>

                <div className="relative p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-primary px-2 py-1 bg-primary/10 rounded-full">AI GROWTH</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
                    How Zyra AI Automates Your Dropshipping Growth
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    A breakdown of how AI-driven optimization boosts product ranking, SEO strength, and store conversions automatically.
                  </p>
                  <div className="flex items-center text-primary group/btn">
                    <span>Read More</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>

              {/* Blog Card 2 */}
              <Link 
                href="/blog/top-5-ai-tools-ecommerce-2025"
                className="group relative bg-background/40 backdrop-blur-sm border border-primary/20 rounded-lg overflow-hidden hover:border-primary/60 transition-all duration-300 block"
                data-testid="blog-card-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#00FFE5]/10 via-transparent to-[#00F0FF]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Featured Image */}
                <div className="relative w-full h-48 overflow-hidden">
                  <img 
                    src={blogImage2} 
                    alt="Top 5 AI Tools Every Ecommerce Owner Must Use in 2025"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                </div>

                <div className="relative p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-primary px-2 py-1 bg-primary/10 rounded-full">TOOLS & TIPS</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
                    Top 5 AI Tools Every Ecommerce Owner Must Use in 2025
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Quick guide to automation tools that save time, increase sales, and streamline your entire workflow.
                  </p>
                  <div className="flex items-center text-primary group/btn">
                    <span>Read More</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>

              {/* Blog Card 3 */}
              <Link 
                href="/blog/future-of-ecommerce-smart-automation"
                className="group relative bg-background/40 backdrop-blur-sm border border-primary/20 rounded-lg overflow-hidden hover:border-primary/60 transition-all duration-300 block"
                data-testid="blog-card-3"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF00F5]/10 via-transparent to-[#00FFE5]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Featured Image */}
                <div className="relative w-full h-48 overflow-hidden">
                  <img 
                    src={blogImage3} 
                    alt="The Future of Ecommerce: Why Smart Automation Wins"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                </div>

                <div className="relative p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-primary px-2 py-1 bg-primary/10 rounded-full">FUTURE TRENDS</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
                    The Future of Ecommerce: Why Smart Automation Wins
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Why self-learning AI systems like Zyra are replacing manual marketing and product optimization forever.
                  </p>
                  <div className="flex items-center text-primary group/btn">
                    <span>Read More</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </div>

            {/* View All Blog CTA */}
            <div className="text-center mt-12">
              <Button asChild variant="outline" size="lg" className="border-primary/50 hover:border-primary">
                <Link href="/blog">
                  View All Articles
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="relative py-20 px-4 sm:px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00F0FF]/20 via-[#FF00F5]/20 to-[#00F0FF]/20 animate-gradient bg-[length:200%_auto]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.1),transparent_70%)]" />
          
          <div className="container mx-auto text-center max-w-3xl relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Don't Leave Money <span className="text-primary">on the Table</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Your competitors are already using AI to win. Start your free trial and see results in 5 minutes.
            </p>
            
            <Button asChild size="lg" className="gradient-button px-6 sm:px-12 py-6 text-sm sm:text-lg shadow-2xl shadow-primary/30 animate-pulse-glow mb-6 w-full sm:w-auto">
              <Link href="/auth" className="flex items-center justify-center">
                <Rocket className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                <span>Start Free Trial—No CC Required</span>
              </Link>
            </Button>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <div className="hover-elevate px-4 py-2 rounded-lg bg-gradient-to-br from-slate-900/40 to-slate-800/40 border border-slate-700/50 backdrop-blur-sm transition-all duration-300">
                <div className="flex items-center gap-2">
                  <SiShopify className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div className="text-left">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">Trusted by</div>
                    <div className="text-sm font-bold text-white">Shopify</div>
                  </div>
                </div>
              </div>

              <div className="hidden sm:block h-10 w-px bg-gradient-to-b from-transparent via-slate-600 to-transparent" />

              <div className="hover-elevate px-4 py-2 rounded-lg bg-gradient-to-br from-slate-900/40 to-slate-800/40 border border-slate-700/50 backdrop-blur-sm transition-all duration-300">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="zyraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#00F0FF', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#FF00F5', stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>
                    <circle cx="12" cy="12" r="10" stroke="url(#zyraGradient)" strokeWidth="1.5" />
                    <path d="M12 6 L15.5 18 L12 14 L8.5 18 Z" fill="url(#zyraGradient)" />
                  </svg>
                  <div className="text-left">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">Powered by</div>
                    <div className="text-sm font-bold text-white">Zyra AI</div>
                  </div>
                </div>
              </div>

              <div className="hidden sm:block h-10 w-px bg-gradient-to-b from-transparent via-slate-600 to-transparent" />

              <div className="hover-elevate px-4 py-2 rounded-lg bg-gradient-to-br from-slate-900/40 to-slate-800/40 border border-slate-700/50 backdrop-blur-sm transition-all duration-300">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="securityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#6366F1', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>
                    <path d="M12 2L20 5.5V12C20 18.5 12 22 12 22C12 22 4 18.5 4 12V5.5L12 2Z" stroke="url(#securityGradient)" strokeWidth="1.5" fill="none" />
                    <path d="M10 14L12 16L16 10" stroke="url(#securityGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="text-left">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">Security</div>
                    <div className="text-sm font-bold text-white">Encrypted</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      {/* Sticky Mobile CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t border-border lg:hidden z-50">
        <Button asChild className="w-full gradient-button" size="lg">
          <Link href="/auth">
            Start Free Trial—No CC Required
          </Link>
        </Button>
      </div>
      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 sm:px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="/help" className="hover:text-foreground transition-colors">Help Center</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© 2025 Zyra AI. All rights reserved.</p>
            {/* Social Media Icons - Center */}
            <div className="flex items-center gap-4">
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors duration-300"
                data-testid="link-social-linkedin"
              >
                <SiLinkedin className="w-5 h-5" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors duration-300"
                data-testid="link-social-instagram"
              >
                <SiInstagram className="w-5 h-5" />
              </a>
              <a 
                href="https://x.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors duration-300"
                data-testid="link-social-x"
              >
                <SiX className="w-5 h-5" />
              </a>
            </div>
            {/* Trust Badges - Right */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span>SOC 2 Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                <span>GDPR Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
