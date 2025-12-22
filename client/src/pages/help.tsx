import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Search, ChevronDown, ChevronRight, HelpCircle, 
  Sparkles, Zap, CreditCard, Settings, ShoppingBag, BarChart3,
  Mail, Shield, Rocket, BookOpen, MessageSquare, ExternalLink, LayoutDashboard
} from "lucide-react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/useAuth";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: typeof Zap;
  description: string;
  faqs: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Rocket,
    description: "Learn the basics of setting up Zyra AI",
    faqs: [
      {
        question: "How do I connect my Shopify store to Zyra AI?",
        answer: "Connecting your store is simple! Go to Settings > Integrations > Shopify, click 'Connect Store', and authorize Zyra AI through Shopify's secure OAuth process. The entire process takes less than 2 minutes."
      },
      {
        question: "What Shopify plans are compatible with Zyra AI?",
        answer: "Zyra AI works with all Shopify plans including Basic, Shopify, Advanced, and Plus. Some advanced features may require specific Shopify API access levels."
      },
      {
        question: "How long does it take to see results?",
        answer: "Most merchants see improvements within the first week. AI-optimized product descriptions typically show SEO improvements within 2-4 weeks, while abandoned cart recovery can generate sales from day one."
      }
    ]
  },
  {
    id: "ai-features",
    title: "AI Features",
    icon: Sparkles,
    description: "Understanding AI-powered optimization",
    faqs: [
      {
        question: "How does the AI generate product descriptions?",
        answer: "Our AI analyzes your product data, images, and category to generate SEO-optimized descriptions that match your brand voice. It uses advanced language models trained specifically for ecommerce conversion."
      },
      {
        question: "Can I customize the AI writing style?",
        answer: "Absolutely! You can set your brand voice preferences, target audience, and tone in the AI Settings. The system learns from your edits to better match your style over time."
      },
      {
        question: "What is Smart Bulk Optimization?",
        answer: "Smart Bulk Optimization allows you to optimize multiple products at once. The AI analyzes each product individually and generates unique, optimized content for titles, descriptions, and meta tags."
      }
    ]
  },
  {
    id: "billing",
    title: "Billing & Plans",
    icon: CreditCard,
    description: "Pricing, subscriptions, and payments",
    faqs: [
      {
        question: "What payment methods do you accept?",
        answer: "All subscription payments are handled through Shopify Billing. This provides secure payment processing integrated directly with your Shopify account."
      },
      {
        question: "Can I cancel my subscription anytime?",
        answer: "Yes, you can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your current billing period."
      },
      {
        question: "Do you offer refunds?",
        answer: "We offer a 14-day money-back guarantee for new subscribers. If you're not satisfied, contact our support team for a full refund."
      },
      {
        question: "What's included in the free trial?",
        answer: "The 7-day free trial includes full access to all features on the Starter plan. No credit card required to start your trial."
      }
    ]
  },
  {
    id: "seo",
    title: "SEO & Rankings",
    icon: BarChart3,
    description: "Improve your search visibility",
    faqs: [
      {
        question: "How does Zyra AI improve my SEO?",
        answer: "Zyra AI optimizes your product titles, descriptions, and meta tags with relevant keywords. It also generates schema markup, analyzes competitor rankings, and provides actionable recommendations."
      },
      {
        question: "What is the SEO Health Score?",
        answer: "The SEO Health Score is a 0-100 rating that measures your store's search optimization. It considers factors like keyword usage, meta descriptions, image alt text, and technical SEO elements."
      },
      {
        question: "Can I track my Google rankings?",
        answer: "Yes! The Pro and Enterprise plans include keyword ranking tracking. Monitor your product positions in Google search results and see how they improve over time."
      }
    ]
  },
  {
    id: "automation",
    title: "Automation",
    icon: Settings,
    description: "Automated marketing and workflows",
    faqs: [
      {
        question: "How does abandoned cart recovery work?",
        answer: "When a customer leaves items in their cart, Zyra AI automatically sends personalized email sequences to bring them back. You can customize timing, messaging, and discount offers."
      },
      {
        question: "What marketing automations are available?",
        answer: "Zyra AI offers email campaigns, SMS notifications, behavioral triggers, post-purchase upsells, and dynamic pricing automation. All can be customized or run autonomously."
      },
      {
        question: "Can I schedule product updates?",
        answer: "Yes, you can schedule bulk optimizations, price changes, and content updates to run at specific times. Perfect for seasonal promotions or coordinated launches."
      }
    ]
  },
  {
    id: "security",
    title: "Security & Privacy",
    icon: Shield,
    description: "Data protection and compliance",
    faqs: [
      {
        question: "Is my store data secure?",
        answer: "Absolutely. We use AES-256 encryption for all data, maintain SOC 2 compliance, and never share your data with third parties. Your store information is fully protected."
      },
      {
        question: "Are you GDPR compliant?",
        answer: "Yes, Zyra AI is fully GDPR compliant. We provide data export, deletion tools, and transparent privacy practices for you and your customers."
      },
      {
        question: "What Shopify permissions does Zyra AI need?",
        answer: "We only request the minimum permissions needed: read/write products, orders for analytics, and customers for marketing automation. You can revoke access anytime."
      }
    ]
  }
];

