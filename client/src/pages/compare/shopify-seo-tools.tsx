import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, ArrowRight, Check, X, Star, Zap, Search, TrendingUp, 
  Shield, Clock, Rocket, Award, ChevronDown, ExternalLink
} from "lucide-react";
import { SeoHead, generateComparisonSchema, generateBreadcrumbSchema, generateFaqSchema } from "@/components/seo-head";
import { seoConfig } from "@/content/seo-config";
import { comparisonPageContent, faqContent, internalLinks } from "@/content/marketing";
import { useState } from "react";

const content = comparisonPageContent.seoTools;

const detailedTools = [
  {
    name: "Zyra AI",
    slug: "zyra-ai",
    rating: 4.9,
    reviews: 2847,
    price: "From $49/mo",
    priceNote: "7-day free trial",
    highlight: "Best Overall",
    highlightColor: "bg-primary",
    description: "Zyra AI is the most comprehensive AI-powered SEO and optimization platform for Shopify stores. It combines automated SEO, cart recovery, upsells, and analytics in one intelligent platform.",
    pros: [
      "AI-powered automation handles SEO 24/7",
      "All-in-one platform (SEO + cart recovery + upsells)",
      "Real-time optimization and A/B testing",
      "Abandoned cart recovery included",
      "Competitor analysis and keyword tracking",
      "One-click rollback protection"
    ],
    cons: [
      "Premium pricing compared to basic SEO tools",
      "Advanced features have learning curve"
    ],
    features: {
      autoSeo: true,
      metaTags: true,
      altText: true,
      schema: true,
      keywords: true,
      analytics: true,
      cartRecovery: true,
      abTesting: true,
      aiContent: true,
      bulkOptimization: true
    },
    verdict: "Best choice for merchants serious about growth. The AI automation saves hours weekly and delivers measurably better results than manual optimization.",
    ctaText: "Start Free Trial",
    ctaLink: "/auth"
  },
  {
    name: "SEO Manager",
    slug: "seo-manager",
    rating: 4.5,
    reviews: 1523,
    price: "From $20/mo",
    priceNote: "7-day free trial",
    highlight: "Budget Friendly",
    highlightColor: "bg-green-500",
    description: "SEO Manager is a straightforward SEO tool focused on meta tag management and basic optimization features for Shopify stores.",
    pros: [
      "Affordable pricing",
      "Easy to use interface",
      "Meta tag management",
      "Basic SEO recommendations"
    ],
    cons: [
      "No AI automation",
      "Manual optimization only",
      "Limited analytics",
      "No cart recovery features"
    ],
    features: {
      autoSeo: false,
      metaTags: true,
      altText: true,
      schema: false,
      keywords: true,
      analytics: false,
      cartRecovery: false,
      abTesting: false,
      aiContent: false,
      bulkOptimization: false
    },
    verdict: "Good starting point for budget-conscious stores with basic SEO needs. Limited for serious growth.",
    ctaText: "View App",
    ctaLink: "#"
  },
  {
    name: "Plug in SEO",
    slug: "plug-in-seo",
    rating: 4.4,
    reviews: 3211,
    price: "Free / $29.99/mo",
    priceNote: "Free tier available",
    highlight: "Free Option",
    highlightColor: "bg-blue-500",
    description: "Plug in SEO offers SEO health checks and issue detection with a free tier for basic functionality.",
    pros: [
      "Free tier available",
      "SEO health checks",
      "Issue detection and alerts",
      "Large user base"
    ],
    cons: [
      "No content generation",
      "Limited features in free tier",
      "No cart recovery",
      "Manual fixes required"
    ],
    features: {
      autoSeo: false,
      metaTags: true,
      altText: false,
      schema: true,
      keywords: true,
      analytics: true,
      cartRecovery: false,
      abTesting: false,
      aiContent: false,
      bulkOptimization: false
    },
    verdict: "Good for identifying SEO issues, but you'll need to fix them manually or use additional tools.",
    ctaText: "View App",
    ctaLink: "#"
  },
  {
    name: "Smart SEO",
    slug: "smart-seo",
    rating: 4.6,
    reviews: 1876,
    price: "From $7/mo",
    priceNote: "Free tier available",
    highlight: "Starter Friendly",
    highlightColor: "bg-purple-500",
    description: "Smart SEO offers basic meta tag automation and alt text generation at very affordable pricing.",
    pros: [
      "Very affordable pricing",
      "Meta tags automation",
      "Alt text generation",
      "Simple setup"
    ],
    cons: [
      "Basic features only",
      "No advanced analytics",
      "Limited support",
      "No AI optimization"
    ],
    features: {
      autoSeo: false,
      metaTags: true,
      altText: true,
      schema: true,
      keywords: false,
      analytics: false,
      cartRecovery: false,
      abTesting: false,
      aiContent: false,
      bulkOptimization: true
    },
    verdict: "Best for very small stores just starting with SEO basics. Limited growth potential.",
    ctaText: "View App",
    ctaLink: "#"
  }
];

