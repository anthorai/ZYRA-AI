import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { getToolCredits, formatCreditsDisplay } from "@shared/ai-credits";
import { 
  Palette,
  Copy,
  CheckCircle,
  Clock,
  Zap,
  Sparkles,
  TrendingUp,
  Circle
} from "lucide-react";

interface ToneTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  example: string;
  keywords: string[];
}

interface TransformForm {
  originalText: string;
  productName: string;
}

export default function DynamicTemplates() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [transformedText, setTransformedText] = useState<string>("");

  const form = useForm<TransformForm>({
    defaultValues: {
      originalText: "",
      productName: "",
    },
  });


  const toneTemplates: ToneTemplate[] = [
    {
      id: 'luxury',
      name: 'Luxury',
      description: 'Sophisticated, premium, exclusive language for high-end products',
      icon: <Sparkles className="w-6 h-6" />,
      color: '#F59E0B',
      example: 'Exquisite craftsmanship meets unparalleled elegance...',
      keywords: ['sophisticated', 'premium', 'exclusive', 'elegant', 'craftsmanship']
    },
    {
      id: 'eco-friendly',
      name: 'Eco-Friendly',
      description: 'Sustainable, environmentally conscious, green messaging',
      icon: <Zap className="w-6 h-6" />,
      color: '#10B981',
      example: 'Sustainably sourced materials for a better tomorrow...',
      keywords: ['sustainable', 'eco-friendly', 'green', 'natural', 'responsible']
    },
    {
      id: 'gen-z',
      name: 'Gen Z',
      description: 'Fun, trendy, casual language with modern slang and energy',
      icon: <TrendingUp className="w-6 h-6" />,
      color: '#8B5CF6',
      example: 'This is literally the vibe you need in your life...',
      keywords: ['trendy', 'vibes', 'iconic', 'aesthetic', 'mood']
    },
    {
      id: 'minimalist',
      name: 'Minimalist',
      description: 'Clean, simple, straightforward copy that focuses on essentials',
      icon: <Circle className="w-6 h-6" />,
      color: '#6B7280',
      example: 'Simple. Effective. Essential.',
      keywords: ['simple', 'clean', 'essential', 'minimal', 'focused']
    }
  ];

  // Mock tone transformation mutation
  const transformMutation = useMutation({
    mutationFn: async (data: TransformForm & { templateId: string }) => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const template = toneTemplates.find(t => t.id === data.templateId);
      if (!template) throw new Error('Template not found');
      
      const { originalText, productName } = data;
      let transformedText = "";
      
      // Generate transformed text based on selected tone
      switch (data.templateId) {
        case 'luxury':
          transformedText = `Discover the epitome of sophistication with our exquisite ${productName}. ${originalText ? `${originalText.replace(/\b(good|nice|great)\b/gi, 'exceptional').replace(/\b(buy|get)\b/gi, 'acquire')}` : ''} Crafted with meticulous attention to detail, this premium offering represents the finest in luxury and elegance. An investment in excellence that transcends mere ownership—it's a statement of refined taste.`;
          break;
        case 'eco-friendly':
          transformedText = `Choose sustainable excellence with our eco-conscious ${productName}. ${originalText ? `${originalText.replace(/\b(made|created)\b/gi, 'sustainably crafted').replace(/\b(materials|parts)\b/gi, 'eco-friendly materials')}` : ''} Responsibly sourced and environmentally mindful, this product helps you make a positive impact while enjoying premium quality. Together, we're building a greener tomorrow, one conscious choice at a time.`;
          break;
        case 'gen-z':
          transformedText = `Okay, this ${productName} is literally everything! 💯 ${originalText ? `${originalText.replace(/\b(good|great)\b/gi, 'iconic').replace(/\b(very)\b/gi, 'SO')}` : ''} The vibes are immaculate and the aesthetic is *chef's kiss*. This is going to be your new obsession, no cap. Your friends are gonna be like "where did you GET that?!" Trust me, this hits different. It's giving main character energy fr 🔥`;
          break;
        case 'minimalist':
          transformedText = `${productName}. ${originalText ? originalText.replace(/\b(amazing|incredible|fantastic)\b/gi, 'effective').split('.')[0] + '.' : 'Essential function.'} Clean design. Pure performance. Nothing more, nothing less.`;
          break;
        default:
          transformedText = originalText;
      }
      
      // Store tone preference in mock Supabase
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return transformedText;
    },
    onSuccess: (result) => {
      setTransformedText(result);
      toast({
        title: "🎨 Transformation Complete!",
        description: "Your content has been adapted to the selected tone style!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Transformation failed",
        description: error.message || "Failed to transform content",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TransformForm) => {
    if (!selectedTemplate) {
      toast({
        title: "Select a tone template",
        description: "Please choose a tone style before transforming",
        variant: "destructive",
      });
      return;
    }

    if (!data.originalText.trim() && !data.productName.trim()) {
      toast({
        title: "Content required",
        description: "Please provide either original text or a product name",
        variant: "destructive",
      });
      return;
    }

    transformMutation.mutate({ ...data, templateId: selectedTemplate });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Transformed content copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const saveAsTemplate = () => {
    // Simulate saving preference to Supabase
    toast({
      title: "Template Saved!",
      description: "This tone style has been saved as your default preference.",
    });
  };

  return (
    <PageShell
      title="Dynamic Tone Templates"
      subtitle="Transform your product descriptions to match different brand voices and tones using AI"
      backTo="/dashboard?tab=campaigns"
    >
      {/* Process Overview */}
      <DashboardCard
        title="Transform Your Brand Voice"
        description="Choose from pre-built tone templates to instantly transform your product descriptions. Zyra AI learns your preferred style and can apply it consistently across all your content."
      >
        <div className="flex items-center space-x-2 text-slate-300 text-sm">
          <Sparkles className="w-5 h-5 text-primary" />
          <p>AI-powered tone transformation available instantly</p>
        </div>
      </DashboardCard>

      {/* Tone Templates */}
      <DashboardCard
        title="Choose Your Tone Style"
        description="Select a tone template that matches your brand personality"
      >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {toneTemplates.map((template) => (
                <Card 
                  key={template.id}
                  className="group relative shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl cursor-pointer hover:scale-105"
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <div className="h-full p-3 sm:p-4 md:p-6 space-y-4 overflow-hidden">
                    <div className="flex items-start space-x-4">
                      <div className="text-primary">
                        {template.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">{template.name}</h3>
                        <p className="text-slate-300 text-sm mb-3">{template.description}</p>
                        <div className="bg-slate-800/50 p-3 rounded-lg mb-3">
                          <p className="text-slate-200 text-sm italic">"{template.example}"</p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {template.keywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
      </DashboardCard>

      {/* Input Form */}
      <DashboardCard
        title="Content to Transform"
        description="Provide your original content and watch Zyra AI transform it to match your selected tone"
      >
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="productName" className="text-white">Product Name (Optional)</Label>
                  <Input
                    id="productName"
                    className="mt-2 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                    placeholder="e.g., Wireless Headphones"
                    {...form.register("productName")}
                  />
                </div>
                <div>
                  <Label className="text-white">Selected Tone</Label>
                  <div className="mt-2 p-3 bg-slate-800/50 border border-slate-600 rounded-md">
                    {selectedTemplate ? (
                      <span className="text-primary font-medium">
                        {toneTemplates.find(t => t.id === selectedTemplate)?.name}
                      </span>
                    ) : (
                      <span className="text-slate-400">No tone selected</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="originalText" className="text-white">Original Text</Label>
                <Textarea
                  id="originalText"
                  className="mt-2 h-32 resize-none bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                  placeholder="Enter your original product description or copy here..."
                  {...form.register("originalText")}
                />
              </div>

              <Button
                type="submit"
                disabled={transformMutation.isPending || !selectedTemplate}
                className="w-full gradient-button transition-all duration-200 font-medium"
                data-testid="button-transform"
              >
                {transformMutation.isPending ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Transforming tone...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Transform Content - {formatCreditsDisplay(getToolCredits('dynamic-templates'))}
                  </>
                )}
              </Button>
            </form>
      </DashboardCard>

      {/* Transformed Result */}
      {transformedText && (
        <DashboardCard
          className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary-foreground/20"
        >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <h3 className="text-xl font-semibold text-white">Transformed Content</h3>
                  <Badge className="bg-primary/20 text-primary">
                    {toneTemplates.find(t => t.id === selectedTemplate)?.name} Style
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(transformedText)}
                    className="text-primary hover:text-white hover:bg-primary/10"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button 
                    onClick={saveAsTemplate}
                    className="gradient-button"
                  >
                    Save as Default
                  </Button>
                </div>
              </div>
              <div className="bg-slate-800/30 p-4 rounded-lg border border-primary/20">
                <p className="text-slate-100 leading-relaxed">
                  {transformedText}
                </p>
              </div>
        </DashboardCard>
      )}
    </PageShell>
  );
}