import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, Check, Shield, Lock, TrendingUp,
  Zap, Activity, BarChart3, Eye, RefreshCcw, Cpu, Gift
} from "lucide-react";
import ResponsiveNavbar from "@/components/responsive-navbar";
import Footer from "@/components/ui/footer";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";

export default function Pricing() {
  const { isAuthenticated, loading, logout, isLoggingOut } = useAuth();
  const { toast } = useToast();

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
      }
    } catch (error: any) {
      toast({
        title: "Logout Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      <Helmet>
        <title>Pricing - ZYRA AI | Permission-Based AI Control</title>
        <meta name="description" content="You don't pay for features. You decide how much control Zyra AI has inside your store. Each plan unlocks a different level of execution, automation, and protection." />
        <meta property="og:title" content="Pricing - ZYRA AI" />
        <meta property="og:description" content="Permission-based pricing. From conservative fixes to full revenue protection." />
      </Helmet>
      
      <ResponsiveNavbar
        navItems={[
          { label: "Home", href: "/" },
          { label: "Pricing", href: "/pricing" },
          { label: "FAQ", href: "/#faq", external: true },
        ]}
        secondaryAction={
          isAuthenticated
            ? { label: isLoggingOut ? "Logging out..." : "Logout", onClick: handleLogout }
            : !loading ? { label: "Log in", href: "/auth" } : undefined
        }
        actionButton={
          isAuthenticated
            ? { label: "Dashboard", scrolledLabel: "Dashboard", href: "/dashboard" }
            : { label: "Start Free", scrolledLabel: "Get Started", href: "/auth" }
        }
        scrollAware
      />

      <main className="pt-20">

        {/* ============================================================
            SECTION 1: HERO — TWO-COLUMN LAYOUT
            ============================================================ */}
        <section className="py-16 sm:py-20 lg:py-28 px-4 sm:px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="container mx-auto max-w-6xl relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              
              {/* LEFT — Text */}
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6" data-testid="text-pricing-headline">
                  You don't pay for features.
                  <span className="block text-primary mt-3">
                    You decide how much control Zyra AI has inside your store.
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                  Each plan unlocks a different level of execution,
                  automation, and protection — safely.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild size="lg" className="gradient-button px-8" data-testid="button-view-plans">
                    <a href="#plans">
                      View Plans
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="px-8 border-primary/50 text-primary" data-testid="button-compare-plans">
                    <a href="#comparison">
                      Compare Plans
                    </a>
                  </Button>
                </div>
              </div>

              {/* RIGHT — Control Meter Visual */}
              <div className="flex justify-center lg:justify-end" data-testid="control-meter">
                <div className="relative w-full max-w-sm">
                  {/* Meter Container */}
                  <div className="space-y-4">
                    
                    {/* Pro Level */}
                    <div className="relative group" data-testid="meter-level-pro">
                      <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/30 via-orange-500/20 to-amber-500/30 rounded-2xl meter-glow-pro" />
                      <div className="relative glass-card p-5 border-amber-500/40" style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                            <Lock className="w-6 h-6 text-amber-400" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-amber-300 text-sm">PRO</p>
                            <p className="text-xs text-muted-foreground">Full revenue protection</p>
                          </div>
                          <div className="flex gap-0.5">
                            <div className="w-2 h-8 rounded-full bg-amber-400" />
                            <div className="w-2 h-8 rounded-full bg-amber-400" />
                            <div className="w-2 h-8 rounded-full bg-amber-400" />
                            <div className="w-2 h-8 rounded-full bg-amber-400" />
                            <div className="w-2 h-8 rounded-full bg-amber-400" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Growth Level */}
                    <div className="relative group" data-testid="meter-level-growth">
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl meter-glow-growth" />
                      <div className="relative glass-card p-5" style={{ borderColor: 'rgba(0, 240, 255, 0.3)' }}>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-primary text-sm">GROWTH</p>
                            <p className="text-xs text-muted-foreground">Revenue optimization</p>
                          </div>
                          <div className="flex gap-0.5">
                            <div className="w-2 h-8 rounded-full bg-primary" />
                            <div className="w-2 h-8 rounded-full bg-primary" />
                            <div className="w-2 h-8 rounded-full bg-primary" />
                            <div className="w-2 h-8 rounded-full bg-primary/30" />
                            <div className="w-2 h-8 rounded-full bg-primary/30" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Starter Level */}
                    <div className="relative group" data-testid="meter-level-starter">
                      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-blue-500/10 rounded-2xl meter-glow-starter" />
                      <div className="relative glass-card p-5" style={{ borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-blue-300 text-sm">STARTER</p>
                            <p className="text-xs text-muted-foreground">Conservative control</p>
                          </div>
                          <div className="flex gap-0.5">
                            <div className="w-2 h-8 rounded-full bg-blue-400" />
                            <div className="w-2 h-8 rounded-full bg-blue-400/30" />
                            <div className="w-2 h-8 rounded-full bg-blue-400/30" />
                            <div className="w-2 h-8 rounded-full bg-blue-400/30" />
                            <div className="w-2 h-8 rounded-full bg-blue-400/30" />
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Vertical label */}
                  <div className="absolute -left-8 top-1/2 -translate-y-1/2 hidden lg:block">
                    <p className="text-xs text-muted-foreground tracking-widest uppercase" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                      Control Level
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 2: HOW PRICING WORKS — 3 VISUAL INFO CARDS
            ============================================================ */}
        <section className="py-16 px-4 sm:px-6 border-t border-primary/10">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3" data-testid="text-section-how-pricing">
                How pricing works
              </h2>
              <p className="text-muted-foreground">Three principles that make ZYRA pricing fair.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card className="glass-card-hover border-primary/15" data-testid="info-card-permission">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Eye className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Permission-Based AI</h3>
                  <p className="text-sm text-muted-foreground">
                    Zyra only acts where you allow it.
                    Your plan controls what's possible.
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card-hover border-primary/15" data-testid="info-card-one-time">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-xl flex items-center justify-center">
                    <RefreshCcw className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">One-Time Fixes</h3>
                  <p className="text-sm text-muted-foreground">
                    If Zyra fixes something, it locks it.
                    No repeat charges for the same action.
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card-hover border-primary/15" data-testid="info-card-credits">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Cpu className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Credits = Execution</h3>
                  <p className="text-sm text-muted-foreground">
                    Credits are used only when real changes
                    are applied to your store.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 3: PRICING CARDS — REDESIGNED
            ============================================================ */}
        <section id="plans" className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-14">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3" data-testid="text-section-choose-plan">
                Choose your level of control
              </h2>
              <p className="text-muted-foreground">
                Every plan includes Shopify integration and one-click rollback.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">

              {/* ---- FREE: FREE TO INSTALL ---- */}
              <div className="relative group" data-testid="pricing-card-free">
                <div className="absolute -inset-[1px] bg-gradient-to-b from-emerald-500/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Card className="relative h-full bg-[#12122a] border-emerald-500/20 overflow-visible">
                  <CardContent className="p-6 sm:p-8 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                        <Gift className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-xs">
                          Free to Install
                        </Badge>
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold mb-1" data-testid="text-plan-name-free">Free</h3>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-4xl font-bold" data-testid="text-plan-price-free">$0</span>
                      <span className="text-muted-foreground text-sm">/ month</span>
                    </div>

                    <p className="text-base text-foreground/90 font-medium mb-2">
                      See real results before you upgrade.
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                      499 AI credits for 8-9 optimization actions. All results visible before upgrading.
                    </p>

                    <div className="mb-6 py-2 px-3 bg-emerald-500/5 border border-emerald-500/15 rounded-lg">
                      <span className="text-sm font-medium text-emerald-300">499 credits (8-9 actions)</span>
                    </div>

                    <div className="space-y-3 mb-8 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>Up to 3 products per action</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>SEO title & meta tag optimization</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>Product description & copy fixes</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>Trust signal enhancement</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>Image alt-text optimization</span>
                      </div>
                    </div>

                    <Button asChild variant="outline" className="w-full border-emerald-500/40 text-emerald-300 bg-emerald-500/5" data-testid="button-free-cta">
                      <Link href="/auth">Get Started Free</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* ---- STARTER: CONSERVATIVE CONTROL ---- */}
              <div className="relative group" data-testid="pricing-card-starter">
                <div className="absolute -inset-[1px] bg-gradient-to-b from-blue-500/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Card className="relative h-full bg-[#12122a] border-blue-500/20 overflow-visible">
                  <CardContent className="p-6 sm:p-8 flex flex-col h-full">
                    {/* Icon + Label */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/30 text-xs">
                          Conservative Control
                        </Badge>
                      </div>
                    </div>

                    {/* Plan Name + Price */}
                    <h3 className="text-2xl font-bold mb-1" data-testid="text-plan-name-starter">Starter</h3>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-4xl font-bold" data-testid="text-plan-price-starter">$49</span>
                      <span className="text-muted-foreground text-sm">/ month</span>
                    </div>

                    {/* Main Line */}
                    <p className="text-base text-foreground/90 font-medium mb-2">
                      Zyra fixes what's broken — and stops.
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                      Safe, low-risk optimization for stores that need stronger fundamentals.
                    </p>

                    {/* Credits */}
                    <div className="mb-6 py-2 px-3 bg-blue-500/5 border border-blue-500/15 rounded-lg">
                      <span className="text-sm font-medium text-blue-300">2,000 credits / month</span>
                    </div>

                    {/* Key capabilities (concise) */}
                    <div className="space-y-3 mb-8 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span>Foundation actions (titles, SEO, trust signals)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span>Fast Mode execution</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span>Auto-rollback on critical failures</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span>Limited Competitive Intelligence</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <Button asChild variant="outline" className="w-full border-blue-500/40 text-blue-300 bg-blue-500/5" data-testid="button-starter-cta">
                      <Link href="/auth">Start Safe</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* ---- GROWTH: REVENUE OPTIMIZER ---- */}
              <div className="relative group" data-testid="pricing-card-growth">
                {/* Glow effect */}
                <div className="absolute -inset-[2px] bg-gradient-to-b from-primary/40 via-primary/20 to-primary/5 rounded-2xl blur-sm" />
                <Card className="relative h-full bg-[#12122a] border-primary ring-1 ring-primary/30 overflow-visible">
                  {/* Most Popular badge */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <span
                      className="no-default-hover-elevate no-default-active-elevate inline-flex items-center gap-1.5 px-5 py-1.5 text-xs font-bold uppercase tracking-widest rounded-full whitespace-nowrap"
                      style={{
                        background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.95), rgba(0, 200, 220, 0.95))',
                        color: '#0a0a1a',
                        boxShadow: '0 0 20px rgba(0, 240, 255, 0.4), 0 0 40px rgba(0, 240, 255, 0.15)',
                        letterSpacing: '0.12em',
                      }}
                      data-testid="badge-most-popular"
                    >
                      <Zap className="w-3 h-3" />
                      Most Popular
                    </span>
                  </div>

                  <CardContent className="p-6 sm:p-8 flex flex-col h-full pt-8">
                    {/* Icon + Label */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                          Revenue Optimizer
                        </Badge>
                      </div>
                    </div>

                    {/* Plan Name + Price */}
                    <h3 className="text-2xl font-bold mb-1" data-testid="text-plan-name-growth">Growth</h3>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-4xl font-bold" data-testid="text-plan-price-growth">$249</span>
                      <span className="text-muted-foreground text-sm">/ month</span>
                    </div>

                    {/* Main Line */}
                    <p className="text-base text-foreground/90 font-medium mb-2">
                      Zyra starts optimizing how money flows.
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                      Cart recovery, upsells, and checkout optimization — with your approval.
                    </p>

                    {/* Credits */}
                    <div className="mb-6 py-2 px-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <span className="text-sm font-medium text-primary">10,000 credits / month</span>
                    </div>

                    {/* Key capabilities (concise) */}
                    <div className="space-y-3 mb-8 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>All Foundation actions</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>Checkout & cart recovery</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>Post-purchase upsells</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>Competitive Intelligence with approval</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>Auto-rollback on KPI drops</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <Button asChild className="w-full gradient-button border border-primary/50" data-testid="button-growth-cta">
                      <Link href="/auth">
                        Unlock Growth
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* ---- PRO: REVENUE PROTECTION SYSTEM ---- */}
              <div className="relative group" data-testid="pricing-card-pro">
                <div className="absolute -inset-[1px] bg-gradient-to-b from-amber-500/25 to-transparent rounded-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
                <Card className="relative h-full bg-[#12122a] border-amber-500/30 overflow-visible">
                  <CardContent className="p-6 sm:p-8 flex flex-col h-full">
                    {/* Icon + Label */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center">
                        <Lock className="w-6 h-6 text-amber-400" />
                      </div>
                      <div>
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-xs">
                          Revenue Protection
                        </Badge>
                      </div>
                    </div>

                    {/* Plan Name + Price */}
                    <h3 className="text-2xl font-bold mb-1" data-testid="text-plan-name-pro">Pro</h3>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-4xl font-bold" data-testid="text-plan-price-pro">$499</span>
                      <span className="text-muted-foreground text-sm">/ month</span>
                    </div>

                    {/* Main Line */}
                    <p className="text-base text-foreground/90 font-medium mb-2">
                      Zyra protects revenue even when you're not watching.
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                      Full autonomy with anomaly detection and automatic risk freeze.
                    </p>

                    {/* Credits */}
                    <div className="mb-6 py-2 px-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                      <span className="text-sm font-medium text-amber-300">20,000 credits / month</span>
                    </div>

                    {/* Key capabilities (concise) */}
                    <div className="space-y-3 mb-8 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span>All Foundation + Growth actions</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span>Risky optimization freeze</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span>Revenue anomaly detection</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span>Full Competitive Intelligence</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span>Auto-rollback on any anomaly</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <Button asChild variant="outline" className="w-full border-amber-500/40 text-amber-300 bg-amber-500/5" data-testid="button-pro-cta">
                      <Link href="/auth">Start Pro</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>

            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 4: CONTROL LEVEL CARDS
            ============================================================ */}
        <section id="comparison" className="py-16 px-4 sm:px-6 border-t border-primary/10">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3" data-testid="text-section-comparison">
                Compare Control Levels
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                See exactly what Zyra is allowed to fix, optimize, and protect
                at each level of control.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              {/* ── FREE CARD ── */}
              <Card className="glass-card border-emerald-500/20 hover-elevate transition-all duration-300" data-testid="control-card-free">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="mb-5">
                    <div className="w-11 h-11 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                      <Gift className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-emerald-300" data-testid="text-control-name-free">Free</h3>
                    <span className="text-xs text-emerald-400/70 tracking-wide uppercase font-medium">Free to Install</span>
                  </div>

                  <div className="border-t border-emerald-500/10 pt-4 mb-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground/60 mb-3 font-medium">Core Permissions</p>
                    <ul className="space-y-2.5">
                      <li className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">SEO & product copy optimization</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">Trust signal enhancement</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">Up to 3 products per action</span>
                      </li>
                    </ul>
                  </div>

                  <div className="border-t border-emerald-500/10 pt-4 mb-5 flex-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground/60 mb-3 font-medium">Limits</p>
                    <ul className="space-y-2.5">
                      <li className="text-sm text-muted-foreground/70">499 credits total — <span className="text-emerald-400/80">8-9 actions</span></li>
                      <li className="text-sm text-muted-foreground/70">Growth actions — <span className="text-muted-foreground/40">Not allowed</span></li>
                      <li className="text-sm text-muted-foreground/70">Guard & protection — <span className="text-muted-foreground/40">Not allowed</span></li>
                      <li className="text-sm text-muted-foreground/70">Competitive Intelligence — <span className="text-muted-foreground/40">Not available</span></li>
                    </ul>
                  </div>

                  <div className="border-t border-emerald-500/10 pt-4">
                    <p className="text-xs text-emerald-300/60 text-center font-medium tracking-wide" data-testid="text-control-summary-free">
                      See real results before you commit.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* ── STARTER CARD ── */}
              <Card className="glass-card border-blue-500/20 hover-elevate transition-all duration-300" data-testid="control-card-starter">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="mb-5">
                    <div className="w-11 h-11 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                      <Shield className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-blue-300" data-testid="text-control-name-starter">Starter</h3>
                    <span className="text-xs text-blue-400/70 tracking-wide uppercase font-medium">Conservative Control</span>
                  </div>

                  <div className="border-t border-blue-500/10 pt-4 mb-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground/60 mb-3 font-medium">Core Permissions</p>
                    <ul className="space-y-2.5">
                      <li className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">Detect revenue leaks</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">Run foundation actions</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">Limited Competitive Intelligence</span>
                      </li>
                    </ul>
                  </div>

                  <div className="border-t border-blue-500/10 pt-4 mb-5 flex-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground/60 mb-3 font-medium">Safety & Automation</p>
                    <ul className="space-y-2.5">
                      <li className="text-sm text-muted-foreground/70">Growth actions — <span className="text-muted-foreground/40">Not allowed</span></li>
                      <li className="text-sm text-muted-foreground/70">Guard & risk freeze — <span className="text-muted-foreground/40">Not allowed</span></li>
                      <li className="text-sm text-muted-foreground/70">Auto rollback — <span className="text-blue-400/80">Critical failures only</span></li>
                      <li className="text-sm text-muted-foreground/70">Store learning — <span className="text-blue-400/80">Read-only</span></li>
                    </ul>
                  </div>

                  <div className="border-t border-blue-500/10 pt-4">
                    <p className="text-xs text-blue-300/60 text-center font-medium tracking-wide" data-testid="text-control-summary-starter">
                      Safe fixes only. No aggressive automation.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* ── GROWTH CARD ── */}
              <Card className="glass-card border-primary/30 shadow-[0_0_25px_rgba(0,240,255,0.08)] hover-elevate transition-all duration-300 relative" data-testid="control-card-growth">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <span
                    className="no-default-hover-elevate no-default-active-elevate inline-flex items-center gap-1.5 px-5 py-1.5 text-xs font-bold uppercase tracking-widest rounded-full whitespace-nowrap"
                    style={{
                      background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.95), rgba(0, 200, 220, 0.95))',
                      color: '#0a0a1a',
                      boxShadow: '0 0 20px rgba(0, 240, 255, 0.4), 0 0 40px rgba(0, 240, 255, 0.15)',
                      letterSpacing: '0.12em',
                    }}
                    data-testid="badge-most-popular-control"
                  >
                    <Zap className="w-3 h-3" />
                    Most Popular
                  </span>
                </div>
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="mb-5">
                    <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-primary" data-testid="text-control-name-growth">Growth</h3>
                    <span className="text-xs text-primary/70 tracking-wide uppercase font-medium">Revenue Optimization</span>
                  </div>

                  <div className="border-t border-primary/15 pt-4 mb-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground/60 mb-3 font-medium">Core Permissions</p>
                    <ul className="space-y-2.5">
                      <li className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">Detect revenue leaks</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">Foundation + growth actions</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">Competitive Intelligence with approval</span>
                      </li>
                    </ul>
                  </div>

                  <div className="border-t border-primary/15 pt-4 mb-5 flex-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground/60 mb-3 font-medium">Safety & Automation</p>
                    <ul className="space-y-2.5">
                      <li className="text-sm text-muted-foreground/70">Guard & risk freeze — <span className="text-muted-foreground/40">Not enabled</span></li>
                      <li className="text-sm text-muted-foreground/70">Auto rollback — <span className="text-primary/80">On KPI drops</span></li>
                      <li className="text-sm text-muted-foreground/70">Store learning — <span className="text-primary/80">Enabled</span></li>
                    </ul>
                  </div>

                  <div className="border-t border-primary/15 pt-4">
                    <p className="text-xs text-primary/60 text-center font-medium tracking-wide" data-testid="text-control-summary-growth">
                      Optimizes revenue with human approval.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* ── PRO CARD ── */}
              <Card className="glass-card border-amber-500/25 shadow-[0_0_30px_rgba(245,158,11,0.07)] hover-elevate transition-all duration-300" data-testid="control-card-pro">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="mb-5">
                    <div className="w-11 h-11 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
                      <Lock className="w-5 h-5 text-amber-400" />
                    </div>
                    <h3 className="text-lg font-bold text-amber-300" data-testid="text-control-name-pro">Pro</h3>
                    <span className="text-xs text-amber-400/70 tracking-wide uppercase font-medium">Revenue Protection System</span>
                  </div>

                  <div className="border-t border-amber-500/10 pt-4 mb-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground/60 mb-3 font-medium">Core Permissions</p>
                    <ul className="space-y-2.5">
                      <li className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">All foundation + growth actions</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">Full Competitive Intelligence</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">Guard & risk freeze enabled</span>
                      </li>
                    </ul>
                  </div>

                  <div className="border-t border-amber-500/10 pt-4 mb-5 flex-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground/60 mb-3 font-medium">Safety & Automation</p>
                    <ul className="space-y-2.5">
                      <li className="text-sm text-muted-foreground/70">Auto rollback — <span className="text-amber-400/80">Any anomaly</span></li>
                      <li className="text-sm text-muted-foreground/70">Store learning — <span className="text-amber-400/80">Segment-level intelligence</span></li>
                      <li className="text-sm text-muted-foreground/70">Risk freeze — <span className="text-amber-400/80">Automatic</span></li>
                    </ul>
                  </div>

                  <div className="border-t border-amber-500/10 pt-4">
                    <p className="text-xs text-amber-300/60 text-center font-medium tracking-wide" data-testid="text-control-summary-pro">
                      Autonomous protection with intelligent safeguards.
                    </p>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 5: CREDITS EXPLANATION (CONCISE)
            ============================================================ */}
        <section className="py-16 px-4 sm:px-6">
          <div className="container mx-auto max-w-3xl">
            <Card className="glass-card border-primary/15">
              <CardContent className="p-8 sm:p-10">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Activity className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-3" data-testid="text-section-credits">What are credits?</h3>
                    <p className="text-muted-foreground mb-3">
                      Credits power Zyra's analysis and execution. Each detection loop, optimization,
                      or action consumes credits based on complexity.
                    </p>
                    <p className="text-muted-foreground">
                      Credits do <span className="text-foreground font-medium">not</span> unlock risky behavior —
                      that's controlled by your plan's permission level.
                      Unused credits never force actions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ============================================================
            SECTION 6: WHO SHOULD CHOOSE WHICH PLAN
            ============================================================ */}
        <section className="py-16 px-4 sm:px-6 border-t border-primary/10">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                Which plan fits your store?
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card className="glass-card border-blue-500/20" data-testid="fit-card-starter">
                <CardContent className="p-6">
                  <Shield className="w-8 h-8 text-blue-400 mb-4" />
                  <h3 className="font-bold mb-2 text-blue-300">Starter</h3>
                  <p className="text-sm text-muted-foreground">
                    Your product pages need work. Titles, descriptions, and SEO
                    are weak. You want safe, foundation-level fixes.
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card border-primary/25" data-testid="fit-card-growth">
                <CardContent className="p-6">
                  <TrendingUp className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-bold mb-2 text-primary">Growth</h3>
                  <p className="text-sm text-muted-foreground">
                    You have traffic and orders. You want to recover abandoned carts,
                    increase order value, and optimize checkout.
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card border-amber-500/20" data-testid="fit-card-pro">
                <CardContent className="p-6">
                  <Lock className="w-8 h-8 text-amber-400 mb-4" />
                  <h3 className="font-bold mb-2 text-amber-300">Pro</h3>
                  <p className="text-sm text-muted-foreground">
                    Mistakes cost real money. You need anomaly detection
                    and the ability to freeze risky changes automatically.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 7: TRUST & SAFETY
            ============================================================ */}
        <section className="py-16 px-4 sm:px-6">
          <div className="container mx-auto max-w-3xl">
            <Card className="glass-card border-primary/15">
              <CardContent className="p-8 text-center">
                <Shield className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-4" data-testid="text-trust-disclaimer">Important: What ZYRA can and cannot do</h3>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-trust-disclaimer-body">
                  ZYRA does not guarantee revenue growth. It improves efficiency, safety, and consistency 
                  in your store operations. Results depend on your traffic, product quality, and market fit. 
                  ZYRA is a tool that helps you optimize — not a magic solution.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ============================================================
            SECTION 8: FINAL CTA
            ============================================================ */}
        <section className="py-20 px-4 sm:px-6 border-t border-primary/10">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4" data-testid="text-section-final-cta">
              Choose how much control you give Zyra
            </h2>
            <p className="text-muted-foreground mb-8">
              Start with what feels right. Upgrade when you're ready for more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="outline" className="px-8 border-blue-500/40 text-blue-300" data-testid="button-final-starter">
                <Link href="/auth">
                  Start Safe
                </Link>
              </Button>
              <Button asChild size="lg" className="gradient-button px-8 border border-primary/50" data-testid="button-final-growth">
                <Link href="/auth">
                  Unlock Growth
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="px-8 border-amber-500/40 text-amber-300" data-testid="button-final-pro">
                <Link href="/auth">
                  Start Pro
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}