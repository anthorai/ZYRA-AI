import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, Check, X, Gift, Zap, Award, Crown,
  Shield, Layers, Rocket, HelpCircle
} from "lucide-react";
import { SiShopify } from "react-icons/si";
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

  const plans = [
    {
      name: "Free to Install",
      price: "$0",
      period: "7 days",
      icon: <Gift className="w-7 h-7" />,
      badge: "Explore ZYRA",
      badgeColor: "bg-slate-500/20 text-slate-300 border-slate-500/30",
      description: "For merchants who want to see how ZYRA thinks before enabling automation.",
      credits: "499 credits / 7 days",
      features: [
        { text: "Live store detection", included: true },
        { text: "Revenue leak insights (read-only)", included: true },
        { text: "Store situation analysis", included: true },
        { text: "Action previews (no execution)", included: true },
      ],
      notIncluded: [
        "No automatic changes",
        "No optimization",
        "No revenue impact",
      ],
      cta: "Install & Preview",
      ctaVariant: "outline" as const,
      popular: false,
    },
    {
      name: "Starter",
      price: "$49",
      period: "per month",
      icon: <Zap className="w-7 h-7" />,
      badge: "Foundation",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      description: "For new or early-stage stores that want safe, low-risk optimization.",
      credits: "2,000 credits / month",
      features: [
        { text: "Product title optimization", included: true, category: "foundation" },
        { text: "Product description clarity", included: true, category: "foundation" },
        { text: "Trust signal enhancement", included: true, category: "foundation" },
        { text: "Friction copy removal", included: true, category: "foundation" },
        { text: "Above-the-fold optimization", included: true, category: "foundation" },
        { text: "Meta & image SEO hygiene", included: true, category: "foundation" },
        { text: "Performance baselines", included: true, category: "intelligence" },
        { text: "Read-only learning", included: true, category: "intelligence" },
        { text: "Manual rollback", included: true, category: "safety" },
        { text: "Auto-rollback on critical failures", included: true, category: "safety" },
      ],
      notIncluded: [
        "No cart recovery",
        "No checkout optimization",
        "No upsells",
        "No risk freeze",
      ],
      cta: "Start Starter Plan",
      ctaVariant: "outline" as const,
      popular: false,
    },
    {
      name: "Growth",
      price: "$249",
      period: "per month",
      icon: <Award className="w-7 h-7" />,
      badge: "Most Popular",
      badgeColor: "bg-primary/20 text-primary border-primary/30",
      description: "For stores with traffic and orders that want more revenue without more ads.",
      credits: "10,000 credits / month",
      features: [
        { text: "All Foundation Actions", included: true, category: "foundation" },
        { text: "Checkout drop-off mitigation", included: true, category: "growth" },
        { text: "Abandoned cart recovery", included: true, category: "growth" },
        { text: "Post-purchase upsells", included: true, category: "growth" },
        { text: "Store-specific learning", included: true, category: "intelligence" },
        { text: "Action effectiveness tracking", included: true, category: "intelligence" },
        { text: "Auto-rollback on KPI drops", included: true, category: "safety" },
      ],
      notIncluded: [],
      cta: "Upgrade to Growth",
      ctaVariant: "default" as const,
      popular: true,
    },
    {
      name: "Pro",
      price: "$499",
      period: "per month",
      icon: <Crown className="w-7 h-7" />,
      badge: "Enterprise-grade control",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      description: "For serious brands where revenue protection matters as much as growth.",
      credits: "20,000 credits / month",
      features: [
        { text: "All Foundation Actions", included: true, category: "foundation" },
        { text: "All Growth Actions", included: true, category: "growth" },
        { text: "Risky optimization freeze", included: true, category: "guard" },
        { text: "Revenue anomaly detection", included: true, category: "guard" },
        { text: "Segment-level learning", included: true, category: "intelligence" },
        { text: "Automatic rollback on any KPI anomaly", included: true, category: "safety" },
      ],
      notIncluded: [],
      cta: "Start Pro",
      ctaVariant: "outline" as const,
      popular: false,
    },
  ];

  const comparisonFeatures = [
    { name: "Detect revenue leaks", free: true, starter: true, growth: true, pro: true },
    { name: "Foundation actions", free: false, starter: true, growth: true, pro: true },
    { name: "Growth actions", free: false, starter: false, growth: true, pro: true },
    { name: "Guard & risk freeze", free: false, starter: false, growth: false, pro: true },
    { name: "Auto rollback", free: false, starter: "Critical only", growth: "On KPI drops", pro: "Any anomaly" },
    { name: "Live activity log", free: true, starter: true, growth: true, pro: true },
    { name: "Store-specific learning", free: false, starter: "Read-only", growth: true, pro: "Segment-level" },
  ];

  return (
    <div className="min-h-screen bg-[#0000001f]">
      <Helmet>
        <title>Pricing - ZYRA AI | Simple, Permission-Based Pricing</title>
        <meta name="description" content="ZYRA pricing is based on how much control you give ZYRA. No revenue guarantees, no risky automation by default. Upgrade or downgrade anytime." />
        <meta property="og:title" content="Pricing - ZYRA AI" />
        <meta property="og:description" content="Simple pricing based on automation level. From free exploration to enterprise-grade revenue protection." />
      </Helmet>
      
      <ResponsiveNavbar
        navItems={[
          { label: "Home", href: "/" },
          { label: "Pricing", href: "/pricing" },
          { label: "FAQ", href: "/#faq", external: true },
          ...(loading ? [{ label: "Log in", href: "/auth" }] : 
              isAuthenticated ? [{ label: isLoggingOut ? "Logging out..." : "Logout", onClick: handleLogout, disabled: isLoggingOut }] : 
              [{ label: "Log in", href: "/auth" }])
        ]}
        actionButton={{ label: "Start Free", href: "/auth" }}
      />

      <main className="pt-20">
        {/* SECTION 1: HERO */}
        <section className="py-16 sm:py-24 px-4 sm:px-6">
          <div className="container mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <SiShopify className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Transparent pricing for Shopify stores</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Simple pricing, based on how much
              <span className="block text-primary mt-2">control you give ZYRA</span>
            </h1>

            <p className="text-lg text-muted-foreground mb-4 max-w-3xl mx-auto">
              ZYRA pricing is not based on store size or hype features.
              Each plan unlocks a specific level of automation, safety, and intelligence.
            </p>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground mb-10">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>No revenue guarantees</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>No risky automation by default</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>Upgrade or downgrade anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>One action per loop, always safe</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gradient-button px-8" data-testid="button-view-plans">
                <a href="#plans">
                  View Plans
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-8" data-testid="button-compare-plans">
                <a href="#comparison">
                  Compare Plans
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* SECTION 2: HOW PRICING WORKS */}
        <section className="py-16 px-4 sm:px-6 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                How ZYRA pricing actually works
              </h2>
            </div>

            <div className="space-y-6 text-muted-foreground mb-12 max-w-2xl mx-auto">
              <p>
                ZYRA pricing is <span className="text-foreground font-medium">permission-based</span>, not usage-based.
                Plans control what ZYRA is allowed to do inside your store.
              </p>
              <p>
                Higher plans unlock growth actions and revenue protection.
                Lower plans keep everything conservative and safe.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              <Card className="bg-[#16162c] border-blue-500/20">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <Layers className="w-7 h-7 text-blue-400" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Foundation</h3>
                  <p className="text-sm text-muted-foreground">Trust & clarity</p>
                </CardContent>
              </Card>

              <Card className="bg-[#16162c] border-green-500/20">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 bg-green-500/10 rounded-xl flex items-center justify-center">
                    <Rocket className="w-7 h-7 text-green-400" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Growth</h3>
                  <p className="text-sm text-muted-foreground">Revenue optimization</p>
                </CardContent>
              </Card>

              <Card className="bg-[#16162c] border-amber-500/20">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 bg-amber-500/10 rounded-xl flex items-center justify-center">
                    <Shield className="w-7 h-7 text-amber-400" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Guard</h3>
                  <p className="text-sm text-muted-foreground">Risk protection</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* SECTION 3: PRICING CARDS */}
        <section id="plans" className="py-16 px-4 sm:px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Choose your plan
              </h2>
              <p className="text-muted-foreground">
                All plans include full Shopify integration and one-click rollback protection.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => (
                <Card 
                  key={plan.name}
                  className={`bg-[#16162c] relative ${plan.popular ? 'border-primary ring-2 ring-primary/20' : 'border-border/50'}`}
                  data-testid={`pricing-card-${plan.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1">
                        Recommended
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-4 pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${plan.popular ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {plan.icon}
                      </div>
                      <Badge variant="outline" className={plan.badgeColor}>
                        {plan.badge}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">/ {plan.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      {plan.description}
                    </p>
                    <div className="mt-3 text-sm">
                      <span className="font-medium text-primary">{plan.credits}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-foreground/90">{feature.text}</span>
                        </div>
                      ))}
                    </div>
                    
                    {plan.notIncluded.length > 0 && (
                      <div className="border-t border-border/30 pt-4 mb-6 space-y-2">
                        {plan.notIncluded.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <X className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{item}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button 
                      asChild 
                      variant={plan.ctaVariant}
                      className={`w-full ${plan.popular ? 'gradient-button' : 'border-primary/50 text-primary bg-primary/10'}`}
                      data-testid={`button-${plan.name.toLowerCase().replace(/\s+/g, '-')}-cta`}
                    >
                      <Link href="/auth">
                        {plan.cta}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: FEATURE COMPARISON TABLE */}
        <section id="comparison" className="py-16 px-4 sm:px-6 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Feature comparison
              </h2>
              <p className="text-muted-foreground">
                A clear breakdown of what each plan includes.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse" data-testid="comparison-table">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-4 px-4 font-medium">Feature</th>
                    <th className="text-center py-4 px-4 font-medium">Free</th>
                    <th className="text-center py-4 px-4 font-medium">Starter</th>
                    <th className="text-center py-4 px-4 font-medium bg-primary/5 border-x border-primary/20">Growth</th>
                    <th className="text-center py-4 px-4 font-medium">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, idx) => (
                    <tr key={idx} className="border-b border-border/30">
                      <td className="py-4 px-4 text-sm">{feature.name}</td>
                      <td className="text-center py-4 px-4">
                        {typeof feature.free === 'boolean' ? (
                          feature.free ? <Check className="w-5 h-5 text-primary mx-auto" /> : <X className="w-5 h-5 text-muted-foreground mx-auto" />
                        ) : (
                          <span className="text-xs text-muted-foreground">{feature.free}</span>
                        )}
                      </td>
                      <td className="text-center py-4 px-4">
                        {typeof feature.starter === 'boolean' ? (
                          feature.starter ? <Check className="w-5 h-5 text-primary mx-auto" /> : <X className="w-5 h-5 text-muted-foreground mx-auto" />
                        ) : (
                          <span className="text-xs text-muted-foreground">{feature.starter}</span>
                        )}
                      </td>
                      <td className="text-center py-4 px-4 bg-primary/5 border-x border-primary/20">
                        {typeof feature.growth === 'boolean' ? (
                          feature.growth ? <Check className="w-5 h-5 text-primary mx-auto" /> : <X className="w-5 h-5 text-muted-foreground mx-auto" />
                        ) : (
                          <span className="text-xs text-primary">{feature.growth}</span>
                        )}
                      </td>
                      <td className="text-center py-4 px-4">
                        {typeof feature.pro === 'boolean' ? (
                          feature.pro ? <Check className="w-5 h-5 text-primary mx-auto" /> : <X className="w-5 h-5 text-muted-foreground mx-auto" />
                        ) : (
                          <span className="text-xs text-primary">{feature.pro}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 5: CREDIT SYSTEM EXPLANATION */}
        <section className="py-16 px-4 sm:px-6">
          <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-8">
              <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-xl flex items-center justify-center">
                <HelpCircle className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                What are credits?
              </h2>
            </div>

            <div className="space-y-4 text-muted-foreground">
              <p>
                Credits power ZYRA's analysis and execution. Each time ZYRA runs a detection loop, 
                generates an optimization, or executes an action, it consumes credits based on the complexity.
              </p>
              <p>
                Higher plans include more credits to run more loops and actions per month. 
                However, <span className="text-foreground font-medium">credits do NOT unlock risky behavior</span> — 
                that's controlled by your plan's permission level, not credit count.
              </p>
              <p>
                Unused credits do not force actions. ZYRA only acts when there's a genuine revenue opportunity, 
                and you always maintain control over what gets executed.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 6: WHO SHOULD CHOOSE WHICH PLAN */}
        <section className="py-16 px-4 sm:px-6 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Which plan is right for you?
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <Card className="bg-[#16162c] border-slate-500/20">
                <CardContent className="p-6">
                  <Gift className="w-8 h-8 text-slate-400 mb-4" />
                  <h3 className="font-bold mb-2">Choose Free if...</h3>
                  <p className="text-sm text-muted-foreground">
                    You want to explore how ZYRA thinks before committing. See what opportunities 
                    exist in your store without making any changes.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[#16162c] border-blue-500/20">
                <CardContent className="p-6">
                  <Zap className="w-8 h-8 text-blue-400 mb-4" />
                  <h3 className="font-bold mb-2">Choose Starter if...</h3>
                  <p className="text-sm text-muted-foreground">
                    Your store fundamentals are weak. Product titles, descriptions, and SEO 
                    need work. You want safe, foundation-level improvements.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[#16162c] border-primary/30">
                <CardContent className="p-6">
                  <Award className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-bold mb-2">Choose Growth if...</h3>
                  <p className="text-sm text-muted-foreground">
                    You already run ads or have consistent orders. You want to recover 
                    abandoned carts, increase order value, and optimize checkout.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[#16162c] border-amber-500/20">
                <CardContent className="p-6">
                  <Crown className="w-8 h-8 text-amber-400 mb-4" />
                  <h3 className="font-bold mb-2">Choose Pro if...</h3>
                  <p className="text-sm text-muted-foreground">
                    Mistakes cost real money. You need revenue protection, anomaly detection, 
                    and the ability to freeze risky optimizations automatically.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* SECTION 7: TRUST & SAFETY DISCLAIMER */}
        <section className="py-16 px-4 sm:px-6">
          <div className="container mx-auto max-w-3xl">
            <Card className="bg-[#16162c] border-border/50">
              <CardContent className="p-8 text-center">
                <Shield className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-4">Important: What ZYRA can and cannot do</h3>
                <p className="text-muted-foreground leading-relaxed">
                  ZYRA does not guarantee revenue growth. It improves efficiency, safety, and consistency 
                  in your store operations. Results depend on your traffic, product quality, and market fit. 
                  ZYRA is a tool that helps you optimize — not a magic solution.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SECTION 8: FINAL CTA */}
        <section className="py-20 px-4 sm:px-6 bg-muted/30">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">
              Choose how much control you want to give ZYRA
            </h2>
            <p className="text-muted-foreground mb-8">
              Start with what feels right. Upgrade when you're ready for more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="outline" className="px-8" data-testid="button-final-starter">
                <Link href="/auth">
                  Start with Starter
                </Link>
              </Button>
              <Button asChild size="lg" className="gradient-button px-8" data-testid="button-final-growth">
                <Link href="/auth">
                  Upgrade to Growth
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="px-8" data-testid="button-final-sales">
                <Link href="/contact">
                  Talk to Sales
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
