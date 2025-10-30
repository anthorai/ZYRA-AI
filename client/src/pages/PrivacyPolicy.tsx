import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Download, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { PageContainer } from "@/components/ui/standardized-layout";

export default function PrivacyPolicy() {
  const [, setLocation] = useLocation();

  return (
    <PageContainer>
      <div className="mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.history.back()}
          className="text-slate-200 hover:text-primary hover:bg-white/10 transition-all duration-300 ease-in-out flex-shrink-0"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>
      <Card>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-muted-foreground">
              ZYRA ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered e-commerce optimization platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
            <div className="space-y-2 text-muted-foreground">
              <p><strong>Personal Information:</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Name and email address (for account creation)</li>
                <li>Payment information (processed securely through Stripe, PayPal, or Razorpay)</li>
                <li>Business information (store connections, product data)</li>
              </ul>
              <p className="mt-3"><strong>Automatically Collected Information:</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Usage data and analytics</li>
                <li>Device information and IP address</li>
                <li>Cookies and tracking technologies</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Provide and maintain our services</li>
              <li>Process your transactions</li>
              <li>Send you marketing campaigns (with your consent)</li>
              <li>Improve our AI models and platform features</li>
              <li>Provide customer support</li>
              <li>Detect and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Data Sharing</h2>
            <p className="text-muted-foreground mb-2">We may share your information with:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Service Providers:</strong> OpenAI (AI generation), SendGrid (emails), Twilio (SMS), payment processors</li>
              <li><strong>Legal Compliance:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with mergers or acquisitions</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              We <strong>never sell</strong> your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Your GDPR Rights</h2>
            <p className="text-muted-foreground mb-3">
              If you are in the European Economic Area (EEA), you have the following rights:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
              <li><strong>Right to Rectification:</strong> Correct inaccurate data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your data</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a structured format</li>
              <li><strong>Right to Object:</strong> Object to data processing</li>
              <li><strong>Right to Restrict Processing:</strong> Request limited processing</li>
            </ul>
            
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
              <p className="font-medium">Exercise Your Rights:</p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation("/settings")}
                  data-testid="button-export-data"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export My Data
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setLocation("/settings")}
                  data-testid="button-delete-account"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete My Account
                </Button>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Data Security</h2>
            <p className="text-muted-foreground">
              We implement industry-standard security measures including encryption, secure data transmission, regular security audits, and access controls to protect your information. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your personal data only as long as necessary to provide our services and comply with legal obligations. When you delete your account, we remove your data immediately, with backups deleted within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Children's Privacy</h2>
            <p className="text-muted-foreground">
              Our services are not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <div className="mt-2 p-3 bg-muted rounded">
              <p className="font-mono text-sm">privacy@zyra.ai</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
