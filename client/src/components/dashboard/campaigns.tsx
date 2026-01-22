import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageContainer, CardGrid } from "@/components/ui/standardized-layout";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  MessageSquare, 
  FileText, 
  Brain, 
  Target, 
  Users, 
  RotateCcw,
  Zap,
  TrendingUp,
  Sparkles
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  subject?: string;
  content?: string;
  message?: string;
  audience?: string;
  createdAt?: string;
}

interface CampaignTool {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  category: 'existing' | 'new';
  actionText: string;
  comingSoon: boolean;
  tooltip: string;
}

export default function Campaigns() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch existing campaigns to check for drafts
  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns'],
  });

  const campaignTools: CampaignTool[] = [
    {
      id: 'upsell-receipts',
      title: 'Upsell Email Receipts',
      description: 'Auto-generate branded email receipts that include personalized upsell offers and recommendations',
      icon: <Mail className="w-6 h-6 stroke-2 text-primary" />,
      category: 'existing',
      actionText: 'Configure Receipts',
      comingSoon: false,
      tooltip: 'Automatically add upsell recommendations to every purchase confirmation email'
    },
    {
      id: 'abandoned-cart-sms',
      title: 'Abandoned Cart SMS',
      description: 'AI-crafted SMS messages to recover abandoned carts with personalized incentives',
      icon: <MessageSquare className="w-6 h-6 stroke-2 text-primary" />,
      category: 'existing',
      actionText: 'Setup SMS Recovery',
      comingSoon: false,
      tooltip: 'Send targeted SMS campaigns to recover lost sales from abandoned shopping carts'
    },
    {
      id: 'ai-upsell-suggestions',
      title: 'AI Upsell Suggestions',
      description: 'Auto-pick the most relevant products to recommend from your entire catalog',
      icon: <Sparkles className="w-6 h-6 stroke-2 text-primary" />,
      category: 'new',
      actionText: 'Enable AI Upsells',
      comingSoon: false,
      tooltip: 'AI analyzes purchase history and product relationships to suggest perfect upsells'
    },
  ];


  const handleToolAction = (toolId: string) => {
    const legacyRoutes: Record<string, string> = {
      'upsell-receipts': '/upsell-email-receipts',
      'abandoned-cart-sms': '/abandoned-cart-sms',
      'ai-upsell-suggestions': '/ai-upsell-suggestions'
    };

    sessionStorage.setItem('navigationSource', 'campaigns');

    if (legacyRoutes[toolId]) {
      setLocation(legacyRoutes[toolId]);
    } else {
      toast({
        title: "Coming Soon",
        description: "This feature will be available soon!",
      });
    }
  };

  return (
    <PageContainer>
      {/* Header */}
      <div className="text-center space-y-4 mb-8">
        <div className="flex items-center justify-center space-x-2">
          <Target className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            Campaign Hub
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Create, manage, and optimize email & SMS marketing campaigns to boost your revenue
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => setLocation('/campaigns/create')}
          className="bg-primary text-[#000000]"
          data-testid="button-create-campaign"
        >
          <Mail className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Campaign Tools Grid */}
      <CardGrid>
        {campaignTools.map((tool) => (
          <Card 
            key={tool.id}
            className="group relative overflow-hidden gradient-card rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:scale-[1.02] border border-slate-700/50 hover:border-primary/30"
            data-testid={`card-campaign-${tool.id}`}
          >
            <div className="h-full p-3 sm:p-4 md:p-6 flex flex-col">
              <CardHeader className="p-0 flex-1 space-y-2 sm:space-y-3">
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="text-primary flex-shrink-0">
                      {tool.icon}
                    </div>
                    <CardTitle 
                      className="text-sm sm:text-base md:text-lg font-bold text-white leading-tight"
                      data-testid={`text-title-${tool.id}`}
                    >
                      {tool.title}
                    </CardTitle>
                  </div>
                  {tool.comingSoon && (
                    <Badge 
                      variant="secondary" 
                      className="bg-slate-700 text-slate-200 text-xs px-2 py-1 rounded-full flex-shrink-0"
                      data-testid={`badge-coming-soon-${tool.id}`}
                    >
                      Coming Soon
                    </Badge>
                  )}
                </div>
                <CardDescription 
                  className="text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-3"
                  data-testid={`text-description-${tool.id}`}
                >
                  {tool.description}
                </CardDescription>
              </CardHeader>

              <div className="flex justify-center mt-3 sm:mt-4">
                <Button
                  onClick={() => handleToolAction(tool.id)}
                  disabled={tool.comingSoon}
                  className={`w-full px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200 border-0 font-semibold rounded-lg hover:shadow-lg hover:scale-105 active:scale-95 ${
                    tool.comingSoon
                      ? "bg-black hover:bg-black text-white opacity-50 cursor-not-allowed"
                      : "bg-primary text-primary-foreground hover:shadow-primary/30"
                  }`}
                  data-testid={`button-action-${tool.id}`}
                  title={tool.tooltip}
                >
                  {tool.actionText}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </CardGrid>

      {/* Stats Overview */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="gradient-card rounded-2xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-slate-800/50 transition-all duration-300">
              <TrendingUp className="w-6 h-6 stroke-2 text-primary" />
            </div>
            <div>
              <h3 className="text-white font-bold text-xl">245%</h3>
              <p className="text-slate-300 text-sm">Avg. Revenue Increase</p>
            </div>
          </div>
        </Card>
        
        <Card className="gradient-card rounded-2xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-slate-800/50 transition-all duration-300">
              <Target className="w-6 h-6 stroke-2 text-primary" />
            </div>
            <div>
              <h3 className="text-white font-bold text-xl">89%</h3>
              <p className="text-slate-300 text-sm">Cart Recovery Rate</p>
            </div>
          </div>
        </Card>
        
        <Card className="gradient-card rounded-2xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-slate-800/50 transition-all duration-300">
              <Zap className="w-6 h-6 stroke-2 text-primary" />
            </div>
            <div>
              <h3 className="text-white font-bold text-xl">12.3x</h3>
              <p className="text-slate-300 text-sm">Email Engagement</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pro Features Notice */}
      <div className="mt-8 p-6 gradient-surface rounded-2xl">
        <div className="flex items-start space-x-4">
          <div className="transition-all duration-300">
            <Sparkles className="w-6 h-6 stroke-2 text-primary" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-2">AI-Powered Campaign Intelligence</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Our advanced AI analyzes customer behavior, purchase patterns, and engagement history to automatically 
              optimize your email and SMS campaigns. From behavioral triggers to dynamic segmentation, 
              every message is personalized for maximum conversion.
            </p>
          </div>
        </div>
      </div>

    </PageContainer>
  );
}