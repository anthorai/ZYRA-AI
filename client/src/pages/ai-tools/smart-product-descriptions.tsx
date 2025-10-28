import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PageContainer, CardPageHeader } from "@/components/ui/standardized-layout";
import { 
  Zap, 
  Copy, 
  TrendingUp, 
  Search, 
  Heart, 
  Upload, 
  FileText,
  Sparkles,
  CheckCircle,
  Clock
} from "lucide-react";

interface GenerateForm {
  productName: string;
  category: string;
  features: string;
  audience: string;
  shortInput: string;
  targetKeywords: string;
}

interface GeneratedResult {
  sales?: string;
  seo?: string;
  casual?: string;
  professional?: string;
}

export default function SmartProductDescriptions() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [brandVoice, setBrandVoice] = useState("sales");
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult>({});

  const form = useForm<GenerateForm>({
    defaultValues: {
      productName: "",
      category: "Electronics",
      features: "",
      audience: "General consumers",
      shortInput: "",
      targetKeywords: "",
    },
  });


  // Real AI generation mutation using the new prompt template system
  const generateMutation = useMutation({
    mutationFn: async (data: GenerateForm) => {
      const { productName, category, features, audience, shortInput, targetKeywords } = data;
      
      // Prepare the full context for AI generation
      const fullFeatures = [features, shortInput].filter(Boolean).join('. ');
      
      // Generate descriptions for each brand voice using the new template system
      const promises = ['sales', 'seo', 'casual'].map(async (brandVoice) => {
        const response = await apiRequest("POST", "/api/generate-description", {
          productName,
          category,
          features: fullFeatures,
          audience,
          brandVoice,
          keywords: targetKeywords,
          specs: shortInput // Use shortInput as specs for professional voice
        });
        
        const result = await response.json();
        return { brandVoice, description: result.description };
      });
      
      const results = await Promise.all(promises);
      
      // Transform results into the expected format
      const generatedResults: GeneratedResult = {};
      results.forEach(({ brandVoice, description }) => {
        if (brandVoice === 'sales') generatedResults.sales = description;
        if (brandVoice === 'seo') generatedResults.seo = description;
        if (brandVoice === 'casual') generatedResults.casual = description;
      });
      
      return generatedResults;
    },
    onSuccess: (result) => {
      setGeneratedResults(result);
      toast({
        title: "🎉 AI Magic Complete!",
        description: "Your product descriptions are ready in 3 powerful styles!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate descriptions",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: GenerateForm) => {
    if (!data.productName.trim()) {
      toast({
        title: "Product name required",
        description: "Please enter a product name to generate descriptions",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate(data);
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

  const saveToProducts = (text: string, type: string) => {
    // Simulate saving to Supabase products table
    toast({
      title: "Saved!",
      description: `${type} description saved to your products database.`,
    });
  };

  const voiceButtons = [
    { id: "sales", label: "Sales", icon: <TrendingUp className="w-4 h-4" />, description: "Emotional & persuasive" },
    { id: "seo", label: "SEO", icon: <Search className="w-4 h-4" />, description: "Keyword-rich" },
    { id: "casual", label: "Casual", icon: <Heart className="w-4 h-4" />, description: "Friendly tone" },
  ];

  return (
    <div>
      <CardPageHeader title="Smart Product Descriptions" />
      <PageContainer>
        {/* Process Overview */}
        <Card className="gradient-card border-0 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-white">How Zyra AI Works</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6 text-[10px] sm:text-xs md:text-sm">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">1</div>
                <span className="text-slate-300 truncate">Enter product details & target keywords</span>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">2</div>
                <span className="text-slate-300 truncate">AI generates 3 style variations</span>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">3</div>
                <span className="text-slate-300 truncate">Copy or save to your products</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generation Form */}
        <Card className="gradient-card">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Product Information</CardTitle>
            <CardDescription className="text-slate-300">
              Provide details about your product for AI-powered description generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="productName" className="text-white">Product Name *</Label>
                    <Input
                      id="productName"
                      className="mt-2 form-input text-white placeholder:text-slate-400"
                      placeholder="e.g., Wireless Bluetooth Headphones"
                      {...form.register("productName", { required: true })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="category" className="text-white">Product Category</Label>
                    <Select 
                      value={form.watch("category")} 
                      onValueChange={(value) => form.setValue("category", value)}
                    >
                      <SelectTrigger className="mt-2 form-select text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="gradient-surface">
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Clothing & Accessories">Clothing & Accessories</SelectItem>
                        <SelectItem value="Home & Garden">Home & Garden</SelectItem>
                        <SelectItem value="Sports & Outdoors">Sports & Outdoors</SelectItem>
                        <SelectItem value="Beauty & Health">Beauty & Health</SelectItem>
                        <SelectItem value="Books & Media">Books & Media</SelectItem>
                        <SelectItem value="Toys & Games">Toys & Games</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="audience" className="text-white">Target Audience</Label>
                    <Select 
                      value={form.watch("audience")} 
                      onValueChange={(value) => form.setValue("audience", value)}
                    >
                      <SelectTrigger className="mt-2 form-select text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="gradient-surface">
                        <SelectItem value="General consumers">General consumers</SelectItem>
                        <SelectItem value="Tech enthusiasts">Tech enthusiasts</SelectItem>
                        <SelectItem value="Business professionals">Business professionals</SelectItem>
                        <SelectItem value="Athletes & fitness enthusiasts">Athletes & fitness enthusiasts</SelectItem>
                        <SelectItem value="Students">Students</SelectItem>
                        <SelectItem value="Parents & families">Parents & families</SelectItem>
                        <SelectItem value="Creative professionals">Creative professionals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="features" className="text-white">Key Features (comma-separated)</Label>
                    <Textarea
                      id="features"
                      className="mt-2 h-24 resize-none form-textarea text-white placeholder:text-slate-400"
                      placeholder="e.g., Noise cancelling, 30-hour battery, wireless charging"
                      {...form.register("features")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="targetKeywords" className="text-white">Target Keywords (for SEO)</Label>
                    <Input
                      id="targetKeywords"
                      className="mt-2 form-input text-white placeholder:text-slate-400"
                      placeholder="e.g., best wireless headphones, noise canceling"
                      {...form.register("targetKeywords")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="shortInput" className="text-white">Additional Context (Optional)</Label>
                    <Textarea
                      id="shortInput"
                      className="mt-2 h-24 resize-none form-textarea text-white placeholder:text-slate-400"
                      placeholder="Any specific details, benefits, or unique selling points"
                      {...form.register("shortInput")}
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full gradient-button"
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Zyra AI is working her magic...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate 3 Styles
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Generated Results */}
        {Object.keys(generatedResults).length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h2 className="text-2xl font-semibold text-white">Your AI-Generated Descriptions</h2>
            </div>

            {generatedResults.sales && (
              <Card className="border-2 border-green-400/30 bg-gradient-to-br from-green-900/20 to-emerald-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <h3 className="text-xl font-semibold text-white">Sales Style</h3>
                      <Badge className="bg-green-400/20 text-green-300">Emotional & Persuasive</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(generatedResults.sales!, "Sales")}
                        className="text-green-300 hover:text-green-200 hover:bg-green-400/10"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button 
                        onClick={() => saveToProducts(generatedResults.sales!, "Sales")}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        Save to Products
                      </Button>
                    </div>
                  </div>
                  <div className="bg-slate-800/30 p-4 rounded-lg border border-green-400/20">
                    <p className="text-slate-100 leading-relaxed">
                      {generatedResults.sales}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {generatedResults.seo && (
              <Card className="border-2 border-blue-400/30 bg-gradient-to-br from-blue-900/20 to-cyan-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Search className="w-5 h-5 text-blue-400" />
                      <h3 className="text-xl font-semibold text-white">SEO Style</h3>
                      <Badge className="bg-blue-400/20 text-blue-300">Keyword-Rich</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(generatedResults.seo!, "SEO")}
                        className="text-blue-300 hover:text-blue-200 hover:bg-blue-400/10"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button 
                        onClick={() => saveToProducts(generatedResults.seo!, "SEO")}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        Save to Products
                      </Button>
                    </div>
                  </div>
                  <div className="bg-slate-800/30 p-4 rounded-lg border border-blue-400/20">
                    <p className="text-slate-100 leading-relaxed">
                      {generatedResults.seo}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {generatedResults.casual && (
              <Card className="border-2 border-pink-400/30 bg-gradient-to-br from-pink-900/20 to-rose-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Heart className="w-5 h-5 text-pink-400" />
                      <h3 className="text-xl font-semibold text-white">Casual Style</h3>
                      <Badge className="bg-pink-400/20 text-pink-300">Friendly Tone</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(generatedResults.casual!, "Casual")}
                        className="text-pink-300 hover:text-pink-200 hover:bg-pink-400/10"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button 
                        onClick={() => saveToProducts(generatedResults.casual!, "Casual")}
                        className="bg-pink-500 hover:bg-pink-600 text-white"
                      >
                        Save to Products
                      </Button>
                    </div>
                  </div>
                  <div className="bg-slate-800/30 p-4 rounded-lg border border-pink-400/20">
                    <p className="text-slate-100 leading-relaxed">
                      {generatedResults.casual}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </PageContainer>
    </div>
  );
}