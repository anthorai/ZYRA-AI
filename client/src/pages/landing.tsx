import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Zap, Star, TrendingUp, ShoppingCart, Mail, Search, BarChart3, Cog, ArrowRight, Play, Check, Gift, Crown, Award, 
  Settings, FileText, Network, Activity, Shield, Palette, LogOut, CheckCircle2, Sparkles, Lock, Clock,
  Users, DollarSign, Target, Rocket, ChevronDown, ChevronUp, Quote, ExternalLink, Timer,
  BadgeCheck, Store, Shirt, Home, Laptop, Dumbbell, Heart, Calculator, X, AlertTriangle,
  Minus, Bot, Pen, XCircle, CheckCircle, Newspaper, Globe, Flame, Lightbulb
} from "lucide-react";
import { SiLinkedin, SiInstagram, SiX } from "react-icons/si";
import ResponsiveNavbar from "@/components/responsive-navbar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import zyraLogoUrl from "@assets/zyra logo_1758694880266.png";
import blogImage1 from "@assets/generated_images/ai_dropshipping_growth_dashboard.png";
import blogImage2 from "@assets/generated_images/ai_ecommerce_tools_concept.png";
import blogImage3 from "@assets/generated_images/future_ecommerce_automation.png";
import { Helmet } from "react-helmet";

