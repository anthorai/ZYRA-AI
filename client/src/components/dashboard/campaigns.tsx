import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      id: 'custom-templates',
      title: 'Custom Templates',
      description: 'Create and edit email & SMS workflow templates with drag-and-drop builder',
      icon: <FileText className="w-6 h-6 stroke-2 text-primary" />,
      category: 'existing',
      actionText: 'Edit Templates',
      comingSoon: false,
      tooltip: 'Design custom email and SMS templates for all your marketing workflows'
    },
    {
      id: 'behavioral-triggers',
      title: 'Behavioral Triggers',
      description: 'AI decides optimal timing & channel - email for active users, SMS for inactive ones',
      icon: <Brain className="w-6 h-6 stroke-2 text-primary" />,
      category: 'new',
      actionText: 'Setup Triggers',
      comingSoon: false,
      tooltip: 'Let AI automatically choose the best communication channel and timing for each customer'
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
    {
      id: 'dynamic-segmentation',
      title: 'Dynamic Segmentation',
      description: 'Auto-segment customers into groups: first-timers, loyal buyers, discount seekers',
      icon: <Users className="w-6 h-6 stroke-2 text-primary" />,
      category: 'new',
      actionText: 'Setup Segments',
      comingSoon: false,
      tooltip: 'Automatically group customers based on behavior patterns for targeted messaging'
    },
    {
      id: 'multi-channel-repurposing',
      title: 'Multi-Channel Repurposing',
      description: 'Convert one product copy into multiple formats: ad copy → social → email → SMS',
      icon: <RotateCcw className="w-6 h-6 stroke-2 text-primary" />,
      category: 'new',
      actionText: 'Generate Variants',
      comingSoon: false,
      tooltip: 'Transform one piece of content into optimized versions for all marketing channels'
    }
  ];


  const handleToolAction = (toolId: string) => {
    const routeMap: Record<string, string> = {
      'ai-upsell-suggestions': '/ai-upsell-suggestions',
      'dynamic-segmentation': '/dynamic-segmentation',
      'multi-channel-repurposing': '/multi-channel-repurposing',
      'upsell-receipts': '/upsell-email-receipts',
      'abandoned-cart-sms': '/abandoned-cart-sms',
      'custom-templates': '/custom-templates',
      'behavioral-triggers': '/behavioral-triggers'
    };
    
    const route = routeMap[toolId];
    if (route) {
      // Store navigation source so dashboard knows to return to campaigns tab
      sessionStorage.setItem('navigationSource', 'campaigns');
      setLocation(route);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-3 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              AI Email & SMS Growth Engine
            </h1>
            <p className="text-slate-300 text-lg">
              Automate your customer communications with intelligent campaigns and behavioral triggers
            </p>
          </div>
          <Button
            onClick={() => setLocation('/campaigns/create')}
            className="bg-primary text-white hover:bg-primary/90"
          >
            <Mail className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Campaign Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {campaignTools.map((tool) => (
          <Card 
            key={tool.id} 
            className="relative gradient-card rounded-2xl transition-all duration-300 hover:scale-105 border-slate-700/50"
            data-testid={`card-campaign-${tool.id}`}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="transition-all duration-300">
                    {tool.icon}
                  </div>
                  <CardTitle className="text-white font-bold text-lg" data-testid={`text-title-${tool.id}`}>
                    {tool.title}
                  </CardTitle>
                </div>
                {tool.comingSoon && (
                  <Badge 
                    variant="secondary" 
                    className="bg-slate-700 text-slate-200 text-xs px-2 py-1 rounded-full"
                    data-testid={`badge-coming-soon-${tool.id}`}
                  >
                    Coming Soon
                  </Badge>
                )}
              </div>
              <CardDescription className="text-slate-300 mt-2" data-testid={`text-description-${tool.id}`}>
                {tool.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                onClick={() => handleToolAction(tool.id)}
                disabled={tool.comingSoon}
                className={`w-full font-medium transition-all duration-300 ${
                  tool.comingSoon
                    ? "bg-black hover:bg-black text-white hover:scale-105"
                    : "gradient-button hover:scale-105"
                }`}
                data-testid={`button-action-${tool.id}`}
                title={tool.tooltip}
              >
                {tool.actionText}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Overview */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
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

    </div>
  );
}