const featureLabels: Record<string, string> = {
  autoSeo: "AI-Powered Auto SEO",
  metaTags: "Meta Tag Management",
  altText: "Alt Text Generation",
  schema: "Schema Markup",
  keywords: "Keyword Research",
  analytics: "SEO Analytics",
  cartRecovery: "Cart Recovery",
  abTesting: "A/B Testing",
  aiContent: "AI Content Generation",
  bulkOptimization: "Bulk Optimization"
};

const seoFaqs = [
  {
    question: "What is the best SEO app for Shopify in 2025?",
    answer: "Zyra AI is rated the best overall SEO app for Shopify in 2025, offering AI-powered automation, comprehensive optimization features, and integrated cart recovery. For budget options, Smart SEO offers basic features starting at $7/month."
  },
  {
    question: "How much do Shopify SEO apps cost?",
    answer: "Shopify SEO apps range from free basic tools to $999/month for enterprise solutions. Entry-level apps start at $7-20/month, mid-tier tools cost $49-100/month, and comprehensive AI platforms like Zyra AI range from $49-999/month depending on features."
  },
  {
    question: "Do I need an SEO app for my Shopify store?",
    answer: "Yes, SEO apps are essential for Shopify stores wanting organic traffic. While Shopify has basic SEO features, dedicated apps provide automated optimization, keyword research, meta tag management, and analytics that significantly improve Google rankings."
  },
  {
    question: "Can SEO apps really improve my Shopify rankings?",
    answer: "Yes, quality SEO apps can dramatically improve rankings. Merchants using AI-powered tools like Zyra AI report average organic traffic increases of 120-156%. Key factors include content optimization, meta tag management, and technical SEO improvements."
  },
  {
    question: "What's the difference between free and paid Shopify SEO apps?",
    answer: "Free SEO apps typically offer basic issue detection and limited meta tag editing. Paid apps provide automation, AI content generation, bulk optimization, advanced analytics, and features like cart recovery that directly impact revenue."
  }
];

