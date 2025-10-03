import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  Shield,
  Database,
  Users,
  Share2,
  Lock,
  UserCheck,
  Cookie,
  Puzzle,
  Archive,
  Globe,
  Bell,
  Mail,
  ArrowUp,
  FileText,
  ChevronRight,
  Baby
} from "lucide-react";
import { useState, useEffect } from "react";
import Footer from "@/components/ui/footer";

export default function PrivacyPolicyPage() {
  const { t } = useLanguage();
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

  const sections = [
    {
      id: "introduction",
      icon: Shield,
      title: t('privacyPolicy.introduction.title'),
      content: [
        t('privacyPolicy.introduction.paragraph1'),
        t('privacyPolicy.introduction.paragraph2'),
        t('privacyPolicy.introduction.paragraph3'),
      ],
    },
    {
      id: "information-collection",
      icon: Database,
      title: t('privacyPolicy.informationCollection.title'),
      content: [
        t('privacyPolicy.informationCollection.intro'),
      ],
      subsections: [
        {
          subtitle: t('privacyPolicy.informationCollection.accountInfo.title'),
          items: t('privacyPolicy.informationCollection.accountInfo.items'),
        },
        {
          subtitle: t('privacyPolicy.informationCollection.usageData.title'),
          items: t('privacyPolicy.informationCollection.usageData.items'),
        },
        {
          subtitle: t('privacyPolicy.informationCollection.cookies.title'),
          items: t('privacyPolicy.informationCollection.cookies.items'),
        },
        {
          subtitle: t('privacyPolicy.informationCollection.integrations.title'),
          items: t('privacyPolicy.informationCollection.integrations.items'),
        },
      ],
    },
    {
      id: "information-use",
      icon: Users,
      title: t('privacyPolicy.informationUse.title'),
      content: [
        t('privacyPolicy.informationUse.intro'),
      ],
      legalBasis: t('privacyPolicy.informationUse.legalBasis'),
      list: [
        t('privacyPolicy.informationUse.items.provideServices'),
        t('privacyPolicy.informationUse.items.optimizePerformance'),
        t('privacyPolicy.informationUse.items.improveFeatures'),
        t('privacyPolicy.informationUse.items.communicate'),
        t('privacyPolicy.informationUse.items.security'),
        t('privacyPolicy.informationUse.items.compliance'),
      ],
    },
    {
      id: "data-sharing",
      icon: Share2,
      title: t('privacyPolicy.dataSharing.title'),
      content: [
        t('privacyPolicy.dataSharing.intro'),
      ],
      subsections: [
        {
          subtitle: t('privacyPolicy.dataSharing.thirdParty.title'),
          description: t('privacyPolicy.dataSharing.thirdParty.description'),
        },
        {
          subtitle: t('privacyPolicy.dataSharing.legal.title'),
          description: t('privacyPolicy.dataSharing.legal.description'),
        },
        {
          subtitle: t('privacyPolicy.dataSharing.businessTransfers.title'),
          description: t('privacyPolicy.dataSharing.businessTransfers.description'),
        },
      ],
    },
    {
      id: "data-security",
      icon: Lock,
      title: t('privacyPolicy.dataSecurity.title'),
      content: [
        t('privacyPolicy.dataSecurity.paragraph1'),
        t('privacyPolicy.dataSecurity.paragraph2'),
      ],
      list: [
        t('privacyPolicy.dataSecurity.measures.encryption'),
        t('privacyPolicy.dataSecurity.measures.accessControls'),
        t('privacyPolicy.dataSecurity.measures.monitoring'),
        t('privacyPolicy.dataSecurity.measures.regularAudits'),
      ],
    },
    {
      id: "user-rights",
      icon: UserCheck,
      title: t('privacyPolicy.userRights.title'),
      content: [
        t('privacyPolicy.userRights.intro'),
      ],
      ccpaNote: t('privacyPolicy.userRights.ccpaNote'),
      list: [
        t('privacyPolicy.userRights.rights.access'),
        t('privacyPolicy.userRights.rights.correction'),
        t('privacyPolicy.userRights.rights.deletion'),
        t('privacyPolicy.userRights.rights.portability'),
        t('privacyPolicy.userRights.rights.optOut'),
        t('privacyPolicy.userRights.rights.complaint'),
      ],
    },
    {
      id: "cookies-tracking",
      icon: Cookie,
      title: t('privacyPolicy.cookiesTracking.title'),
      content: [
        t('privacyPolicy.cookiesTracking.paragraph1'),
        t('privacyPolicy.cookiesTracking.paragraph2'),
      ],
      subsections: [
        {
          subtitle: t('privacyPolicy.cookiesTracking.types.essential.title'),
          description: t('privacyPolicy.cookiesTracking.types.essential.description'),
        },
        {
          subtitle: t('privacyPolicy.cookiesTracking.types.analytics.title'),
          description: t('privacyPolicy.cookiesTracking.types.analytics.description'),
        },
        {
          subtitle: t('privacyPolicy.cookiesTracking.types.preferences.title'),
          description: t('privacyPolicy.cookiesTracking.types.preferences.description'),
        },
      ],
    },
    {
      id: "third-party-integrations",
      icon: Puzzle,
      title: t('privacyPolicy.thirdPartyIntegrations.title'),
      content: [
        t('privacyPolicy.thirdPartyIntegrations.intro'),
      ],
      list: [
        t('privacyPolicy.thirdPartyIntegrations.services.shopify'),
        t('privacyPolicy.thirdPartyIntegrations.services.sendgrid'),
        t('privacyPolicy.thirdPartyIntegrations.services.stripe'),
        t('privacyPolicy.thirdPartyIntegrations.services.openai'),
        t('privacyPolicy.thirdPartyIntegrations.services.analytics'),
      ],
    },
    {
      id: "data-retention",
      icon: Archive,
      title: t('privacyPolicy.dataRetention.title'),
      content: [
        t('privacyPolicy.dataRetention.paragraph1'),
        t('privacyPolicy.dataRetention.paragraph2'),
        t('privacyPolicy.dataRetention.paragraph3'),
      ],
    },
    {
      id: "international-transfers",
      icon: Globe,
      title: t('privacyPolicy.internationalTransfers.title'),
      content: [
        t('privacyPolicy.internationalTransfers.paragraph1'),
        t('privacyPolicy.internationalTransfers.paragraph2'),
      ],
    },
    {
      id: "policy-updates",
      icon: Bell,
      title: t('privacyPolicy.policyUpdates.title'),
      content: [
        t('privacyPolicy.policyUpdates.paragraph1'),
        t('privacyPolicy.policyUpdates.paragraph2'),
      ],
    },
    {
      id: "contact",
      icon: Mail,
      title: t('privacyPolicy.contact.title'),
      content: [
        t('privacyPolicy.contact.paragraph1'),
      ],
      contactInfo: {
        email: t('privacyPolicy.contact.email'),
        support: t('privacyPolicy.contact.support'),
      },
    },
    {
      id: "childrens-privacy",
      icon: Baby,
      title: t('privacyPolicy.childrensPrivacy.title'),
      content: [
        t('privacyPolicy.childrensPrivacy.paragraph1'),
        t('privacyPolicy.childrensPrivacy.paragraph2'),
        t('privacyPolicy.childrensPrivacy.paragraph3'),
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D1F] via-[#14142B] to-[#0D0D1F]" data-testid="page-privacy-policy">
      {/* Hero Section */}
      <section className="relative overflow-hidden" data-testid="hero-privacy-policy">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00F0FF08_1px,transparent_1px),linear-gradient(to_bottom,#00F0FF08_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 mb-8">
              <Shield className="w-4 h-4 text-[#00F0FF]" />
              <span className="text-[#00F0FF] text-sm font-medium" data-testid="text-hero-badge">
                {t('privacyPolicy.hero.badge')}
              </span>
            </div>
            
            <h1 
              className="text-4xl md:text-6xl font-bold text-[#EAEAEA] mb-6 leading-tight"
              data-testid="heading-hero"
            >
              {t('privacyPolicy.hero.title')}
            </h1>
            
            <p 
              className="text-lg text-[#EAEAEA]/60 mb-4"
              data-testid="text-last-updated"
            >
              {t('privacyPolicy.hero.lastUpdated')}: {t('privacyPolicy.hero.date')}
            </p>
            
            <p 
              className="text-xl text-[#EAEAEA]/80 max-w-3xl mx-auto"
              data-testid="text-hero-description"
            >
              {t('privacyPolicy.hero.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Privacy Policy Sections */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {sections.map((section, index) => (
              <Card
                key={section.id}
                className="bg-[#14142B] border-[#00F0FF]/20 p-6 md:p-8 hover:border-[#00F0FF]/40 transition-all duration-300"
                data-testid={`section-${section.id}`}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-[#00F0FF]/10 flex items-center justify-center">
                      <section.icon className="w-6 h-6 text-[#00F0FF]" />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h2 
                      className="text-2xl md:text-3xl font-bold text-[#EAEAEA]"
                      data-testid={`heading-${section.id}`}
                    >
                      {section.title}
                    </h2>
                  </div>
                </div>

                <div className="space-y-4 text-[#EAEAEA]/80 leading-relaxed">
                  {section.content && section.content.map((paragraph, pIndex) => (
                    <p 
                      key={pIndex} 
                      data-testid={`text-${section.id}-${pIndex}`}
                    >
                      {paragraph}
                    </p>
                  ))}

                  {(section as any).legalBasis && (
                    <div 
                      className="mt-4 p-4 bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-lg"
                      data-testid={`legal-basis-${section.id}`}
                    >
                      <p className="text-[#00F0FF] font-medium">
                        {(section as any).legalBasis}
                      </p>
                    </div>
                  )}

                  {(section as any).ccpaNote && (
                    <div 
                      className="mt-4 p-4 bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-lg"
                      data-testid={`ccpa-note-${section.id}`}
                    >
                      <p className="text-[#00F0FF] font-medium">
                        {(section as any).ccpaNote}
                      </p>
                    </div>
                  )}

                  {section.list && (
                    <ul className="space-y-3 mt-4" data-testid={`list-${section.id}`}>
                      {section.list.map((item, itemIndex) => (
                        <li 
                          key={itemIndex} 
                          className="flex items-start gap-3"
                          data-testid={`item-${section.id}-${itemIndex}`}
                        >
                          <ChevronRight className="w-5 h-5 text-[#00F0FF] flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.subsections && (
                    <div className="space-y-4 mt-6">
                      {section.subsections.map((subsection, subIndex) => {
                        const hasDescription = 'description' in subsection;
                        const hasItems = 'items' in subsection;
                        
                        return (
                          <div 
                            key={subIndex} 
                            className="pl-4 border-l-2 border-[#00F0FF]/20"
                            data-testid={`subsection-${section.id}-${subIndex}`}
                          >
                            <h3 
                              className="text-lg font-semibold text-[#EAEAEA] mb-2"
                              data-testid={`text-subsection-title-${section.id}-${subIndex}`}
                            >
                              {subsection.subtitle}
                            </h3>
                            
                            {hasDescription && (
                              <p 
                                className="text-[#EAEAEA]/70"
                                data-testid={`text-subsection-description-${section.id}-${subIndex}`}
                              >
                                {(subsection as any).description}
                              </p>
                            )}
                            
                            {hasItems && Array.isArray((subsection as any).items) && (
                              <ul className="space-y-2 mt-2">
                                {((subsection as any).items as string[]).map((item: string, itemIndex: number) => (
                                  <li 
                                    key={itemIndex}
                                    className="flex items-start gap-2 text-[#EAEAEA]/70"
                                    data-testid={`list-item-${section.id}-${subIndex}-${itemIndex}`}
                                  >
                                    <span className="text-[#00F0FF]">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {section.contactInfo && (
                    <div 
                      className="mt-6 p-4 bg-[#0D0D1F]/50 rounded-lg border border-[#00F0FF]/10"
                      data-testid={`contact-info-${section.id}`}
                    >
                      <div className="space-y-2">
                        <p className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-[#00F0FF]" />
                          <span className="font-medium text-[#EAEAEA]" data-testid="link-privacy-email">
                            {section.contactInfo.email}
                          </span>
                        </p>
                        <p className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#00F0FF]" />
                          <span className="text-[#EAEAEA]/70">
                            {section.contactInfo.support}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
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
              {t('privacyPolicy.cta.title')}
            </h2>
            
            <p 
              className="text-xl text-[#EAEAEA]/80 mb-8"
              data-testid="text-cta-description"
            >
              {t('privacyPolicy.cta.description')}
            </p>
            
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-[#0D0D1F] font-bold text-lg px-8 py-6 h-auto"
                data-testid="button-go-dashboard"
              >
                {t('privacyPolicy.cta.button')}
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
  );
}
