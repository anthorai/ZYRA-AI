import { useState } from "react";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { PageShell } from "@/components/ui/page-shell";
import { HelpCircle, FileText, MessageSquare, Mail, Users, ExternalLink, Send, Book, Video, LifeBuoy } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function SupportPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

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
      toast({
        title: "Message Sent",
        description: "Thank you! Our team will review your message shortly",
        duration: 3000,
      });
      setSubject("");
      setMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send",
        description: error.message || "Please try again later",
        variant: "destructive",
        duration: 3000,
      });
    }
  });

  const handleSubmitFeedback = () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a subject and message",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    submitTicketMutation.mutate({ subject, message });
  };

  const resourceLinks = [
    {
      id: "getting-started",
      title: "Getting Started Guide",
      description: "Learn the basics of using Zyra AI",
      icon: <Book className="w-5 h-5" />,
      action: "View Guide"
    },
    {
      id: "video-tutorials",
      title: "Video Tutorials",
      description: "Watch step-by-step video guides",
      icon: <Video className="w-5 h-5" />,
      action: "Watch Videos"
    },
    {
      id: "api-docs",
      title: "API Documentation",
      description: "Integrate Zyra AI with your systems",
      icon: <FileText className="w-5 h-5" />,
      action: "Read Docs"
    },
    {
      id: "best-practices",
      title: "Best Practices",
      description: "Tips to maximize your results",
      icon: <LifeBuoy className="w-5 h-5" />,
      action: "Learn More"
    }
  ];

  return (
    <PageShell
      title="Help & Support"
      subtitle="Get help, browse resources, and contact our support team"
      maxWidth="xl"
      spacing="normal"
      useHistoryBack={true}
    >
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <DashboardCard size="sm" testId="card-live-chat">
            <Button
              variant="ghost"
              className="w-full h-auto p-0 hover:bg-transparent"
              onClick={() => {
                toast({
                  title: "Opening Live Chat",
                  description: "Connecting to support team...",
                  duration: 2000,
                });
              }}
              data-testid="button-live-chat"
            >
              <div className="flex flex-col items-center text-center space-y-3 min-w-0">
                <div className="p-3 rounded-lg bg-primary/20 flex-shrink-0">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0 w-full">
                  <h3 className="text-white font-semibold text-base sm:text-lg md:text-xl truncate">Live Chat</h3>
                  <p className="text-[10px] sm:text-xs md:text-sm text-slate-400 mt-1 truncate">Get instant help</p>
                </div>
              </div>
            </Button>
        </DashboardCard>

        <DashboardCard size="sm" testId="card-documentation">
            <Button
              variant="ghost"
              className="w-full h-auto p-0 hover:bg-transparent"
              onClick={() => {
                toast({
                  title: "Opening Documentation",
                  description: "Loading help center...",
                  duration: 2000,
                });
              }}
              data-testid="button-documentation"
            >
              <div className="flex flex-col items-center text-center space-y-3 min-w-0">
                <div className="p-3 rounded-lg bg-primary/20 flex-shrink-0">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0 w-full">
                  <h3 className="text-white font-semibold text-base sm:text-lg md:text-xl truncate">Documentation</h3>
                  <p className="text-[10px] sm:text-xs md:text-sm text-slate-400 mt-1 truncate">Browse guides & FAQs</p>
                </div>
              </div>
            </Button>
        </DashboardCard>

        <DashboardCard size="sm" testId="card-community">
            <Button
              variant="ghost"
              className="w-full h-auto p-0 hover:bg-transparent"
              onClick={() => {
                toast({
                  title: "Opening Community",
                  description: "Redirecting to community forum...",
                  duration: 2000,
                });
              }}
              data-testid="button-community"
            >
              <div className="flex flex-col items-center text-center space-y-3 min-w-0">
                <div className="p-3 rounded-lg bg-primary/20 flex-shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0 w-full">
                  <h3 className="text-white font-semibold text-base sm:text-lg md:text-xl truncate">Community</h3>
                  <p className="text-[10px] sm:text-xs md:text-sm text-slate-400 mt-1 truncate">Join the discussion</p>
                </div>
              </div>
            </Button>
        </DashboardCard>
      </div>

      {/* Help Resources */}
      <DashboardCard
        title="Help Resources"
        description="Explore our documentation and learning materials"
        headerAction={<FileText className="w-5 h-5 text-primary" />}
        testId="card-help-resources"
      >
        <div className="space-y-3">
          {resourceLinks.map((resource) => (
            <div key={resource.id}>
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors min-w-0">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="p-2 rounded-lg bg-primary/20 flex-shrink-0">
                    <div className="text-primary">{resource.icon}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-white font-medium text-base sm:text-lg md:text-xl truncate">{resource.title}</h4>
                    <p className="text-[10px] sm:text-xs md:text-sm text-slate-400 truncate">{resource.description}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:bg-primary/10"
                  onClick={() => {
                    const routes: Record<string, string> = {
                      'getting-started': '/help/getting-started',
                      'video-tutorials': '/help/tutorials',
                      'api-docs': '/help/api',
                      'best-practices': '/help/best-practices'
                    };
                    setLocation(routes[resource.id] || '/help/getting-started');
                  }}
                  data-testid={`button-resource-${resource.id}`}
                >
                  {resource.action}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>

      {/* Contact Support */}
      <DashboardCard
        title="Contact Support"
        description="Send us a message and we'll get back to you as soon as possible"
        headerAction={<Mail className="w-5 h-5 text-primary" />}
        testId="card-contact-support"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-white">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What do you need help with?"
              className="bg-slate-800/50 border-slate-600 text-white"
              data-testid="input-support-subject"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message" className="text-white">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue or question in detail..."
              rows={6}
              className="bg-slate-800/50 border-slate-600 text-white resize-none"
              data-testid="textarea-support-message"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setSubject("");
                setMessage("");
              }}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
              data-testid="button-clear-form"
            >
              Clear
            </Button>
            <Button
              onClick={handleSubmitFeedback}
              className="gradient-button"
              disabled={submitTicketMutation.isPending}
              data-testid="button-submit-support"
            >
              <Send className="w-4 h-4 mr-2" />
              {submitTicketMutation.isPending ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </div>
      </DashboardCard>

      {/* Additional Support Options */}
      <DashboardCard className="bg-primary/5" testId="card-additional-support">
          <div className="flex items-start space-x-4">
            <div className="p-2 rounded-lg bg-primary/20">
              <LifeBuoy className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-2">Need urgent help?</h3>
              <p className="text-slate-400 text-sm mb-4">
                For critical issues or urgent support needs, you can reach our priority support team via live chat or email us directly at team@zzyraai.com
              </p>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary text-primary hover:bg-primary/10"
                  data-testid="button-email-support"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Support
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary text-primary hover:bg-primary/10"
                  data-testid="button-schedule-call"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Schedule a Call
                </Button>
              </div>
            </div>
          </div>
      </DashboardCard>
    </PageShell>
  );
}
