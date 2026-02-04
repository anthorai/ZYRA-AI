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
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>ZYRA AI: Let AI Run Your Shopify Growth</title>
        <meta name="description" content="ZYRA automatically detects, fixes, and proves what's blocking your store's revenue — from product SEO to cart recovery — while you stay in control." />
        <meta property="og:title" content="ZYRA AI: Let AI Run Your Shopify Growth" />
        <meta property="og:description" content="One AI system that runs your revenue loop. ZYRA detects opportunities, executes safely, and proves real revenue impact." />
      </Helmet>
      
      <HeroSection navigationItems={navigationItems} />

      <main>
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
              <Card className="bg-card border">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-destructive/10 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-destructive" />
                  </div>
                  <h3 className="font-semibold mb-2">Traffic Doesn't Convert</h3>
                  <p className="text-sm text-muted-foreground">Visitors browse but don't buy</p>
                </CardContent>
              </Card>

              <Card className="bg-card border">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-destructive/10 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-destructive" />
                  </div>
                  <h3 className="font-semibold mb-2">Carts Get Abandoned</h3>
                  <p className="text-sm text-muted-foreground">70% of carts never complete</p>
                </CardContent>
              </Card>

              <Card className="bg-card border">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-destructive/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-destructive" />
                  </div>
                  <h3 className="font-semibold mb-2">Upsells Are Missed</h3>
                  <p className="text-sm text-muted-foreground">Post-purchase revenue left behind</p>
                </CardContent>
              </Card>

              <Card className="bg-card border">
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
              <Card className="bg-card hover-elevate border">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Search className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">DETECT</h3>
                  <p className="text-xs text-muted-foreground">Finds revenue leaks automatically</p>
                </CardContent>
              </Card>

              <Card className="bg-card hover-elevate border">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <Brain className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">DECIDE</h3>
                  <p className="text-xs text-muted-foreground">Picks the best growth action</p>
                </CardContent>
              </Card>

              <Card className="bg-card hover-elevate border">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">EXECUTE</h3>
                  <p className="text-xs text-muted-foreground">Makes changes safely</p>
                </CardContent>
              </Card>

              <Card className="bg-card hover-elevate border">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-amber-500/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">PROVE</h3>
                  <p className="text-xs text-muted-foreground">Shows real revenue impact</p>
                </CardContent>
              </Card>

              <Card className="bg-card hover-elevate col-span-2 md:col-span-1 border">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-pink-500/10 rounded-lg flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-pink-400" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">LEARN</h3>
                  <p className="text-xs text-muted-foreground">Improves over time</p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center border border-primary/20 rounded-none p-8 bg-card">
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
              <div className="flex items-start gap-4 p-6 bg-card rounded-none border">
                <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Cart recovery actions to bring shoppers back</h3>
                  <p className="text-sm text-muted-foreground">ZYRA automatically sends recovery messages when carts are abandoned</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-card rounded-none border">
                <div className="w-10 h-10 bg-pink-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Post-purchase upsells to increase order value</h3>
                  <p className="text-sm text-muted-foreground">AI recommends products after purchase to maximize customer value</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-card rounded-none border">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Search className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Product SEO improvements that drive converting traffic</h3>
                  <p className="text-sm text-muted-foreground">AI optimizes titles, descriptions, and meta when revenue upside is detected</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-card rounded-none border">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Layers className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Bulk product optimizations when patterns repeat</h3>
                  <p className="text-sm text-muted-foreground">ZYRA applies successful improvements across similar products</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-card rounded-none border">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Brand-consistent content updates</h3>
                  <p className="text-sm text-muted-foreground">ZYRA learns your brand voice and applies it automatically</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-card rounded-none border">
                <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Smart content refresh when performance drops</h3>
                  <p className="text-sm text-muted-foreground">AI detects content decay and refreshes stale product pages</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-card rounded-none border md:col-span-2">
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
              <Card className="bg-card hover-elevate border">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Manual Approval by Default</h3>
                  <p className="text-sm text-muted-foreground">You review and approve every action before it happens</p>
                </CardContent>
              </Card>

              <Card className="bg-card hover-elevate border">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Eye className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Full Visibility</h3>
                  <p className="text-sm text-muted-foreground">See every change ZYRA makes and why it made it</p>
                </CardContent>
              </Card>

              <Card className="bg-card hover-elevate border">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center">
                    <RotateCcw className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">One-Click Rollback</h3>
                  <p className="text-sm text-muted-foreground">Instantly revert any action anytime</p>
                </CardContent>
              </Card>
            </div>

            <div className="border border-primary/20 rounded-none p-8 text-center bg-card">
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
              <Card className="bg-card border">
                <CardContent className="sm:p-6 p-6 space-y-5 rounded-none">
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
                      <h3 className="font-semibold mb-1">Proves exactly what it made you</h3>
                      <p className="text-sm text-muted-foreground">Revenue attribution you can actually trust</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border">
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
              <Card className="bg-card hover-elevate border">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-3">Solo Founders</h3>
                  <p className="text-muted-foreground">Who want AI to handle growth while they focus on what matters</p>
                </CardContent>
              </Card>

              <Card className="bg-card hover-elevate border">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-3">Growing Brands</h3>
                  <p className="text-muted-foreground">Replacing multiple disconnected tools with one intelligent system</p>
                </CardContent>
              </Card>

              <Card className="bg-card hover-elevate border">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-3">Teams</h3>
                  <p className="text-muted-foreground">That want automation without losing control or visibility</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* PRICING CTA */}
        <section id="pricing" className="py-20 px-4 sm:px-6 bg-muted/30">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Simple, Permission-Based Pricing
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Plans control what ZYRA is allowed to do. Higher plans unlock growth actions and revenue protection.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Button asChild size="lg" className="rounded-none font-semibold px-8" data-testid="button-view-pricing">
                <Link href="/pricing">
                  VIEW PRICING
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              <Shield className="w-4 h-4 inline mr-1" />
              Billed through Shopify · Cancel anytime · No contracts
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
                <Card key={index} className="bg-card hover-elevate cursor-pointer border" onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-2">
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
            <Button asChild size="lg" className="rounded-none font-semibold px-10 py-6 text-lg" data-testid="button-final-cta">
              <Link href="/auth">
                INSTALL ZYRA FOR SHOPIFY
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
              <span>No credit card required</span>
              <span>·</span>
              <span>Safe, reversible automation</span>
              <span>·</span>
              <span>Built for long-term growth</span>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <Footer />
      </main>
    </div>
  );
}
