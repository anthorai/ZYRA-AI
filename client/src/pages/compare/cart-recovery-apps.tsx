import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, ArrowRight, Check, X, Star, ShoppingCart, Mail, MessageSquare,
  Shield, Rocket, ChevronDown, ExternalLink, Zap, TrendingUp, Clock, DollarSign
} from "lucide-react";
import { SeoHead, generateComparisonSchema, generateBreadcrumbSchema, generateFaqSchema } from "@/components/seo-head";
import { seoConfig } from "@/content/seo-config";
import { useState } from "react";

const abandonmentStats = [
  { value: "70%", label: "Average cart abandonment rate", icon: ShoppingCart },
  { value: "$4.6T", label: "Lost globally to cart abandonment", icon: DollarSign },
  { value: "35%", label: "Average recovery rate with AI", icon: TrendingUp },
  { value: "45min", label: "Optimal first recovery email timing", icon: Clock }
];

const recoveryApps = [
  {
    name: "Zyra AI",
    slug: "zyra-ai",
    rating: 4.9,
    reviews: 2847,
    price: "From $49/mo",
    recoveryRate: "35%",
    highlight: "Best Recovery Rate",
    highlightColor: "bg-primary",
    type: "AI-Powered",
    description: "Zyra AI uses machine learning to optimize every aspect of cart recovery—from timing to messaging to channel selection. The AI learns from each recovery attempt to continuously improve results.",
    channels: ["Email", "SMS", "Push Notifications", "Web Push"],
    features: [
      "AI timing optimization",
      "Personalized messaging",
      "Behavioral triggers",
      "Dynamic discounts",
      "Multi-channel sequences",
      "A/B testing automation",
      "Analytics dashboard",
      "Shopify integration"
    ],
    pros: [
      "Highest recovery rate (35%+)",
      "AI learns and improves",
      "Multi-channel approach",
      "Includes SEO + upsells",
      "One-click setup"
    ],
    cons: [
      "Premium pricing",
      "Advanced features take time to master"
    ],
    verdict: "Best overall cart recovery solution. The AI-powered approach delivers significantly higher recovery rates than rule-based alternatives.",
    ctaText: "Start Free Trial",
    ctaLink: "/auth"
  },
  {
    name: "Klaviyo",
    slug: "klaviyo",
    rating: 4.6,
    reviews: 2156,
    price: "From $45/mo",
    recoveryRate: "25%",
    highlight: "Email Marketing Leader",
    highlightColor: "bg-purple-500",
    type: "Email Marketing",
    description: "Klaviyo is a powerful email marketing platform with cart recovery as one of its features. Best for stores that want a comprehensive email marketing solution.",
    channels: ["Email", "SMS"],
    features: [
      "Email sequences",
      "Segmentation",
      "Templates library",
      "Analytics",
      "Shopify integration"
    ],
    pros: [
      "Powerful email marketing",
      "Good segmentation",
      "Large template library"
    ],
    cons: [
      "No AI optimization",
      "Complex setup",
      "Gets expensive at scale"
    ],
    verdict: "Great email marketing platform, but cart recovery is just one feature. Better for stores prioritizing email marketing overall.",
    ctaText: "View App",
    ctaLink: "#"
  },
  {
    name: "Omnisend",
    slug: "omnisend",
    rating: 4.5,
    reviews: 1893,
    price: "From $16/mo",
    recoveryRate: "22%",
    highlight: "Budget Option",
    highlightColor: "bg-green-500",
    type: "Multi-Channel",
    description: "Omnisend offers multi-channel marketing automation with cart recovery capabilities at an accessible price point.",
    channels: ["Email", "SMS", "Push"],
    features: [
      "Email + SMS",
      "Automation workflows",
      "Push notifications",
      "Basic analytics"
    ],
    pros: [
      "Affordable pricing",
      "Multi-channel",
      "Easy to use"
    ],
    cons: [
      "Lower recovery rates",
      "Limited AI features",
      "Basic personalization"
    ],
    verdict: "Good entry-level option for budget-conscious stores. Limited compared to AI-powered solutions.",
    ctaText: "View App",
    ctaLink: "#"
  },
  {
    name: "Privy",
    slug: "privy",
    rating: 4.4,
    reviews: 1567,
    price: "From $30/mo",
    recoveryRate: "20%",
    highlight: "Simple & Easy",
    highlightColor: "bg-blue-500",
    type: "Popups + Email",
    description: "Privy focuses on exit-intent popups and simple email recovery flows. Best for stores wanting basic cart recovery without complexity.",
    channels: ["Email", "Popups"],
    features: [
      "Exit-intent popups",
      "Email recovery",
      "Simple automation",
      "Basic templates"
    ],
    pros: [
      "Very easy to use",
      "Good popup builder",
      "Quick setup"
    ],
    cons: [
      "Basic recovery features",
      "No SMS",
      "Limited personalization"
    ],
    verdict: "Simplest option for stores just starting with cart recovery. Upgrade when you need more power.",
    ctaText: "View App",
    ctaLink: "#"
  }
];

