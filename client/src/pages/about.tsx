import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { PageContainer } from "@/components/ui/standardized-layout";
import { 
  Info,
  Sparkles, 
  TrendingUp, 
  PenTool, 
  BarChart3, 
  Zap, 
  ArrowUp,
  ArrowLeft,
  ChevronRight
} from "lucide-react";
import { useState, useEffect } from "react";
import Footer from "@/components/ui/footer";

export default function AboutPage() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    window.history.back();
  };

  const features = [
    {
      icon: Sparkles,
      title: "AI Product Optimization",
      description: "Transform your product listings with intelligent AI-powered descriptions, SEO optimization, and conversion-focused content.",
    },
    {
      icon: TrendingUp,
      title: "Conversion Boost",
      description: "Increase sales with data-driven product descriptions designed to convert visitors into customers.",
    },
    {
      icon: PenTool,
      title: "Brand Voice & Content",
      description: "Maintain consistent brand messaging across all products with AI that learns your unique voice and style.",
    },
    {
      icon: BarChart3,
      title: "ROI Tracking & Analytics",
      description: "Track the impact of AI-generated content on your sales with comprehensive analytics and reporting.",
    },
    {
      icon: Zap,
      title: "Automated Workflow Tools",
      description: "Save hours with bulk operations, automated publishing, and intelligent content scheduling.",
    },
  ];

  return (
    <PageContainer>
      <div className="mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="text-slate-200 hover:text-primary hover:bg-white/10 transition-all duration-300 ease-in-out flex-shrink-0"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>
      <div className="min-h-screen bg-gradient-to-br from-[#0D0D1F] via-[#14142B] to-[#0D0D1F]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00F0FF08_1px,transparent_1px),linear-gradient(to_bottom,#00F0FF08_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 mb-8">
              <Zap className="w-4 h-4 text-[#00F0FF]" />
              <span className="text-[#00F0FF] text-sm font-medium" data-testid="text-hero-badge">
                AI-Powered E-Commerce Platform
              </span>
            </div>
            
            <h1 
              className="text-4xl md:text-6xl font-bold text-[#EAEAEA] mb-6 leading-tight"
              data-testid="text-hero-title"
            >
              About Zyra AI
            </h1>
            
            <p 
              className="text-xl md:text-2xl text-[#EAEAEA]/80 max-w-4xl mx-auto mb-8"
              data-testid="text-hero-subtitle"
            >
              Transforming E-Commerce with Intelligent Automation
            </p>
            
            <p 
              className="text-lg text-[#EAEAEA]/60 max-w-3xl mx-auto"
              data-testid="text-hero-description"
            >
              Zyra AI is your intelligent partner for e-commerce success, combining advanced artificial intelligence with practical automation to help businesses grow faster and smarter.
            </p>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-[#14142B] border-[#00F0FF]/20 p-8 md:p-12">
            <div className="max-w-4xl mx-auto">
              <h2 
                className="text-3xl md:text-4xl font-bold text-[#00F0FF] mb-6 text-center"
                data-testid="text-vision-title"
              >
                Our Vision
              </h2>
              
              <div className="space-y-6 text-[#EAEAEA]/80 text-lg leading-relaxed">
                <p data-testid="text-vision-paragraph-1">
                  We believe that every e-commerce business, regardless of size, deserves access to enterprise-level AI technology. Zyra AI was built to democratize intelligent automation, making advanced marketing and content optimization accessible to all online sellers.
                </p>
                
                <p data-testid="text-vision-paragraph-2">
                  Our platform combines cutting-edge artificial intelligence with deep e-commerce expertise to help businesses create compelling product content, run effective marketing campaigns, and maximize their return on investment.
                </p>
                
                <p data-testid="text-vision-paragraph-3">
                  We're committed to continuous innovation, constantly evolving our AI capabilities to meet the changing needs of modern e-commerce while maintaining our focus on simplicity, reliability, and measurable results.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-16 md:py-24 bg-[#0D0D1F]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 
              className="text-3xl md:text-4xl font-bold text-[#EAEAEA] mb-4"
              data-testid="text-features-title"
            >
              Core Features
            </h2>
            <p 
              className="text-lg text-[#EAEAEA]/60 max-w-2xl mx-auto"
              data-testid="text-features-subtitle"
            >
              Powerful tools designed to accelerate your e-commerce growth
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-[#14142B] border-[#00F0FF]/20 p-6 hover:border-[#00F0FF]/40 transition-all duration-300"
                data-testid={`card-feature-${index}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-[#00F0FF]/10 flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-[#00F0FF]" />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 
                      className="text-xl font-bold text-[#EAEAEA] mb-2"
                      data-testid={`text-feature-title-${index}`}
                    >
                      {feature.title}
                    </h3>
                    <p 
                      className="text-[#EAEAEA]/70 leading-relaxed"
                      data-testid={`text-feature-description-${index}`}
                    >
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-br from-[#14142B] to-[#0D0D1F] border-[#00F0FF]/20 p-8 md:p-12">
            <h2 
              className="text-3xl md:text-4xl font-bold text-[#00F0FF] mb-12 text-center"
              data-testid="text-impact-title"
            >
              Measurable Impact
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center" data-testid="card-impact-time">
                <div className="text-5xl font-bold text-[#00F0FF] mb-3">
                  80%
                </div>
                <div className="text-xl font-semibold text-[#EAEAEA] mb-2">
                  Time Saved
                </div>
                <p className="text-[#EAEAEA]/60">
                  On average, merchants save 80% of the time they previously spent on product content creation
                </p>
              </div>

              <div className="text-center" data-testid="card-impact-sales">
                <div className="text-5xl font-bold text-[#00F0FF] mb-3">
                  35%
                </div>
                <div className="text-xl font-semibold text-[#EAEAEA] mb-2">
                  Sales Boost
                </div>
                <p className="text-[#EAEAEA]/60">
                  Businesses see an average 35% increase in conversions with optimized product descriptions
                </p>
              </div>

              <div className="text-center" data-testid="card-impact-roi">
                <div className="text-5xl font-bold text-[#00F0FF] mb-3">
                  10x
                </div>
                <div className="text-xl font-semibold text-[#EAEAEA] mb-2">
                  ROI Maximization
                </div>
                <p className="text-[#EAEAEA]/60">
                  Our users report an average 10x return on their Zyra AI investment within the first quarter
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Future Promise Section */}
      <section className="py-16 md:py-24 bg-[#0D0D1F]/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 
            className="text-3xl md:text-4xl font-bold text-[#EAEAEA] mb-6"
            data-testid="text-future-title"
          >
            The Future of E-Commerce
          </h2>
          
          <p 
            className="text-xl text-[#EAEAEA]/80 leading-relaxed mb-6"
            data-testid="text-future-description"
          >
            As AI technology continues to evolve, we're committed to staying at the forefront of innovation. We're constantly developing new features, integrations, and capabilities to ensure Zyra AI remains the most powerful and accessible e-commerce AI platform available.
          </p>
          
          <p 
            className="text-lg text-[#00F0FF] font-semibold"
            data-testid="text-future-tagline"
          >
            Together, we're building the future of intelligent e-commerce.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-[#00F0FF]/10 to-[#00F0FF]/5 border-[#00F0FF]/30 p-12 text-center">
            <h2 
              className="text-3xl md:text-4xl font-bold text-[#EAEAEA] mb-6"
              data-testid="text-cta-title"
            >
              Ready to Transform Your E-Commerce Business?
            </h2>
            
            <p 
              className="text-xl text-[#EAEAEA]/80 mb-8"
              data-testid="text-cta-description"
            >
              Join thousands of merchants who are already growing their businesses with Zyra AI
            </p>
            
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-[#0D0D1F] font-bold text-lg px-8 py-6 h-auto"
                data-testid="button-cta-start"
              >
                Get Started Now
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-12 h-12 rounded-full bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-[#0D0D1F] flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-[#00F0FF]/50 z-50"
          data-testid="button-scroll-top"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}
      </div>
    </PageContainer>
  );
}