export default function Help() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>("getting-started");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  
  // Smart navigation: redirect to dashboard if authenticated, otherwise to landing page
  const backHref = isAuthenticated ? "/dashboard" : "/";
  const backLabel = isAuthenticated ? "Back to Dashboard" : "Back to Home";

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq => 
      searchQuery === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0);

  const totalFAQs = faqCategories.reduce((acc, cat) => acc + cat.faqs.length, 0);

  return (
    <div className="min-h-screen bg-background relative">
      <Helmet>
        <title>Help Center - Zyra AI | FAQ & Support</title>
        <meta name="description" content="Find answers to common questions about Zyra AI. Browse our help center for guides on getting started, AI features, billing, SEO, and more." />
      </Helmet>

      {/* Global Small Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 240, 255, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.5) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.15),transparent_70%)]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse_at_center,rgba(255,0,245,0.1),transparent_70%)]" />
      </div>

      {/* Header */}
      <header className="border-b border-primary/10 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href={backHref} className="flex items-center gap-2 text-foreground hover:text-primary transition-colors group" data-testid="link-back-navigation">
              {isAuthenticated ? <LayoutDashboard className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />}
              <span className="font-medium">{backLabel}</span>
            </Link>
            <Button asChild className="gradient-button shadow-lg shadow-primary/20" data-testid="button-start-trial">
              <Link href="/auth">
                Start Free Trial
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 overflow-hidden z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.08),transparent_50%)]" />
        
        <div className="container mx-auto max-w-5xl relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6">
            <HelpCircle className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Help Center</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-[#00F0FF] via-[#00FFE5] to-[#FF00F5] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,240,255,0.3)]">
              How Can We Help?
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            Find answers to common questions or get in touch with our support team.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6 text-lg bg-background/50 border-primary/20 focus:border-primary/50 rounded-xl"
              data-testid="input-search"
            />
          </div>

          <p className="text-sm text-muted-foreground mt-4">{totalFAQs} articles across {faqCategories.length} categories</p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="relative py-12 sm:py-16 px-4 sm:px-6 z-10">
        <div className="container mx-auto max-w-4xl">
          
          {/* Category Grid */}
          {!searchQuery && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
              {faqCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                  className={`text-left p-5 rounded-xl border transition-all duration-300 ${
                    expandedCategory === category.id 
                      ? 'bg-primary/10 border-primary/40' 
                      : 'bg-background/40 border-primary/10 hover:border-primary/30'
                  }`}
                  data-testid={`category-${category.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      expandedCategory === category.id ? 'bg-primary/20' : 'bg-primary/10'
                    }`}>
                      <category.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{category.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{category.faqs.length} articles</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* FAQ List */}
          <div className="space-y-4">
            {filteredCategories.map((category) => (
              <div 
                key={category.id}
                className={`bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-md border border-primary/10 rounded-xl overflow-hidden ${
                  !searchQuery && expandedCategory !== category.id ? 'hidden' : ''
                }`}
              >
                {searchQuery && (
                  <div className="px-6 py-4 border-b border-primary/10 flex items-center gap-3">
                    <category.icon className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold text-foreground">{category.title}</h2>
                    <Badge variant="outline" className="ml-auto border-primary/30 text-primary text-xs">
                      {category.faqs.length} results
                    </Badge>
                  </div>
                )}
                
                <div className="divide-y divide-primary/10">
                  {category.faqs.map((faq, index) => {
                    const faqId = `${category.id}-${index}`;
                    const isExpanded = expandedFAQ === faqId;
                    
                    return (
                      <div key={faqId}>
                        <button
                          onClick={() => setExpandedFAQ(isExpanded ? null : faqId)}
                          className="w-full px-6 py-4 flex items-center gap-4 text-left hover:bg-primary/5 transition-colors"
                          data-testid={`faq-${faqId}`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                            isExpanded ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                          }`}>
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </div>
                          <span className="font-medium text-foreground">{faq.question}</span>
                        </button>
                        
                        {isExpanded && (
                          <div className="px-6 pb-5 pl-16">
                            <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {filteredCategories.length === 0 && searchQuery && (
              <div className="text-center py-12 bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-md border border-primary/10 rounded-xl">
                <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
                <p className="text-muted-foreground mb-6">We couldn't find any articles matching "{searchQuery}"</p>
                <Button variant="outline" onClick={() => setSearchQuery("")} data-testid="button-clear-search">
                  Clear Search
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="relative py-16 px-4 sm:px-6 z-10">
        <div className="container mx-auto max-w-3xl">
          <div className="bg-gradient-to-br from-background/90 to-background/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 text-center overflow-hidden relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.15),transparent_70%)]" />
            
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-5">
                <MessageSquare className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Still Need Help?</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Can't find what you're looking for? Our support team is ready to assist you.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild className="gradient-button shadow-lg shadow-primary/20" data-testid="button-contact-support">
                  <Link href="/contact">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Support
                  </Link>
                </Button>
                <Button asChild variant="outline" data-testid="button-email-direct">
                  <a href="mailto:team@zzyraai.com">
                    team@zzyraai.com
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-primary/10 py-10 px-4 sm:px-6 z-10">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© 2025 Zyra AI. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
