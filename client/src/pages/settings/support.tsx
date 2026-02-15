import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { PageShell } from "@/components/ui/page-shell";
import { FileText, MessageSquare, Mail, Users, ExternalLink, Send, Book, Video, LifeBuoy } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const sectionCardStyle = {
  background: '#121833',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '14px',
};

const quickActions = [
  {
    id: 'live-chat',
    title: 'Live Chat',
    description: 'Get instant help',
    icon: MessageSquare,
    accent: '#22C55E',
    toastTitle: 'Coming Soon',
    toastDesc: 'Live chat will be available soon!',
    comingSoon: true,
  },
  {
    id: 'documentation',
    title: 'Documentation',
    description: 'Browse guides & FAQs',
    icon: FileText,
    accent: '#00F0FF',
    toastTitle: 'Opening Documentation',
    toastDesc: 'Loading help center...',
    comingSoon: false,
  },
  {
    id: 'community',
    title: 'Community',
    description: 'Join the discussion',
    icon: Users,
    accent: '#A78BFA',
    toastTitle: 'Opening Community',
    toastDesc: 'Redirecting to community forum...',
    comingSoon: false,
  },
];

const resourceLinks = [
  {
    id: "getting-started",
    title: "Getting Started Guide",
    description: "Learn the basics of using Zyra AI",
    icon: Book,
    action: "View Guide"
  },
  {
    id: "video-tutorials",
    title: "Video Tutorials",
    description: "Watch step-by-step video guides",
    icon: Video,
    action: "Watch Videos"
  },
  {
    id: "api-docs",
    title: "API Documentation",
    description: "Integrate Zyra AI with your systems",
    icon: FileText,
    action: "Read Docs"
  },
  {
    id: "best-practices",
    title: "Best Practices",
    description: "Tips to maximize your results",
    icon: LifeBuoy,
    action: "Learn More"
  }
];

