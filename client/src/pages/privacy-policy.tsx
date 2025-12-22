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
  Baby,
  LayoutDashboard
} from "lucide-react";
import { useState, useEffect } from "react";
import Footer from "@/components/ui/footer";
import { useAuth } from "@/hooks/useAuth";

export default function PrivacyPolicyPage() {
  const { isAuthenticated } = useAuth();
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Smart navigation: redirect to dashboard if authenticated, otherwise to landing page
  const backHref = isAuthenticated ? "/dashboard" : "/";
  const backLabel = isAuthenticated ? "Back to Dashboard" : "Back to Landing Page";

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
      title: "Introduction",
      content: [
        "At Zyra AI, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use our platform and services.",
        "We value your trust and take our responsibility to protect your privacy seriously. This policy applies to all users of Zyra AI's platform, including those who access our services through web browsers, mobile applications, or API integrations.",
        "By using Zyra AI, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.",
      ],
    },
    {
      id: "information-collection",
      icon: Database,
      title: "Information We Collect",
      content: [
        "We collect various types of information to provide and improve our services to you:",
      ],
      subsections: [
        {
          subtitle: "Account Information",
          items: ["Name and email address", "Business or store information", "Payment and billing details", "Authentication credentials"],
        },
        {
          subtitle: "Usage Data",
          items: ["Product data and descriptions", "AI generation history and preferences", "Campaign and automation activity", "Platform interactions and feature usage"],
        },
        {
          subtitle: "Cookies and Tracking",
          items: ["Session cookies for authentication", "Analytics cookies for performance tracking", "Preference cookies for personalization", "Third-party integration cookies"],
        },
        {
          subtitle: "Integration Data",
          items: ["Shopify store data (if connected)", "Email service provider information", "Payment gateway data", "Third-party app connections"],
        },
      ],
    },
    {
      id: "information-use",
      icon: Users,
      title: "How We Use Your Information",
      content: [
        "We use the information we collect for various legitimate business purposes:",
      ],
      legalBasis: "Legal Basis (GDPR): We process your data based on contract performance, legitimate interests, legal obligations, and your consent where required.",
      list: [
        "Provide and maintain our AI-powered services and features",
        "Optimize and personalize your experience with content recommendations",
        "Improve our platform through analytics and feature development",
        "Communicate with you about updates, offers, and support",
        "Detect, prevent, and address security issues and fraud",
        "Comply with legal obligations and enforce our terms of service",
      ],
    },
    {
      id: "data-sharing",
      icon: Share2,
      title: "How We Share Your Information",
      content: [
        "We do not sell your personal information. We may share your data only in the following circumstances:",
      ],
      subsections: [
        {
          subtitle: "Third-Party Service Providers",
          description: "We work with trusted partners who help us operate our platform, including cloud hosting providers, payment processors, email service providers, and AI technology partners. These partners are contractually obligated to protect your data and use it only for the services they provide to us.",
        },
        {
          subtitle: "Legal Requirements",
          description: "We may disclose your information if required by law, court order, or government regulation, or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others, investigate fraud, or respond to a government request.",
        },
        {
          subtitle: "Business Transfers",
          description: "In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity. We will notify you of any such change in ownership or control of your personal information.",
        },
      ],
    },
    {
      id: "data-security",
      icon: Lock,
      title: "Data Security",
      content: [
        "We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. Our security practices include:",
        "While we strive to protect your data, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security but remain committed to maintaining the highest standards of data protection.",
      ],
      list: [
        "End-to-end encryption for data in transit and at rest",
        "Strict access controls and authentication requirements",
        "Continuous monitoring and threat detection systems",
        "Regular security audits and penetration testing",
      ],
    },
    {
      id: "user-rights",
      icon: UserCheck,
      title: "Your Rights and Choices",
      content: [
        "You have important rights regarding your personal information. Depending on your location, you may have the following rights:",
      ],
      ccpaNote: "California Residents: Under the CCPA, you have specific rights including the right to know what personal information we collect, the right to delete your information, and the right to opt-out of the sale of your information (which we do not engage in).",
      list: [
        "Access: Request a copy of the personal information we hold about you",
        "Correction: Request correction of inaccurate or incomplete data",
        "Deletion: Request deletion of your personal information, subject to legal obligations",
        "Data Portability: Receive your data in a structured, machine-readable format",
        "Opt-Out: Unsubscribe from marketing communications at any time",
        "Complaint: Lodge a complaint with your local data protection authority",
      ],
    },
    {
      id: "cookies-tracking",
      icon: Cookie,
      title: "Cookies and Tracking Technologies",
      content: [
        "We use cookies and similar tracking technologies to track activity on our platform and store certain information. Cookies are files with small amounts of data that may include an anonymous unique identifier.",
        "You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.",
      ],
      subsections: [
        {
          subtitle: "Essential Cookies",
          description: "These cookies are necessary for the platform to function properly. They enable core functionality such as security, authentication, and accessibility features. These cookies cannot be disabled in our systems.",
        },
        {
          subtitle: "Analytics Cookies",
          description: "We use analytics cookies to understand how visitors interact with our platform. This helps us measure and improve the performance of our services. These cookies collect information in an aggregated and anonymous form.",
        },
        {
          subtitle: "Preference Cookies",
          description: "These cookies allow the platform to remember choices you make (such as your language preference or region) and provide enhanced, personalized features based on your preferences.",
        },
      ],
    },
    {
      id: "third-party-integrations",
      icon: Puzzle,
      title: "Third-Party Services and Integrations",
      content: [
        "We integrate with various third-party services to provide you with a comprehensive platform. When you use these integrations, you are also subject to those third parties' privacy policies and terms of service:",
      ],
      list: [
        "Shopify: E-commerce platform integration for product management and sales data",
        "SendGrid: Email delivery service for transactional and marketing communications",
        "Shopify Billing: Subscription and billing management through Shopify's secure payment system",
        "OpenAI: AI technology provider for content generation and optimization",
        "Analytics Providers: Tools for measuring platform performance and user engagement",
      ],
    },
    {
      id: "data-retention",
      icon: Archive,
      title: "Data Retention",
      content: [
        "We retain your personal information only for as long as necessary to fulfill the purposes for which it was collected, including legal, accounting, or reporting requirements.",
        "When you close your account, we will delete or anonymize your personal information within 90 days, unless we are required by law to retain it longer. Backup copies may persist for a limited time in our systems.",
        "We maintain different retention periods for different types of data based on their nature and purpose. For example, transaction records may be retained longer for tax and accounting purposes.",
      ],
    },
    {
      id: "international-transfers",
      icon: Globe,
      title: "International Data Transfers",
      content: [
        "Your information may be transferred to and maintained on servers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ from those in your jurisdiction.",
        "If you are located outside the United States and choose to provide information to us, please note that we transfer the data to the United States and process it there. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable law, including Standard Contractual Clauses where required.",
      ],
    },
    {
      id: "policy-updates",
      icon: Bell,
      title: "Changes to This Privacy Policy",
      content: [
        "We may update our Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the 'Last Updated' date.",
        "We encourage you to review this Privacy Policy periodically to stay informed about how we are protecting your information. Your continued use of our services after we post changes constitutes your acceptance of the updated policy.",
      ],
    },
    {
      id: "contact",
      icon: Mail,
      title: "Contact Us",
      content: [
        "If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us using the information below. We are committed to resolving any privacy-related issues promptly and transparently.",
      ],
      contactInfo: {
        email: "team@zzyraai.com",
        support: "For general support inquiries, visit our Help Center in the dashboard",
      },
    },
    {
      id: "childrens-privacy",
      icon: Baby,
      title: "Children's Privacy",
      content: [
        "Our services are not intended for individuals under the age of 18. We do not knowingly collect personally identifiable information from children under 18 years of age.",
        "If you are a parent or guardian and you believe that your child has provided us with personal information, please contact us immediately. If we become aware that we have collected personal information from children without verification of parental consent, we will take steps to remove that information from our servers.",
        "For users in the European Economic Area (EEA), we comply with the age requirements specified by the GDPR and process personal data of minors only with appropriate parental consent where required.",
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
                Your Privacy Matters
              </span>
            </div>
            
            <h1 
              className="text-4xl md:text-6xl font-bold text-[#EAEAEA] mb-6 leading-tight"
              data-testid="heading-hero"
            >
              Privacy Policy
            </h1>
            
            <p 
              className="text-lg text-[#EAEAEA]/60 mb-4"
              data-testid="text-last-updated"
            >
              Last Updated: January 15, 2025
            </p>
            
            <p 
              className="text-xl text-[#EAEAEA]/80 max-w-3xl mx-auto"
              data-testid="text-hero-description"
            >
              This Privacy Policy describes how Zyra AI collects, uses, and protects your personal information when you use our platform and services.
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
              Questions About Your Privacy?
            </h2>
            
            <p 
              className="text-xl text-[#EAEAEA]/80 mb-8"
              data-testid="text-cta-description"
            >
              If you have any concerns or questions about our privacy practices, our team is here to help
            </p>
            
            <Link href={backHref}>
              <Button
                size="lg"
                className="bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-[#0D0D1F] font-bold text-lg px-8 py-6 h-auto"
                data-testid="button-back-navigation"
              >
                {isAuthenticated ? <LayoutDashboard className="mr-2 w-5 h-5" /> : null}
                {backLabel}
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
