import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageContainer, PageHeader } from "@/components/ui/standardized-layout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Upload, 
  Download, 
  Share, 
  Brain, 
  RotateCcw,
  FileSpreadsheet,
  Package,
  TrendingUp
} from "lucide-react";

interface AutomationTool {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  category: 'existing' | 'new';
  actionText: string;
  comingSoon: boolean;
  tooltip: string;
}

export default function AutomationTools() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const automationTools: AutomationTool[] = [
    {
      id: 'csv-import-export',
      title: 'CSV Import/Export',
      description: 'Upload or download CSV files for bulk product management and data synchronization',
      icon: <FileSpreadsheet className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary" />,
      category: 'existing',
      actionText: 'Upload CSV',
      comingSoon: false,
      tooltip: 'Bulk upload products from CSV or export your existing products for external management'
    },
    {
      id: 'shopify-publish',
      title: 'One-Click Shopify Publish',
      description: 'Push optimized product copy directly to your Shopify store listings instantly',
      icon: <Share className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary" />,
      category: 'existing', 
      actionText: 'Publish to Shopify',
      comingSoon: false,
      tooltip: 'Automatically sync your optimized product descriptions to Shopify with a single click'
    },
    {
      id: 'bulk-suggestions',
      title: 'Smart Bulk Suggestions',
      description: 'AI scans products with low CTR/SEO performance and auto-suggests improvements',
      icon: <Brain className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary" />,
      category: 'new',
      actionText: 'Run Suggestions',
      comingSoon: false,
      tooltip: 'Let AI analyze your product performance and automatically suggest title, description, and tag improvements'
    },
    {
      id: 'rollback-changes',
      title: 'Rollback Button',
      description: 'Instantly undo recent changes to restore previous versions and ensure data safety',
      icon: <RotateCcw className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary" />,
      category: 'new',
      actionText: 'Rollback Changes',
      comingSoon: false,
      tooltip: 'One-click rollback to previous versions of your product data for peace of mind'
    }
  ];

  // Mock mutation for automation actions
  const automationMutation = useMutation({
    mutationFn: async (data: { toolId: string; action: string }) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResponses = {
        'csv-import-export': {
          message: `Successfully processed CSV file. ${Math.floor(Math.random() * 100) + 50} products updated.`
        },
        'shopify-publish': {
          message: `Published ${Math.floor(Math.random() * 25) + 10} optimized products to your Shopify store.`
        },
        'bulk-suggestions': {
          message: `Generated smart suggestions for ${Math.floor(Math.random() * 30) + 15} products needing optimization.`
        },
        'rollback-changes': {
          message: `Successfully rolled back to previous version. All changes from the last 24 hours have been restored.`
        }
      };

      return mockResponses[data.toolId as keyof typeof mockResponses] || { message: 'Action completed successfully.' };
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: data.message,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete automation action. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleToolAction = (toolId: string) => {
    const tool = automationTools.find(t => t.id === toolId);
    
    if (tool?.comingSoon) {
      toast({
        title: "Coming Soon!",
        description: `${tool.title} will be available in a future update.`,
      });
      return;
    }

    // Navigate to the specific automation tool page
    const routeMap = {
      'csv-import-export': '/automation/csv-import-export',
      'shopify-publish': '/automation/shopify-publish',
      'bulk-suggestions': '/automation/smart-bulk-suggestions',
      'rollback-changes': '/automation/rollback-changes'
    };

    const route = routeMap[toolId as keyof typeof routeMap];
    if (route) {
      setLocation(route);
    }
  };

  return (
    <PageContainer>
      <PageHeader 
        icon={Package}
        title="Automation Tools"
        subtitle="Streamline your workflow with powerful automation features for bulk operations and intelligent optimizations."
      />
      {/* Automation Tools Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6 ml-[5px] mr-[5px]">
        {automationTools.map((tool) => (
          <Card 
            key={tool.id} 
            className="group relative overflow-hidden gradient-card rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:scale-[1.02] border border-slate-700/50 hover:border-primary/30"
            data-testid={`card-automation-${tool.id}`}
          >
            <div className="h-full p-3 sm:p-4 md:p-6 flex flex-col">
              <CardHeader className="p-0 flex-1 space-y-2 sm:space-y-3">
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="text-primary flex-shrink-0">
                      {tool.icon}
                    </div>
                    <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white leading-tight" data-testid={`text-title-${tool.id}`}>
                      {tool.title}
                    </CardTitle>
                  </div>
                  {tool.comingSoon && (
                    <Badge className="bg-slate-700 text-slate-200 text-xs px-2 py-1 rounded-full hover:bg-slate-700 flex-shrink-0" data-testid={`badge-coming-soon-${tool.id}`}>
                      Soon
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-3" data-testid={`text-description-${tool.id}`}>
                  {tool.description}
                </CardDescription>
              </CardHeader>
              
              <div className="flex justify-center mt-3 sm:mt-4">
                <Button
                  onClick={() => handleToolAction(tool.id)}
                  disabled={automationMutation.isPending || tool.comingSoon}
                  className={`gradient-button w-full h-9 sm:h-10 text-xs sm:text-sm font-semibold ${
                    tool.comingSoon ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  data-testid={`button-action-${tool.id}`}
                  title={tool.tooltip}
                >
                  <span className="truncate">
                    {automationMutation.isPending ? 'Processing...' : tool.actionText}
                  </span>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {/* Additional Info */}
      <div className="mt-8 p-6 gradient-surface rounded-xl border border-slate-700/50 ml-[8px] mr-[8px]">
        <div className="flex items-start space-x-4">
          <TrendingUp className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-white font-semibold mb-2">Automation Benefits</h3>
            <p className="text-slate-300 text-sm">
              Save hours of manual work with intelligent bulk operations. Process hundreds of products, 
              sync with Shopify, and get AI-powered optimization suggestions to maximize your store's performance.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}