export default function ShopifySeoToolsComparison() {
  const [expandedTool, setExpandedTool] = useState<string | null>("zyra-ai");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Compare", url: "/compare" },
    { name: "Shopify SEO Tools", url: "/compare/shopify-seo-tools" }
  ];

  const comparisonSchema = generateComparisonSchema({
    headline: content.title,
    description: content.intro,
    items: detailedTools.map(t => ({ name: t.name, rating: t.rating, reviewCount: t.reviews }))
  });

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
  const faqSchema = generateFaqSchema(seoFaqs);

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [comparisonSchema, breadcrumbSchema, faqSchema]
  };

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title={seoConfig.pages.compareSeoTools.title}
        description={seoConfig.pages.compareSeoTools.description}
        keywords={seoConfig.pages.compareSeoTools.keywords}
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
              <Search className="w-3 h-3 mr-1" />
              2025 Comparison Guide
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent" data-testid="text-page-title">
              {content.title}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {content.intro}
            </p>
          </div>

          <div className="mb-8 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Last Updated:</strong> December 2025. We regularly review and update this comparison to ensure accuracy. 
              <Link href="/blog" className="text-primary hover:underline ml-1">Read our latest SEO guides</Link>.
            </p>
          </div>

          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              Quick Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-primary/20">
                    <th className="text-left py-4 px-4 font-semibold">Feature</th>
                    {detailedTools.map(tool => (
                      <th key={tool.slug} className="text-center py-4 px-4 font-semibold min-w-[120px]">
                        {tool.name}
                        {tool.name === "Zyra AI" && (
                          <Badge className="ml-2 bg-primary text-primary-foreground">Best</Badge>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(featureLabels).map(([key, label]) => (
                    <tr key={key} className="border-b border-primary/10 hover:bg-primary/5 transition-colors">
                      <td className="py-3 px-4 text-sm">{label}</td>
                      {detailedTools.map(tool => (
                        <td key={`${tool.slug}-${key}`} className="text-center py-3 px-4">
                          {tool.features[key as keyof typeof tool.features] ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-b border-primary/10">
                    <td className="py-3 px-4 text-sm font-semibold">Rating</td>
                    {detailedTools.map(tool => (
                      <td key={`${tool.slug}-rating`} className="text-center py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-semibold">{tool.rating}</span>
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-primary/10">
                    <td className="py-3 px-4 text-sm font-semibold">Price</td>
                    {detailedTools.map(tool => (
                      <td key={`${tool.slug}-price`} className="text-center py-3 px-4 text-sm font-medium">
                        {tool.price}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Award className="w-6 h-6 text-primary" />
              Detailed Reviews
            </h2>
            
            {detailedTools.map((tool, index) => (
              <Card 
                key={tool.slug} 
                className={`overflow-hidden transition-all duration-300 ${
                  expandedTool === tool.slug ? 'ring-2 ring-primary/50' : ''
                } ${index === 0 ? 'border-primary/30' : ''}`}
                data-testid={`card-tool-${tool.slug}`}
              >
                <CardHeader 
                  className="cursor-pointer hover:bg-primary/5 transition-colors"
                  onClick={() => setExpandedTool(expandedTool === tool.slug ? null : tool.slug)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
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
                      <div className="text-sm text-muted-foreground">{tool.priceNote}</div>
                      <ChevronDown className={`w-5 h-5 mt-2 transition-transform ${expandedTool === tool.slug ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </CardHeader>
                
                {expandedTool === tool.slug && (
                  <CardContent className="border-t border-primary/10 pt-6">
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
                        <h4 className="font-semibold text-red-500 mb-3 flex items-center gap-2">
                          <X className="w-4 h-4" /> Cons
                        </h4>
                        <ul className="space-y-2">
                          {tool.cons.map((con, i) => (
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
                      <p className="text-sm text-muted-foreground">{tool.verdict}</p>
                    </div>
                    
                    <Button 
                      asChild 
                      className={index === 0 ? "gradient-button w-full sm:w-auto" : "w-full sm:w-auto"}
                      variant={index === 0 ? "default" : "outline"}
                      data-testid={`button-cta-${tool.slug}`}
                    >
                      <Link href={tool.ctaLink}>
                        {tool.ctaText}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          <section className="mt-16 p-8 bg-gradient-to-br from-primary/10 via-background to-accent/10 border border-primary/20 rounded-xl">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Our Recommendation</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                {content.conclusion}
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
              {seoFaqs.map((faq, index) => (
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
              <Button asChild variant="outline" data-testid="link-compare-ai">
                <Link href="/compare/shopify-ai-apps">
                  Shopify AI Apps
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
                  SEO Guides
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