const cartFaqs = [
  {
    question: "What is cart abandonment and why does it happen?",
    answer: "Cart abandonment occurs when shoppers add items to their cart but leave without completing the purchase. Common causes include unexpected shipping costs (48%), required account creation (24%), complex checkout (18%), concerns about security (17%), and comparison shopping (15%). AI-powered recovery can address many of these issues with personalized messaging."
  },
  {
    question: "What's a good cart recovery rate?",
    answer: "Average cart recovery rates are 5-15% with basic email only. Good recovery rates with optimized sequences are 15-25%. Excellent rates with AI-powered multi-channel recovery (like Zyra AI) reach 30-40%. The difference between 15% and 35% recovery can mean thousands in additional monthly revenue."
  },
  {
    question: "How quickly should I send a cart recovery email?",
    answer: "Research shows the optimal first email should be sent 45-60 minutes after abandonment while purchase intent is still high. AI tools like Zyra AI optimize this timing per customer based on their behavior patterns, often achieving better results than fixed timing rules."
  },
  {
    question: "Should I offer discounts in cart recovery emails?",
    answer: "Discounts can increase recovery rates but should be used strategically. AI-powered tools analyze each customer's behavior to determine if a discount is needed. Some customers will complete purchase without a discount—offering one to everyone reduces margins unnecessarily."
  },
  {
    question: "Is SMS effective for cart recovery?",
    answer: "Yes, SMS has significantly higher open rates (98%) than email (20%). Multi-channel recovery combining email + SMS typically sees 20-30% higher recovery rates than email alone. Zyra AI's AI determines the optimal channel and timing for each customer."
  },
  {
    question: "How do AI cart recovery apps work?",
    answer: "AI cart recovery apps like Zyra AI use machine learning to analyze customer behavior, predict optimal messaging timing, personalize content, and determine which channel to use. The AI continuously learns from results, improving recovery rates over time without manual optimization."
  }
];

const featureComparison = [
  { feature: "AI Timing Optimization", zyra: true, klaviyo: false, omnisend: false, privy: false },
  { feature: "Multi-Channel (Email+SMS+Push)", zyra: true, klaviyo: true, omnisend: true, privy: false },
  { feature: "Behavioral Triggers", zyra: true, klaviyo: true, omnisend: true, privy: false },
  { feature: "Dynamic Personalization", zyra: true, klaviyo: true, omnisend: false, privy: false },
  { feature: "A/B Testing Automation", zyra: true, klaviyo: false, omnisend: false, privy: false },
  { feature: "Predictive Analytics", zyra: true, klaviyo: false, omnisend: false, privy: false },
  { feature: "SEO Optimization Included", zyra: true, klaviyo: false, omnisend: false, privy: false },
  { feature: "Upsell Automation Included", zyra: true, klaviyo: false, omnisend: false, privy: false }
];

