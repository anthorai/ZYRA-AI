import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Mail, MessageSquare, MapPin, Clock, Send, 
  CheckCircle2, Sparkles, Building2, Globe, Headphones
} from "lucide-react";
import { FaXTwitter, FaLinkedin } from "react-icons/fa6";
import { Helmet } from "react-helmet";

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    toast({
      title: "Message sent successfully!",
      description: "We'll get back to you within 24 hours.",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-background relative">
      <Helmet>
        <title>Contact Us - Zyra AI | Get in Touch</title>
        <meta name="description" content="Have questions about Zyra AI? Contact our team for support, partnerships, or general inquiries. We're here to help you grow your ecommerce business." />
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
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 overflow-hidden z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.08),transparent_50%)]" />
        
        <div className="container mx-auto max-w-5xl relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Get in Touch</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-[#00F0FF] via-[#00FFE5] to-[#FF00F5] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,240,255,0.3)]">
              Contact Us
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Have questions about Zyra AI? Our team is here to help you succeed with AI-powered ecommerce optimization.
          </p>
          
          <div className="mt-10 flex items-center justify-center gap-3">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary/50" />
            <Sparkles className="w-5 h-5 text-primary/50" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary/50" />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative py-12 sm:py-16 px-4 sm:px-6 z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
            
            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-md border border-primary/10 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-6 text-foreground">Contact Information</h2>
                
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Email Us</p>
                      <a href="mailto:support@zyra-ai.com" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        support@zyra-ai.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <Headphones className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Live Support</p>
                      <p className="text-sm text-muted-foreground">Available for Pro & Enterprise plans</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Response Time</p>
                      <p className="text-sm text-muted-foreground">Within 24 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Global Support</p>
                      <p className="text-sm text-muted-foreground">Serving merchants worldwide</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-md border border-primary/10 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4 text-foreground">Quick Links</h3>
                <div className="space-y-3">
                  <Link href="/help" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group" data-testid="link-help-center">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <MessageSquare className="w-4 h-4 text-primary" />
                    </div>
                    <span>Help Center</span>
                  </Link>
                  <Link href="/blog" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group" data-testid="link-blog">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <span>Blog & Resources</span>
                  </Link>
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-md border border-primary/10 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4 text-foreground">Follow Us</h3>
                <div className="flex items-center gap-3">
                  <a 
                    href="https://twitter.com/zyraai" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center hover:bg-primary/20 transition-colors"
                    data-testid="link-twitter"
                  >
                    <FaXTwitter className="w-5 h-5 text-primary" />
                  </a>
                  <a 
                    href="https://linkedin.com/company/zyraai" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center hover:bg-primary/20 transition-colors"
                    data-testid="link-linkedin"
                  >
                    <FaLinkedin className="w-5 h-5 text-primary" />
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-md border border-primary/10 rounded-xl p-6 sm:p-8">
                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-3">Message Sent!</h2>
                    <p className="text-muted-foreground mb-6">
                      Thank you for reaching out. We'll get back to you within 24 hours.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsSubmitted(false);
                        setFormData({ name: "", email: "", subject: "", message: "" });
                      }}
                      data-testid="button-send-another"
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-foreground mb-2">Send us a Message</h2>
                      <p className="text-muted-foreground text-sm">Fill out the form below and we'll respond as soon as possible.</p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="name">Your Name</Label>
                          <Input 
                            id="name"
                            name="name"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="bg-background/50 border-primary/20 focus:border-primary/50"
                            data-testid="input-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input 
                            id="email"
                            name="email"
                            type="email"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="bg-background/50 border-primary/20 focus:border-primary/50"
                            data-testid="input-email"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input 
                          id="subject"
                          name="subject"
                          placeholder="How can we help you?"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          className="bg-background/50 border-primary/20 focus:border-primary/50"
                          data-testid="input-subject"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea 
                          id="message"
                          name="message"
                          placeholder="Tell us more about your inquiry..."
                          value={formData.message}
                          onChange={handleChange}
                          required
                          rows={5}
                          className="bg-background/50 border-primary/20 focus:border-primary/50 resize-none"
                          data-testid="input-message"
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full gradient-button shadow-lg shadow-primary/20"
                        disabled={isSubmitting}
                        data-testid="button-submit"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </div>
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
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
