import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, Check,
  Shield, ChevronDown, ChevronUp, Zap,
  Users, DollarSign, Target, Eye, RotateCcw,
  ShoppingCart, Mail, Search, TrendingUp, Brain,
  Layers, RefreshCw, Trophy, CheckCircle2
} from "lucide-react";
import Footer from "@/components/ui/footer";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";
import { HeroSection } from "@/components/ui/hero-section";
import { AnimatedSectionTitle, AnimatedWords } from "@/components/ui/typewriter-effect";

export default function Landing() {
  const { isAuthenticated, loading, logout, isLoggingOut } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [loading, isAuthenticated, setLocation]);

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

  const navigationItems = [
    { name: "HOW IT WORKS", href: "#how-it-works", external: true },
    { name: "PRICING", href: "/pricing" },
    { name: "FAQ", href: "#faq", external: true },
    ...(loading ? [{ name: "LOG IN", href: "/auth" }] : 
        isAuthenticated ? [{ name: isLoggingOut ? "LOGGING OUT..." : "LOGOUT", onClick: handleLogout, href: "#" }] : 
        [{ name: "LOG IN", href: "/auth" }])
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#16162c' }}>
      <Helmet>
        <title>ZYRA AI: Let AI Run Your Shopify Growth</title>
        <meta name="description" content="ZYRA automatically detects, fixes, and proves what's blocking your store's revenue — from product SEO to cart recovery — while you stay in control." />
        <meta property="og:title" content="ZYRA AI: Let AI Run Your Shopify Growth" />
        <meta property="og:description" content="One AI system that runs your revenue loop. ZYRA detects opportunities, executes safely, and proves real revenue impact." />
      </Helmet>
      
      <HeroSection navigationItems={navigationItems} />

      <main>
        {/* PROBLEM SECTION */}
        <section className="py-24 px-4 sm:px-6 landing-section-alt relative overflow-hidden">
          <div className="floating-orb orb-purple w-[300px] h-[300px] top-20 right-10 opacity-30" />
          <div className="container mx-auto max-w-5xl relative z-10">
            <div className="text-center mb-16">
              <Badge className="mb-6 bg-destructive/10 text-destructive border-destructive/20">
                The Problem
              </Badge>
              <AnimatedWords 
                text="Most Shopify Stores Don't Fail — They Leak Revenue"
                highlightWords={["Leak", "Revenue"]}
                className=""
              />
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                You're not missing traffic. You're missing conversions, losing carts, and leaving money on the table.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-card-hover p-6 text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-destructive/10 rounded-xl flex items-center justify-center">
                  <Target className="w-7 h-7 text-destructive" />
                </div>
                <h3 className="font-semibold mb-2 text-lg">Traffic Doesn't Convert</h3>
                <p className="text-sm text-muted-foreground">Visitors browse but don't buy</p>
              </div>

              <div className="glass-card-hover p-6 text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-destructive/10 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-7 h-7 text-destructive" />
                </div>
                <h3 className="font-semibold mb-2 text-lg">Carts Get Abandoned</h3>
                <p className="text-sm text-muted-foreground">70% of carts never complete</p>
              </div>

              <div className="glass-card-hover p-6 text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-destructive/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-7 h-7 text-destructive" />
                </div>
                <h3 className="font-semibold mb-2 text-lg">Upsells Are Missed</h3>
                <p className="text-sm text-muted-foreground">Post-purchase revenue left behind</p>
              </div>

              <div className="glass-card-hover p-6 text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-destructive/10 rounded-xl flex items-center justify-center">
                  <Layers className="w-7 h-7 text-destructive" />
                </div>
                <h3 className="font-semibold mb-2 text-lg">Too Many Tools</h3>
                <p className="text-sm text-muted-foreground">Disconnected apps, no clear ROI</p>
              </div>
            </div>

            <div className="text-center mt-12 glass-card p-6 max-w-2xl mx-auto">
              <p className="text-muted-foreground">
                The result? <span className="text-foreground font-semibold">Complexity. Guesswork. Manual work. No clear revenue proof.</span>
              </p>
            </div>
          </div>
        </section>

        {/* THE ZYRA SOLUTION - ONE BRAIN */}
        <section id="how-it-works" className="py-24 px-4 sm:px-6 landing-section relative overflow-hidden">
          <div className="floating-orb orb-cyan w-[400px] h-[400px] -bottom-20 -left-20 opacity-30" />
          <div className="container mx-auto max-w-5xl relative z-10">
            <div className="text-center mb-16">
              <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 px-4 py-2">
                <Brain className="w-4 h-4 mr-2" />
                One AI System
              </Badge>
              <AnimatedSectionTitle>
                One AI System. <span className="gradient-text">One Revenue Loop.</span>
              </AnimatedSectionTitle>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                ZYRA runs a continuous cycle that finds revenue opportunities, takes action, and proves the impact — automatically.
              </p>
            </div>

            {/* Revenue Loop Visualization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
              <div className="glass-card-hover p-6 text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Search className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="font-bold text-lg mb-2">DETECT</h3>
                <p className="text-xs text-muted-foreground">Finds revenue leaks automatically</p>
              </div>

              <div className="glass-card-hover p-6 text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Brain className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="font-bold text-lg mb-2">DECIDE</h3>
                <p className="text-xs text-muted-foreground">Picks the best growth action</p>
              </div>

              <div className="glass-card-hover p-6 text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Zap className="w-7 h-7 text-green-400" />
                </div>
                <h3 className="font-bold text-lg mb-2">EXECUTE</h3>
                <p className="text-xs text-muted-foreground">Makes changes safely</p>
              </div>

              <div className="glass-card-hover p-6 text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-amber-400" />
                </div>
                <h3 className="font-bold text-lg mb-2">PROVE</h3>
                <p className="text-xs text-muted-foreground">Shows real revenue impact</p>
              </div>

              <div className="glass-card-hover p-6 text-center sm:col-span-2 md:col-span-1">
                <div className="w-14 h-14 mx-auto mb-4 bg-pink-500/20 rounded-xl flex items-center justify-center">
                  <RefreshCw className="w-7 h-7 text-pink-400" />
                </div>
                <h3 className="font-bold text-lg mb-2">LEARN</h3>
                <p className="text-xs text-muted-foreground">Improves over time</p>
              </div>
            </div>

            <div className="text-center glass-card p-10">
              <p className="text-xl font-medium">
                <span className="gradient-text font-bold">ZYRA does the work.</span> You supervise.
              </p>
            </div>
          </div>
        </section>

        {/* WHAT ZYRA DOES (OUTCOMES) */}
        <section className="py-24 px-4 sm:px-6 landing-section-alt relative overflow-hidden">
          <div className="floating-orb orb-pink w-[350px] h-[350px] top-40 -right-20 opacity-25" />
          <div className="container mx-auto max-w-5xl relative z-10">
            <div className="text-center mb-16">
              <Badge className="mb-6 bg-accent/10 text-accent border-accent/20">
                Automated Actions
              </Badge>
              <AnimatedSectionTitle>
                What ZYRA <span className="gradient-text">Automatically Runs</span> for Your Store
              </AnimatedSectionTitle>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                These aren't features to configure. These are actions ZYRA takes for you.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card-hover flex items-start gap-4 p-6">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-lg">Cart recovery actions to bring shoppers back</h3>
                  <p className="text-sm text-muted-foreground">ZYRA automatically sends recovery messages when carts are abandoned</p>
                </div>
              </div>

              <div className="glass-card-hover flex items-start gap-4 p-6">
                <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-pink-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-lg">Post-purchase upsells to increase order value</h3>
                  <p className="text-sm text-muted-foreground">AI recommends products after purchase to maximize customer value</p>
                </div>
              </div>

              <div className="glass-card-hover flex items-start gap-4 p-6">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Search className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-lg">Product SEO improvements that drive converting traffic</h3>
                  <p className="text-sm text-muted-foreground">AI optimizes titles, descriptions, and meta when revenue upside is detected</p>
                </div>
              </div>

              <div className="glass-card-hover flex items-start gap-4 p-6">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Layers className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-lg">Bulk product optimizations when patterns repeat</h3>
                  <p className="text-sm text-muted-foreground">ZYRA applies successful improvements across similar products</p>
                </div>
              </div>

              <div className="glass-card-hover flex items-start gap-4 p-6">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-lg">Brand-consistent content updates</h3>
                  <p className="text-sm text-muted-foreground">ZYRA learns your brand voice and applies it automatically</p>
                </div>
              </div>

              <div className="glass-card-hover flex items-start gap-4 p-6">
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-lg">Smart content refresh when performance drops</h3>
                  <p className="text-sm text-muted-foreground">AI detects content decay and refreshes stale product pages</p>
                </div>
              </div>

              <div className="glass-card-hover flex items-start gap-4 p-6 md:col-span-2 border-primary/20">
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-lg">Competitive SEO insights (optional power mode)</h3>
                  <p className="text-sm text-muted-foreground">Real-time Google SERP analysis to identify opportunities vs. competitors</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTROL & SAFETY */}
        <section className="py-24 px-4 sm:px-6 landing-section relative overflow-hidden">
          <div className="floating-orb orb-cyan w-[350px] h-[350px] bottom-20 right-20 opacity-20" />
          <div className="container mx-auto max-w-5xl relative z-10">
            <div className="text-center mb-16">
              <Badge className="mb-6 bg-green-500/10 text-green-400 border-green-500/20">
                <Shield className="w-4 h-4 mr-2" />
                Safety First
              </Badge>
              <AnimatedSectionTitle>
                Automation You Can <span className="gradient-text">Trust</span>
              </AnimatedSectionTitle>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                ZYRA never changes your store without your control.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12">
              <div className="glass-card-hover p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-primary/20 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-3">Manual Approval by Default</h3>
                <p className="text-sm text-muted-foreground">You review and approve every action before it happens</p>
              </div>

              <div className="glass-card-hover p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-primary/20 rounded-2xl flex items-center justify-center">
                  <Eye className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-3">Full Visibility</h3>
                <p className="text-sm text-muted-foreground">See every change ZYRA makes and why it made it</p>
              </div>

              <div className="glass-card-hover p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-primary/20 rounded-2xl flex items-center justify-center">
                  <RotateCcw className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-3">One-Click Rollback</h3>
                <p className="text-sm text-muted-foreground">Instantly revert any action anytime</p>
              </div>
            </div>

            <div className="glass-card p-10 text-center max-w-2xl mx-auto">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary/30 to-accent/30 rounded-2xl flex items-center justify-center">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <p className="text-xl font-bold mb-3">Autonomy only when you allow it.</p>
              <p className="text-muted-foreground">Turn on autonomous mode when you're ready. Until then, ZYRA waits for your approval.</p>
            </div>
          </div>
        </section>

        {/* REVENUE PROOF */}
        <section className="py-24 px-4 sm:px-6 landing-section-alt relative overflow-hidden">
          <div className="floating-orb orb-purple w-[300px] h-[300px] -bottom-20 left-20 opacity-25" />
          <div className="container mx-auto max-w-5xl relative z-10">
            <div className="text-center mb-16">
              <Badge className="mb-6 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                <TrendingUp className="w-4 h-4 mr-2" />
                Revenue Attribution
              </Badge>
              <AnimatedSectionTitle>
                See Exactly What Changed — <span className="gradient-text">And What It Made</span>
              </AnimatedSectionTitle>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Not more dashboards — just clarity.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-stretch">
              <div className="glass-card p-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-lg">ZYRA tracks real revenue impact</h3>
                    <p className="text-sm text-muted-foreground">Not vanity metrics — actual dollars attributed to each action</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-lg">Shows which product was changed</h3>
                    <p className="text-sm text-muted-foreground">Clear visibility into every optimization made</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-lg">Proves exactly what it made you</h3>
                    <p className="text-sm text-muted-foreground">Revenue attribution you can actually trust</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-8 text-center flex flex-col justify-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary/30 to-emerald-500/30 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-10 h-10 text-primary" />
                </div>
                <p className="text-2xl font-bold mb-3">Track Attributable Revenue</p>
                <p className="text-muted-foreground mb-6">See exactly which ZYRA actions contributed to your store's growth</p>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20 self-center px-4 py-2">Business outcomes, not vanity metrics</Badge>
              </div>
            </div>
          </div>
        </section>

        {/* WHO ZYRA IS FOR */}
        <section className="py-24 px-4 sm:px-6 landing-section relative overflow-hidden">
          <div className="container mx-auto max-w-5xl relative z-10">
            <div className="text-center mb-16">
              <Badge className="mb-6 bg-purple-500/10 text-purple-400 border-purple-500/20">
                <Users className="w-4 h-4 mr-2" />
                Built For You
              </Badge>
              <AnimatedSectionTitle>
                Who ZYRA Is <span className="gradient-text">Built For</span>
              </AnimatedSectionTitle>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="glass-card-hover p-8">
                <div className="w-14 h-14 mb-6 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                  <Users className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="font-bold text-xl mb-3">Solo Founders</h3>
                <p className="text-muted-foreground">Who want AI to handle growth while they focus on what matters</p>
              </div>

              <div className="glass-card-hover p-8">
                <div className="w-14 h-14 mb-6 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="font-bold text-xl mb-3">Growing Brands</h3>
                <p className="text-muted-foreground">Replacing multiple disconnected tools with one intelligent system</p>
              </div>

              <div className="glass-card-hover p-8">
                <div className="w-14 h-14 mb-6 bg-pink-500/20 rounded-2xl flex items-center justify-center">
                  <Layers className="w-7 h-7 text-pink-400" />
                </div>
                <h3 className="font-bold text-xl mb-3">Teams</h3>
                <p className="text-muted-foreground">That want automation without losing control or visibility</p>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING CTA */}
        <section id="pricing" className="py-24 px-4 sm:px-6 cta-section relative overflow-hidden">
          <div className="floating-orb orb-cyan w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
          <div className="container mx-auto max-w-3xl text-center relative z-10">
            <div className="glass-card p-10 md:p-14">
              <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
                <DollarSign className="w-4 h-4 mr-2" />
                Simple Pricing
              </Badge>
              <AnimatedSectionTitle>
                Simple, <span className="gradient-text">Permission-Based</span> Pricing
              </AnimatedSectionTitle>
              <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                Plans control what ZYRA is allowed to do. Higher plans unlock growth actions and revenue protection.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
                <Button asChild size="lg" variant="outline" className="rounded-xl font-semibold px-10 py-6 text-base border-primary/40 tracking-wide" data-testid="button-view-pricing">
                  <Link href="/pricing">
                    VIEW PRICING
                    <ArrowRight className="w-5 h-5 ml-3" />
                  </Link>
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {[
                  { icon: Shield, text: "Billed through Shopify" },
                  { icon: Check, text: "Cancel anytime" },
                  { icon: Check, text: "No contracts" },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-primary/15 text-sm font-medium text-foreground/80"
                    style={{ background: 'rgba(0, 240, 255, 0.04)', boxShadow: '0 0 12px rgba(0, 240, 255, 0.04)' }}
                  >
                    <item.icon className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24 px-4 sm:px-6 landing-section relative overflow-hidden">
          <div className="floating-orb orb-pink w-[250px] h-[250px] top-20 -left-20 opacity-20" />
          <div className="container mx-auto max-w-3xl relative z-10">
            <div className="text-center mb-16">
              <Badge className="mb-6 bg-muted text-foreground border-primary/30">
                FAQ
              </Badge>
              <AnimatedSectionTitle>
                Questions? <span className="gradient-text">We've Got Answers</span>
              </AnimatedSectionTitle>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div 
                  key={index} 
                  className="glass-card-hover cursor-pointer p-6" 
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold text-lg">{faq.question}</h3>
                    <div className={`w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${expandedFaq === index ? 'rotate-180' : ''}`}>
                      {expandedFaq === index ? (
                        <ChevronUp className="w-5 h-5 text-primary" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </div>
                  {expandedFaq === index && (
                    <p className="mt-4 text-muted-foreground leading-relaxed">{faq.answer}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-28 px-4 sm:px-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a38 0%, #16162c 50%, #1e1e3a 100%)' }}>
          <div className="floating-orb orb-cyan w-[500px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30" />
          <div className="floating-orb orb-purple w-[300px] h-[300px] top-10 left-10 opacity-20" />
          <div className="floating-orb orb-pink w-[300px] h-[300px] bottom-10 right-10 opacity-20" />
          <div className="container mx-auto max-w-3xl text-center relative z-10">
            <div className="glass-card p-12 md:p-16">
              <AnimatedSectionTitle>
                Stop Managing Growth. <span className="gradient-text">Start Supervising It.</span>
              </AnimatedSectionTitle>
              <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                Let ZYRA handle the work. You stay in control.
              </p>
              <div className="relative group inline-block">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-primary via-accent to-primary rounded-2xl blur-xl opacity-70 group-hover:opacity-100 transition duration-300" />
                <Button asChild size="lg" className="relative gradient-button rounded-2xl font-bold px-14 py-8 text-lg tracking-wide" data-testid="button-final-cta">
                  <Link href="/auth">
                    INSTALL ZYRA FOR SHOPIFY
                    <ArrowRight className="w-6 h-6 ml-3" />
                  </Link>
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 mt-12">
                {[
                  { text: "No credit card required" },
                  { text: "Safe, reversible automation" },
                  { text: "Built for long-term growth" },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-primary/15 text-sm font-medium text-foreground/80"
                    style={{ background: 'rgba(0, 240, 255, 0.04)', boxShadow: '0 0 12px rgba(0, 240, 255, 0.04)' }}
                  >
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <Footer />
      </main>
    </div>
  );
}
