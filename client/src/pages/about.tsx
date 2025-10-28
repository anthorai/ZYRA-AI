import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { PageContainer, PageHeader } from "@/components/ui/standardized-layout";
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
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
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

  const features = [
    {
      icon: Sparkles,
      title: t('aboutPage.features.productOptimization.title'),
      description: t('aboutPage.features.productOptimization.description'),
    },
    {
      icon: TrendingUp,
      title: t('aboutPage.features.conversionBoost.title'),
      description: t('aboutPage.features.conversionBoost.description'),
    },
    {
      icon: PenTool,
      title: t('aboutPage.features.contentBranding.title'),
      description: t('aboutPage.features.contentBranding.description'),
    },
    {
      icon: BarChart3,
      title: t('aboutPage.features.roiTracking.title'),
      description: t('aboutPage.features.roiTracking.description'),
    },
    {
      icon: Zap,
      title: t('aboutPage.features.workflowTools.title'),
      description: t('aboutPage.features.workflowTools.description'),
    },
  ];

  return (
    <PageContainer>
      <div className="mb-6">
        <Button
          onClick={() => setLocation('/dashboard')}
          variant="ghost"
          size="sm"
          className="hover:bg-primary/10"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
      <PageHeader 
        icon={Info} 
        title="About Zyra AI" 
        subtitle="AI-Powered E-Commerce Optimization Platform" 
      />
      <div className="min-h-screen bg-gradient-to-br from-[#0D0D1F] via-[#14142B] to-[#0D0D1F]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00F0FF08_1px,transparent_1px),linear-gradient(to_bottom,#00F0FF08_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 mb-8">
              <Zap className="w-4 h-4 text-[#00F0FF]" />
              <span className="text-[#00F0FF] text-sm font-medium" data-testid="text-hero-badge">
                {t('aboutPage.hero.badge')}
              </span>
            </div>
            
            <h1 
              className="text-4xl md:text-6xl font-bold text-[#EAEAEA] mb-6 leading-tight"
              data-testid="text-hero-title"
            >
              {t('aboutPage.hero.title')}
            </h1>
            
            <p 
              className="text-xl md:text-2xl text-[#EAEAEA]/80 max-w-4xl mx-auto mb-8"
              data-testid="text-hero-subtitle"
            >
              {t('aboutPage.hero.subtitle')}
            </p>
            
            <p 
              className="text-lg text-[#EAEAEA]/60 max-w-3xl mx-auto"
              data-testid="text-hero-description"
            >
              {t('aboutPage.hero.description')}
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
                {t('aboutPage.vision.title')}
              </h2>
              
              <div className="space-y-6 text-[#EAEAEA]/80 text-lg leading-relaxed">
                <p data-testid="text-vision-paragraph-1">
                  {t('aboutPage.vision.paragraph1')}
                </p>
                
                <p data-testid="text-vision-paragraph-2">
                  {t('aboutPage.vision.paragraph2')}
                </p>
                
                <p data-testid="text-vision-paragraph-3">
                  {t('aboutPage.vision.paragraph3')}
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
              {t('aboutPage.features.title')}
            </h2>
            <p 
              className="text-lg text-[#EAEAEA]/60 max-w-2xl mx-auto"
              data-testid="text-features-subtitle"
            >
              {t('aboutPage.features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              {t('aboutPage.impact.title')}
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center" data-testid="card-impact-time">
                <div className="text-5xl font-bold text-[#00F0FF] mb-3">
                  {t('aboutPage.impact.timeSaved.value')}
                </div>
                <div className="text-xl font-semibold text-[#EAEAEA] mb-2">
                  {t('aboutPage.impact.timeSaved.label')}
                </div>
                <p className="text-[#EAEAEA]/60">
                  {t('aboutPage.impact.timeSaved.description')}
                </p>
              </div>

              <div className="text-center" data-testid="card-impact-sales">
                <div className="text-5xl font-bold text-[#00F0FF] mb-3">
                  {t('aboutPage.impact.salesBoost.value')}
                </div>
                <div className="text-xl font-semibold text-[#EAEAEA] mb-2">
                  {t('aboutPage.impact.salesBoost.label')}
                </div>
                <p className="text-[#EAEAEA]/60">
                  {t('aboutPage.impact.salesBoost.description')}
                </p>
              </div>

              <div className="text-center" data-testid="card-impact-roi">
                <div className="text-5xl font-bold text-[#00F0FF] mb-3">
                  {t('aboutPage.impact.roiMaximization.value')}
                </div>
                <div className="text-xl font-semibold text-[#EAEAEA] mb-2">
                  {t('aboutPage.impact.roiMaximization.label')}
                </div>
                <p className="text-[#EAEAEA]/60">
                  {t('aboutPage.impact.roiMaximization.description')}
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
            {t('aboutPage.future.title')}
          </h2>
          
          <p 
            className="text-xl text-[#EAEAEA]/80 leading-relaxed mb-6"
            data-testid="text-future-description"
          >
            {t('aboutPage.future.description')}
          </p>
          
          <p 
            className="text-lg text-[#00F0FF] font-semibold"
            data-testid="text-future-tagline"
          >
            {t('aboutPage.future.tagline')}
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
              {t('aboutPage.cta.title')}
            </h2>
            
            <p 
              className="text-xl text-[#EAEAEA]/80 mb-8"
              data-testid="text-cta-description"
            >
              {t('aboutPage.cta.description')}
            </p>
            
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-[#0D0D1F] font-bold text-lg px-8 py-6 h-auto"
                data-testid="button-cta-start"
              >
                {t('aboutPage.cta.button')}
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
