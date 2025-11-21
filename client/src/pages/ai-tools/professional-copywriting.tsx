import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { supabase } from "@/lib/supabaseClient";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { ProductSelector } from "@/components/ui/product-selector";
import { 
  Zap, 
  Copy, 
  TrendingUp, 
  Target,
  Trophy,
  Sparkles,
  CheckCircle,
  Award,
  Brain,
  Heart,
  BarChart3,
  Lightbulb,
  AlertTriangle,
  Gauge
} from "lucide-react";
import type { Product } from "@shared/schema";

interface CopyForm {
  productName: string;
  category: string;
  features: string;
  audience: string;
  framework: string;
  industry: string;
  maxWords: number;
}

interface QualityScore {
  overall: number;
  conversionPotential: number;
  seoScore: number;
  readability: number;
  emotionalImpact: number;
  clarity: number;
  breakdown: {
    strengths: string[];
    improvements: string[];
    keywords: string[];
    sentiment: string;
  };
}

interface CopyVariant {
  id: string;
  type: string;
  headline: string;
  copy: string;
  cta: string;
  qualityScore: QualityScore;
  validation: {
    passed: boolean;
    score: number;
    readability: number;
    seo: number;
    issues: any[];
    suggestions: any[];
  };
  framework: string;
  psychologicalTriggers: string[];
}

interface GeneratedCopy {
  success: boolean;
  framework: string;
  wordCount: number;
  variants?: CopyVariant[]; // Optional for Fast Mode
  analysis?: any;
  recommendedVariant?: string;
  validationSummary?: {
    allPassed: boolean;
    averageScore: number;
    patternsUsed: number;
  };
  // Fast Mode specific fields
  fastMode?: boolean;
  headline?: string;
  copy?: string;
  cta?: string;
}