export default function CartRecoveryAppsComparison() {
  const [expandedApp, setExpandedApp] = useState<string | null>("zyra-ai");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Compare", url: "/compare" },
    { name: "Cart Recovery Apps", url: "/compare/cart-recovery-apps" }
  ];

  const comparisonSchema = generateComparisonSchema({
    headline: "Shopify Cart Recovery Apps Comparison 2025",
    description: "Compare the best abandoned cart recovery solutions for Shopify",
    items: recoveryApps.map(app => ({ name: app.name, rating: app.rating, reviewCount: app.reviews }))
  });

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
  const faqSchema = generateFaqSchema(cartFaqs);

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [comparisonSchema, breadcrumbSchema, faqSchema]
  };

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title={seoConfig.pages.compareCartRecovery.title}
        description={seoConfig.pages.compareCartRecovery.description}
        keywords={seoConfig.pages.compareCartRecovery.keywords}
        ogType="article"
        structuredData={combinedSchema}
      />

      <header className="border-b border-primary/10 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors group" data-testid="link-back-home">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Home</span>
            </Link>
            <Button asChild className="gradient-button shadow-lg shadow-primary/20" data-testid="button-start-trial">
              <Link href="/auth">
                Start Free Trial
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <nav className="border-b border-primary/5 bg-background/50" aria-label="Breadcrumb">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.url} className="flex items-center gap-2">
                {index > 0 && <span>/</span>}
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-foreground font-medium">{crumb.name}</span>
                ) : (
                  <Link href={crumb.url} className="hover:text-primary transition-colors">
                    {crumb.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </div>
      </nav>

      <section className="py-16 px-4 sm:px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
              <ShoppingCart className="w-3 h-3 mr-1" />
              Cart Recovery Guide 2025
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent" data-testid="text-page-title">
              Shopify Abandoned Cart Solutions: Compare Recovery Apps & Strategies
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              With average cart abandonment rates of 70%, recovery solutions are essential for any serious ecommerce business. Compare the top options.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {abandonmentStats.map((stat, index) => (
              <Card key={index} className="text-center p-6">
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </Card>
            ))}
          </div>

          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              Feature Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-primary/20">
                    <th className="text-left py-4 px-4 font-semibold">Feature</th>
                    <th className="text-center py-4 px-4 font-semibold">
                      Zyra AI
                      <Badge className="ml-2 bg-primary text-primary-foreground">Best</Badge>
                    </th>
                    <th className="text-center py-4 px-4 font-semibold">Klaviyo</th>
                    <th className="text-center py-4 px-4 font-semibold">Omnisend</th>
                    <th className="text-center py-4 px-4 font-semibold">Privy</th>
                  </tr>
                </thead>
                <tbody>
                  {featureComparison.map((row, index) => (
                    <tr key={index} className="border-b border-primary/10 hover:bg-primary/5 transition-colors">
                      <td className="py-3 px-4 text-sm">{row.feature}</td>
                      <td className="text-center py-3 px-4">
                        {row.zyra ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />}
                      </td>
                      <td className="text-center py-3 px-4">
                        {row.klaviyo ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />}
                      </td>
                      <td className="text-center py-3 px-4">
                        {row.omnisend ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />}
                      </td>
                      <td className="text-center py-3 px-4">
                        {row.privy ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-b border-primary/10 bg-muted/30">
                    <td className="py-3 px-4 text-sm font-semibold">Recovery Rate</td>
                    <td className="text-center py-3 px-4 font-bold text-green-500">35%</td>
                    <td className="text-center py-3 px-4">25%</td>
                    <td className="text-center py-3 px-4">22%</td>
                    <td className="text-center py-3 px-4">20%</td>
                  </tr>
                  <tr className="border-b border-primary/10">
                    <td className="py-3 px-4 text-sm font-semibold">Price</td>
                    <td className="text-center py-3 px-4 text-sm">From $49/mo</td>
                    <td className="text-center py-3 px-4 text-sm">From $45/mo</td>
                    <td className="text-center py-3 px-4 text-sm">From $16/mo</td>
                    <td className="text-center py-3 px-4 text-sm">From $30/mo</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6 mb-16">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="w-6 h-6 text-primary" />
              Detailed Reviews
            </h2>
            
            {recoveryApps.map((app, index) => (
              <Card 
                key={app.slug} 
                className={`overflow-hidden transition-all duration-300 ${
                  expandedApp === app.slug ? 'ring-2 ring-primary/50' : ''
                } ${index === 0 ? 'border-primary/30' : ''}`}
                data-testid={`card-app-${app.slug}`}
              >
                <CardHeader 
                  className="cursor-pointer hover:bg-primary/5 transition-colors"
                  onClick={() => setExpandedApp(expandedApp === app.slug ? null : app.slug)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <Badge className={`${app.highlightColor} text-white`}>
                          {app.highlight}
                        </Badge>
                        <Badge variant="outline">{app.type}</Badge>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-semibold">{app.rating}</span>
                          <span className="text-muted-foreground text-sm">({app.reviews.toLocaleString()})</span>
                        </div>
                      </div>
                      <CardTitle className="text-2xl">{app.name}</CardTitle>
                      <CardDescription className="mt-2">{app.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{app.price}</div>
                      <div className="text-sm font-semibold text-green-500">{app.recoveryRate} recovery</div>
                      <ChevronDown className={`w-5 h-5 mt-2 transition-transform ${expandedApp === app.slug ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </CardHeader>
                
                {expandedApp === app.slug && (
                  <CardContent className="border-t border-primary/10 pt-6">
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary" /> Channels
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {app.channels.map((channel, i) => (
                          <Badge key={i} variant="secondary">{channel}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3">Features</h4>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {app.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="font-semibold text-green-500 mb-3 flex items-center gap-2">
                          <Check className="w-4 h-4" /> Pros
                        </h4>
                        <ul className="space-y-2">
                          {app.pros.map((pro, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-red-500 mb-3 flex items-center gap-2">
                          <X className="w-4 h-4" /> Cons
                        </h4>
                        <ul className="space-y-2">
                          {app.cons.map((con, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <span>{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted/30 rounded-lg mb-6">
                      <h4 className="font-semibold mb-2">Our Verdict</h4>
                      <p className="text-sm text-muted-foreground">{app.verdict}</p>
                    </div>
                    
                    <Button 
                      asChild 
                      className={index === 0 ? "gradient-button w-full sm:w-auto" : "w-full sm:w-auto"}
                      variant={index === 0 ? "default" : "outline"}
                      data-testid={`button-cta-${app.slug}`}
                    >
                      <Link href={app.ctaLink}>
                        {app.ctaText}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          <section className="p-8 bg-gradient-to-br from-primary/10 via-background to-accent/10 border border-primary/20 rounded-xl mb-16">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Our Recommendation</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                AI-powered solutions like Zyra AI deliver significantly higher recovery rates by optimizing timing and personalization automatically. For maximum cart recovery, choose a solution that combines multiple channels with intelligent automation.
              </p>
              <Button asChild size="lg" className="gradient-button" data-testid="button-recommendation-cta">
                <Link href="/auth">
                  <Rocket className="w-5 h-5 mr-2" />
                  Try Zyra AI Free for 7 Days
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground mt-3">No credit card required</p>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {cartFaqs.map((faq, index) => (
                <div 
                  key={index}
                  className="border border-primary/10 rounded-lg overflow-hidden"
                  data-testid={`faq-item-${index}`}
                >
                  <button
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-primary/5 transition-colors"
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    data-testid={`button-faq-${index}`}
                  >
                    <h3 className="font-semibold pr-4">{faq.question}</h3>
                    <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform ${expandedFaq === index ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedFaq === index && (
                    <div className="px-4 pb-4 text-muted-foreground">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="text-center">
            <h2 className="text-2xl font-bold mb-4">Related Comparisons</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild variant="outline" data-testid="link-compare-seo">
                <Link href="/compare/shopify-seo-tools">
                  SEO Tools
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" data-testid="link-compare-ai">
                <Link href="/compare/shopify-ai-apps">
                  AI Apps
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" data-testid="link-blog">
                <Link href="/blog">
                  Recovery Guides
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </section>

      <footer className="border-t border-primary/10 py-10 px-4 sm:px-6">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© 2025 Zyra AI. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
