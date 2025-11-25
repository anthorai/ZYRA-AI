import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, ArrowLeft, Zap, Sparkles, Rocket, Lightbulb, Clock, User, BookOpen
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
    <div className="min-h-screen bg-background relative">
      <Helmet>
        <title>Blog - Zyra AI Insights | Ecommerce Automation Tips</title>
        <meta name="description" content="Stay ahead with expert tips, automation strategies, and ecommerce trends. Learn how AI can transform your online store." />
      </Helmet>

      {/* Global Small Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Small grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 240, 255, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.5) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        {/* Top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.15),transparent_70%)]" />
        {/* Bottom glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse_at_center,rgba(255,0,245,0.1),transparent_70%)]" />
      </div>

      {/* Header */}
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

      {/* Hero Section */}
      <section className="relative py-20 sm:py-28 px-4 sm:px-6 overflow-hidden z-10">
        {/* Hero glow effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.08),transparent_50%)]" />
        
        <div className="container mx-auto max-w-5xl relative z-10 text-center">
          {/* Floating badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">Latest Insights</span>
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-[#00F0FF] via-[#00FFE5] to-[#FF00F5] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,240,255,0.3)]">
              Zyra AI Insights
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Stay ahead with expert tips, automation strategies, and ecommerce trends that help you grow your online store.
          </p>
          
          {/* Decorative line */}
          <div className="mt-10 flex items-center justify-center gap-3">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary/50" />
            <Sparkles className="w-5 h-5 text-primary/50" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary/50" />
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="relative py-12 sm:py-20 px-4 sm:px-6 z-10">
        <div className="container mx-auto max-w-6xl">
          {/* Section header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Featured Articles</h2>
              <p className="text-muted-foreground mt-1">Dive deep into AI-powered ecommerce strategies</p>
            </div>
            <Badge variant="outline" className="hidden sm:flex border-primary/30 text-primary">
              {blogPosts.length} Articles
            </Badge>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {blogPosts.map((post, index) => (
              <article 
                key={post.slug}
                className="group relative bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-md border border-primary/10 rounded-xl overflow-hidden hover:border-primary/40 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5"
                data-testid={`blog-card-${post.slug}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Card glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/5 via-transparent to-[#FF00F5]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute -inset-px bg-gradient-to-b from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
                
                {/* Featured Image */}
                <div className="relative w-full h-52 overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                  
                  {/* Category badge overlay */}
                  <div className="absolute top-4 left-4">
                    <span className="text-xs font-bold text-white px-3 py-1.5 bg-primary/90 backdrop-blur-sm rounded-full shadow-lg shadow-primary/30">
                      {post.category}
                    </span>
                  </div>
                  
                  {/* Icon overlay */}
                  <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-primary/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                    <post.icon className="w-5 h-5 text-primary" />
                  </div>
                </div>

                <div className="relative p-6">
                  {/* Title */}
                  <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2">
                    {post.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-5 line-clamp-2 leading-relaxed">
                    {post.description}
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-5 pb-5 border-b border-primary/10">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary/60" />
                      {post.author}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary/60" />
                      {post.readTime}
                    </span>
                  </div>
                  
                  {/* Read More Button */}
                  <Link 
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center text-sm font-semibold text-primary group/btn"
                    data-testid={`button-read-${post.slug}`}
                  >
                    <span className="relative">
                      Read Article
                      <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary group-hover/btn:w-full transition-all duration-300" />
                    </span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1.5 transition-transform duration-300" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 sm:py-24 px-4 sm:px-6 z-10">
        {/* CTA background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        
        <div className="container mx-auto max-w-4xl relative">
          <div className="relative bg-gradient-to-br from-background/90 to-background/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 sm:p-12 text-center overflow-hidden">
            {/* Inner glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.15),transparent_70%)]" />
            
            {/* Decorative corners */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary/30 rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary/30 rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary/30 rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary/30 rounded-br-lg" />
            
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6">
                <Rocket className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Ready to Transform Your Store?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-lg">
                Start your free trial and see how Zyra AI can automate your ecommerce growth.
              </p>
              <Button asChild size="lg" className="gradient-button shadow-xl shadow-primary/30 px-8" data-testid="button-cta-trial">
                <Link href="/auth">
                  <Rocket className="w-5 h-5 mr-2" />
                  Start Free Trial
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground mt-4">No credit card required</p>
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