export default function ProfessionalCopywriting() {
  const { toast } = useToast();
  const [generatedCopy, setGeneratedCopy] = useState<GeneratedCopy | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [fastMode, setFastMode] = useState(true); // Default to Fast Mode
  const [streamingText, setStreamingText] = useState("");
  const [fastModeResult, setFastModeResult] = useState<any | null>(null);

  const [navigationSource, setNavigationSource] = useState<string | null>(null);

  useEffect(() => {
    const source = sessionStorage.getItem('navigationSource');
    setNavigationSource(source);
  }, []);

  const form = useForm<CopyForm>({
    defaultValues: {
      productName: "",
      category: "",
      features: "",
      audience: "",
      framework: "aida",
      industry: "",
      maxWords: 150,
    },
  });


  const productCategories = [
    "Electronics",
    "Fashion & Apparel",
    "Home & Garden",
    "Beauty & Personal Care",
    "Sports & Outdoors",
    "Toys & Games",
    "Books & Media",
    "Food & Beverage",
    "Health & Wellness",
    "Automotive",
    "Pet Supplies",
    "Office & Stationery",
    "Baby & Kids",
    "Arts & Crafts",
    "Jewelry & Accessories",
    "Tools & Hardware",
    "Musical Instruments"
  ];

  const targetAudiences = [
    "Young Adults (18-25)",
    "Millennials (26-40)",
    "Gen X (41-56)",
    "Baby Boomers (57+)",
    "Parents with Young Children",
    "Working Professionals",
    "Students",
    "Entrepreneurs & Small Business Owners",
    "Budget-Conscious Shoppers",
    "Luxury Seekers",
    "Health & Wellness Enthusiasts",
    "Tech Early Adopters",
    "Eco-Conscious Consumers",
    "Busy Families",
    "Retirees",
    "Gamers & Tech Enthusiasts"
  ];

  const industries = [
    "E-commerce & Retail",
    "SaaS & Technology",
    "Healthcare & Medical",
    "Education & Training",
    "Real Estate",
    "Finance & Banking",
    "Hospitality & Tourism",
    "Food & Restaurant",
    "Manufacturing",
    "Professional Services",
    "Marketing & Advertising",
    "Entertainment & Media",
    "Fashion & Beauty",
    "Fitness & Wellness",
    "Automotive",
    "Home Services",
    "Agriculture"
  ];

  const copywritingFrameworks = [
    {
      id: 'aida',
      name: 'AIDA',
      description: 'Attention, Interest, Desire, Action',
      icon: <Target className="w-5 h-5 text-primary" />,
      bestFor: 'Sales pages, product launches'
    },
    {
      id: 'pas',
      name: 'PAS',
      description: 'Problem, Agitate, Solution',
      icon: <Lightbulb className="w-5 h-5 text-primary" />,
      bestFor: 'Problem-solving products'
    },
    {
      id: 'fab',
      name: 'FAB',
      description: 'Features, Advantages, Benefits',
      icon: <BarChart3 className="w-5 h-5 text-primary" />,
      bestFor: 'B2B, technical products'
    },
    {
      id: 'storytelling',
      name: 'Storytelling',
      description: 'Narrative-driven emotional connection',
      icon: <Heart className="w-5 h-5 text-primary" />,
      bestFor: 'Brand building, lifestyle products'
    },
    {
      id: 'before-after-bridge',
      name: 'Before-After-Bridge',
      description: 'Show transformation journey',
      icon: <TrendingUp className="w-5 h-5 text-primary" />,
      bestFor: 'Health, fitness, self-improvement'
    }
  ];

  // SSE Parser for streaming (same as in Smart Product Descriptions and SEO Optimization)
  const parseSSEStream = (chunk: string, buffer: string): { events: any[], newBuffer: string } => {
    const combined = buffer + chunk;
    const lines = combined.split('\n');
    const events: any[] = [];
    let currentData = '';
    let remainingBuffer = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (i === lines.length - 1 && !combined.endsWith('\n')) {
        remainingBuffer = line;
        break;
      }
      
      if (line.startsWith('data: ')) {
        currentData = line.substring(6);
        try {
          const parsed = JSON.parse(currentData);
          events.push(parsed);
          currentData = '';
        } catch (e) {
          remainingBuffer = line;
        }
      }
    }
    
    return { events, newBuffer: remainingBuffer };
  };

  // Fast Mode streaming function
  const generateFastCopy = async (data: CopyForm) => {
    setIsGenerating(true);
    setStreamingText("");
    setFastModeResult(null);
    setAnalysisProgress(0);

    try {
      // Get the current session token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/generate-copy-fast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          productName: data.productName,
          category: data.category,
          features: data.features,
          audience: data.audience,
          framework: data.framework,
          industry: data.industry,
          maxWords: data.maxWords,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate copy');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream');
      }

      let progress = 0;
      let completed = false;
      let buffer = ''; // Buffer for incomplete SSE lines
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            // Stream ended - if we haven't received a complete event, this is an error
            if (!completed) {
              throw new Error('Stream ended unexpectedly without completion');
            }
            break;
          }

          // Decode chunk and add to buffer
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // Split on double newlines to get complete SSE events
          const events = buffer.split('\n\n');
          
          // Keep the last incomplete event in the buffer
          buffer = events.pop() || '';
          
          // Process complete events
          for (const event of events) {
            if (event.startsWith('data: ')) {
              try {
                const data = JSON.parse(event.slice(6));
                
                if (data.type === 'chunk') {
                  setStreamingText(prev => prev + data.content);
                  progress = Math.min(progress + 5, 90);
                  setAnalysisProgress(progress);
                } else if (data.type === 'complete') {
                  completed = true;
                  setFastModeResult(data.result);
                  setAnalysisProgress(100);
                  setIsGenerating(false);
                  return data.result;
                } else if (data.type === 'error') {
                  throw new Error(data.message);
                }
              } catch (parseError) {
                console.error('Failed to parse SSE data:', parseError, 'Event:', event);
                // Continue to next event instead of failing completely
              }
            }
          }
        }
      } finally {
        // Always clean up, even if there was an error
        reader.releaseLock();
      }
    } catch (error) {
      setIsGenerating(false);
      throw error;
    } finally {
      // Ensure isGenerating is always set to false
      setIsGenerating(false);
    }
  };

  const generateCopyMutation = useMutation({
    mutationFn: async (data: CopyForm) => {
      // Use Fast Mode or Quality Mode
      if (fastMode) {
        return await generateFastCopy(data);
      }

      // Quality Mode (original multi-agent pipeline)
      setIsGenerating(true);
      setAnalysisProgress(0);

      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setAnalysisProgress(i);
      }

      const response = await apiRequest('POST', '/api/generate-professional-copy', {
        productName: data.productName,
        category: data.category,
        features: data.features,
        audience: data.audience,
        framework: data.framework,
        industry: data.industry,
        maxWords: data.maxWords
      });

      const result = await response.json();
      setIsGenerating(false);
      return result;
    },
    onSuccess: (result) => {
      // Only set generatedCopy for Quality Mode (Fast Mode uses fastModeResult)
      if (!result.fastMode) {
        setGeneratedCopy(result);
      }
      toast({
        title: "✨ Professional Copy Generated!",
        description: `Created ${result.framework.toUpperCase()} framework copy with ${result.wordCount} words`,
      });
    },
    onError: (error: any) => {
      setIsGenerating(false);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate professional copy",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CopyForm) => {
    if (!data.productName.trim() || !data.features.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in product name and key features",
        variant: "destructive",
      });
      return;
    }
    generateCopyMutation.mutate(data);
  };

  const applyToProductMutation = useMutation({
    mutationFn: async ({ productId, copy }: { productId: string; copy: CopyVariant }) => {
      if (!productId) {
        throw new Error("No product selected");
      }
      const response = await apiRequest('POST', `/api/products/${productId}/apply-content`, {
        optimizedCopy: {
          headline: copy.headline,
          copy: copy.copy,
          cta: copy.cta,
          framework: copy.framework,
          qualityScore: copy.qualityScore,
          psychologicalTriggers: copy.psychologicalTriggers
        },
        optimizedDescription: copy.copy
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Applied to Product!",
        description: "AI-generated copy has been saved to your product.",
      });
      setSelectedProductId("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to apply content",
        description: error.message || "Could not save content to product",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard.`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <PageShell
      title="Professional Copywriting"
      subtitle="Generate conversion-focused copy using proven frameworks like AIDA, PAS, and FAB"
      
    >
      <div className="space-y-6 sm:space-y-8">
        <DashboardCard 
          title="Choose Your Framework"
          description="Select a proven copywriting framework that matches your product and goals"
          testId="card-frameworks"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {copywritingFrameworks.map((framework) => (
              <Card 
                key={framework.id}
                className={`group relative shadow-lg border transition-all duration-300 rounded-xl sm:rounded-2xl cursor-pointer hover:scale-105 ${
                  selectedFramework === framework.id 
                    ? 'border-primary/50 hover:border-primary/50 bg-gradient-to-br from-primary/10 to-primary-foreground/20' 
                    : 'border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10'
                }`}
                onClick={() => {
                  setSelectedFramework(framework.id);
                  form.setValue('framework', framework.id);
                }}
              >
                <CardContent className="p-3 sm:p-4 md:p-6 overflow-hidden">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="flex-shrink-0">
                      {framework.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white mb-1 truncate">{framework.name}</h3>
                      <p className="text-slate-300 text-sm mb-2">{framework.description}</p>
                      <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">
                        {framework.bestFor}
                      </Badge>
                    </div>
                  </div>
                  {selectedFramework === framework.id && (
                    <div className="flex items-center space-x-2 mt-3 text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Selected</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard
          title="Product Information"
          description="Provide details about your product for AI-powered copy generation"
          testId="card-product-info"
        >
          {/* Fast Mode Toggle */}
          <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className={`w-5 h-5 ${fastMode ? 'text-primary' : 'text-slate-400'}`} />
                <div>
                  <h3 className="text-white font-semibold">
                    {fastMode ? '⚡ Fast Mode' : '🎯 Quality Mode'}
                  </h3>
                  <p className="text-sm text-slate-300">
                    {fastMode 
                      ? 'Single variant, 2-3 seconds, real-time streaming'
                      : '3 variants, quality scores, 15-25 seconds'}
                  </p>
                </div>
              </div>
              <Switch
                checked={fastMode}
                onCheckedChange={setFastMode}
                data-testid="switch-fast-mode"
              />
            </div>
            {fastMode && (
              <div className="mt-3 flex items-center gap-2 text-xs text-primary/80">
                <Sparkles className="w-4 h-4" />
                <span>Real-time streaming enabled - Watch your copy being generated live!</span>
              </div>
            )}
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ProductSelector
              mode="single"
              label="Quick Select from Your Products"
              placeholder="Select a product to auto-fill details..."
              value={selectedProductId}
              onChange={(id) => {
                // Handle both selection and deselection
                setSelectedProductId(typeof id === 'string' ? id : "");
              }}
              onProductSelect={(product) => {
                if (product && !Array.isArray(product)) {
                  setSelectedProductId(product.id);
                  form.setValue("productName", product.name);
                  form.setValue("category", product.category);
                  if (product.features) {
                    form.setValue("features", product.features);
                  }
                  toast({
                    title: "Product Selected",
                    description: `Auto-filled details for "${product.name}"`,
                  });
                }
              }}
              showSelectedBadge={true}
            />

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="productName" className="text-white">Product Name *</Label>
                <Input
                  id="productName"
                  className="mt-2 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                  placeholder="e.g., Premium Wireless Headphones"
                  {...form.register("productName", { required: true })}
                  data-testid="input-product-name"
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-white">Category</Label>
                <Controller
                  name="category"
                  control={form.control}
                  render={({ field: { value, onChange } }) => (
                    <Select onValueChange={onChange} value={value ?? ""}>
                      <SelectTrigger className="mt-2 bg-slate-800/50 border-slate-600 text-white" data-testid="select-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {productCategories.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="features" className="text-white">Key Features & Benefits *</Label>
              <Textarea
                id="features"
                className="mt-2 h-24 resize-none bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                placeholder="List the main features and benefits of your product..."
                {...form.register("features", { required: true })}
                data-testid="input-features"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="audience" className="text-white">Target Audience</Label>
                <Controller
                  name="audience"
                  control={form.control}
                  render={({ field: { value, onChange } }) => (
                    <Select onValueChange={onChange} value={value ?? ""}>
                      <SelectTrigger className="mt-2 bg-slate-800/50 border-slate-600 text-white" data-testid="select-audience">
                        <SelectValue placeholder="Select target audience" />
                      </SelectTrigger>
                      <SelectContent>
                        {targetAudiences.map((audience) => (
                          <SelectItem key={audience} value={audience}>{audience}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <Label htmlFor="industry" className="text-white">Industry</Label>
                <Controller
                  name="industry"
                  control={form.control}
                  render={({ field: { value, onChange } }) => (
                    <Select onValueChange={onChange} value={value ?? ""}>
                      <SelectTrigger className="mt-2 bg-slate-800/50 border-slate-600 text-white" data-testid="select-industry">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="framework" className="text-white">Copywriting Framework</Label>
                <Select 
                  value={form.watch("framework")}
                  onValueChange={(value) => {
                    form.setValue("framework", value);
                    setSelectedFramework(value);
                  }}
                >
                  <SelectTrigger className="mt-2 bg-slate-800/50 border-slate-600 text-white" data-testid="select-framework">
                    <SelectValue placeholder="Select framework" />
                  </SelectTrigger>
                  <SelectContent>
                    {copywritingFrameworks.map(fw => (
                      <SelectItem key={fw.id} value={fw.id}>{fw.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="maxWords" className="text-white">Max Words</Label>
                <Input
                  id="maxWords"
                  type="number"
                  className="mt-2 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                  {...form.register("maxWords", { valueAsNumber: true })}
                  data-testid="input-max-words"
                />
              </div>
            </div>

            {isGenerating && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">
                    {fastMode ? '⚡ Generating in fast mode...' : 'Crafting professional copy...'}
                  </span>
                  <span className="text-white">{analysisProgress}%</span>
                </div>
                <Progress value={analysisProgress} className="h-2" />
                
                {/* Streaming preview for Fast Mode */}
                {fastMode && streamingText && (
                  <div className="mt-4 p-4 bg-slate-800/50 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                      <span className="text-sm text-primary font-medium">Streaming in real-time...</span>
                    </div>
                    <div className="text-slate-300 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {streamingText}
                      <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1"></span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={generateCopyMutation.isPending}
              className="w-full gradient-button transition-all duration-200 font-medium"
              data-testid="button-generate"
            >
              {generateCopyMutation.isPending ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Generating professional copy...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Generate Professional Copy
                </>
              )}
            </Button>
          </form>
        </DashboardCard>

        {/* Fast Mode Results */}
        {fastModeResult && !generatedCopy && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h2 className="text-2xl font-semibold text-white">Your Professional Copy</h2>
                <Badge className="bg-primary/20 text-primary">
                  {fastModeResult.framework?.toUpperCase()} Framework
                </Badge>
                <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                  <Zap className="w-3 h-3 mr-1" />
                  Fast Mode
                </Badge>
              </div>
            </div>

            <Card className="border border-primary/30 bg-gradient-to-br from-slate-800/50 to-slate-900/50">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                    <Sparkles className="w-5 h-5 text-primary mr-2" />
                    Headline
                  </h3>
                  <p className="text-lg text-slate-100 font-medium">{fastModeResult.headline}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(fastModeResult.headline, 'Headline')}
                    className="mt-2"
                    data-testid="button-copy-headline"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                    <Brain className="w-5 h-5 text-primary mr-2" />
                    Copy ({fastModeResult.wordCount || 0} words)
                  </h3>
                  <div className="text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-800/30 p-4 rounded-lg">
                    {fastModeResult.copy}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(fastModeResult.copy, 'Copy')}
                    className="mt-2"
                    data-testid="button-copy-content"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                    <Target className="w-5 h-5 text-primary mr-2" />
                    Call to Action
                  </h3>
                  <p className="text-lg text-slate-100 font-medium">{fastModeResult.cta}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(fastModeResult.cta, 'CTA')}
                    className="mt-2"
                    data-testid="button-copy-cta"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>

                <div className="pt-4 border-t border-slate-700 space-y-3">
                  {selectedProductId ? (
                    <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-primary/10 rounded-lg border border-primary/30">
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="text-lg font-semibold text-white mb-1">Ready to Apply?</h3>
                        <p className="text-sm text-slate-300">Save this AI-generated copy directly to your product</p>
                      </div>
                      <Button
                        onClick={() => {
                          const copyVariant: CopyVariant = {
                            headline: fastModeResult.headline,
                            copy: fastModeResult.copy,
                            cta: fastModeResult.cta,
                            framework: fastModeResult.framework,
                            type: 'Fast Mode',
                            id: `fast-${Date.now()}`,
                            qualityScore: {
                              overall: 85,
                              conversionPotential: 85,
                              seoScore: 80,
                              readability: 90,
                              emotionalImpact: 85,
                              clarity: 90,
                              breakdown: {
                                strengths: ['Fast generation', 'Clear messaging'],
                                improvements: ['Run Quality Mode for detailed scoring'],
                                keywords: ['professional', 'quality', 'fast'],
                                sentiment: 'positive'
                              }
                            },
                            validation: {
                              passed: true,
                              score: 85,
                              seo: 80,
                              readability: 90,
                              issues: [],
                              suggestions: []
                            },
                            psychologicalTriggers: fastModeResult.psychologicalTriggers || []
                          };
                          applyToProductMutation.mutate({ productId: selectedProductId, copy: copyVariant });
                        }}
                        disabled={applyToProductMutation.isPending}
                        className="gradient-button w-full sm:w-auto"
                        data-testid="button-apply-to-product"
                      >
                        {applyToProductMutation.isPending ? (
                          <>
                            <Zap className="w-4 h-4 mr-2 animate-pulse" />
                            Applying...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Apply to Product
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                      <div className="flex items-center gap-2 text-yellow-300">
                        <AlertTriangle className="w-5 h-5" />
                        <p className="text-sm font-medium">No product selected</p>
                      </div>
                      <p className="text-sm text-slate-300">Select a product above to apply this copy directly</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => copyToClipboard(
                        `${fastModeResult.headline}\n\n${fastModeResult.copy}\n\n${fastModeResult.cta}`,
                        'All content'
                      )}
                      variant="outline"
                      className="flex-1"
                      data-testid="button-copy-all"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy to Clipboard
                    </Button>
                    <Button
                      onClick={() => {
                        setFastMode(false);
                        setFastModeResult(null);
                        toast({
                          title: "Switched to Quality Mode",
                          description: "Click 'Generate' again to get 3 variants with quality scores",
                        });
                      }}
                      variant="outline"
                      data-testid="button-quality-mode"
                    >
                      <Trophy className="w-4 h-4 mr-2" />
                      Try Quality Mode
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {generatedCopy && !generatedCopy.fastMode && (() => {
          const recommendedVariant = generatedCopy.variants?.find(v => v.id === generatedCopy.recommendedVariant) || generatedCopy.variants?.[0];
          if (!recommendedVariant) return null;
          return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h2 className="text-2xl font-semibold text-white">Your Professional Copy</h2>
              <Badge className="bg-primary/20 text-primary">
                {generatedCopy.framework.toUpperCase()} Framework
              </Badge>
            </div>

            <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary-foreground/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-6 h-6 text-primary" />
                    <h3 className="text-2xl font-semibold text-white">Quality Score</h3>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary">{Math.round(recommendedVariant.qualityScore.overall || 0)}</div>
                    <div className="text-sm text-slate-300">out of 100</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-slate-800/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 text-sm">Validation Score</span>
                      <Award className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">{Math.round(recommendedVariant.validation.score || 0)}</div>
                  </div>

                  <div className="bg-slate-800/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 text-sm">SEO Score</span>
                      <Target className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">{Math.round(recommendedVariant.validation.seo || 0)}</div>
                  </div>

                  <div className="bg-slate-800/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 text-sm">Readability</span>
                      <Heart className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">{Math.round(recommendedVariant.validation.readability || 0)}</div>
                  </div>
                </div>

                {recommendedVariant.validation.suggestions?.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-white font-semibold mb-2 flex items-center">
                      <Lightbulb className="w-4 h-4 text-yellow-400 mr-2" />
                      AI Suggestions
                    </h4>
                    <ul className="space-y-1">
                      {recommendedVariant.validation.suggestions.slice(0, 3).map((suggestion: any, index: number) => (
                        <li key={index} className="text-slate-300 text-sm flex items-start">
                          <span className="text-yellow-400 mr-2">•</span>
                          {suggestion.message || suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedProductId && (
              <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-lg font-semibold text-white mb-1">Ready to Apply?</h3>
                      <p className="text-sm text-slate-300">Save this AI-generated copy directly to your product</p>
                    </div>
                    <Button
                      onClick={() => applyToProductMutation.mutate({ productId: selectedProductId, copy: recommendedVariant })}
                      disabled={applyToProductMutation.isPending}
                      className="gradient-button w-full sm:w-auto"
                      data-testid="button-apply-to-product"
                    >
                      {applyToProductMutation.isPending ? (
                        <>
                          <Zap className="w-4 h-4 mr-2 animate-pulse" />
                          Applying...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Apply to Product
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-2 border-blue-400/30 bg-gradient-to-br from-blue-900/20 to-cyan-900/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Brain className="w-5 h-5 text-blue-400" />
                    <h3 className="text-xl font-semibold text-white">Main Copy</h3>
                    <Badge className="bg-blue-400/20 text-blue-300">{generatedCopy.wordCount} words</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(recommendedVariant.copy, "Main copy")}
                    className="text-blue-300 hover:text-blue-200 hover:bg-blue-400/10"
                    data-testid="button-copy-main"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="bg-slate-800/30 p-4 rounded-lg border border-blue-400/20">
                  <p className="text-slate-100 leading-relaxed whitespace-pre-wrap">
                    {recommendedVariant.copy}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-2 border-purple-400/30 bg-gradient-to-br from-purple-900/20 to-violet-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <h3 className="text-lg font-semibold text-white">Headline</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(recommendedVariant.headline, "Headline")}
                      className="text-purple-300 hover:text-purple-200 hover:bg-purple-400/10"
                      data-testid="button-copy-headline"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="bg-slate-800/30 p-4 rounded-lg border border-purple-400/20">
                    <p className="text-slate-100 font-medium">
                      {recommendedVariant.headline}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-400/30 bg-gradient-to-br from-green-900/20 to-emerald-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Target className="w-5 h-5 text-green-400" />
                      <h3 className="text-lg font-semibold text-white">Call to Action</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(recommendedVariant.cta, "Call to action")}
                      className="text-green-300 hover:text-green-200 hover:bg-green-400/10"
                      data-testid="button-copy-cta"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="bg-slate-800/30 p-4 rounded-lg border border-green-400/20">
                    <p className="text-slate-100 font-medium">
                      {recommendedVariant.cta}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {generatedCopy.variants && generatedCopy.variants.length > 1 && (
              <DashboardCard
                title="Alternative Variations"
                description="Different psychological approaches for A/B testing"
                testId="card-variants"
              >
                <Tabs defaultValue="variant-0" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
                    {generatedCopy.variants.map((variant, index) => (
                      <TabsTrigger key={index} value={`variant-${index}`} className="text-white">
                        {variant.type}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {generatedCopy.variants.map((variant, index) => (
                    <TabsContent key={index} value={`variant-${index}`} className="mt-4 space-y-4">
                      <div className="bg-slate-800/30 p-4 rounded-lg space-y-3">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-300 mb-2">Headline</h4>
                          <p className="text-slate-100 font-medium">{variant.headline}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-300 mb-2">Copy</h4>
                          <p className="text-slate-100 leading-relaxed whitespace-pre-wrap">{variant.copy}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-300 mb-2">Call to Action</h4>
                          <p className="text-slate-100 font-medium">{variant.cta}</p>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-slate-400">
                          <span>Quality Score: {Math.round(variant.qualityScore.overall || 0)}</span>
                          <span>•</span>
                          <span>Validation: {Math.round(variant.validation.score || 0)}</span>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </DashboardCard>
            )}
          </div>
        );})()}

      </div>
    </PageShell>
  );
}
