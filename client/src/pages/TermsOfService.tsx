import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { PageContainer } from "@/components/ui/standardized-layout";

export default function TermsOfService() {
  const [location, setLocation] = useLocation();

  // Track navigation history in sessionStorage
  useEffect(() => {
    const currentPath = sessionStorage.getItem('currentPath');
    if (currentPath && currentPath !== location) {
      sessionStorage.setItem('previousPath', currentPath);
    }
    sessionStorage.setItem('currentPath', location);
  }, [location]);

  const handleBack = () => {
    const previousPath = sessionStorage.getItem('previousPath');
    if (previousPath && previousPath !== location && previousPath !== '/') {
      setLocation(previousPath);
    } else {
      window.history.back();
    }
  };

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
      <Card>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using ZYRA's services, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
            <p className="text-muted-foreground">
              ZYRA provides an AI-powered SaaS platform for e-commerce optimization, including:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground mt-2">
              <li>AI-generated product descriptions and SEO optimization</li>
              <li>Marketing campaign automation (email & SMS)</li>
              <li>Abandoned cart recovery</li>
              <li>Analytics and reporting tools</li>
              <li>E-commerce integrations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
            <div className="space-y-2 text-muted-foreground">
              <p><strong>Account Registration:</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li>You must provide accurate and complete information</li>
                <li>You are responsible for maintaining account security</li>
                <li>You must be at least 18 years old to use our services</li>
                <li>One person or legal entity may maintain only one account</li>
              </ul>
              <p className="mt-3"><strong>Account Termination:</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li>You may delete your account at any time from settings</li>
                <li>We reserve the right to suspend or terminate accounts that violate these terms</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Subscription Plans & Billing</h2>
            <div className="space-y-2 text-muted-foreground">
              <p><strong>Plans:</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Trial:</strong> 100 AI generations, expires after 14 days</li>
                <li><strong>Starter:</strong> $29/month, 1,000 AI generations</li>
                <li><strong>Growth:</strong> $79/month, 10,000 AI generations</li>
                <li><strong>Pro:</strong> $199/month, unlimited AI generations</li>
              </ul>
              <p className="mt-3"><strong>Billing Terms:</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Subscriptions are billed monthly or annually</li>
                <li>Payments are processed securely through our payment partners</li>
                <li>Refunds are available within 14 days of purchase</li>
                <li>We reserve the right to change pricing with 30 days notice</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. AI Usage & Content</h2>
            <div className="space-y-2 text-muted-foreground">
              <p><strong>AI-Generated Content:</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li>You own all content generated through our AI services</li>
                <li>We use OpenAI's GPT models for content generation</li>
                <li>AI-generated content should be reviewed before publication</li>
                <li>We are not responsible for inaccuracies in AI-generated content</li>
              </ul>
              <p className="mt-3"><strong>Usage Limits:</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li>AI generation limits are based on your subscription plan</li>
                <li>Excessive use or abuse may result in account suspension</li>
                <li>Rate limits apply to API endpoints to ensure fair usage</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Prohibited Activities</h2>
            <p className="text-muted-foreground mb-2">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Use the service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Transmit malware, viruses, or harmful code</li>
              <li>Scrape, copy, or reverse engineer our platform</li>
              <li>Resell or redistribute our services without permission</li>
              <li>Generate spam or misleading marketing content</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Data & Privacy</h2>
            <p className="text-muted-foreground">
              Your use of ZYRA is also governed by our Privacy Policy. We collect and process your data as described in our Privacy Policy to provide and improve our services.
            </p>
            <Button 
              variant="link" 
              className="p-0 h-auto"
              onClick={() => setLocation("/privacy-policy")}
              data-testid="link-privacy-policy"
            >
              View Privacy Policy →
            </Button>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Intellectual Property</h2>
            <div className="space-y-2 text-muted-foreground">
              <p><strong>Our Rights:</strong> ZYRA and its original content, features, and functionality are owned by ZYRA and are protected by international copyright, trademark, and other intellectual property laws.</p>
              <p className="mt-2"><strong>Your Rights:</strong> You retain all rights to your product data, campaign content, and other materials you upload to our platform.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Disclaimers & Limitations</h2>
            <div className="space-y-2 text-muted-foreground">
              <p><strong>Service Availability:</strong> We strive for 99.9% uptime but do not guarantee uninterrupted service.</p>
              <p><strong>No Warranties:</strong> The service is provided "AS IS" without warranties of any kind.</p>
              <p><strong>Limitation of Liability:</strong> ZYRA shall not be liable for any indirect, incidental, or consequential damages.</p>
              <p><strong>Maximum Liability:</strong> Our total liability shall not exceed the amount you paid us in the last 12 months.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Third-Party Services</h2>
            <p className="text-muted-foreground">
              Our platform integrates with third-party services (OpenAI, SendGrid, Twilio, PayPal, Razorpay). Your use of these services is subject to their respective terms and conditions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Indemnification</h2>
            <p className="text-muted-foreground">
              You agree to indemnify and hold ZYRA harmless from any claims, damages, losses, and expenses arising from your use of our services or violation of these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. We will notify users of significant changes via email or platform notification. Continued use of the service constitutes acceptance of modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">13. Governing Law</h2>
            <p className="text-muted-foreground">
              These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which ZYRA operates, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">14. Contact Information</h2>
            <p className="text-muted-foreground">
              For questions about these Terms of Service, please contact us at:
            </p>
            <div className="mt-2 p-3 bg-muted rounded">
              <p className="font-mono text-sm">legal@zyra.ai</p>
            </div>
          </section>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              By using ZYRA, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
