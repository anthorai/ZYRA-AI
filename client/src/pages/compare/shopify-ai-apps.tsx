import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, ArrowRight, Check, X, Star, Bot, Brain, Sparkles, 
  Shield, Rocket, ChevronDown, ExternalLink, Zap, TrendingUp
} from "lucide-react";
import { SeoHead, generateComparisonSchema, generateBreadcrumbSchema, generateFaqSchema } from "@/components/seo-head";
import { seoConfig } from "@/content/seo-config";
import { useState } from "react";

const aiCategories = [
  {
    name: "All-in-One AI Platforms",
    description: "Comprehensive AI solutions covering multiple aspects of store optimization including SEO, cart recovery, upsells, and analytics.",
    icon: Brain,
    apps: [
      {
        name: "Zyra AI",
        rating: 4.9,
        reviews: 2847,
        price: "From $49/mo",
        highlight: "Best Overall",
        features: ["AI SEO", "Cart Recovery", "Upsells", "A/B Testing", "Analytics"]
      }
    ]
  },
  {
    name: "AI Product Description Writers",
    description: "Tools focused on generating compelling product copy and marketing content using artificial intelligence.",
    icon: Sparkles,
    apps: [
      {
        name: "Zyra AI",
        rating: 4.9,
        reviews: 2847,
        price: "From $49/mo",
        highlight: "Most Comprehensive",
        features: ["GPT-4o Powered", "Brand Voice", "SEO Optimized", "Bulk Generation"]
      }
    ]
  },
  {
    name: "AI Recommendation Engines",
    description: "Personalization tools that use machine learning to suggest relevant products to customers.",
    icon: TrendingUp,
    apps: [
      {
        name: "Zyra AI",
        rating: 4.9,
        reviews: 2847,
        price: "From $49/mo",
        highlight: "AI-Powered",
        features: ["Smart Upsells", "Cross-sells", "Bundles", "Post-Purchase"]
      }
    ]
  }
];

const detailedComparison = [
  {
    name: "Zyra AI",
    slug: "zyra-ai",
    rating: 4.9,
    reviews: 2847,
    price: "From $49/mo",
    highlight: "Best Overall AI Platform",
    highlightColor: "bg-primary",
    description: "Zyra AI is the most comprehensive AI-powered platform for Shopify, combining GPT-4o for content generation, machine learning for optimization, and predictive analytics for growth.",
    aiCapabilities: [
      "GPT-4o powered content generation",
      "Machine learning optimization",
      "Predictive cart recovery",
      "AI-driven A/B testing",
      "Smart product recommendations",
      "Automated competitor analysis",
      "Brand voice learning",
      "Real-time SEO optimization"
    ],
    useCases: [
      "Product description generation",
      "SEO title and meta optimization",
      "Abandoned cart recovery",
      "Upsell and cross-sell automation",
      "Customer segmentation",
      "Performance analytics"
    ],
    pros: [
      "Most advanced AI (GPT-4o)",
      "All-in-one platform",
      "Learns your brand voice",
      "Continuous optimization"
    ],
    cons: [
      "Premium pricing",
      "Feature-rich (learning curve)"
    ],
    verdict: "The gold standard for AI-powered Shopify optimization. Combines multiple AI capabilities into one platform.",
    ctaText: "Start Free Trial",
    ctaLink: "/auth"
  }
];

const aiFaqs = [
  {
    question: "What is AI for Shopify stores?",
    answer: "AI for Shopify refers to artificial intelligence tools that automate and optimize store operations. This includes AI-generated product descriptions, smart product recommendations, automated cart recovery, and predictive analytics that help merchants grow sales without manual effort."
  },
  {
    question: "How does AI improve Shopify conversions?",
    answer: "AI improves conversions by optimizing product content for search and conversion, personalizing product recommendations, timing cart recovery messages perfectly, and continuously A/B testing variations to find what works best. AI tools like Zyra AI typically increase conversions by 20-50%."
  },
  {
    question: "Is AI worth the investment for small Shopify stores?",
    answer: "Yes, AI tools are often more valuable for small stores because they provide enterprise-level capabilities without hiring specialists. A $49/month AI tool can replace hours of manual work and typically pays for itself within the first month through increased sales."
  },
  {
    question: "Can AI really write good product descriptions?",
    answer: "Modern AI like GPT-4o (used by Zyra AI) writes product descriptions that often outperform human-written copy in conversion tests. The key is using AI that learns your brand voice and optimizes for both search engines and customer psychology."
  },
  {
    question: "What's the difference between basic automation and AI?",
    answer: "Basic automation follows fixed rules (e.g., 'send email 24 hours after cart abandonment'). AI learns from data and adapts—predicting optimal send times per customer, personalizing content, and continuously improving based on results."
  }
];

