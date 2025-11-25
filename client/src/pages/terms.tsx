import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, FileText, Shield, CreditCard, AlertTriangle, 
  Scale, Globe, Mail, CheckCircle, XCircle, Sparkles
} from "lucide-react";
import { Helmet } from "react-helmet";

interface TermsSection {
  id: string;
  title: string;
  icon: typeof FileText;
  content: React.ReactNode;
}

const termsSections: TermsSection[] = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    icon: CheckCircle,
    content: (
      <div className="space-y-3">
        <p>
          By accessing and using Zyra AI's services ("Service"), you accept and agree to be bound by these Terms of Service ("Terms"). These Terms apply to all visitors, users, and others who access or use the Service.
        </p>
        <p>
          If you disagree with any part of these terms, you may not access the Service. By using Zyra AI, you represent that you are at least 18 years old and have the legal capacity to enter into these Terms.
        </p>
      </div>
    )
  },
  {
    id: "service-description",
    title: "2. Description of Service",
    icon: Sparkles,
    content: (
      <div className="space-y-3">
        <p>Zyra AI provides an AI-powered SaaS platform designed to help ecommerce businesses optimize their operations. Our services include:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>AI Product Optimization:</strong> Automated product descriptions, titles, and SEO optimization</li>
          <li><strong>Marketing Automation:</strong> Email and SMS campaigns, abandoned cart recovery</li>
          <li><strong>Analytics & Insights:</strong> Performance tracking, revenue attribution, A/B testing</li>
          <li><strong>Shopify Integration:</strong> Seamless connection with your Shopify store</li>
          <li><strong>Autonomous AI Features:</strong> Self-learning optimization, dynamic pricing, behavioral triggers</li>
        </ul>
        <p>
          We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time, with or without notice.
        </p>
      </div>
    )
  },
  {
    id: "accounts",
    title: "3. User Accounts",
    icon: Shield,
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Account Registration</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li>You must provide accurate, complete, and current information during registration</li>
            <li>You are responsible for safeguarding your account credentials</li>
            <li>You must notify us immediately of any unauthorized access to your account</li>
            <li>One person or legal entity may maintain only one active account</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Account Security</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li>We offer two-factor authentication (2FA) for enhanced security</li>
            <li>You are responsible for all activities that occur under your account</li>
            <li>We recommend using strong, unique passwords</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Account Termination</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li>You may delete your account at any time from your account settings</li>
            <li>We may suspend or terminate accounts that violate these Terms</li>
            <li>Upon termination, your right to use the Service will immediately cease</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: "billing",
    title: "4. Subscription & Billing",
    icon: CreditCard,
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Subscription Plans</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Free Trial:</strong> 7-day access with limited features, no credit card required</li>
            <li><strong>Starter:</strong> $29/month - For small stores getting started</li>
            <li><strong>Growth:</strong> $79/month - For growing businesses</li>
            <li><strong>Pro:</strong> $199/month - For established stores needing advanced features</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Billing Terms</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li>Subscriptions are billed monthly in advance</li>
            <li>All payments are processed securely through PayPal</li>
            <li>Prices are in USD and exclude applicable taxes</li>
            <li>We reserve the right to change pricing with 30 days advance notice</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Refund Policy</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li>14-day money-back guarantee for new subscribers</li>
            <li>Refund requests must be submitted via email to team@zzyraai.com</li>
            <li>Refunds are processed within 5-10 business days</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: "ai-usage",
    title: "5. AI Usage & Content",
    icon: Sparkles,
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">AI-Generated Content</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li>You own all content generated through our AI services for your business</li>
            <li>AI-generated content should be reviewed before publication</li>
            <li>We are not responsible for inaccuracies in AI-generated content</li>
            <li>You are responsible for ensuring AI content complies with applicable laws</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Usage Limits</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li>AI generation limits are based on your subscription plan</li>
            <li>Unused generations do not roll over to the next billing period</li>
            <li>Additional generations may be purchased as add-ons</li>
            <li>Rate limits apply to prevent abuse and ensure fair access</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: "prohibited",
    title: "6. Prohibited Activities",
    icon: XCircle,
    content: (
      <div className="space-y-3">
        <p>You agree not to engage in any of the following prohibited activities:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Using the Service for any illegal or unauthorized purpose</li>
          <li>Attempting to gain unauthorized access to our systems or networks</li>
          <li>Transmitting malware, viruses, or other harmful code</li>
          <li>Scraping, copying, or reverse engineering our platform</li>
          <li>Reselling or redistributing our services without authorization</li>
          <li>Generating spam, misleading, or fraudulent content</li>
          <li>Violating intellectual property rights of others</li>
          <li>Harassing, abusing, or harming other users</li>
          <li>Interfering with or disrupting the Service</li>
        </ul>
        <p>
          Violation of these prohibitions may result in immediate account termination without refund.
        </p>
      </div>
    )
  },
  {
    id: "privacy",
    title: "7. Data & Privacy",
    icon: Shield,
    content: (
      <div className="space-y-3">
        <p>
          Your use of Zyra AI is also governed by our Privacy Policy. By using our Service, you consent to the collection and use of your information as described in our Privacy Policy.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>We use industry-standard encryption (AES-256) to protect your data</li>
          <li>Your store data is processed only to provide our services</li>
          <li>We do not sell your personal information to third parties</li>
          <li>You may request data export or deletion at any time</li>
        </ul>
        <div className="mt-4">
          <Link href="/privacy-policy" className="text-primary hover:underline inline-flex items-center gap-1">
            View our full Privacy Policy
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </div>
      </div>
    )
  },
  {
    id: "intellectual-property",
    title: "8. Intellectual Property",
    icon: FileText,
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Our Intellectual Property</h4>
          <p>
            The Service and its original content (excluding content provided by users), features, and functionality are and will remain the exclusive property of Zyra AI. Our trademarks, logos, and service marks may not be used without prior written consent.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Your Intellectual Property</h4>
          <p>
            You retain all rights to your product data, store content, and other materials you upload or create through our Service. By using our Service, you grant us a limited license to process your content solely to provide the Service.
          </p>
        </div>
      </div>
    )
  },
  {
    id: "disclaimers",
    title: "9. Disclaimers & Limitations",
    icon: AlertTriangle,
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Service Availability</h4>
          <p>We strive for 99.9% uptime but do not guarantee uninterrupted or error-free service. Scheduled maintenance will be announced in advance when possible.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">No Warranties</h4>
          <p>
            THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Limitation of Liability</h4>
          <p>
            IN NO EVENT SHALL ZYRA AI BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
          </p>
        </div>
      </div>
    )
  },
  {
    id: "third-party",
    title: "10. Third-Party Services",
    icon: Globe,
    content: (
      <div className="space-y-3">
        <p>Our platform integrates with third-party services to provide enhanced functionality:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Shopify:</strong> Store integration and product synchronization</li>
          <li><strong>OpenAI:</strong> AI-powered content generation</li>
          <li><strong>SendGrid:</strong> Email delivery services</li>
          <li><strong>Twilio:</strong> SMS messaging services</li>
          <li><strong>PayPal:</strong> Payment processing</li>
        </ul>
        <p>
          Your use of these third-party services is subject to their respective terms and privacy policies. We are not responsible for the actions or policies of third-party service providers.
        </p>
      </div>
    )
  },
  {
    id: "indemnification",
    title: "11. Indemnification",
    icon: Scale,
    content: (
      <p>
        You agree to defend, indemnify, and hold harmless Zyra AI and its officers, directors, employees, contractors, agents, licensors, and suppliers from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms or your use of the Service.
      </p>
    )
  },
  {
    id: "changes",
    title: "12. Changes to Terms",
    icon: FileText,
    content: (
      <div className="space-y-3">
        <p>
          We reserve the right to modify or replace these Terms at any time at our sole discretion. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.
        </p>
        <p>
          Notice may be provided by email or by posting the revised Terms on our website. Your continued use of the Service after the effective date of the revised Terms constitutes acceptance of those changes.
        </p>
      </div>
    )
  },
  {
    id: "governing-law",
    title: "13. Governing Law & Disputes",
    icon: Scale,
    content: (
      <div className="space-y-3">
        <p>
          These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.
        </p>
        <p>
          Any disputes arising from these Terms or your use of the Service shall first be attempted to be resolved through good-faith negotiations. If negotiations fail, disputes shall be resolved through binding arbitration in accordance with applicable arbitration rules.
        </p>
      </div>
    )
  },
  {
    id: "contact",
    title: "14. Contact Information",
    icon: Mail,
    content: (
      <div className="space-y-3">
        <p>For questions about these Terms of Service, please contact us:</p>
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <p className="font-semibold mb-2">Zyra AI Legal Team</p>
          <p className="text-sm">
            Email: <a href="mailto:team@zzyraai.com" className="text-primary hover:underline">team@zzyraai.com</a>
          </p>
        </div>
      </div>
    )
  }
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-background relative">
      <Helmet>
        <title>Terms of Service - Zyra AI</title>
        <meta name="description" content="Read the Terms of Service for Zyra AI. Understand our policies on subscriptions, AI usage, data privacy, and more." />
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
      <section className="relative py-16 sm:py-20 px-4 sm:px-6 overflow-hidden z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        
        <div className="container mx-auto max-w-4xl relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6">
            <Scale className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Legal</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-[#00F0FF] via-[#00FFE5] to-[#FF00F5] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,240,255,0.3)]">
              Terms of Service
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Please read these terms carefully before using Zyra AI. By using our service, you agree to be bound by these terms.
          </p>
          <p className="text-sm text-muted-foreground mt-4">Last updated: November 25, 2025</p>
        </div>
      </section>

      {/* Terms Content */}
      <section className="relative py-12 px-4 sm:px-6 z-10">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-6">
            {termsSections.map((section) => (
              <div 
                key={section.id}
                className="bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-md border border-primary/10 rounded-xl p-6 sm:p-8"
                id={section.id}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <section.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground pt-1.5">{section.title}</h2>
                </div>
                <div className="text-muted-foreground leading-relaxed pl-14">
                  {section.content}
                </div>
              </div>
            ))}
          </div>

          {/* Acceptance Banner */}
          <div className="mt-12 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 text-center">
            <CheckCircle className="w-10 h-10 text-primary mx-auto mb-4" />
            <p className="text-foreground font-medium mb-2">
              By using Zyra AI, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
            <p className="text-sm text-muted-foreground">
              If you have any questions, please contact us at{" "}
              <a href="mailto:team@zzyraai.com" className="text-primary hover:underline">team@zzyraai.com</a>
            </p>
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
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
