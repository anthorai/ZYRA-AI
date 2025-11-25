import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, ArrowLeft, Zap, Sparkles, Rocket, Lightbulb, Clock, User
} from "lucide-react";
import { Helmet } from "react-helmet";

import blogImage1 from "@assets/generated_images/ai_dropshipping_growth_dashboard.png";
import blogImage2 from "@assets/generated_images/ai_ecommerce_tools_concept.png";
import blogImage3 from "@assets/generated_images/future_ecommerce_automation.png";

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  category: string;
  image: string;
  icon: typeof Zap;
  author: string;
  date: string;
  readTime: string;
}

const blogPosts: BlogPost[] = [
  {
    slug: "how-zyra-ai-automates-dropshipping-growth",
    title: "How Zyra AI Automates Your Dropshipping Growth",
    description: "A breakdown of how AI-driven optimization boosts product ranking, SEO strength, and store conversions automatically.",
    category: "AI GROWTH",
    image: blogImage1,
    icon: Zap,
    author: "Zyra AI Team",
    date: "November 20, 2025",
    readTime: "8 min read"
  },
  {
    slug: "top-5-ai-tools-ecommerce-2025",
    title: "Top 5 AI Tools Every Ecommerce Owner Must Use in 2025",
    description: "Quick guide to automation tools that save time, increase sales, and streamline your entire workflow.",
    category: "TOOLS & TIPS",
    image: blogImage2,
    icon: Sparkles,
    author: "Zyra AI Team",
    date: "November 15, 2025",
    readTime: "6 min read"
  },
  {
    slug: "future-of-ecommerce-smart-automation",
    title: "The Future of Ecommerce: Why Smart Automation Wins",
    description: "Why self-learning AI systems like Zyra are replacing manual marketing and product optimization forever.",
    category: "FUTURE TRENDS",
    image: blogImage3,
    icon: Rocket,
    author: "Zyra AI Team",
    date: "November 10, 2025",
    readTime: "10 min read"
  }
];

export default function Blog() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Blog - Zyra AI Insights | Ecommerce Automation Tips</title>
        <meta name="description" content="Stay ahead with expert tips, automation strategies, and ecommerce trends. Learn how AI can transform your online store." />
      </Helmet>

      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors" data-testid="link-back-home">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Back to Home</span>
            </Link>
            <Button asChild className="gradient-button" data-testid="button-start-trial">
              <Link href="/auth">
                Start Free Trial
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(0,240,255,0.1),transparent_50%)]" />
        
        <div className="container mx-auto max-w-5xl relative z-10 text-center">
          <Badge variant="outline" className="mb-4" data-testid="badge-insights">
            <Lightbulb className="w-3 h-3 mr-1" />
            Latest Insights
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-[#00F0FF] via-[#00FFE5] to-[#FF00F5] bg-clip-text text-transparent">
              Zyra AI Insights
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Stay ahead with expert tips, automation strategies, and ecommerce trends that help you grow your online store.
          </p>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article 
                key={post.slug}
                className="group relative bg-background/40 backdrop-blur-sm border border-primary/20 rounded-lg overflow-hidden hover:border-primary/60 transition-all duration-300"
                data-testid={`blog-card-${post.slug}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/5 via-transparent to-[#FF00F5]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Featured Image */}
                <div className="relative w-full h-48 overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                </div>

                <div className="relative p-6">
                  {/* Category Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-primary px-2 py-1 bg-primary/10 rounded-full">
                      {post.category}
                    </span>
                  </div>
                  
                  {/* Title */}
                  <h2 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
                    {post.title}
                  </h2>
                  
                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {post.description}
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {post.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  </div>
                  
                  {/* Read More Button */}
                  <Button 
                    asChild
                    variant="ghost" 
                    size="sm"
                    className="text-primary group/btn"
                    data-testid={`button-read-${post.slug}`}
                  >
                    <Link href={`/blog/${post.slug}`}>
                      <span>Read More</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to Transform Your Store?
          </h2>
          <p className="text-muted-foreground mb-8">
            Start your free trial and see how Zyra AI can automate your ecommerce growth.
          </p>
          <Button asChild size="lg" className="gradient-button" data-testid="button-cta-trial">
            <Link href="/auth">
              <Rocket className="w-5 h-5 mr-2" />
              Start Free Trial
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 Zyra AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
