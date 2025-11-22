import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { GradientPageHeader } from "@/components/ui/page-hero";
import { 
  Zap, 
  Copy, 
  TrendingUp, 
  Search, 
  Heart, 
  Upload, 
  Wand2,
  Package,
  Target,
  ImageIcon,
  Palette,
  Brain,
  Camera,
  FlaskConical,
  RefreshCw,
  Sparkles,
  FileText,
  BarChart3
} from "lucide-react";

interface GenerateForm {
  productName: string;
  category: string;
  features: string;
  audience: string;
}

interface GeneratedResult {
  sales?: string;
  seo?: string;
  casual?: string;
}

export default function AITools() {
  const { toast } = useToast();
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [brandVoice, setBrandVoice] = useState("sales");
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult>({});

  const form = useForm<GenerateForm>({
    defaultValues: {
      productName: "",
      category: "Electronics",
      features: "",
      audience: "General consumers",
    },
  });

  // Mock mutation for AI generation (placeholder for MVP)
  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock response based on tool type
      const mockResponses = {
        'product-descriptions': {
          description: `Experience premium quality with our ${data.productName}. ${data.features ? `Featuring ${data.features}, ` : ''}this product delivers exceptional value for ${data.audience}.`
        },
        'bulk-optimization': {
          message: `Successfully optimized ${Math.floor(Math.random() * 50) + 20} products with improved SEO scores and conversion rates.`
        },
        'seo-titles': {
          title: `${data.productName} - Premium Quality & Fast Shipping | YourStore`,
          meta: `Shop ${data.productName} with confidence. ${data.features} Perfect for ${data.audience}. Free shipping on orders over $50.`
        },
        'image-alt-text': {
          altText: `High-quality ${data.productName} showing ${data.features} in professional studio lighting`
        }
      };
      
      return mockResponses[data.toolId as keyof typeof mockResponses] || { message: 'AI processing completed successfully!' };
    },
    onSuccess: (result, variables) => {
      if (variables.toolId === 'product-descriptions' && 'description' in result) {
        setGeneratedResults(prev => ({
          ...prev,
          [variables.brandVoice || 'sales']: result.description,
        }));
      }
      
      toast({
        title: "AI Processing Complete!",
        description: `${getToolById(variables.toolId)?.title} completed successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Processing failed",
        description: error.message || "Failed to process with AI",
        variant: "destructive",
      });
    },
  });

  const aiTools = [
    {
      id: 'product-seo-engine',
      title: 'Ultimate Product SEO Engine',
      description: 'AI-powered SEO Titles, Descriptions & Meta Optimization — All-in-one SEO powerhouse',
      icon: <Zap className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />,
      category: 'new',
      gradient: 'from-cyan-500 via-blue-500 to-purple-600',
      actionText: 'Open SEO Engine',
      comingSoon: false,
      featured: true
    },
    {
      id: 'bulk-optimization',
      title: 'Bulk Optimization',
      description: 'Optimize 20-100+ products in one go with AI-powered enhancements',
      icon: <Package className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />,
      category: 'existing', 
      gradient: 'from-green-500 to-emerald-400',
      actionText: 'Start Bulk Process',
      comingSoon: false
    },
    {
      id: 'image-alt-text',
      title: 'AI Image Alt-Text',
      description: 'Auto-generate alt-text for accessibility and SEO optimization',
      icon: <ImageIcon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />,
      category: 'existing',
      gradient: 'from-orange-500 to-yellow-400',
      actionText: 'Process Images',
      comingSoon: false
    },
    {
      id: 'dynamic-templates',
      title: 'Dynamic Templates',
      description: 'Pre-built tones: Luxury, Gen Z, Eco, Minimalist, and more',
      icon: <Palette className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />,
      category: 'new',
      gradient: 'from-pink-500 to-rose-400',
      actionText: 'Choose Template',
      comingSoon: false
    },
    {
      id: 'brand-voice',
      title: 'Brand Voice Memory',
      description: 'Set your brand tone once, Zyra AI applies it everywhere automatically',
      icon: <Brain className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />,
      category: 'new',
      gradient: 'from-indigo-500 to-blue-400',
      actionText: 'Setup Voice',
      comingSoon: false
    },
    {
      id: 'multimodal-ai',
      title: 'Multimodal AI',
      description: 'Upload product images + tags for richer, more accurate copy generation',
      icon: <Camera className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />,
      category: 'new',
      gradient: 'from-teal-500 to-cyan-400',
      actionText: 'Upload & Generate',
      comingSoon: false
    },
    {
      id: 'ab-testing',
      title: 'A/B Testing Copy',
      description: 'Auto-generate multiple versions, track CTR/conversions, keep the winner',
      icon: <FlaskConical className="w-8 h-8" />,
      category: 'new',
      gradient: 'from-red-500 to-pink-400',
      actionText: 'Start A/B Test',
      comingSoon: false
    },
    {
      id: 'scheduled-refresh',
      title: 'Scheduled Refresh',
      description: 'Auto-update SEO/descriptions every 3-6 months for content freshness',
      icon: <RefreshCw className="w-8 h-8" />,
      category: 'new',
      gradient: 'from-violet-500 to-purple-400',
      actionText: 'Schedule Updates',
      comingSoon: false
    }
  ];

  const getToolById = (id: string) => aiTools.find(tool => tool.id === id);

  const [, setLocation] = useLocation();

  const handleToolAction = (toolId: string) => {
    const tool = getToolById(toolId);
    
    if (tool?.comingSoon) {
      toast({
        title: "Coming Soon!",
        description: `${tool.title} will be available in a future update.`,
      });
      return;
    }

    // Store navigation source so dashboard knows to return to AI tools tab
    sessionStorage.setItem('navigationSource', 'ai-tools');

    // Navigate to dedicated AI tool pages
    switch (toolId) {
      case 'product-seo-engine':
        setLocation('/ai-tools/product-seo-engine');
        break;
      case 'bulk-optimization':
        setLocation('/ai-tools/bulk-optimization');
        break;
      case 'image-alt-text':
        setLocation('/ai-tools/ai-image-alt-text');
        break;
      case 'dynamic-templates':
        setLocation('/ai-tools/dynamic-templates');
        break;
      case 'brand-voice':
        setLocation('/ai-tools/brand-voice-memory');
        break;
      case 'multimodal-ai':
        setLocation('/ai-tools/multimodal-ai');
        break;
      case 'ab-testing':
        setLocation('/ai-tools/ab-testing-copy');
        break;
      case 'scheduled-refresh':
        setLocation('/ai-tools/scheduled-refresh');
        break;
      default:
        toast({
          title: "Tool not found",
          description: "This AI tool page is not available yet.",
          variant: "destructive",
        });
    }
  };

  const onSubmit = (data: GenerateForm) => {
    generateMutation.mutate({ ...data, brandVoice, toolId: 'product-descriptions' });
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${type} description copied to clipboard.`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const voiceButtons = [
    { id: "sales", label: "Sales", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "seo", label: "SEO", icon: <Search className="w-4 h-4" /> },
    { id: "casual", label: "Casual", icon: <Heart className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* AI Tools Hub Header */}
      <GradientPageHeader
        icon={<Sparkles className="w-8 h-8 text-primary" />}
        title="AI Tools Hub"
        subtitle="Supercharge your e-commerce with AI-powered content generation, optimization, and automation"
      />

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {aiTools.map((tool) => (
          <Card 
            key={tool.id} 
            className="group relative overflow-hidden gradient-card rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:scale-[1.02] border border-slate-700/50 hover:border-primary/30"
            data-testid={`card-${tool.id}`}
          >
            <div className="h-full p-3 sm:p-4 md:p-6 flex flex-col">
              <CardHeader className="p-0 flex-1 space-y-2 sm:space-y-3">
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="text-primary flex-shrink-0">
                      {tool.icon}
                    </div>
                    <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white leading-tight">
                      {tool.title}
                    </CardTitle>
                  </div>
                  {tool.comingSoon && (
                    <Badge className="bg-slate-700 text-slate-200 text-xs px-2 py-1 rounded-full hover:bg-slate-700 flex-shrink-0">
                      Soon
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-3">
                  {tool.description}
                </CardDescription>
              </CardHeader>
              
              <div className="flex justify-center mt-3 sm:mt-4">
                <Button
                  onClick={() => handleToolAction(tool.id)}
                  disabled={generateMutation.isPending || tool.comingSoon}
                  className={`w-full px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200 border-0 font-semibold rounded-lg ${
                    tool.comingSoon 
                      ? 'bg-black text-white opacity-50 cursor-not-allowed' 
                      : 'bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/30 hover:scale-105 active:scale-95'
                  }`}
                  data-testid={`button-${tool.id}`}
                >
                  <Wand2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="truncate">
                    {generateMutation.isPending && activeToolId === tool.id 
                      ? 'Processing...' 
                      : tool.actionText
                    }
                  </span>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>


      {/* Generated Results */}
      {Object.keys(generatedResults).length > 0 && (
        <div className="space-y-6">
          {generatedResults.sales && (
            <Card className="border-2 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold flex items-center">
                    <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                    Sales Style
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(generatedResults.sales!, "Sales")}
                      data-testid="button-copy-sales"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button className="bg-gradient-to-r from-green-500 to-emerald-400 text-white" data-testid="button-use-sales">
                      Use This
                    </Button>
                  </div>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-foreground leading-relaxed" data-testid="text-sales-result">
                    {generatedResults.sales}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {generatedResults.seo && (
            <Card className="border-2 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold flex items-center">
                    <Search className="w-5 h-5 text-blue-600 mr-2" />
                    SEO Style
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(generatedResults.seo!, "SEO")}
                      data-testid="button-copy-seo"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white" data-testid="button-use-seo">
                      Use This
                    </Button>
                  </div>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-foreground leading-relaxed" data-testid="text-seo-result">
                    {generatedResults.seo}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {generatedResults.casual && (
            <Card className="border-2 border-pink-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold flex items-center">
                    <Heart className="w-5 h-5 text-pink-600 mr-2" />
                    Casual Style
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(generatedResults.casual!, "Casual")}
                      data-testid="button-copy-casual"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button className="bg-gradient-to-r from-pink-500 to-rose-400 text-white" data-testid="button-use-casual">
                      Use This
                    </Button>
                  </div>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-foreground leading-relaxed" data-testid="text-casual-result">
                    {generatedResults.casual}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Close Tool */}
      {activeToolId && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setActiveToolId(null)}
            data-testid="button-close-tool"
          >
            Close Tool
          </Button>
        </div>
      )}
    </div>
  );
}