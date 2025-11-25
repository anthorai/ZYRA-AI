import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, ArrowLeft, Zap, Sparkles, Rocket, Clock, User, Calendar,
  CheckCircle, TrendingUp, Target, Shield, Bot
} from "lucide-react";
import { Helmet } from "react-helmet";

import blogImage1 from "@assets/generated_images/ai_dropshipping_growth_dashboard.png";
import blogImage2 from "@assets/generated_images/ai_ecommerce_tools_concept.png";
import blogImage3 from "@assets/generated_images/future_ecommerce_automation.png";

interface ArticleContent {
  slug: string;
  title: string;
  description: string;
  category: string;
  image: string;
  icon: typeof Zap;
  author: string;
  date: string;
  readTime: string;
  content: {
    intro: string;
    sections: {
      title: string;
      content: string;
      bullets?: string[];
    }[];
    conclusion: string;
  };
}

const articles: Record<string, ArticleContent> = {
  "how-zyra-ai-automates-dropshipping-growth": {
    slug: "how-zyra-ai-automates-dropshipping-growth",
    title: "How Zyra AI Automates Your Dropshipping Growth",
    description: "A breakdown of how AI-driven optimization boosts product ranking, SEO strength, and store conversions automatically.",
    category: "AI GROWTH",
    image: blogImage1,
    icon: Zap,
    author: "Zyra AI Team",
    date: "November 20, 2025",
    readTime: "8 min read",
    content: {
      intro: "In the fast-paced world of dropshipping, staying ahead of the competition requires more than just finding trending products. It demands intelligent automation that works around the clock to optimize every aspect of your store. Zyra AI represents a paradigm shift in how ecommerce entrepreneurs approach store management and growth.",
      sections: [
        {
          title: "The Challenge of Manual Optimization",
          content: "Traditional dropshipping requires countless hours of manual work: writing product descriptions, optimizing for SEO, managing abandoned carts, and analyzing competitor pricing. Most store owners spend 60% of their time on repetitive tasks that could be automated.",
          bullets: [
            "Product descriptions take 15-30 minutes each to write effectively",
            "SEO optimization requires constant keyword research and updates",
            "Cart abandonment emails need personalization at scale",
            "Competitor monitoring is a full-time job in itself"
          ]
        },
        {
          title: "How Zyra AI Transforms Your Workflow",
          content: "Zyra AI uses advanced machine learning algorithms to understand your brand voice, analyze market trends, and automatically optimize your entire product catalog. The system learns from successful conversions and continuously improves its recommendations.",
          bullets: [
            "AI-powered product descriptions in your unique brand voice",
            "Automatic SEO optimization with trending keywords",
            "Smart cart recovery with personalized messaging",
            "Real-time competitor price monitoring and alerts"
          ]
        },
        {
          title: "Boosting Product Rankings Automatically",
          content: "One of Zyra AI's most powerful features is its ability to automatically optimize your product listings for search engines. The AI analyzes top-performing products in your niche and applies proven SEO strategies to your listings, including meta descriptions, alt text for images, and strategic keyword placement.",
          bullets: [
            "Automatic meta description generation",
            "Image alt-text optimization for Google Images",
            "Keyword density analysis and recommendations",
            "Schema markup suggestions for rich snippets"
          ]
        },
        {
          title: "Conversion Optimization at Scale",
          content: "Beyond SEO, Zyra AI focuses on converting visitors into customers. The platform analyzes your store's performance data and makes real-time adjustments to product descriptions, pricing strategies, and promotional messaging to maximize conversions.",
          bullets: [
            "A/B testing of product descriptions automatically",
            "Dynamic pricing suggestions based on demand",
            "Urgency and scarcity messaging optimization",
            "Social proof integration recommendations"
          ]
        }
      ],
      conclusion: "The future of dropshipping belongs to those who leverage AI automation. Zyra AI doesn't just save time—it fundamentally changes how you grow your business by making intelligent decisions at scale, 24/7. Start your free trial today and experience the difference AI-powered automation can make for your store."
    }
  },
  "top-5-ai-tools-ecommerce-2025": {
    slug: "top-5-ai-tools-ecommerce-2025",
    title: "Top 5 AI Tools Every Ecommerce Owner Must Use in 2025",
    description: "Quick guide to automation tools that save time, increase sales, and streamline your entire workflow.",
    category: "TOOLS & TIPS",
    image: blogImage2,
    icon: Sparkles,
    author: "Zyra AI Team",
    date: "November 15, 2025",
    readTime: "6 min read",
    content: {
      intro: "Artificial intelligence has moved from a nice-to-have to an absolute necessity for ecommerce success in 2025. The stores that thrive are the ones leveraging AI tools to automate repetitive tasks, personalize customer experiences, and make data-driven decisions faster than ever before. Here are the five essential AI tools every ecommerce owner should be using.",
      sections: [
        {
          title: "1. AI Product Description Generators",
          content: "Writing compelling product descriptions is time-consuming and requires copywriting expertise. AI-powered description generators like Zyra AI can create SEO-optimized, conversion-focused product copy in seconds, maintaining your brand voice while scaling effortlessly.",
          bullets: [
            "Generate hundreds of descriptions in minutes",
            "Maintain consistent brand voice across all products",
            "Automatic SEO keyword integration",
            "A/B test different copy variations automatically"
          ]
        },
        {
          title: "2. Smart Cart Recovery Systems",
          content: "Cart abandonment rates hover around 70% for most ecommerce stores. AI-powered recovery systems analyze customer behavior to send perfectly-timed, personalized recovery emails and SMS messages that significantly boost recovery rates.",
          bullets: [
            "Personalized messaging based on browsing history",
            "Optimal send-time prediction for each customer",
            "Dynamic discount offers based on cart value",
            "Multi-channel recovery (email, SMS, push)"
          ]
        },
        {
          title: "3. Dynamic Pricing Intelligence",
          content: "Staying competitive requires constant price monitoring and adjustment. AI pricing tools automatically track competitor prices, analyze demand patterns, and adjust your prices in real-time to maximize both sales and profit margins.",
          bullets: [
            "Real-time competitor price monitoring",
            "Demand-based dynamic pricing",
            "Margin protection algorithms",
            "Seasonal and trend-based adjustments"
          ]
        },
        {
          title: "4. AI-Powered Customer Service",
          content: "Modern AI chatbots handle up to 80% of customer inquiries without human intervention. They learn from every interaction, providing instant responses 24/7 while freeing your team to focus on complex issues that require a human touch.",
          bullets: [
            "24/7 instant customer support",
            "Order tracking and status updates",
            "Product recommendations during chat",
            "Seamless handoff to human agents when needed"
          ]
        },
        {
          title: "5. Predictive Analytics Platforms",
          content: "AI analytics go beyond reporting what happened—they predict what will happen. These tools forecast inventory needs, identify trending products before they peak, and help you make proactive business decisions.",
          bullets: [
            "Inventory demand forecasting",
            "Trend prediction and early alerts",
            "Customer lifetime value predictions",
            "Churn risk identification"
          ]
        }
      ],
      conclusion: "The AI tools available in 2025 aren't just incremental improvements—they're transformative technologies that can 10x your productivity and profitability. Start with Zyra AI to automate your product optimization and cart recovery, then expand your AI toolkit as your store grows. The sooner you adopt these tools, the faster you'll outpace your competition."
    }
  },
  "future-of-ecommerce-smart-automation": {
    slug: "future-of-ecommerce-smart-automation",
    title: "The Future of Ecommerce: Why Smart Automation Wins",
    description: "Why self-learning AI systems like Zyra are replacing manual marketing and product optimization forever.",
    category: "FUTURE TRENDS",
    image: blogImage3,
    icon: Rocket,
    author: "Zyra AI Team",
    date: "November 10, 2025",
    readTime: "10 min read",
    content: {
      intro: "The ecommerce landscape is undergoing its most significant transformation since the advent of mobile shopping. Self-learning AI systems are not just automating tasks—they're fundamentally reimagining how online stores operate. Manual optimization is becoming a relic of the past, replaced by intelligent systems that learn, adapt, and improve continuously.",
      sections: [
        {
          title: "The End of Manual Marketing",
          content: "Traditional marketing requires constant human intervention: analyzing data, creating content, testing variations, and making adjustments. Self-learning AI systems do all of this automatically, running thousands of micro-experiments simultaneously and applying learnings in real-time.",
          bullets: [
            "AI runs continuous optimization 24/7/365",
            "Learns from every customer interaction",
            "Applies insights across entire product catalog",
            "Adapts to market changes in real-time"
          ]
        },
        {
          title: "The Rise of Autonomous Commerce",
          content: "We're entering the era of autonomous commerce, where AI systems handle everything from product sourcing to customer retention. Zyra AI represents this new paradigm—a system that doesn't just assist store owners but actively manages and optimizes store performance autonomously.",
          bullets: [
            "Self-optimizing product listings",
            "Automated competitor response strategies",
            "Intelligent inventory management",
            "Predictive customer engagement"
          ]
        },
        {
          title: "Why Manual Optimization Can't Compete",
          content: "Human marketers simply cannot process the volume of data that AI systems analyze in seconds. A single store generates millions of data points about customer behavior, market trends, and competitive dynamics. AI systems synthesize this data instantly and take action.",
          bullets: [
            "AI processes data 1000x faster than humans",
            "No fatigue, no off-hours, no holidays",
            "Unbiased decision-making based on data",
            "Scales infinitely without additional cost"
          ]
        },
        {
          title: "The Competitive Advantage of Early Adopters",
          content: "Stores that adopt AI automation today are building an insurmountable advantage. Their systems are learning and improving while competitors rely on manual processes. The gap between AI-powered and manual stores will only widen over time.",
          bullets: [
            "Compound improvements over time",
            "Lower customer acquisition costs",
            "Higher customer lifetime value",
            "Better margins through efficiency"
          ]
        },
        {
          title: "Preparing for the Autonomous Future",
          content: "The transition to autonomous commerce doesn't happen overnight. Smart store owners are starting now, implementing AI tools incrementally and allowing their systems to learn and improve. The key is to begin the journey before competitors do.",
          bullets: [
            "Start with high-impact automation (product optimization, cart recovery)",
            "Gradually expand to more autonomous systems",
            "Focus on data quality to improve AI performance",
            "Build AI expertise within your team"
          ]
        }
      ],
      conclusion: "The future of ecommerce is autonomous. Stores that embrace smart automation will thrive; those that cling to manual processes will struggle to survive. Zyra AI is at the forefront of this revolution, providing the intelligent automation tools that tomorrow's successful stores are using today. Don't wait to be disrupted—be the disruptor. Start your free trial and join the autonomous commerce revolution."
    }
  }
};

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? articles[slug] : null;

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>Article Not Found | Zyra AI Blog</title>
          <meta name="description" content="The article you're looking for could not be found. Browse our blog for AI and ecommerce insights." />
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        
        {/* Header */}
        <header className="border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link href="/blog" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors" data-testid="link-back-blog-404">
                <ArrowLeft className="w-4 h-4" />
                <span className="font-medium">Back to Blog</span>
              </Link>
              <Button asChild className="gradient-button" data-testid="button-start-trial-404">
                <Link href="/auth">
                  Start Free Trial
                </Link>
              </Button>
            </div>
          </div>
        </header>
        
        <div className="flex flex-col items-center justify-center py-24 px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Rocket className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The article you're looking for doesn't exist or may have been moved. Check out our other articles for AI and ecommerce insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="default" className="gradient-button" data-testid="button-browse-articles">
                <Link href="/blog">
                  Browse All Articles
                </Link>
              </Button>
              <Button asChild variant="outline" data-testid="button-back-home-404">
                <Link href="/">
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="border-t border-border py-8 px-4 sm:px-6 mt-auto">
          <div className="container mx-auto text-center text-sm text-muted-foreground">
            <p>© 2025 Zyra AI. All rights reserved.</p>
          </div>
        </footer>
      </div>
    );
  }

  const otherArticles = Object.values(articles).filter(a => a.slug !== slug).slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{article.title} | Zyra AI Blog</title>
        <meta name="description" content={article.description} />
      </Helmet>

      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/blog" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors" data-testid="link-back-blog">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Back to Blog</span>
            </Link>
            <Button asChild className="gradient-button" data-testid="button-start-trial-header">
              <Link href="/auth">
                Start Free Trial
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Image */}
      <div className="relative w-full h-64 sm:h-80 lg:h-96 overflow-hidden">
        <img 
          src={article.image} 
          alt={article.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      {/* Article Content */}
      <article className="relative -mt-20 z-10">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6">
          {/* Article Header */}
          <div className="bg-background rounded-lg border border-border p-6 sm:p-8 mb-8">
            <Badge variant="outline" className="mb-4" data-testid="badge-category">
              <article.icon className="w-3 h-3 mr-1" />
              {article.category}
            </Badge>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-[#00F0FF] via-[#00FFE5] to-foreground bg-clip-text text-transparent" data-testid="text-article-title">
              {article.title}
            </h1>
            
            <p className="text-lg text-muted-foreground mb-6">
              {article.description}
            </p>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {article.author}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {article.date}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {article.readTime}
              </span>
            </div>
          </div>

          {/* Article Body */}
          <div className="prose prose-invert max-w-none">
            {/* Introduction */}
            <p className="text-lg leading-relaxed text-foreground/90 mb-8">
              {article.content.intro}
            </p>

            {/* Sections */}
            {article.content.sections.map((section, index) => (
              <section key={index} className="mb-10">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm">
                    {index + 1}
                  </span>
                  {section.title}
                </h2>
                <p className="text-foreground/80 leading-relaxed mb-4">
                  {section.content}
                </p>
                {section.bullets && (
                  <ul className="space-y-3">
                    {section.bullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex} className="flex items-start gap-3 text-foreground/80">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            {/* Conclusion */}
            <div className="border-t border-border pt-8 mt-8">
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                <Target className="w-6 h-6 text-primary" />
                Key Takeaway
              </h2>
              <p className="text-lg text-foreground/90 leading-relaxed mb-8">
                {article.content.conclusion}
              </p>
            </div>
          </div>

          {/* CTA Box */}
          <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border border-primary/30 rounded-lg p-8 text-center my-12">
            <h3 className="text-2xl font-bold mb-4">Ready to Automate Your Store?</h3>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Join 50,000+ Shopify merchants using Zyra AI to grow their stores on autopilot.
            </p>
            <Button asChild size="lg" className="gradient-button" data-testid="button-cta-trial">
              <Link href="/auth">
                <Rocket className="w-5 h-5 mr-2" />
                Start Your Free Trial
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              <Shield className="w-4 h-4 inline mr-1" />
              No credit card required. 7-day free trial.
            </p>
          </div>

          {/* Related Articles */}
          <div className="border-t border-border pt-12 pb-16">
            <h3 className="text-2xl font-bold mb-8">Related Articles</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {otherArticles.map((post) => (
                <Link 
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group block bg-background/40 border border-primary/20 rounded-lg overflow-hidden hover:border-primary/60 transition-all duration-300"
                  data-testid={`link-related-${post.slug}`}
                >
                  <div className="relative h-32 overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4">
                    <span className="text-xs font-semibold text-primary">{post.category}</span>
                    <h4 className="font-bold text-foreground group-hover:text-primary transition-colors mt-1">
                      {post.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 Zyra AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