export default function ShopifyAiAppsComparison() {
  const [expandedCategory, setExpandedCategory] = useState<number | null>(0);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Compare", url: "/compare" },
    { name: "Shopify AI Apps", url: "/compare/shopify-ai-apps" }
  ];

  const comparisonSchema = generateComparisonSchema({
    headline: "Shopify AI Apps: Complete Guide 2025",
    description: "Discover the best AI apps for Shopify stores",
    items: [{ name: "Zyra AI", rating: 4.9, reviewCount: 2847 }]
  });

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
  const faqSchema = generateFaqSchema(aiFaqs);

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [comparisonSchema, breadcrumbSchema, faqSchema]
  };

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title={seoConfig.pages.compareAiApps.title}
        description={seoConfig.pages.compareAiApps.description}
        keywords={seoConfig.pages.compareAiApps.keywords}
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
              <Bot className="w-3 h-3 mr-1" />
              AI for Ecommerce
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent" data-testid="text-page-title">
              Shopify AI Apps: The Complete Guide to Artificial Intelligence for Ecommerce
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              AI is no longer a luxury—it's a necessity for competitive ecommerce. Discover which AI apps can help automate your store and boost revenue.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 mb-16">
            <Card className="text-center p-6">
              <div className="text-4xl font-bold text-primary mb-2">85%</div>
              <p className="text-sm text-muted-foreground">of top stores use AI tools</p>
            </Card>
            <Card className="text-center p-6">
              <div className="text-4xl font-bold text-primary mb-2">3X</div>
              <p className="text-sm text-muted-foreground">faster content creation</p>
            </Card>
            <Card className="text-center p-6">
              <div className="text-4xl font-bold text-primary mb-2">47%</div>
              <p className="text-sm text-muted-foreground">avg. conversion increase</p>
            </Card>
          </div>

          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              AI App Categories
            </h2>
            
            <div className="space-y-4">
              {aiCategories.map((category, index) => (
                <Card 
                  key={index}
                  className={`overflow-hidden transition-all duration-300 ${
                    expandedCategory === index ? 'ring-2 ring-primary/50' : ''
                  }`}
                  data-testid={`card-category-${index}`}
                >
                  <CardHeader 
                    className="cursor-pointer hover:bg-primary/5 transition-colors"
                    onClick={() => setExpandedCategory(expandedCategory === index ? null : index)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <category.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{category.name}</CardTitle>
                          <CardDescription>{category.description}</CardDescription>
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 transition-transform ${expandedCategory === index ? 'rotate-180' : ''}`} />
                    </div>
                  </CardHeader>
                  
                  {expandedCategory === index && (
                    <CardContent className="border-t border-primary/10 pt-6">
                      <div className="space-y-4">
                        {category.apps.map((app, appIndex) => (
                          <div key={appIndex} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">{app.name}</span>
                                <Badge className="bg-primary text-primary-foreground">{app.highlight}</Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                  {app.rating}
                                </span>
                                <span>{app.reviews.toLocaleString()} reviews</span>
                                <span>{app.price}</span>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {app.features.map((feature, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <Button asChild size="sm" className="gradient-button" data-testid={`button-app-${appIndex}`}>
                              <Link href="/auth">
                                Try Free
                              </Link>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>

          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              Top AI Platform: Zyra AI
            </h2>
            
            {detailedComparison.map((tool) => (
              <Card key={tool.slug} className="border-primary/30" data-testid={`card-detail-${tool.slug}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={`${tool.highlightColor} text-white`}>
                          {tool.highlight}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-semibold">{tool.rating}</span>
                          <span className="text-muted-foreground text-sm">({tool.reviews.toLocaleString()} reviews)</span>
                        </div>
                      </div>
                      <CardTitle className="text-2xl">{tool.name}</CardTitle>
                      <CardDescription className="mt-2">{tool.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{tool.price}</div>
                      <div className="text-sm text-muted-foreground">7-day free trial</div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="border-t border-primary/10 pt-6">
                  <div className="grid md:grid-cols-2 gap-8 mb-6">
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Brain className="w-4 h-4 text-primary" /> AI Capabilities
                      </h4>
                      <ul className="space-y-2">
                        {tool.aiCapabilities.map((cap, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{cap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" /> Use Cases
                      </h4>
                      <ul className="space-y-2">
                        {tool.useCases.map((useCase, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>{useCase}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-semibold text-green-500 mb-3 flex items-center gap-2">
                        <Check className="w-4 h-4" /> Pros
                      </h4>
                      <ul className="space-y-2">
                        {tool.pros.map((pro, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-orange-500 mb-3 flex items-center gap-2">
                        <X className="w-4 h-4" /> Considerations
                      </h4>
                      <ul className="space-y-2">
                        {tool.cons.map((con, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <X className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg mb-6">
                    <h4 className="font-semibold mb-2">Our Verdict</h4>
                    <p className="text-sm text-muted-foreground">{tool.verdict}</p>
                  </div>
                  
                  <Button asChild className="gradient-button" data-testid={`button-cta-${tool.slug}`}>
                    <Link href={tool.ctaLink}>
                      {tool.ctaText}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <section className="mt-16 p-8 bg-gradient-to-br from-primary/10 via-background to-accent/10 border border-primary/20 rounded-xl">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Store with AI?</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                The most successful Shopify stores use AI comprehensively. Zyra AI stands out as the only platform combining SEO, cart recovery, upsells, and analytics in one AI-powered solution.
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

          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {aiFaqs.map((faq, index) => (
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

          <section className="mt-16 text-center">
            <h2 className="text-2xl font-bold mb-4">Related Comparisons</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild variant="outline" data-testid="link-compare-seo">
                <Link href="/compare/shopify-seo-tools">
                  SEO Tools
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" data-testid="link-compare-cart">
                <Link href="/compare/cart-recovery-apps">
                  Cart Recovery Apps
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" data-testid="link-blog">
                <Link href="/blog">
                  AI Guides
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
