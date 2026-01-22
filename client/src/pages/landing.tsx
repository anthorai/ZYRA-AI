import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, Play, Check, Gift, Crown, Award, 
  Shield, ChevronDown, ChevronUp, Zap,
  Users, DollarSign, Target, Eye, RotateCcw,
  ShoppingCart, Mail, Search, TrendingUp, Brain,
  Layers, RefreshCw, Trophy, CheckCircle2
} from "lucide-react";
import { SiShopify } from "react-icons/si";
import ResponsiveNavbar from "@/components/responsive-navbar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import zyraLogoUrl from "@assets/zyra logo_1758694880266.png";
import { Helmet } from "react-helmet";

export default function Landing() {
  const { isAuthenticated, loading, logout, isLoggingOut } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);

  const handleLogout = async () => {
    try {
      const { error } = await logout();
      if (error) {
        toast({
          title: "Logout Failed",
          description: error.message || "An error occurred during logout.",
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
      toast({
        title: "Logout Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const faqs = [
    {
      question: "Will the AI content sound generic or robotic?",
      answer: "ZYRA learns your brand voice and creates content that matches your style. You can review and edit all generated content before publishing."
    },
    {
      question: "Is this hard to set up? I'm not technical.",
      answer: "Setup takes a few minutes. Simply connect your Shopify store and ZYRA starts working. No coding or technical skills required."
    },
    {
      question: "Will this work for my specific niche?",
      answer: "ZYRA works with Shopify stores across many industries including fashion, tech, home goods, health & wellness, and more. The AI adapts to your specific products."
    },
    {
      question: "Is my store data safe?",
      answer: "We use AES-256 encryption and follow GDPR compliance guidelines. Your data is not sold or shared. You have one-click rollback if you ever want to restore original data."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes. Subscriptions are managed through Shopify billing. You can cancel anytime from your Shopify admin with no penalties."
    },
    {
      question: "What if I don't like an AI change?",
      answer: "Every change ZYRA makes is reversible with one click. Your original data is always preserved, and you can rollback instantly."
    }
  ];

  const plans = [
    {
      name: "7-Day Free Trial",
      price: "$0",
      period: "7 days",
      icon: <Gift className="w-8 h-8" />,
      badge: "Risk-Free",
      features: [
        "100 credits included",
        "Full ZYRA capabilities",
        "Manual approval mode",
        "One-click rollback",
        "Email support"
      ],
      popular: false
    },
    {
      name: "Starter",
      price: "$49",
      annualPrice: "$39",
      period: "per month",
      icon: <Zap className="w-8 h-8" />,
      badge: "For Beginners",
      features: [
        "1,000 credits / month",
        "Product SEO optimization",
        "Cart recovery actions",
        "Post-purchase upsells",
        "Brand voice memory",
        "Revenue tracking"
      ],
      popular: false
    },
    {
      name: "Growth",
      price: "$299",
      annualPrice: "$239",
      period: "per month",
      icon: <Award className="w-8 h-8" />,
      badge: "Most Popular",
      features: [
        "6,000 credits / month",
        "Everything in Starter +",
        "Autonomous mode",
        "Bulk optimization",
        "Competitive intelligence",
        "Priority processing"
      ],
      popular: true
    },
    {
      name: "Pro",
      price: "$999",
      annualPrice: "$799",
      period: "per month",
      icon: <Crown className="w-8 h-8" />,
      badge: "Enterprise",
      features: [
        "20,000 credits / month",
        "Everything in Growth +",
        "White-glove onboarding",
        "Dedicated support",
        "Custom integrations",
        "Enterprise SLA"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>ZYRA AI: Let AI Run Your Shopify Growth</title>
        <meta name="description" content="ZYRA automatically detects, fixes, and proves what's blocking your store's revenue — from product SEO to cart recovery — while you stay in control." />
        <meta property="og:title" content="ZYRA AI: Let AI Run Your Shopify Growth" />
        <meta property="og:description" content="One AI system that runs your revenue loop. ZYRA detects opportunities, executes safely, and proves real revenue impact." />
      </Helmet>

      <ResponsiveNavbar
        navItems={[
          { label: "How It Works", href: "#how-it-works", external: true },
          { label: "Pricing", href: "#pricing", external: true },
          { label: "FAQ", href: "#faq", external: true },
          ...(loading ? [{ label: "Log in", href: "/auth" }] : 
              isAuthenticated ? [{ label: isLoggingOut ? "Logging out..." : "Logout", onClick: handleLogout, disabled: isLoggingOut }] : 
              [{ label: "Log in", href: "/auth" }])
        ]}
        actionButton={{ label: "Start Free", href: "/auth" }}
      />

      <main className="pt-16">
        {/* HERO SECTION */}
        <section className="relative py-20 sm:py-28 px-4 sm:px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
          <div className="container mx-auto max-w-5xl relative z-10 text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8">
              <SiShopify className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Built for Shopify stores</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
              Let AI Run Your Shopify Growth
              <span className="block text-primary mt-2">With Full Control</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
              ZYRA automatically detects, fixes, and proves what's blocking your store's revenue — 
              from product SEO to cart recovery — while you stay in control.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
              <Button asChild size="lg" className="gradient-button px-8 py-6 text-lg font-semibold" data-testid="button-hero-start">
                <Link href="/auth">
                  Start Free with Your Shopify Store
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg" data-testid="button-hero-demo">
                <Play className="w-5 h-5 mr-2" />
                See How ZYRA Works
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>No code required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>Safe automation with approval</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>One-click rollback</span>
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEM SECTION */}
        <section className="py-20 px-4 sm:px-6 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Most Shopify Stores Don't Fail — They Leak Revenue
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                You're not missing traffic. You're missing conversions, losing carts, and leaving money on the table.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-card/50 border-destructive/20">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-destructive/10 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-destructive" />
                  </div>
                  <h3 className="font-semibold mb-2">Traffic Doesn't Convert</h3>
                  <p className="text-sm text-muted-foreground">Visitors browse but don't buy</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-destructive/20">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-destructive/10 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-destructive" />
                  </div>
                  <h3 className="font-semibold mb-2">Carts Get Abandoned</h3>
                  <p className="text-sm text-muted-foreground">70% of carts never complete</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-destructive/20">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-destructive/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-destructive" />
                  </div>
                  <h3 className="font-semibold mb-2">Upsells Are Missed</h3>
                  <p className="text-sm text-muted-foreground">Post-purchase revenue left behind</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-destructive/20">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-destructive/10 rounded-lg flex items-center justify-center">
                    <Layers className="w-6 h-6 text-destructive" />
                  </div>
                  <h3 className="font-semibold mb-2">Too Many Tools</h3>
                  <p className="text-sm text-muted-foreground">Disconnected apps, no clear ROI</p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-10">
              <p className="text-muted-foreground">
                The result? <span className="text-foreground font-medium">Complexity. Guesswork. Manual work. No clear revenue proof.</span>
              </p>
            </div>
          </div>
        </section>

        {/* THE ZYRA SOLUTION - ONE BRAIN */}
        <section id="how-it-works" className="py-20 px-4 sm:px-6">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                <Brain className="w-3 h-3 mr-1" />
                One AI System
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                One AI System. One Revenue Loop.
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                ZYRA runs a continuous cycle that finds revenue opportunities, takes action, and proves the impact — automatically.
              </p>
            </div>

            {/* Revenue Loop Visualization */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
              <Card className="bg-card/50 hover-elevate">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Search className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">DETECT</h3>
                  <p className="text-xs text-muted-foreground">Finds revenue leaks automatically</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 hover-elevate">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <Brain className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">DECIDE</h3>
                  <p className="text-xs text-muted-foreground">Picks the best growth action</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 hover-elevate">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">EXECUTE</h3>
                  <p className="text-xs text-muted-foreground">Makes changes safely</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 hover-elevate">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-amber-500/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">PROVE</h3>
                  <p className="text-xs text-muted-foreground">Shows real revenue impact</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 hover-elevate col-span-2 md:col-span-1">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-pink-500/10 rounded-lg flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-pink-400" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">LEARN</h3>
                  <p className="text-xs text-muted-foreground">Improves over time</p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center bg-primary/5 border border-primary/20 rounded-xl p-8">
              <p className="text-lg font-medium">
                <span className="text-primary">ZYRA does the work.</span> You supervise.
              </p>
            </div>
          </div>
        </section>

        {/* WHAT ZYRA DOES (OUTCOMES) */}
        <section className="py-20 px-4 sm:px-6 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                What ZYRA Automatically Runs for Your Store
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                These aren't features to configure. These are actions ZYRA takes for you.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4 p-6 bg-card rounded-lg border">
                <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Cart recovery actions to bring shoppers back</h3>
                  <p className="text-sm text-muted-foreground">ZYRA automatically sends recovery messages when carts are abandoned</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-card rounded-lg border">
                <div className="w-10 h-10 bg-pink-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Post-purchase upsells to increase order value</h3>
                  <p className="text-sm text-muted-foreground">AI recommends products after purchase to maximize customer value</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-card rounded-lg border">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Search className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Product SEO improvements that drive converting traffic</h3>
                  <p className="text-sm text-muted-foreground">AI optimizes titles, descriptions, and meta when revenue upside is detected</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-card rounded-lg border">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Layers className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Bulk product optimizations when patterns repeat</h3>
                  <p className="text-sm text-muted-foreground">ZYRA applies successful improvements across similar products</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-card rounded-lg border">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Brand-consistent content updates</h3>
                  <p className="text-sm text-muted-foreground">ZYRA learns your brand voice and applies it automatically</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-card rounded-lg border">
                <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Smart content refresh when performance drops</h3>
                  <p className="text-sm text-muted-foreground">AI detects content decay and refreshes stale product pages</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-card rounded-lg border md:col-span-2">
                <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Competitive SEO insights (optional power mode)</h3>
                  <p className="text-sm text-muted-foreground">Real-time Google SERP analysis to identify opportunities vs. competitors</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTROL & SAFETY */}
        <section className="py-20 px-4 sm:px-6">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Automation You Can Trust
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                ZYRA never changes your store without your control.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <Card className="bg-card/50 hover-elevate">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Manual Approval by Default</h3>
                  <p className="text-sm text-muted-foreground">You review and approve every action before it happens</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 hover-elevate">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Eye className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Full Visibility</h3>
                  <p className="text-sm text-muted-foreground">See every change ZYRA makes and why it made it</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 hover-elevate">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center">
                    <RotateCcw className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">One-Click Rollback</h3>
                  <p className="text-sm text-muted-foreground">Instantly revert any action anytime</p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-8 text-center">
              <Shield className="w-8 h-8 text-primary mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Autonomy only when you allow it.</p>
              <p className="text-muted-foreground">Turn on autonomous mode when you're ready. Until then, ZYRA waits for your approval.</p>
            </div>
          </div>
        </section>

        {/* REVENUE PROOF */}
        <section className="py-20 px-4 sm:px-6 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                See Exactly What Changed — And What It Made
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Not more dashboards — just clarity.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">ZYRA tracks real revenue impact</h3>
                    <p className="text-sm text-muted-foreground">Not vanity metrics — actual dollars attributed to each action</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Shows which product was changed</h3>
                    <p className="text-sm text-muted-foreground">Clear visibility into every optimization made</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Shows why the change was made</h3>
                    <p className="text-sm text-muted-foreground">Understand ZYRA's reasoning for every decision</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Shows how much money it generated</h3>
                    <p className="text-sm text-muted-foreground">Revenue attribution you can actually trust</p>
                  </div>
                </div>
              </div>

              <Card className="bg-gradient-to-br from-primary/10 to-emerald-500/10 border-primary/20">
                <CardContent className="p-8 text-center">
                  <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
                  <p className="text-2xl font-bold mb-2">Track Attributable Revenue</p>
                  <p className="text-muted-foreground mb-4">See exactly which ZYRA actions contributed to your store's growth</p>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Business outcomes, not vanity metrics</Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* WHO ZYRA IS FOR */}
        <section className="py-20 px-4 sm:px-6">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Who ZYRA Is For
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-card/50 hover-elevate">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-3">Solo Founders</h3>
                  <p className="text-muted-foreground">Who want AI to handle growth while they focus on what matters</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 hover-elevate">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-3">Growing Brands</h3>
                  <p className="text-muted-foreground">Replacing multiple disconnected tools with one intelligent system</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 hover-elevate">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-3">Teams</h3>
                  <p className="text-muted-foreground">That want automation without losing control or visibility</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-20 px-4 sm:px-6 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-muted-foreground mb-6">Start free. Scale when you're ready.</p>
              
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {plans.map((plan, index) => (
                <Card 
                  key={index} 
                  className={`relative hover-elevate transition-all ${plan.popular ? 'ring-2 ring-primary md:scale-105' : ''}`}
                  data-testid={`card-plan-${index}`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className={plan.popular ? "bg-primary text-primary-foreground" : ""}>{plan.badge}</Badge>
                    </div>
                  )}
                  <CardContent className="p-6 pt-8">
                    <div className="text-center mb-6">
                      <div className="flex justify-center text-primary mb-3">{plan.icon}</div>
                      <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                      <div className="mb-2">
                        <span className="text-3xl font-bold">
                          {isAnnual && plan.annualPrice ? plan.annualPrice : plan.price}
                        </span>
                        {index !== 0 && <span className="text-sm text-muted-foreground">/month</span>}
                      </div>
                      {isAnnual && plan.annualPrice && index !== 0 && (
                        <p className="text-xs text-muted-foreground line-through">{plan.price}/month</p>
                      )}
                    </div>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start text-sm">
                          <Check className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      asChild
                      className={`w-full ${plan.popular ? 'gradient-button' : ''}`}
                      variant={plan.popular ? "default" : "outline"}
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

            <div className="text-center text-sm text-muted-foreground">
              <Shield className="w-4 h-4 inline mr-1" />
              Billed through Shopify • Cancel anytime • No contracts
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-20 px-4 sm:px-6">
          <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Questions? We've Got Answers
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index} className="hover-elevate cursor-pointer" onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold pr-4">{faq.question}</h3>
                      {expandedFaq === index ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                    {expandedFaq === index && (
                      <p className="mt-4 text-muted-foreground">{faq.answer}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-primary/10 via-background to-primary/5">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Stop Managing Growth. Start Supervising It.
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Let ZYRA handle the work. You stay in control.
            </p>
            <Button asChild size="lg" className="gradient-button px-10 py-6 text-lg font-semibold" data-testid="button-final-cta">
              <Link href="/auth">
                Install ZYRA for Shopify
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
              <span>No credit card required</span>
              <span>•</span>
              <span>Safe, reversible automation</span>
              <span>•</span>
              <span>Built for long-term growth</span>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="py-12 px-4 sm:px-6 border-t">
          <div className="container mx-auto max-w-5xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <img src={zyraLogoUrl} alt="ZYRA AI" className="w-8 h-8" />
                <span className="font-bold text-lg">ZYRA AI</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
                <a href="mailto:support@zyraai.com" className="hover:text-foreground transition-colors">Support</a>
              </div>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} ZYRA AI. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