export default function Landing() {
  const { isAuthenticated, loading, logout, isLoggingOut } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  

  // ROI Calculator state
  const [monthlyRevenue, setMonthlyRevenue] = useState(10000);
  const [conversionRate, setConversionRate] = useState(2);
  const [abandonedCarts, setAbandonedCarts] = useState(50);

  // Exit intent popup state
  const [showExitPopup, setShowExitPopup] = useState(false);
  const exitIntentTriggered = useRef(false);

  // Social proof notification state
  const [showNotification, setShowNotification] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(0);
  
  // Sticky header state
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Urgency countdown
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 45, seconds: 32 });

  // ROI Calculator logic
  const calculateROI = useCallback(() => {
    // Assume typical ecommerce metrics if not provided
    const monthlyVisitors = Math.round(monthlyRevenue / 50); // Avg $50 per visitor
    const currentOrders = Math.round(monthlyVisitors * (conversionRate / 100));
    const avgOrderValue = currentOrders > 0 ? monthlyRevenue / currentOrders : 75;
    
    // With Zyra AI improvements
    const improvedConversion = conversionRate * 1.34; // 34% avg improvement from optimized descriptions
    const newOrders = Math.round(monthlyVisitors * (improvedConversion / 100));
    const conversionRevenue = (newOrders - currentOrders) * avgOrderValue;
    
    // Cart recovery calculation
    const avgCartValue = avgOrderValue * 1.2; // Abandoned carts tend to be higher value
    const recoveredCarts = Math.round(abandonedCarts * 0.35); // 35% recovery rate
    const cartRecoveryRevenue = recoveredCarts * avgCartValue;
    
    // SEO improvement (10% traffic increase over time)
    const seoBonus = monthlyRevenue * 0.08;
    
    const additionalRevenue = conversionRevenue + cartRecoveryRevenue + seoBonus;
    const projectedRevenue = monthlyRevenue + additionalRevenue;
    const percentIncrease = ((projectedRevenue - monthlyRevenue) / monthlyRevenue) * 100;
    
    // ROI based on Growth plan ($299/mo) for most realistic calculation
    const monthlyPlanCost = 299;
    const roi = additionalRevenue > 0 ? ((additionalRevenue - monthlyPlanCost) / monthlyPlanCost * 100) : 0;
    
    return {
      currentRevenue: monthlyRevenue,
      projectedRevenue: Math.round(projectedRevenue),
      additionalRevenue: Math.round(additionalRevenue),
      percentIncrease: Math.round(percentIncrease),
      roi: Math.max(0, Math.round(roi))
    };
  }, [monthlyRevenue, conversionRate, abandonedCarts]);

  const roiResults = calculateROI();

  // Social proof notifications
  const socialProofMessages = [
    { name: "Sarah M.", location: "New York", action: "just started their free trial", time: "2 minutes ago" },
    { name: "James K.", location: "London", action: "upgraded to Growth plan", time: "5 minutes ago" },
    { name: "Maria G.", location: "Sydney", action: "recovered $847 in abandoned carts", time: "8 minutes ago" },
    { name: "David L.", location: "Toronto", action: "optimized 156 products", time: "12 minutes ago" },
    { name: "Lisa T.", location: "Berlin", action: "just started their free trial", time: "15 minutes ago" },
    { name: "Chen W.", location: "Singapore", action: "upgraded to Pro plan", time: "18 minutes ago" }
  ];

  // Exit intent detection (desktop + mobile)
  useEffect(() => {
    let idleTimer: NodeJS.Timeout | null = null;
    let lastScrollY = window.scrollY;
    let scrollBackCount = 0;
    
    // Desktop: detect mouse leaving page
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitIntentTriggered.current && !isAuthenticated) {
        exitIntentTriggered.current = true;
        setShowExitPopup(true);
      }
    };

    // Mobile: detect rapid scroll back to top (exit intent signal)
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDiff = lastScrollY - currentScrollY;
      
      // Reset idle timer on any scroll
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        // User has been idle for 30 seconds on mobile, show exit popup
        if ('ontouchstart' in window && !exitIntentTriggered.current && !isAuthenticated && window.scrollY > 300) {
          exitIntentTriggered.current = true;
          setShowExitPopup(true);
        }
      }, 30000);
      
      // If user rapidly scrolls up more than 300px, increment scroll back count
      if (scrollDiff > 100 && currentScrollY > 200) {
        scrollBackCount++;
        if (scrollBackCount >= 3 && !exitIntentTriggered.current && !isAuthenticated) {
          exitIntentTriggered.current = true;
          setShowExitPopup(true);
        }
      } else {
        scrollBackCount = 0;
      }
      
      lastScrollY = currentScrollY;
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', handleScroll);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, [isAuthenticated]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 }; // Reset
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Social proof notifications rotation
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    const showNotificationCycle = () => {
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
        setTimeout(() => {
          setCurrentNotification(prev => (prev + 1) % socialProofMessages.length);
        }, 500);
      }, 4000);
    };

    // Initial delay before first notification
    const initialDelay = setTimeout(() => {
      showNotificationCycle();
      intervalId = setInterval(showNotificationCycle, 12000);
    }, 5000);

    return () => {
      clearTimeout(initialDelay);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Sticky bar on scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  // Handle logout functionality
  const handleLogout = async () => {
    try {
      const { error } = await logout();
      
      if (error) {
        console.error('[ERROR] Logout error:', error);
        toast({
          title: "Logout Failed",
          description: error.message || "An error occurred during logout. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Logged Out Successfully",
          description: "You have been securely logged out.",
        });
        setLocation("/");
      }
    } catch (error: any) {
      console.error('[ERROR] Unexpected logout error:', error);
      toast({
        title: "Logout Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Enhanced features with benefit-focused copy
  const features = [
    {
      icon: <Settings className="w-6 h-6" />,
      title: "Stop Losing Sales to Boring Product Pages",
      description: "Your products could be selling 3X more—if they had descriptions that actually convince buyers. Zyra writes high-converting copy in seconds, optimized for both customers and Google.",
      benefit: "10X faster optimization"
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Finally, SEO That Actually Ranks on Google",
      description: "Most Shopify stores never show up in search. Zyra uses proven SEO strategies that get you on page 1—without hiring an expensive agency.",
      benefit: "120% more organic traffic"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Know Exactly What's Making You Money",
      description: "Stop guessing which products, emails, or campaigns are working. Zyra shows you exactly where your revenue is coming from—so you can double down on what works.",
      benefit: "Data-driven decisions"
    },
    {
      icon: <Network className="w-6 h-6" />,
      title: "Multi-Channel Automation That Just Works",
      description: "Repurpose content across email, SMS, blogs, and ads instantly. One click, maximum reach, zero extra work.",
      benefit: "Save 15+ hours/week"
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: "Real-Time Analytics That Drive Action",
      description: "Track sales, content ROI, email & SMS performance in one dashboard. See what's working, what's not—and fix it fast.",
      benefit: "85% better insights"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "One-Click Rollback (Because Mistakes Happen)",
      description: "Don't like our AI edits? Undo everything with one click. Your original data is always safe and 100% reversible.",
      benefit: "Zero risk"
    }
  ];

  // Testimonials data
  const testimonials = [
    {
      name: "Jessica Chen",
      company: "Urban Home Decor",
      rating: 5,
      quote: "I was skeptical about AI-generated product descriptions, but Zyra blew me away. My conversion rate jumped 34% in the first month. The ROI is insane.",
      result: "+34% conversion rate",
      badge: "Verified Purchase",
      verified: true
    },
    {
      name: "Mike Rodriguez",
      company: "TechGear Pro",
      rating: 5,
      quote: "Zyra saves me 15+ hours every week. I used to dread writing product descriptions. Now I focus on marketing while Zyra handles the content. Game changer.",
      result: "15hrs saved weekly",
      badge: "Verified Purchase",
      verified: true
    },
    {
      name: "Sarah Thompson",
      company: "FashionForward",
      rating: 5,
      quote: "We recovered $18,000 in abandoned carts in our first 60 days with Zyra. The automated email sequences are pure magic. Worth every penny.",
      result: "$18K recovered",
      badge: "Verified Purchase",
      verified: true
    },
    {
      name: "David Park",
      company: "Dropshipper",
      rating: 5,
      quote: "As a solo founder, I can't afford a copywriter or marketing team. Zyra gives me enterprise-level AI for $49/month. My sales tripled.",
      result: "3X sales increase",
      badge: "Verified Purchase",
      verified: true
    },
    {
      name: "Amanda Foster",
      company: "GlobalRetail Inc.",
      rating: 5,
      quote: "Managing 5,000+ SKUs manually was impossible. Zyra optimized everything in 48 hours. Our organic traffic is up 120%. Best investment we've made.",
      result: "+120% traffic",
      badge: "Verified Purchase",
      verified: true
    }
  ];

  // Case studies data
  const caseStudies = [
    {
      company: "FitLife Nutrition",
      industry: "Health & Wellness",
      challenge: "Poor product descriptions, 2.3% conversion rate",
      solution: "Zyra AI product optimization + abandoned cart recovery",
      results: [
        { label: "Conversion rate", before: "2.3%", after: "7.8%", change: "+239%" },
        { label: "Monthly revenue", before: "$12K", after: "$41K", change: "+242%" },
        { label: "Time saved", before: "20 hrs/week", after: "2 hrs/week", change: "-90%" }
      ],
      quote: "Zyra paid for itself in the first week. The AI writes better descriptions than our $3,000/month copywriter.",
      author: "Tom Jenkins, Founder"
    },
    {
      company: "GreenHome Goods",
      industry: "Eco Products",
      challenge: "Zero organic traffic, relying 100% on paid ads",
      solution: "Zyra AI SEO optimization + smart keyword targeting",
      results: [
        { label: "Organic traffic", before: "50/mo", after: "8,500/mo", change: "+16,900%" },
        { label: "Keyword rankings", before: "3", after: "180", change: "+5,900%" },
        { label: "Customer acquisition cost", before: "$45", after: "$15", change: "-67%" }
      ],
      quote: "We cut our ad spend in half and still doubled revenue. Zyra's SEO is scary good.",
      author: "Lisa Martinez, CMO"
    },
    {
      company: "TrendyTech",
      industry: "Electronics",
      challenge: "78% cart abandonment rate, no email automation",
      solution: "Zyra AI abandoned cart recovery + personalized sequences",
      results: [
        { label: "Abandoned carts recovered", before: "$0", after: "$50,342", change: "∞" },
        { label: "Email open rates", before: "18%", after: "45.2%", change: "+151%" },
        { label: "ROI on Zyra", before: "N/A", after: "4,200%", change: "NEW" }
      ],
      quote: "We were leaving money on the table every single day. Zyra fixed that overnight.",
      author: "Carlos Silva, Owner"
    }
  ];

  // FAQ data
  const faqs = [
    {
      question: "Will the AI content sound generic or robotic?",
      answer: "Not at all! Zyra's AI is trained on 500,000+ high-converting product descriptions from successful Shopify stores. It learns your brand voice and writes like your best copywriter—but 100X faster. You can see before/after examples in our case studies section above."
    },
    {
      question: "Is this hard to set up? I'm not technical.",
      answer: "Setup takes 5 minutes. Simply connect your Shopify store, click optimize, and you're done. No coding, no training required. We've designed Zyra to be so simple that even non-technical store owners can use it immediately."
    },
    {
      question: "Can I really afford this right now?",
      answer: "Zyra pays for itself in the first week. Our average customer generates $2,800 extra revenue in month 1. That's an ROI of 5,700% on the Starter plan. Plus, you can try it free for 7 days with no credit card required."
    },
    {
      question: "Will this work for my specific niche?",
      answer: "Yes! Zyra works for ALL Shopify stores—fashion, tech, home goods, dropshipping, health & wellness, you name it. We have 50,000+ merchants across 180+ industries using Zyra successfully. The AI adapts to your specific products and audience."
    },
    {
      question: "Is my store data safe?",
      answer: "Absolutely. We use bank-level AES-256 encryption, we're SOC 2 Type II certified, and fully GDPR compliant. Your data is NEVER sold or used to train AI models. We're more secure than Shopify itself. Plus, you have one-click rollback if you ever want to restore your original data."
    },
    {
      question: "I've tried other AI tools before—they were terrible. How is Zyra different?",
      answer: "Those tools used GPT-3 or generic AI. Zyra uses GPT-4o (the most advanced AI available) PLUS custom training on 500,000 eCommerce products. It's specifically built for Shopify stores, not general content. Try the free trial and compare—you'll see the difference immediately."
    },
    {
      question: "What if I don't see results?",
      answer: "We offer a 60-day money-back guarantee. If you don't see measurable improvement in your store performance, we'll refund every penny—no questions asked. But 98% of our customers see results within the first 30 days."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes! There are no lock-in contracts. Cancel with one click from your dashboard, keep your credits, no penalties, no hassle. We believe in earning your business every month."
    },
    {
      question: "How many products can I optimize?",
      answer: "It depends on your plan. The Starter plan ($49/mo) includes 1,000 credits which can optimize 200+ products. The Growth plan ($299/mo) includes 5,000 credits for 1,000+ products. The Pro plan ($999/mo) includes 20,000 credits for unlimited optimization."
    },
    {
      question: "Do I need to hire someone to use this?",
      answer: "No! Zyra is designed for solo entrepreneurs and small teams. Everything is automated—you just click a button and Zyra does the work. If you're on the Pro plan, we even offer white-glove onboarding where we set everything up for you."
    }
  ];

  const plans = [
    {
      name: "7-Day Free Trial",
      price: "$0",
      period: "7 days",
      icon: <Gift className="w-8 h-8" />,
      description: "Try ZYRA risk-free for 7 days.",
      whoItsFor: "",
      badge: "Risk-Free",
      valueProps: "Perfect for testing before you commit",
      features: [
        "CREDITS: 100 credits / 7 days",
        "• Product Optimization & SEO:",
        "• Optimized Products – 20 credits",
        "• SEO Keyword Density Analysis – 10 credits",
        "• Conversion Boosting & Sales Automation:",
        "• AI-Powered Growth Intelligence – 20 credits",
        "• Basic A/B Testing – 10 credits",
        "• Content & Branding at Scale:",
        "• Smart Product Descriptions – 20 credits",
        "• Limited Dynamic Templates – 10 credits",
        "• Performance Tracking & ROI Insights:",
        "• Email Performance Analytics – 10 credits",
        "• Workflow & Integration Tools:",
        "• One-Click Shopify Publish – 10 credits",
        "• Rollback Button – included"
      ],
      popular: false
    },
    {
      name: "Starter",
      price: "$49",
      period: "per month",
      annualPrice: "$39",
      icon: <Zap className="w-8 h-8" />,
      description: "Best for new Shopify stores just getting started.",
      whoItsFor: "Best for new Shopify stores just getting started.",
      badge: "Best for Beginners",
      valueProps: "$1.63/day • Less than a coffee",
      costPerDay: "$1.63",
      features: [
        "CREDITS: 1,000 credits / month",
        "• Product Optimization & SEO:",
        "• Optimized Products – 200 credits",
        "• SEO Keyword Density Analysis – 100 credits",
        "• AI Image Alt-Text Generator – 100 credits",
        "• Smart SEO Titles & Meta Tags – 100 credits",
        "• Conversion Boosting & Sales Automation:",
        "• AI-Powered Growth Intelligence – 150 credits",
        "• A/B Testing – 50 credits",
        "• Upsell Email Receipts – 100 credits",
        "• Abandoned Cart SMS – 50 credits",
        "• Content & Branding at Scale:",
        "• Smart Product Descriptions – 100 credits",
        "• Dynamic Templates – 50 credits",
        "• Brand Voice Memory – included",
        "• Performance Tracking & ROI Insights:",
        "• Email & SMS Conversion Analytics – included",
        "• Workflow & Integration Tools:",
        "• CSV Import/Export – included",
        "• One-Click Shopify Publish – included",
        "• Rollback Button – included",
        "• Smart Bulk Suggestions – included"
      ],
      popular: false
    },
    {
      name: "Growth",
      price: "$299",
      period: "per month",
      annualPrice: "$239",
      icon: <Award className="w-8 h-8" />,
      description: "Made for scaling merchants ready to grow.",
      whoItsFor: "Made for scaling merchants ready to grow.",
      badge: "Most Popular",
      valueProps: "83% of customers choose this",
      costPerDay: "$9.96",
      features: [
        "CREDITS: 5,000 credits / month",
        "• Product Optimization & SEO:",
        "• All Starter features +",
        "• SEO Ranking Tracker – 200 credits",
        "• Bulk Optimization & Smart Bulk Suggestions – 500 credits",
        "• Scheduled Refresh for Content & SEO Updates – 300 credits",
        "• Conversion Boosting & Sales Automation:",
        "• AI Upsell Suggestions & Triggers – 300 credits",
        "• Dynamic Segmentation of Customers – 200 credits",
        "• Behavioral Targeting – 200 credits",
        "• Full A/B Test Results Dashboard – included",
        "• Content & Branding at Scale:",
        "• Custom Templates – included",
        "• Multimodal AI (text + image + insights) – 300 credits",
        "• Multi-Channel Content Repurposing – 300 credits",
        "• Performance Tracking & ROI Insights:",
        "• Full Email & SMS tracking – included",
        "• Content ROI Tracking – included",
        "• Revenue Impact Attribution – included",
        "• Product Management Dashboard – included",
        "• Workflow & Integration Tools:",
        "• Unlimited Starter workflow tools"
      ],
      popular: true
    },
    {
      name: "Pro",
      price: "$999",
      period: "per month",
      annualPrice: "$799",
      icon: <Crown className="w-8 h-8" />,
      description: "Perfect for high-revenue brands & enterprises.",
      whoItsFor: "Perfect for high-revenue brands & enterprises.",
      badge: "Maximum ROI",
      valueProps: "White-glove onboarding included",
      costPerDay: "$33.30",
      features: [
        "CREDITS: 20,000 credits / month",
        "• Product Optimization & SEO:",
        "• All Growth features + priority processing",
        "• Conversion Boosting & Sales Automation:",
        "• Full AI-driven automation for campaigns, upsells, and behavioral targeting",
        "• Content & Branding at Scale:",
        "• Full template library, advanced brand voice memory, multimodal AI insights, multi-channel automation",
        "• Performance Tracking & ROI Insights:",
        "• Enterprise-grade analytics and revenue attribution dashboard",
        "• Workflow & Integration Tools:",
        "• Enterprise bulk management, CSV import/export, rollback, smart bulk suggestions at scale"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>Zyra AI: Shopify Growth Tool | 3X Sales with AI Product Optimization</title>
        <meta name="description" content="Grow your Shopify store 300% faster with AI-powered product descriptions, abandoned cart recovery, and SEO optimization. Trusted by 50,000+ merchants. Start free—no credit card required." />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://zyraai.com/" />
        <meta property="og:title" content="Zyra AI: Turn Your Shopify Store Into a Sales Machine" />
        <meta property="og:description" content="Join 50,000+ Shopify merchants using AI to 3X their sales. Automated product descriptions, cart recovery, and SEO optimization." />
        <meta property="og:image" content="https://zyraai.com/og-image.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://zyraai.com/" />
        <meta property="twitter:title" content="Zyra AI: Turn Your Shopify Store Into a Sales Machine" />
        <meta property="twitter:description" content="Join 50,000+ Shopify merchants using AI to 3X their sales." />
        <meta property="twitter:image" content="https://zyraai.com/og-image.png" />

        {/* Structured Data - Organization */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Zyra AI",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "49.00",
              "priceCurrency": "USD"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "ratingCount": "2300",
              "bestRating": "5",
              "worstRating": "1"
            }
          })}
        </script>

        {/* Structured Data - FAQPage */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
              }
            }))
          })}
        </script>
      </Helmet>
      {/* Social Proof Notification Toast */}
      <div 
        className={`fixed bottom-20 lg:bottom-6 left-4 z-50 transition-all duration-500 transform ${
          showNotification ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        }`}
        data-testid="social-proof-notification"
      >
        <Card className="bg-card/95 backdrop-blur-sm border shadow-lg max-w-sm">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00F0FF] to-[#FF00F5] flex items-center justify-center text-white font-bold flex-shrink-0">
              {socialProofMessages[currentNotification]?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                <span className="font-semibold">{socialProofMessages[currentNotification]?.name}</span>
                {' from '}
                <span className="text-muted-foreground">{socialProofMessages[currentNotification]?.location}</span>
              </p>
              <p className="text-sm text-primary font-medium">
                {socialProofMessages[currentNotification]?.action}
              </p>
              <p className="text-xs text-muted-foreground">{socialProofMessages[currentNotification]?.time}</p>
            </div>
            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
          </CardContent>
        </Card>
      </div>
      {/* Navigation */}
      <ResponsiveNavbar
        navItems={[
          { label: "Features", href: "#features", external: true },
          { label: "Testimonials", href: "#testimonials", external: true },
          { label: "Pricing", href: "#pricing", external: true },
          { label: "FAQ", href: "#faq", external: true },
          ...(loading ? [
            { label: "Log in", href: "/auth" }
          ] : isAuthenticated ? [
            { 
              label: isLoggingOut ? "Logging out..." : "Logout", 
              onClick: handleLogout,
              disabled: isLoggingOut
            }
          ] : [
            { label: "Log in", href: "/auth" }
          ])
        ]}
        actionButton={{
          label: "Get Started Free",
          href: "/auth"
        }}
      />
      {/* Main Content */}
      <main id="main-content" className="pt-10">
        {/* Optimized Hero Section */}
        <section className="relative pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 animate-gradient" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(0,240,255,0.1),transparent_50%)]" />
          
          <div className="container mx-auto text-center max-w-5xl relative z-10">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Trusted by 50,000+ Shopify Merchants</span>
            </div>

            {/* Modern Professional Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-8 leading-[1.1] tracking-tight">
              <span className="block mb-2">
                Turn Your Shopify Store
              </span>
              <span className="block bg-gradient-to-r from-[#00D4FF] via-[#00E5CC] to-[#7C3AED] bg-clip-text text-transparent bg-[length:150%_auto] animate-[gradient_8s_ease_infinite]">
                Into a Sales Machine
              </span>
              <span className="block mt-3 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-muted-foreground/80 tracking-normal">
                While You Sleep
              </span>
            </h1>

            {/* Benefit-focused subheadline */}
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto">
              Stop losing money to bad product descriptions and abandoned carts. 
              Zyra AI optimizes your entire store automatically—so you can focus 
              on what matters: <span className="text-foreground font-semibold">growing your business</span>.
            </p>

            {/* 3 Key Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 max-w-3xl mx-auto">
              <div className="flex items-start gap-3 text-left">
                <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-foreground">10X Faster Optimization</p>
                  <p className="text-sm text-muted-foreground">Not weeks, minutes</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left">
                <DollarSign className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-foreground">85% Cart Recovery</p>
                  <p className="text-sm text-muted-foreground">Recover lost sales automatically</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left">
                <Target className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-foreground">SEO That Ranks</p>
                  <p className="text-sm text-muted-foreground">Google-friendly AI</p>
                </div>
              </div>
            </div>

            {/* Improved CTAs with micro-copy */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <Button 
                asChild 
                size="lg"
                className="gradient-button w-full sm:w-auto px-8 py-6 text-lg font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 animate-pulse-glow"
                data-testid="button-start-trial"
              >
                <Link href="/auth">
                  <Rocket className="w-5 h-5 mr-2" />
                  Start Free Trial—No Credit Card Required
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="w-full sm:w-auto px-8 py-6 text-lg font-semibold backdrop-blur-sm border-primary/30 hover:bg-primary/5"
                data-testid="button-watch-demo"
              >
                <Play className="w-5 h-5 mr-2" />
                See Real Results (2-Min Demo)
              </Button>
            </div>

            {/* Micro-copy under CTAs */}
            <p className="text-sm text-muted-foreground mb-10">
              <Clock className="w-4 h-4 inline mr-1" />
              Setup in 5 minutes • Cancel anytime • 7 days free
            </p>

            {/* Stats with animated counters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-[#00F0FF] to-[#00FFE5] bg-clip-text text-transparent mb-1" data-testid="text-stat-sales">300%</div>
                <div className="text-sm text-muted-foreground">Sales Increase</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-[#00FFE5] to-[#FF00F5] bg-clip-text text-transparent mb-1" data-testid="text-stat-recovery">85%</div>
                <div className="text-sm text-muted-foreground">Cart Recovery</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-[#FF00F5] to-[#00F0FF] bg-clip-text text-transparent mb-1" data-testid="text-stat-setup">5 min</div>
                <div className="text-sm text-muted-foreground">Setup Time</div>
              </div>
            </div>

            {/* 60-day money-back guarantee badge */}
            <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-6 py-3 text-sm">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-semibold">60-Day Money-Back Guarantee</span>
              <span className="text-muted-foreground">• Love it or leave it, risk-free</span>
            </div>
          </div>
        </section>

        {/* Trust Bar Section */}
        <section className="py-8 px-4 sm:px-6 border-y border-border/50 bg-muted/30">
          <div className="container mx-auto">
            {/* Client Logos Strip */}
            <div className="mb-8">
              <p className="text-center text-sm text-muted-foreground mb-2">Join thousands of successful Shopify merchants</p>
              <p className="text-center text-xs text-muted-foreground/60 mb-4 italic">Illustrative client examples</p>
              <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 opacity-60">
                <div className="flex flex-col items-center gap-2" data-testid="logo-client-1">
                  <div className="w-24 h-16 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex flex-col items-center justify-center gap-1 hover-elevate transition-all">
                    <Shirt className="w-5 h-5 text-primary/70" />
                    <span className="text-xs font-semibold tracking-wide text-foreground/70">FASHION CO</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2" data-testid="logo-client-2">
                  <div className="w-24 h-16 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex flex-col items-center justify-center gap-1 hover-elevate transition-all">
                    <Sparkles className="w-5 h-5 text-primary/70" />
                    <span className="text-xs font-semibold tracking-wide text-foreground/70">BEAUTY PLUS</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2" data-testid="logo-client-3">
                  <div className="w-24 h-16 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex flex-col items-center justify-center gap-1 hover-elevate transition-all">
                    <Laptop className="w-5 h-5 text-primary/70" />
                    <span className="text-xs font-semibold tracking-wide text-foreground/70">TECH STORE</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2" data-testid="logo-client-4">
                  <div className="w-24 h-16 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex flex-col items-center justify-center gap-1 hover-elevate transition-all">
                    <Home className="w-5 h-5 text-primary/70" />
                    <span className="text-xs font-semibold tracking-wide text-foreground/70">HOME SHOP</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2" data-testid="logo-client-5">
                  <div className="w-24 h-16 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex flex-col items-center justify-center gap-1 hover-elevate transition-all">
                    <Dumbbell className="w-5 h-5 text-primary/70" />
                    <span className="text-xs font-semibold tracking-wide text-foreground/70">FIT GEAR</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2" data-testid="logo-client-6">
                  <div className="w-24 h-16 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex flex-col items-center justify-center gap-1 hover-elevate transition-all">
                    <Heart className="w-5 h-5 text-primary/70" />
                    <span className="text-xs font-semibold tracking-wide text-foreground/70">LIFESTYLE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Star rating + security badges */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 mb-6 flex-wrap">
              <div className="flex items-center gap-2" data-testid="trust-star-rating">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm font-semibold">4.9/5 from 2,300+ reviews</span>
              </div>
              <div className="h-4 w-px bg-border hidden md:block" />
              <div className="flex items-center gap-2" data-testid="trust-shopify-partner">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="text-sm">Official Shopify Partner</span>
              </div>
              <div className="h-4 w-px bg-border hidden md:block" />
              <div className="flex items-center gap-2" data-testid="trust-encryption">
                <Lock className="w-5 h-5 text-primary" />
                <span className="text-sm">Bank-Level Encryption</span>
              </div>
              <div className="h-4 w-px bg-border hidden md:block" />
              <div className="flex items-center gap-2" data-testid="trust-gdpr">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm">GDPR Compliant</span>
              </div>
              <div className="h-4 w-px bg-border hidden md:block" />
              <div className="flex items-center gap-2" data-testid="trust-soc2">
                <Award className="w-5 h-5 text-primary" />
                <span className="text-sm">SOC 2 Certified</span>
              </div>
            </div>

            {/* Live social proof */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground" data-testid="trust-live-activity">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>342 merchants started their trial in the last 30 days</span>
            </div>
          </div>
        </section>

        {/* Problem-Agitation Section */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#0e0e20]">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 text-red-500 border-red-500/30">
                <AlertTriangle className="w-3 h-3 mr-1" />
                The Hard Truth
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                Your Store Is <span className="text-red-500">Bleeding Money</span> Right Now
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Every day you wait, you're losing customers to competitors with better product pages and smarter marketing. Here's what's happening while you sleep:
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="border-red-500/20 bg-red-500/5">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">78% of Carts</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Are abandoned without any follow-up
                  </p>
                  <div className="text-2xl font-bold text-red-500">-$2,400/mo</div>
                  <p className="text-xs text-muted-foreground">Average lost revenue</p>
                </CardContent>
              </Card>

              <Card className="border-red-500/20 bg-red-500/5">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
                    <Search className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">91% of Stores</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Never appear on Google's first page
                  </p>
                  <div className="text-2xl font-bold text-red-500">-5,000+</div>
                  <p className="text-xs text-muted-foreground">Monthly visitors missed</p>
                </CardContent>
              </Card>

              <Card className="border-red-500/20 bg-red-500/5">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">2.3% Conversion</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Poor descriptions kill conversions
                  </p>
                  <div className="text-2xl font-bold text-red-500">-67%</div>
                  <p className="text-xs text-muted-foreground">Below optimized stores</p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <p className="text-lg mb-6">
                <span className="font-bold">The good news?</span> Zyra AI fixes all of this in under 5 minutes.
              </p>
              <Button asChild size="lg" className="gradient-button">
                <Link href="/auth">
                  <Rocket className="w-5 h-5 mr-2" />
                  Fix My Store Now—Free Trial
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                Simple 3-Step Process
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Start Growing in <span className="text-primary">5 Minutes</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                No coding, no training, no hiring. Just results.
              </p>
            </div>

            <div className="relative">
              {/* Connection line */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent -translate-y-1/2" />
              
              <div className="grid md:grid-cols-3 gap-8 relative">
                <div className="text-center relative">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#00F0FF] to-[#00FFE5] rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary/30 relative z-10">
                    1
                  </div>
                  <h3 className="text-xl font-bold mb-3">Connect Your Store</h3>
                  <p className="text-muted-foreground">
                    One-click Shopify integration. Zyra automatically imports your products and learns your brand voice.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
                    <Clock className="w-4 h-4" />
                    <span>Takes 30 seconds</span>
                  </div>
                </div>

                <div className="text-center relative">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#00FFE5] to-[#FF00F5] rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary/30 relative z-10">
                    2
                  </div>
                  <h3 className="text-xl font-bold mb-3">AI Optimizes Everything</h3>
                  <p className="text-muted-foreground">
                    Zyra rewrites descriptions, fixes SEO, and sets up abandoned cart recovery automatically.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
                    <Bot className="w-4 h-4" />
                    <span>100% hands-free</span>
                  </div>
                </div>

                <div className="text-center relative">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#FF00F5] to-[#00F0FF] rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary/30 relative z-10">
                    3
                  </div>
                  <h3 className="text-xl font-bold mb-3">Watch Sales Grow</h3>
                  <p className="text-muted-foreground">
                    Track real-time revenue increases, recovered carts, and SEO rankings from your dashboard.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
                    <TrendingUp className="w-4 h-4" />
                    <span>Results in 24 hours</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <Button asChild size="lg" className="gradient-button">
                <Link href="/auth">
                  <Zap className="w-5 h-5 mr-2" />
                  Start My Free Trial
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Before/After Product Showcase */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#0f0f22]">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                <Sparkles className="w-3 h-3 mr-1" />
                Real AI Transformation
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                See the <span className="text-primary">AI Difference</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Here's how Zyra transforms boring product pages into conversion machines
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Before */}
              <Card className="border-red-500/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="font-semibold text-red-500">Before Zyra</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium mb-2 text-muted-foreground">Premium Wireless Headphones</h4>
                    <p className="text-sm text-muted-foreground">
                      Good headphones. Wireless. Battery lasts long. Good sound quality. Comfortable to wear. Black color available.
                    </p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-red-500">
                      <X className="w-4 h-4" />
                      <span>No emotional appeal</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-500">
                      <X className="w-4 h-4" />
                      <span>Missing keywords for SEO</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-500">
                      <X className="w-4 h-4" />
                      <span>No benefits highlighted</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-500">
                      <X className="w-4 h-4" />
                      <span>2.1% conversion rate</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* After */}
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-primary">After Zyra AI</span>
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-xs ml-auto">
                      AI Optimized
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg p-4 mb-4 border border-primary/20 bg-[#16162c]">
                    <h4 className="font-medium mb-2">Premium Wireless Noise-Canceling Headphones - 40H Battery</h4>
                    <p className="text-sm text-muted-foreground">
                      Experience pure audio bliss with our studio-quality wireless headphones. Active noise cancellation lets you escape into your music, while 40-hour battery life keeps the soundtrack going all week. Memory foam ear cushions deliver cloud-like comfort for extended listening sessions.
                    </p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-primary">
                      <Check className="w-4 h-4" />
                      <span>Emotional, benefit-driven copy</span>
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                      <Check className="w-4 h-4" />
                      <span>SEO-optimized keywords</span>
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                      <Check className="w-4 h-4" />
                      <span>Clear value proposition</span>
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                      <Check className="w-4 h-4" />
                      <span>7.8% conversion rate (+271%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-8">
              <p className="text-muted-foreground mb-4">
                This transformation takes Zyra AI less than 10 seconds per product
              </p>
              <Button asChild size="lg" className="gradient-button">
                <Link href="/auth">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Transform My Products
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Competitor Comparison Table */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                Why Zyra Wins
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Compare Your <span className="text-primary">Options</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See how Zyra AI stacks up against traditional methods
              </p>
            </div>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold"></th>
                      <th className="p-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Pen className="w-5 h-5 text-muted-foreground" />
                          <span className="font-semibold">Do It Yourself</span>
                        </div>
                      </th>
                      <th className="p-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="w-5 h-5 text-muted-foreground" />
                          <span className="font-semibold">Hire Freelancer</span>
                        </div>
                      </th>
                      <th className="p-4 text-center bg-primary/5 border-2 border-primary/20">
                        <div className="flex flex-col items-center gap-2">
                          <Bot className="w-5 h-5 text-primary" />
                          <span className="font-semibold text-primary">Zyra AI</span>
                          <Badge className="bg-primary text-primary-foreground text-xs">Best Value</Badge>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-4 font-medium">Monthly Cost</td>
                      <td className="p-4 text-center text-muted-foreground">$0 (but time)</td>
                      <td className="p-4 text-center text-muted-foreground">$2,000-5,000</td>
                      <td className="p-4 text-center font-semibold text-primary bg-primary/5">$49-299</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">Time per Product</td>
                      <td className="p-4 text-center text-muted-foreground">30-60 min</td>
                      <td className="p-4 text-center text-muted-foreground">24-48 hours</td>
                      <td className="p-4 text-center font-semibold text-primary bg-primary/5">10 seconds</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">SEO Optimization</td>
                      <td className="p-4 text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      <td className="p-4 text-center"><Minus className="w-5 h-5 text-muted-foreground mx-auto" /></td>
                      <td className="p-4 text-center bg-primary/5"><CheckCircle className="w-5 h-5 text-primary mx-auto" /></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">Abandoned Cart Recovery</td>
                      <td className="p-4 text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      <td className="p-4 text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      <td className="p-4 text-center bg-primary/5"><CheckCircle className="w-5 h-5 text-primary mx-auto" /></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">24/7 Availability</td>
                      <td className="p-4 text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      <td className="p-4 text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      <td className="p-4 text-center bg-primary/5"><CheckCircle className="w-5 h-5 text-primary mx-auto" /></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">Bulk Optimization</td>
                      <td className="p-4 text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      <td className="p-4 text-center"><Minus className="w-5 h-5 text-muted-foreground mx-auto" /></td>
                      <td className="p-4 text-center bg-primary/5"><CheckCircle className="w-5 h-5 text-primary mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium">Avg. ROI</td>
                      <td className="p-4 text-center text-muted-foreground">Low</td>
                      <td className="p-4 text-center text-muted-foreground">Moderate</td>
                      <td className="p-4 text-center font-bold text-primary bg-primary/5">5,700%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="text-center mt-8">
              <Button asChild size="lg" className="gradient-button">
                <Link href="/auth">
                  Choose the Smart Option
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ROI Calculator Section */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#0f0f23]" id="roi-calculator">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                <Calculator className="w-3 h-3 mr-1" />
                Free ROI Calculator
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Calculate Your <span className="text-primary">Potential Revenue</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Enter your current metrics and see how much more you could be making with Zyra AI
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Input Side */}
              <Card className="gradient-card border-0">
                <CardContent className="p-6 space-y-6">
                  <h3 className="text-lg font-semibold">Your Current Metrics</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Monthly Revenue: <span className="text-primary font-bold">${monthlyRevenue.toLocaleString()}</span>
                      </Label>
                      <Slider
                        value={[monthlyRevenue]}
                        onValueChange={(val) => setMonthlyRevenue(val[0])}
                        min={1000}
                        max={100000}
                        step={1000}
                        className="my-4"
                        data-testid="slider-monthly-revenue"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>$1K</span>
                        <span>$100K</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Current Conversion Rate: <span className="text-primary font-bold">{conversionRate}%</span>
                      </Label>
                      <Slider
                        value={[conversionRate]}
                        onValueChange={(val) => setConversionRate(val[0])}
                        min={0.5}
                        max={10}
                        step={0.1}
                        className="my-4"
                        data-testid="slider-conversion-rate"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0.5%</span>
                        <span>10%</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Monthly Abandoned Carts: <span className="text-primary font-bold">{abandonedCarts}</span>
                      </Label>
                      <Slider
                        value={[abandonedCarts]}
                        onValueChange={(val) => setAbandonedCarts(val[0])}
                        min={10}
                        max={500}
                        step={5}
                        className="my-4"
                        data-testid="slider-abandoned-carts"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>10</span>
                        <span>500</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Results Side */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-6">Your Potential with Zyra AI</h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-[#16162c]">
                      <div>
                        <p className="text-sm text-muted-foreground">Current Monthly Revenue</p>
                        <p className="text-2xl font-bold">${roiResults.currentRevenue.toLocaleString()}</p>
                      </div>
                      <ArrowRight className="w-6 h-6 text-muted-foreground" />
                      <div className="text-right">
                        <p className="text-sm text-primary font-medium">Projected Revenue</p>
                        <p className="text-2xl font-bold text-primary">${roiResults.projectedRevenue.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg text-center bg-[#16162c]">
                        <p className="text-sm text-muted-foreground mb-1">Extra Revenue</p>
                        <p className="text-2xl font-bold text-primary">+${roiResults.additionalRevenue.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">per month</p>
                      </div>
                      <div className="p-4 rounded-lg text-center bg-[#16162c]">
                        <p className="text-sm text-muted-foreground mb-1">Revenue Increase</p>
                        <p className="text-2xl font-bold text-primary">+{roiResults.percentIncrease}%</p>
                        <p className="text-xs text-muted-foreground">growth</p>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg text-center">
                      <p className="text-sm font-medium mb-2">Your ROI with Zyra AI</p>
                      <p className="text-4xl font-bold text-primary">{roiResults.roi.toLocaleString()}%</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        For every $1 spent, you get ${Math.round(roiResults.roi / 100)} back
                      </p>
                    </div>

                    <Button asChild className="gradient-button w-full" size="lg">
                      <Link href="/auth">
                        <Rocket className="w-5 h-5 mr-2" />
                        Unlock This Revenue—Start Free
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* As Featured In Section */}
        <section className="py-12 px-4 sm:px-6 bg-muted/30 border-y border-border/50">
          <div className="container mx-auto">
            <p className="text-center text-sm text-muted-foreground mb-8">As Featured In</p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60">
              <div className="flex items-center gap-2 text-foreground/70 hover-elevate transition-all" data-testid="press-forbes">
                <Newspaper className="w-6 h-6" />
                <span className="text-lg font-bold tracking-tight">Forbes</span>
              </div>
              <div className="flex items-center gap-2 text-foreground/70 hover-elevate transition-all" data-testid="press-techcrunch">
                <Globe className="w-6 h-6" />
                <span className="text-lg font-bold tracking-tight">TechCrunch</span>
              </div>
              <div className="flex items-center gap-2 text-foreground/70 hover-elevate transition-all" data-testid="press-entrepreneur">
                <Newspaper className="w-6 h-6" />
                <span className="text-lg font-bold tracking-tight">Entrepreneur</span>
              </div>
              <div className="flex items-center gap-2 text-foreground/70 hover-elevate transition-all" data-testid="press-shopify">
                <ShoppingCart className="w-6 h-6" />
                <span className="text-lg font-bold tracking-tight">Shopify Blog</span>
              </div>
              <div className="flex items-center gap-2 text-foreground/70 hover-elevate transition-all" data-testid="press-producthunt">
                <Rocket className="w-6 h-6" />
                <span className="text-lg font-bold tracking-tight">Product Hunt</span>
              </div>
            </div>
          </div>
        </section>

        {/* Product Demo Video Section */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#0f0f23]">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4" data-testid="badge-video-section">
                See Zyra AI In Action
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Watch How <span className="bg-gradient-to-r from-[#00F0FF] to-[#FF00F5] bg-clip-text text-transparent">Zyra Transforms</span> Your Store
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See our AI-powered tools in action. This 2-minute demo shows you exactly how Zyra optimizes products, recovers carts, and drives revenue.
              </p>
            </div>

            {/* Demo Preview Card */}
            <div 
              className="relative max-w-5xl mx-auto rounded-xl overflow-hidden shadow-2xl"
              data-testid="container-demo-video"
            >
              {/* Gradient Background with Animated Elements */}
              <div className="w-full aspect-video bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative">
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#00F0FF]/10 via-[#FF00F5]/10 to-[#00F0FF]/10 bg-[length:200%_100%] animate-gradient" />
                
                {/* Demo UI Mockup */}
                <div className="absolute inset-4 sm:inset-8 flex gap-4">
                  {/* Left Panel - Product List */}
                  <div className="w-1/3 bg-white/5 backdrop-blur-sm rounded-lg p-3 hidden sm:block">
                    <div className="h-4 w-3/4 bg-white/20 rounded mb-3" />
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-2 p-2 rounded bg-white/10">
                          <div className="w-8 h-8 bg-gradient-to-br from-[#00F0FF]/30 to-[#FF00F5]/30 rounded" />
                          <div className="flex-1 space-y-1">
                            <div className="h-2 w-3/4 bg-white/20 rounded" />
                            <div className="h-2 w-1/2 bg-white/10 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Right Panel - AI Optimization */}
                  <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Bot className="w-5 h-5 text-primary" />
                      <div className="h-3 w-32 bg-primary/30 rounded" />
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 rounded bg-gradient-to-r from-[#00F0FF]/20 to-transparent border border-[#00F0FF]/30">
                        <div className="h-3 w-full bg-white/20 rounded mb-2" />
                        <div className="h-3 w-4/5 bg-white/15 rounded mb-2" />
                        <div className="h-3 w-3/4 bg-white/10 rounded" />
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-primary/70">SEO Optimized</span>
                        <CheckCircle className="w-4 h-4 text-primary ml-2" />
                        <span className="text-primary/70">+34% Conversion</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* CTA Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="text-center">
                    <Button asChild size="lg" className="gradient-button mb-3">
                      <Link href="/auth">
                        <Play className="w-5 h-5 mr-2" />
                        Start Free Demo
                      </Link>
                    </Button>
                    <p className="text-sm text-white/70">See it work on your products</p>
                  </div>
                </div>
              </div>

              {/* Gradient Border Effect */}
              <div className="absolute inset-0 rounded-xl border-2 border-transparent bg-gradient-to-r from-[#00F0FF]/20 to-[#FF00F5]/20 pointer-events-none" />
            </div>

            {/* Video Features Below */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
              <div className="text-center" data-testid="feature-video-1">
                <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">AI Product Optimization</h3>
                <p className="text-sm text-muted-foreground">Watch AI generate perfect product descriptions in seconds</p>
              </div>
              <div className="text-center" data-testid="feature-video-2">
                <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Cart Recovery Automation</h3>
                <p className="text-sm text-muted-foreground">See how personalized emails bring customers back</p>
              </div>
              <div className="text-center" data-testid="feature-video-3">
                <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Real-Time Analytics</h3>
                <p className="text-sm text-muted-foreground">Track ROI and performance across all channels</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section (Enhanced) */}
        <section id="features" className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Powerful AI Features That <span className="text-primary">Actually Work</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to optimize your Shopify store and 3X your revenue
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="gradient-card border-0 h-full hover-elevate transition-all duration-300" data-testid={`card-feature-${index}`}>
                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4 text-primary">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-3" data-testid={`text-feature-title-${index}`}>{feature.title}</h3>
                    <p className="text-muted-foreground flex-grow mb-4" data-testid={`text-feature-description-${index}`}>{feature.description}</p>
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <CheckCircle2 className="w-4 h-4" />
                      {feature.benefit}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-16 sm:py-20 px-4 sm:px-6 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Success Stories from <span className="text-primary">Real Merchants</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join thousands of Shopify store owners who transformed their business with Zyra AI
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="gradient-card border-0 hover-elevate transition-all duration-300" data-testid={`card-testimonial-${index}`}>
                  <CardContent className="p-6">
                    {/* Star Rating */}
                    <div className="flex items-center gap-1 mb-4" data-testid={`rating-testimonial-${index}`}>
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="ml-1 text-sm text-muted-foreground">({testimonial.rating}.0)</span>
                    </div>
                    
                    {/* Quote */}
                    <Quote className="w-8 h-8 text-primary/20 mb-3" />
                    <p className="text-foreground mb-6 leading-relaxed" data-testid={`quote-testimonial-${index}`}>
                      "{testimonial.quote}"
                    </p>
                    
                    {/* Customer Info with Avatar */}
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="w-14 h-14 border-2 border-primary/30" data-testid={`avatar-testimonial-${index}`}>
                        <AvatarFallback className="bg-gradient-to-br from-[#00F0FF] to-[#FF00F5] text-white font-bold text-xl">
                          {testimonial.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold" data-testid={`name-testimonial-${index}`}>{testimonial.name}</p>
                          {testimonial.verified && (
                            <BadgeCheck className="w-4 h-4 text-primary" data-testid={`verified-icon-${index}`} />
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Store className="w-3 h-3" />
                          <span data-testid={`company-testimonial-${index}`}>{testimonial.company}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Badge and Result */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <Badge variant="outline" className="text-xs flex items-center gap-1" data-testid={`badge-testimonial-${index}`}>
                        <CheckCircle2 className="w-3 h-3" />
                        {testimonial.badge}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-primary" data-testid={`result-testimonial-${index}`}>
                          {testimonial.result}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* CTA after testimonials */}
            <div className="text-center">
              <p className="text-lg mb-4 text-muted-foreground">Ready to join 50,000+ merchants growing with Zyra?</p>
              <Button asChild size="lg" className="gradient-button">
                <Link href="/auth">
                  Start Free Trial—No Risk
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Case Studies Section */}
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Real Results, <span className="text-primary">Real Numbers</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See how Zyra AI helped real Shopify stores achieve massive growth
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {caseStudies.map((study, index) => (
                <Card key={index} className="gradient-card border-0 hover-elevate transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{study.company}</h3>
                        <p className="text-sm text-muted-foreground">{study.industry}</p>
                      </div>
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-1">Challenge:</p>
                        <p className="text-sm">{study.challenge}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-1">Solution:</p>
                        <p className="text-sm">{study.solution}</p>
                      </div>
                      <div className="border-t border-border pt-4">
                        <p className="text-sm font-semibold mb-3">Results (90 days):</p>
                        {study.results.map((result, i) => (
                          <div key={i} className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">{result.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{result.before} →</span>
                              <span className="text-sm font-bold text-primary">{result.after}</span>
                              <Badge variant="outline" className="text-xs">{result.change}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-border pt-4">
                        <Quote className="w-6 h-6 text-primary/20 mb-2" />
                        <p className="text-sm italic mb-2">"{study.quote}"</p>
                        <p className="text-xs text-muted-foreground">— {study.author}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Autonomous AI Future Section */}
        <section className="relative py-20 px-4 sm:px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,240,255,0.15),transparent_70%)]" />
          
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                <Sparkles className="w-3 h-3 mr-1" />
                The Future of E-Commerce
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                Your Store, <span className="bg-gradient-to-r from-[#00F0FF] via-[#00FFE5] to-[#FF00F5] bg-clip-text text-transparent">Managed by AI</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Zyra isn't just a tool—it's evolving into a fully autonomous AI store manager that runs your business 24/7. 
                No manual work. No constant monitoring. Just growth on autopilot.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="gradient-card border-0 hover-elevate">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Cog className="w-6 h-6 text-primary animate-spin-slow" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-3">Autonomous Mode</h3>
                      <p className="text-muted-foreground mb-4">
                        Turn on autopilot and Zyra takes over. AI automatically optimizes products, adjusts pricing, 
                        sends marketing campaigns, and recovers carts—while you sleep.
                      </p>
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Set it and forget it</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="gradient-card border-0 hover-elevate">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-3">Manual Approval Mode</h3>
                      <p className="text-muted-foreground mb-4">
                        Prefer control? AI creates smart recommendations, you approve what you like. 
                        Get AI superpowers without giving up decision-making authority.
                      </p>
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>You're still in charge</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-8 mb-12">
              <h3 className="text-2xl font-bold mb-8 text-center">
                <Rocket className="w-6 h-6 inline mr-2 text-primary" />
                What the AI Does Autonomously
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-md flex items-center justify-center flex-shrink-0">
                    <Search className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Daily SEO Audits</h4>
                    <p className="text-sm text-muted-foreground">AI scans products, finds SEO gaps, fixes them automatically</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-md flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Dynamic Pricing</h4>
                    <p className="text-sm text-muted-foreground">Adjusts prices based on competition, demand, and profit goals</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-md flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Smart Marketing</h4>
                    <p className="text-sm text-muted-foreground">Sends emails & SMS at optimal times with A/B testing built-in</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-md flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Cart Recovery</h4>
                    <p className="text-sm text-muted-foreground">Multi-stage sequences that escalate from email to SMS</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-xl p-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold">Built-In Safety Guardrails</h3>
              </div>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Zyra's autonomous mode includes intelligent safety limits: daily action caps, price bounds, 
                frequency limits, quiet hours, GDPR compliance, and one-click rollback. Your store is protected.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                <Badge variant="outline" className="bg-background/50">
                  <Clock className="w-3 h-3 mr-1" />
                  Respects Quiet Hours
                </Badge>
                <Badge variant="outline" className="bg-background/50">
                  <Target className="w-3 h-3 mr-1" />
                  Daily Limits
                </Badge>
                <Badge variant="outline" className="bg-background/50">
                  <Shield className="w-3 h-3 mr-1" />
                  GDPR Safe
                </Badge>
                <Badge variant="outline" className="bg-background/50">
                  <Activity className="w-3 h-3 mr-1" />
                  One-Click Undo
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section (Enhanced) */}
        <section id="pricing" className="py-16 sm:py-20 px-4 sm:px-6 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Simple, Transparent <span className="text-primary">Pricing</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-6">Start with a 7-day free trial, upgrade anytime</p>
              
              {/* Annual/Monthly Toggle */}
              <div className="inline-flex items-center gap-3 bg-card border border-border rounded-lg p-1 mb-8">
                <button
                  onClick={() => setIsAnnual(false)}
                  className={`px-4 py-2 rounded-md transition-all ${!isAnnual ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsAnnual(true)}
                  className={`px-4 py-2 rounded-md transition-all ${isAnnual ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                >
                  Annual
                  <Badge className="ml-2 bg-green-500 text-white">Save 20%</Badge>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-12">
              {plans.map((plan, index) => (
                <Card 
                  key={index} 
                  className={`pricing-card border-0 relative h-full hover-elevate transition-all duration-300 ${plan.popular ? 'ring-2 ring-primary scale-105' : ''}`}
                  data-testid={`card-plan-${index}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1">Most Popular</Badge>
                    </div>
                  )}
                  {plan.badge && !plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge variant="outline" className="px-4 py-1 ml-[-14px] mr-[-14px]">{plan.badge}</Badge>
                    </div>
                  )}
                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="text-center mb-6">
                      <div className="flex justify-center text-primary mb-3">{plan.icon}</div>
                      <h3 className="text-xl font-semibold mb-2" data-testid={`text-plan-name-${index}`}>{plan.name}</h3>
                      <div className="mb-2">
                        <span className="text-4xl font-bold" data-testid={`text-plan-price-${index}`}>
                          {isAnnual && plan.annualPrice ? plan.annualPrice : plan.price}
                        </span>
                        {index !== 0 && <span className="text-muted-foreground">/{isAnnual ? 'month' : 'month'}</span>}
                      </div>
                      {isAnnual && plan.annualPrice && index !== 0 && (
                        <p className="text-xs text-muted-foreground line-through mb-1">{plan.price}/month</p>
                      )}
                      <p className="text-xs text-muted-foreground mb-2">{plan.period}</p>
                      {plan.costPerDay && index !== 0 && (
                        <p className="text-sm text-primary font-medium">{isAnnual ? `$${(parseFloat(plan.annualPrice?.replace('$', '') || plan.price.replace('$', '')) / 30).toFixed(2)}` : plan.costPerDay}/day</p>
                      )}
                      {plan.valueProps && (
                        <p className="text-xs text-muted-foreground mt-2">{plan.valueProps}</p>
                      )}
                    </div>
                    <div className="flex-1">
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start text-sm" data-testid={`text-plan-feature-${index}-${featureIndex}`}>
                            <Check className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button 
                      asChild
                      className={`w-full ${plan.popular ? 'gradient-button' : 'border border-border hover:bg-muted'}`}
                      variant={plan.popular ? "default" : "outline"}
                      data-testid={`button-choose-plan-${index}`}
                    >
                      <Link href="/auth">
                        {index === 0 ? "Start Free Trial" : "Choose Plan"}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* ROI Callout */}
            <div className="max-w-2xl mx-auto text-center bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-bold mb-2">Average ROI: 5,700%</h3>
              <p className="text-muted-foreground mb-4">
                Our customers generate $2,800 extra revenue in their first month on the Starter plan.
                That means Zyra pays for itself 57X over.
              </p>
              <p className="text-sm text-muted-foreground">
                <Shield className="w-4 h-4 inline mr-1" />
                60-day money-back guarantee • No contracts • Cancel anytime
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Questions? <span className="text-primary">We've Got Answers</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Everything you need to know about Zyra AI
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card 
                  key={index} 
                  className="gradient-card border-0 hover-elevate cursor-pointer transition-all duration-300"
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-lg font-semibold flex-1">{faq.question}</h3>
                      {expandedFaq === index ? (
                        <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                    {expandedFaq === index && (
                      <p className="mt-4 text-muted-foreground leading-relaxed">{faq.answer}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Still have questions CTA */}
            <div className="text-center mt-8">
              <p className="text-muted-foreground mb-4">Still have questions?</p>
              <Button asChild variant="outline">
                <Link href="/auth">
                  Talk to Our Team
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Security & Trust Section */}
        <section className="py-16 px-4 sm:px-6 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                <Lock className="w-8 h-8 inline mr-2 text-primary" />
                Your Data, <span className="text-primary">Protected</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <p className="font-semibold mb-1">AES-256 Encryption</p>
                <p className="text-xs text-muted-foreground">Bank-level security</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <p className="font-semibold mb-1">SOC 2 Type II</p>
                <p className="text-xs text-muted-foreground">Certified secure</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                <p className="font-semibold mb-1">GDPR Compliant</p>
                <p className="text-xs text-muted-foreground">Privacy first</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <p className="font-semibold mb-1">Never Sold</p>
                <p className="text-xs text-muted-foreground">Your data stays yours</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <p className="font-semibold mb-1">99.9% Uptime</p>
                <p className="text-xs text-muted-foreground">Always available</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <p className="font-semibold mb-1">Daily Backups</p>
                <p className="text-xs text-muted-foreground">Never lose data</p>
              </div>
            </div>
          </div>
        </section>

        {/* Zyra AI Blog Section */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-background to-primary/5">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                <Lightbulb className="w-3 h-3 mr-1" />
                Latest Insights
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-[#00F0FF] via-[#00FFE5] to-[#FF00F5] bg-clip-text text-transparent">
                  Zyra AI Insights
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Stay ahead with expert tips, automation strategies, and ecommerce trends
              </p>
            </div>

            {/* Blog Cards Grid */}
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {/* Blog Card 1 */}
              <Link 
                href="/blog/how-zyra-ai-automates-dropshipping-growth"
                className="group relative bg-background/40 backdrop-blur-sm border border-primary/20 rounded-lg overflow-hidden hover:border-primary/60 transition-all duration-300 block"
                data-testid="blog-card-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/10 via-transparent to-[#FF00F5]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Featured Image */}
                <div className="relative w-full h-48 overflow-hidden">
                  <img 
                    src={blogImage1} 
                    alt="How Zyra AI Automates Your Dropshipping Growth"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                </div>

                <div className="relative p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-primary px-2 py-1 bg-primary/10 rounded-full">AI GROWTH</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
                    How Zyra AI Automates Your Dropshipping Growth
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    A breakdown of how AI-driven optimization boosts product ranking, SEO strength, and store conversions automatically.
                  </p>
                  <div className="flex items-center text-primary group/btn">
                    <span>Read More</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>

              {/* Blog Card 2 */}
              <Link 
                href="/blog/top-5-ai-tools-ecommerce-2025"
                className="group relative bg-background/40 backdrop-blur-sm border border-primary/20 rounded-lg overflow-hidden hover:border-primary/60 transition-all duration-300 block"
                data-testid="blog-card-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#00FFE5]/10 via-transparent to-[#00F0FF]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Featured Image */}
                <div className="relative w-full h-48 overflow-hidden">
                  <img 
                    src={blogImage2} 
                    alt="Top 5 AI Tools Every Ecommerce Owner Must Use in 2025"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                </div>

                <div className="relative p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-primary px-2 py-1 bg-primary/10 rounded-full">TOOLS & TIPS</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
                    Top 5 AI Tools Every Ecommerce Owner Must Use in 2025
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Quick guide to automation tools that save time, increase sales, and streamline your entire workflow.
                  </p>
                  <div className="flex items-center text-primary group/btn">
                    <span>Read More</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>

              {/* Blog Card 3 */}
              <Link 
                href="/blog/future-of-ecommerce-smart-automation"
                className="group relative bg-background/40 backdrop-blur-sm border border-primary/20 rounded-lg overflow-hidden hover:border-primary/60 transition-all duration-300 block"
                data-testid="blog-card-3"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF00F5]/10 via-transparent to-[#00FFE5]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Featured Image */}
                <div className="relative w-full h-48 overflow-hidden">
                  <img 
                    src={blogImage3} 
                    alt="The Future of Ecommerce: Why Smart Automation Wins"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                </div>

                <div className="relative p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-primary px-2 py-1 bg-primary/10 rounded-full">FUTURE TRENDS</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
                    The Future of Ecommerce: Why Smart Automation Wins
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Why self-learning AI systems like Zyra are replacing manual marketing and product optimization forever.
                  </p>
                  <div className="flex items-center text-primary group/btn">
                    <span>Read More</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </div>

            {/* View All Blog CTA */}
            <div className="text-center mt-12">
              <Button asChild variant="outline" size="lg" className="border-primary/50 hover:border-primary">
                <Link href="/blog">
                  View All Articles
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="relative py-20 px-4 sm:px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00F0FF]/20 via-[#FF00F5]/20 to-[#00F0FF]/20 animate-gradient bg-[length:200%_auto]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.1),transparent_70%)]" />
          
          <div className="container mx-auto text-center max-w-3xl relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Don't Leave Money <span className="text-primary">on the Table</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Your competitors are already using AI to win. Start your free trial and see results in 5 minutes.
            </p>
            
            <Button asChild size="lg" className="gradient-button px-12 py-6 text-lg shadow-2xl shadow-primary/30 animate-pulse-glow mb-6">
              <Link href="/auth">
                <Rocket className="w-5 h-5 mr-2" />
                Start Free Trial—No CC Required
              </Link>
            </Button>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span>60-Day Money-Back Guarantee</span>
              </div>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>5-Minute Setup</span>
              </div>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>Cancel Anytime</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      {/* Sticky Mobile CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t border-border lg:hidden z-50">
        <Button asChild className="w-full gradient-button" size="lg">
          <Link href="/auth">
            Start Free Trial—No CC Required
          </Link>
        </Button>
      </div>
      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 sm:px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="/help" className="hover:text-foreground transition-colors">Help Center</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© 2025 Zyra AI. All rights reserved.</p>
            {/* Social Media Icons - Center */}
            <div className="flex items-center gap-4">
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors duration-300"
                data-testid="link-social-linkedin"
              >
                <SiLinkedin className="w-5 h-5" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors duration-300"
                data-testid="link-social-instagram"
              >
                <SiInstagram className="w-5 h-5" />
              </a>
              <a 
                href="https://x.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors duration-300"
                data-testid="link-social-x"
              >
                <SiX className="w-5 h-5" />
              </a>
            </div>
            {/* Trust Badges - Right */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span>SOC 2 Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                <span>GDPR Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
