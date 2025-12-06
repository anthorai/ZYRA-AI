import { useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { ProductSelector, stripHtmlTags } from "@/components/product-selector";
import { getToolCredits, formatCreditsDisplay } from "@shared/ai-credits";
import { 
  Brain,
  Upload,
  FileText,
  CheckCircle,
  Clock,
  Zap,
  Eye,
  MessageSquare,
  Mail,
  X,
  Copy,
  Package
} from "lucide-react";

interface BrandVoiceForm {
  brandName: string;
  brandValues: string;
  targetAudience: string;
  sampleText: string;
  keywords: string;
}

interface BrandAnalysis {
  tone: string;
  personality: string[];
  writingStyle: string;
  keyPhrases: string[];
  dosList: string[];
  dontsList: string[];
  confidence: number;
}

interface GeneratedContent {
  type: 'description' | 'email' | 'sms';
  content: string;
}

interface Product {
  id: string;
  shopifyId: string | null;
  name: string;
  description: string | null;
  price: string;
  category: string;
  image: string | null;
  features: string | null;
  tags: string | null;
}

export default function BrandVoiceMemory() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [brandAnalysis, setBrandAnalysis] = useState<BrandAnalysis | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [learningProgress, setLearningProgress] = useState(0);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [combinedText, setCombinedText] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);

  // Fetch products once and use cache
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

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

  const form = useForm<BrandVoiceForm>({
    defaultValues: {
      brandName: "",
      brandValues: "",
      targetAudience: "",
      sampleText: "",
      keywords: "",
    },
  });

  // Bulk import handler - fetch all selected products from Shopify
  const handleBulkImport = async () => {
    if (selectedProductIds.length < 3) {
      toast({
        title: "Not Enough Products",
        description: "Please select at least 3 products for richer brand voice training.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setCombinedText("");

    try {
      const { apiRequest } = await import('@/lib/queryClient');
      
      // Get selected products from cache (already fetched by useQuery)
      const selectedProducts = products.filter((p: Product) => selectedProductIds.includes(p.id));
      
      if (selectedProducts.length === 0) {
        throw new Error('Selected products not found');
      }

      // Fetch Shopify details for all selected products in parallel
      const productPromises = selectedProducts.map(async (product: Product) => {
        if (!product.shopifyId) {
          return { success: false, text: '', productName: product.name };
        }

        try {
          // Fetch full Shopify details
          const shopifyResponse = await apiRequest('GET', `/api/shopify/products/${product.shopifyId}`);
          if (!shopifyResponse.ok) {
            return { success: false, text: '', productName: product.name };
          }

          const fullProduct = await shopifyResponse.json();
          const description = stripHtmlTags(fullProduct.description || '');
          
          return {
            success: true,
            text: description,
            productName: fullProduct.title || product.name
          };
        } catch {
          return { success: false, text: '', productName: product.name };
        }
      });

      const results = await Promise.all(productPromises);
      const successfulImports = results.filter((r: any) => r.success && r.text);
      
      if (successfulImports.length === 0) {
        throw new Error('No product descriptions could be imported');
      }

      // Combine all descriptions with separators
      const combined = successfulImports
        .map((r: any, i: number) => `[Product ${i + 1}: ${r.productName}]\n${r.text}`)
        .join('\n\n---\n\n');

      setCombinedText(combined);
      form.setValue("sampleText", combined);

      toast({
        title: "Bulk Import Successful!",
        description: `Imported ${successfulImports.length} product description(s). ${combined.length} characters ready for training.`,
      });
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import product descriptions",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };


  // 🎯 WAVE 2: Real Brand DNA Training with AI!
  const learnVoiceMutation = useMutation({
    mutationFn: async (data: BrandVoiceForm) => {
      // Show progress animation
      setLearningProgress(0);
      const progressInterval = setInterval(() => {
        setLearningProgress(prev => Math.min(prev + 5, 90));
      }, 150);

      try {
        // 🚀 Call real Wave 2 Brand DNA API
        const { apiRequest } = await import('@/lib/queryClient');
        const response = await apiRequest('POST', '/api/brand-dna/train', {
          sampleTexts: [data.sampleText], // Use the provided sample text
        });

        clearInterval(progressInterval);
        setLearningProgress(100);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Brand DNA training failed');
        }

        const result = await response.json();
        
        // Map Wave 2 Brand DNA output to the UI format
        const brandDNA = result.brandDNA;
        
        return {
          tone: brandDNA.writingStyle || 'Professional',
          personality: brandDNA.brandPersonality 
            ? [brandDNA.brandPersonality] 
            : ['Reliable', 'Trustworthy'],
          writingStyle: `${brandDNA.toneDensity} tone with ${brandDNA.avgSentenceLength}-word sentences`,
          keyPhrases: brandDNA.keyPhrases || data.keywords.split(',').map(k => k.trim()).filter(k => k),
          confidence: brandDNA.confidenceScore || 85,
          formality: brandDNA.formalityScore || 70,
          ctaStyle: brandDNA.ctaStyle || 'professional',
        };
      } catch (error) {
        clearInterval(progressInterval);
        setLearningProgress(0);
        throw error;
      }
    },
    onSuccess: (analysis: any) => {
      // Map real Brand DNA data to component format
      setBrandAnalysis({
        tone: analysis.tone,
        personality: analysis.personality,
        writingStyle: analysis.writingStyle,
        keyPhrases: analysis.keyPhrases || [],
        dosList: [
          `Use ${analysis.tone.toLowerCase()} language`,
          `Maintain ${analysis.formality}% formality level`,
          `Apply ${analysis.ctaStyle} CTA style`,
          "Keep messaging consistent with trained voice"
        ],
        dontsList: [
          "Deviate from learned tone and style",
          "Use inconsistent formality levels",
          "Ignore brand voice patterns",
          "Mix different writing styles"
        ],
        confidence: analysis.confidence
      });
      
      toast({
        title: "🧠 Brand DNA Learned Successfully!",
        description: `Zyra AI has analyzed your brand with ${analysis.confidence}% confidence using Wave 2 engine.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Learning failed",
        description: error.message || "Failed to learn brand voice",
        variant: "destructive",
      });
    },
  });

  // Mock content generation mutation
  const generateContentMutation = useMutation({
    mutationFn: async (contentType: 'description' | 'email' | 'sms') => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!brandAnalysis) throw new Error('No brand voice learned yet');
      
      const brandName = form.getValues('brandName') || 'Your Brand';
      const tone = brandAnalysis.tone.toLowerCase();
      
      let content = "";
      
      switch (contentType) {
        case 'description':
          if (tone === 'enthusiastic') {
            content = `We're absolutely thrilled to introduce this amazing product from ${brandName}! It's everything you've been looking for and more. Get ready to fall in love with quality that speaks for itself!`;
          } else if (tone === 'sophisticated') {
            content = `Discover the epitome of elegance with ${brandName}'s latest offering. Meticulously crafted for the discerning individual who appreciates the finer things in life.`;
          } else if (tone === 'minimalist') {
            content = `${brandName}. Simple. Effective. Essential. Everything you need, nothing you don't.`;
          } else {
            content = `Experience the reliable quality of ${brandName}. Built with care and designed to meet your needs with professional excellence.`;
          }
          break;
        case 'email':
          content = `Subject: Something special from ${brandName}\n\nHi there!\n\n${tone === 'enthusiastic' ? "We're super excited to share" : tone === 'sophisticated' ? "We're pleased to present" : "We're sharing"} our latest update with you. ${brandAnalysis.keyPhrases.length > 0 ? `Featuring ${brandAnalysis.keyPhrases.slice(0, 2).join(' and ')}, ` : ''}this is exactly what you've been waiting for.\n\nBest regards,\nThe ${brandName} Team`;
          break;
        case 'sms':
          content = `Hi! ${tone === 'enthusiastic' ? '🎉' : ''} ${brandName} here with something ${tone === 'sophisticated' ? 'exclusive' : tone === 'enthusiastic' ? 'amazing' : 'great'} for you. ${brandAnalysis.keyPhrases.length > 0 ? `${brandAnalysis.keyPhrases[0]} ` : ''}Check it out! Reply STOP to opt out.`;
          break;
      }
      
      return { type: contentType, content };
    },
    onSuccess: (result) => {
      setGeneratedContent(prev => [...prev, result]);
      toast({
        title: `${result.type.charAt(0).toUpperCase() + result.type.slice(1)} Generated!`,
        description: "Content created using your brand voice patterns.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate content",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BrandVoiceForm) => {
    if (!data.brandName.trim()) {
      toast({
        title: "Brand name required",
        description: "Please enter your brand name",
        variant: "destructive",
      });
      return;
    }

    if (!data.sampleText.trim()) {
      toast({
        title: "Sample text required",
        description: "Please provide sample brand content for analysis",
        variant: "destructive",
      });
      return;
    }

    learnVoiceMutation.mutate(data);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      form.setValue('sampleText', content.substring(0, 2000)); // Limit to 2000 chars
      toast({
        title: "File uploaded",
        description: "Content has been loaded into the sample text field",
      });
    };
    reader.readAsText(file);
  };

  return (
    <PageShell
      title="Brand Voice Memory"
      subtitle="Teach Zyra AI your brand's unique voice and tone to maintain consistency across all content"
      backTo="/dashboard?tab=ai-tools"
    >
      {/* Learning Process */}
      <DashboardCard
        title="How Zyra AI Learns Your Voice"
        description="AI analyzes your brand guidelines and sample content to understand and replicate your unique voice"
      >
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                <span className="text-slate-300">Upload brand guidelines or sample content</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                <span className="text-slate-300">AI analyzes tone, style & patterns</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
                <span className="text-slate-300">Memory stores brand voice rules</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">4</div>
                <span className="text-slate-300">Apply consistently across all content</span>
              </div>
            </div>
      </DashboardCard>

      {/* Brand Information Form */}
      <DashboardCard
        title="Teach Zyra AI Your Brand Voice"
        description="Provide your brand information and sample content for AI analysis"
      >
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Bulk Product Selector - Import multiple product descriptions */}
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary">
                    <Package className="w-5 h-5" />
                    <Label className="text-sm font-semibold">Bulk Import from Shopify Products</Label>
                  </div>
                  {selectedProductIds.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedProductIds.length} selected
                    </Badge>
                  )}
                </div>
                
                <ProductSelector
                  multiple
                  maxSelection={5}
                  value={selectedProductIds}
                  onSelect={(productIds: string[]) => {
                    setSelectedProductIds(productIds);
                  }}
                  placeholder="Select 3-5 products for richer brand voice training..."
                />
                
                {selectedProductIds.length > 0 && (
                  <Button
                    type="button"
                    onClick={handleBulkImport}
                    disabled={isImporting || selectedProductIds.length < 3}
                    className="w-full bg-primary hover:bg-primary/90"
                    data-testid="button-bulk-import"
                  >
                    {isImporting ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Importing {selectedProductIds.length} products...
                      </>
                    ) : selectedProductIds.length < 3 ? (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Select at least 3 products
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Import {selectedProductIds.length} Product{selectedProductIds.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                )}
                
                <p className="text-xs text-muted-foreground">
                  {selectedProductIds.length > 0 && selectedProductIds.length < 3 ? (
                    <span className="text-yellow-400">⚠️ Select at least 3 products for optimal training</span>
                  ) : (
                    "Select 3-5 products to combine their descriptions for richer AI training"
                  )}
                </p>
              </div>
              
              {/* Combined Text Preview */}
              {combinedText && (
                <div className="p-4 rounded-lg border border-green-400/20 bg-green-400/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-green-400">Combined Preview</Label>
                    <Badge variant="outline" className="text-xs">
                      {combinedText.length} characters
                    </Badge>
                  </div>
                  <div className="max-h-40 overflow-y-auto bg-slate-900/50 p-3 rounded text-xs text-slate-300">
                    <pre className="whitespace-pre-wrap font-mono">{combinedText.substring(0, 500)}...</pre>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ✓ Text auto-filled below. You can edit it before training.
                  </p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="brandName" className="text-white">Brand Name *</Label>
                    <Input
                      id="brandName"
                      className="mt-2 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                      placeholder="e.g., TechCorp"
                      {...form.register("brandName", { required: true })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="brandValues" className="text-white">Brand Values</Label>
                    <Input
                      id="brandValues"
                      className="mt-2 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                      placeholder="e.g., Innovation, Quality, Sustainability"
                      {...form.register("brandValues")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="targetAudience" className="text-white">Target Audience</Label>
                    <Controller
                      name="targetAudience"
                      control={form.control}
                      render={({ field: { value, onChange } }) => (
                        <Select onValueChange={onChange} value={value ?? ""}>
                          <SelectTrigger className="mt-2 bg-slate-800/50 border-slate-600 text-white" data-testid="select-target-audience">
                            <SelectValue placeholder="Select your target audience" />
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
                    <Label htmlFor="keywords" className="text-white">Key Phrases/Keywords</Label>
                    <Input
                      id="keywords"
                      className="mt-2 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                      placeholder="e.g., cutting-edge, reliable, user-friendly"
                      {...form.register("keywords")}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sampleText" className="text-white">Sample Brand Content *</Label>
                    <Textarea
                      id="sampleText"
                      className="mt-2 h-32 resize-none bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                      placeholder="Paste your existing marketing copy, slogans, or product descriptions here..."
                      {...form.register("sampleText", { required: true })}
                    />
                  </div>

                  <div>
                    <Label className="text-white">Or Upload Brand Guidelines</Label>
                    <div 
                      className="mt-2 border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-slate-500 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-300 text-sm">Click to upload .txt file</p>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        accept=".txt,.md"
                        onChange={handleFileUpload}
                        className="hidden" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Learning Progress */}
              {learnVoiceMutation.isPending && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Learning your brand voice...</span>
                    <span className="text-white">{learningProgress}%</span>
                  </div>
                  <Progress value={learningProgress} className="h-2" />
                </div>
              )}

              <Button
                type="submit"
                disabled={learnVoiceMutation.isPending}
                className="w-full gradient-button"
                data-testid="button-learn-brand-voice"
              >
                {learnVoiceMutation.isPending ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing brand voice...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Learn My Brand Voice - {formatCreditsDisplay(getToolCredits('brand-voice'))}
                  </>
                )}
              </Button>
            </form>
      </DashboardCard>

      {/* Brand Analysis Results */}
      {brandAnalysis && (
        <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h2 className="text-2xl font-semibold text-white">Brand Voice Analysis</h2>
              <Badge className="bg-green-400/20 text-green-300">{brandAnalysis.confidence}% Confidence</Badge>
            </div>

            {/* Analysis Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-900/20 to-cyan-900/20">
                <CardContent className="p-3 sm:p-4 md:p-6 text-center overflow-hidden">
                  <h3 className="text-lg font-semibold text-white mb-2">Tone</h3>
                  <div className="text-2xl font-bold text-blue-400">{brandAnalysis.tone}</div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-900/20 to-violet-900/20">
                <CardContent className="p-3 sm:p-4 md:p-6 text-center overflow-hidden">
                  <h3 className="text-lg font-semibold text-white mb-2">Writing Style</h3>
                  <div className="text-purple-400 font-medium">{brandAnalysis.writingStyle}</div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-900/20 to-emerald-900/20">
                <CardContent className="p-3 sm:p-4 md:p-6 text-center overflow-hidden">
                  <h3 className="text-lg font-semibold text-white mb-2">Key Phrases</h3>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {brandAnalysis.keyPhrases.slice(0, 3).map((phrase, index) => (
                      <Badge key={index} className="bg-green-400/20 text-green-300 text-xs">
                        {phrase}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Personality Traits */}
            <Card className="border-0 gradient-card rounded-xl">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Brand Personality</h3>
                <div className="flex flex-wrap gap-2">
                  {brandAnalysis.personality.map((trait, index) => (
                    <Badge key={index} className="bg-primary/20 text-primary">
                      {trait}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Voice Guidelines */}
            <div className="grid md:grid-cols-2 gap-6">
              <DashboardCard className="border-2 border-green-400/30 bg-gradient-to-br from-green-900/20 to-emerald-900/20">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                    Do's
                  </h3>
                  <ul className="space-y-2">
                    {brandAnalysis.dosList.map((item, index) => (
                      <li key={index} className="text-slate-300 text-sm flex items-start">
                        <span className="text-green-400 mr-2">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
              </DashboardCard>

              <DashboardCard className="border-2 border-red-400/30 bg-gradient-to-br from-red-900/20 to-rose-900/20">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <X className="w-5 h-5 text-red-400 mr-2" />
                    Don'ts
                  </h3>
                  <ul className="space-y-2">
                    {brandAnalysis.dontsList.map((item, index) => (
                      <li key={index} className="text-slate-300 text-sm flex items-start">
                        <span className="text-red-400 mr-2">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
              </DashboardCard>
            </div>

            {/* Generate Content */}
            <DashboardCard
              title="Test Your Brand Voice"
              description="Generate sample content using your learned brand voice"
            >
                <div className="grid md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => generateContentMutation.mutate('description')}
                    disabled={generateContentMutation.isPending}
                    className="flex items-center justify-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Product Description</span>
                  </Button>
                  <Button
                    onClick={() => generateContentMutation.mutate('email')}
                    disabled={generateContentMutation.isPending}
                    className="flex items-center justify-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Email Copy</span>
                  </Button>
                  <Button
                    onClick={() => generateContentMutation.mutate('sms')}
                    disabled={generateContentMutation.isPending}
                    className="flex items-center justify-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>SMS Copy</span>
                  </Button>
                </div>
            </DashboardCard>

            {/* Generated Content */}
            {generatedContent.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Generated Content</h3>
                {generatedContent.map((content, index) => (
                  <Card key={index} className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary-foreground/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <Badge className="bg-primary/20 text-primary">
                          {content.type.charAt(0).toUpperCase() + content.type.slice(1)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigator.clipboard.writeText(content.content)}
                          className="text-primary hover:text-white"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="bg-slate-800/30 p-4 rounded-lg">
                        <pre className="text-slate-100 whitespace-pre-wrap text-sm">
                          {content.content}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
    </PageShell>
  );
}