export default function SupportPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const testEmailMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/settings/test-email', {});
    },
    onSuccess: () => {
      toast({ title: "Test Email Sent", description: "Check your inbox and spam folder for a test email from Zyra AI", duration: 5000 });
    },
    onError: (error: any) => {
      toast({ title: "Test Email Failed", description: error.message || "Email service error", variant: "destructive", duration: 3000 });
    }
  });

  const submitTicketMutation = useMutation({
    mutationFn: async (data: { subject: string; message: string }) => {
      return await apiRequest('POST', '/api/settings/support', {
        subject: data.subject,
        message: data.message,
        category: 'general',
        priority: 'medium',
        status: 'open'
      });
    },
    onSuccess: () => {
      toast({ title: "Message Sent", description: "Thank you! Our team will review your message shortly", duration: 3000 });
      setSubject("");
      setMessage("");
    },
    onError: (error: any) => {
      toast({ title: "Failed to Send", description: error.message || "Please try again later", variant: "destructive", duration: 3000 });
    }
  });

  const handleSubmitFeedback = () => {
    if (!subject.trim() || !message.trim()) {
      toast({ title: "Missing Information", description: "Please provide both a subject and message", variant: "destructive", duration: 3000 });
      return;
    }
    submitTicketMutation.mutate({ subject, message });
  };

  return (
    <PageShell
      title="Help & Support"
      subtitle="Get help, browse resources, and contact our support team"
      maxWidth="xl"
      spacing="normal"
      useHistoryBack={true}
    >
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              className="relative overflow-hidden text-left w-full"
              style={sectionCardStyle}
              data-testid={`button-${action.id}`}
              onClick={() => {
                toast({ title: action.toastTitle, description: action.toastDesc, duration: 2000 });
              }}
            >
              <div
                className="absolute top-0 left-0 bottom-0 w-[3px]"
                style={{ background: action.accent, borderRadius: '14px 0 0 14px' }}
              />
              <div className="p-5 flex flex-col items-center text-center space-y-3">
                {action.comingSoon && (
                  <span
                    className="absolute top-2.5 right-2.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                    style={{ background: `${action.accent}20`, color: action.accent }}
                  >
                    Coming Soon
                  </span>
                )}
                <div className="p-3 rounded-lg" style={{ background: `${action.accent}15`, opacity: action.comingSoon ? 0.5 : 1 }}>
                  <Icon className="w-6 h-6" style={{ color: `${action.accent}CC` }} />
                </div>
                <div>
                  <h3 className="font-semibold text-base sm:text-lg" style={{ color: '#E6F7FF', opacity: action.comingSoon ? 0.6 : 1 }}>
                    {action.title}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: '#7C86B8' }}>
                    {action.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Help Resources */}
      <div
        className="overflow-hidden"
        style={{
          background: '#0F152B',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
        data-testid="card-help-resources"
      >
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-1">
            <FileText className="w-5 h-5" style={{ color: '#00F0FFCC' }} />
            <h3 className="font-semibold text-base sm:text-lg" style={{ color: '#E6F7FF' }}>
              Help Resources
            </h3>
          </div>
          <p className="text-sm mb-4" style={{ color: '#7C86B8' }}>
            Explore our documentation and learning materials
          </p>
        </div>

        <div>
          {resourceLinks.map((resource, index) => {
            const Icon = resource.icon;
            return (
              <div
                key={resource.id}
                className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 transition-colors"
                style={{
                  background: '#121833',
                  borderBottom: index < resourceLinks.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}
                data-testid={`resource-row-${resource.id}`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-2 rounded-lg flex-shrink-0" style={{ background: '#00F0FF15' }}>
                    <Icon className="w-5 h-5" style={{ color: '#00F0FFCC' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium truncate" style={{ color: '#E6F7FF' }}>
                      {resource.title}
                    </h4>
                    <p className="text-sm truncate" style={{ color: '#A9B4E5' }}>
                      {resource.description}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const routes: Record<string, string> = {
                      'getting-started': '/help/getting-started',
                      'video-tutorials': '/help/tutorials',
                      'api-docs': '/help/api',
                      'best-practices': '/help/best-practices'
                    };
                    setLocation(routes[resource.id] || '/help/getting-started');
                  }}
                  style={{ color: '#00F0FF' }}
                  data-testid={`button-resource-${resource.id}`}
                >
                  {resource.action}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact Support */}
      <div
        className="relative overflow-hidden"
        style={{
          background: '#131B34',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
        data-testid="card-contact-support"
      >
        <div
          className="absolute top-0 left-0 bottom-0 w-[3px]"
          style={{ background: '#00F0FF', borderRadius: '16px 0 0 16px' }}
        />
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-1">
            <Mail className="w-5 h-5" style={{ color: '#00F0FFCC' }} />
            <h3 className="font-semibold text-base sm:text-lg" style={{ color: '#E6F7FF' }}>
              Contact Support
            </h3>
          </div>
          <p className="text-sm mb-5" style={{ color: '#7C86B8' }}>
            Send us a message and we'll get back to you as soon as possible
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject" style={{ color: '#E6F7FF' }}>Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What do you need help with?"
                className="focus:ring-1 placeholder:text-[#7C86B8]"
                style={{
                  background: '#0F152B',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#E6F7FF',
                  ['--tw-ring-color' as string]: '#00F0FF',
                }}
                data-testid="input-support-subject"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" style={{ color: '#E6F7FF' }}>Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or question in detail..."
                rows={6}
                className="resize-none focus:ring-1 placeholder:text-[#7C86B8]"
                style={{
                  background: '#0F152B',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#E6F7FF',
                  ['--tw-ring-color' as string]: '#00F0FF',
                }}
                data-testid="textarea-support-message"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setSubject("");
                  setMessage("");
                }}
                style={{
                  background: '#1A2142',
                  color: '#E6F7FF',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                data-testid="button-clear-form"
              >
                Clear
              </Button>
              <Button
                onClick={handleSubmitFeedback}
                disabled={submitTicketMutation.isPending}
                style={{
                  background: '#00F0FF',
                  color: '#04141C',
                  fontWeight: 600,
                  borderRadius: '10px',
                }}
                data-testid="button-submit-support"
              >
                <Send className="w-4 h-4 mr-2" />
                {submitTicketMutation.isPending ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Urgent Support Footer */}
      <div
        className="p-4 sm:p-5"
        style={{
          background: '#0F152B',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
        }}
        data-testid="card-additional-support"
      >
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-lg flex-shrink-0" style={{ background: '#00F0FF15' }}>
            <LifeBuoy className="w-6 h-6" style={{ color: '#00F0FFCC' }} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1" style={{ color: '#E6F7FF' }}>
              Need urgent help?
            </h3>
            <p className="text-sm mb-4" style={{ color: '#A9B4E5' }}>
              For critical issues or urgent support needs, you can reach our priority support team via live chat or email us directly at team@zzyraai.com
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => testEmailMutation.mutate()}
                disabled={testEmailMutation.isPending}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(0,240,255,0.4)',
                  color: '#00F0FF',
                }}
                data-testid="button-test-email"
              >
                <Mail className="w-4 h-4 mr-2" />
                {testEmailMutation.isPending ? "Sending..." : "Send Test Email"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(0,240,255,0.4)',
                  color: '#00F0FF',
                }}
                data-testid="button-email-support"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email Support
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(167,139,250,0.25)',
                  color: '#A78BFA',
                  opacity: 0.6,
                }}
                data-testid="button-schedule-call"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Schedule a Call
                <span
                  className="ml-2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(167,139,250,0.15)', color: '#A78BFA' }}
                >
                  Soon
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
