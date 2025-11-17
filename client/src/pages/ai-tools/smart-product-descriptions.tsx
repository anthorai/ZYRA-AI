import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { ProductSelector } from "@/components/ui/product-selector";
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
import type { Product } from "@shared/schema";

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
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  const form = useForm<GenerateForm>({
    defaultValues: {
      productName: "",
      category: "Fashion & Apparel",
      features: "",
      audience: "General Consumers",
      shortInput: "",
      targetKeywords: "",
    },
  });


  const generateMutation = useMutation({
    mutationFn: async (data: GenerateForm) => {
      const { productName, category, features, audience, shortInput, targetKeywords } = data;
      
      const fullFeatures = [features, shortInput].filter(Boolean).join('. ');
      
      const promises = ['sales', 'seo', 'casual'].map(async (brandVoice) => {
        const response = await apiRequest("POST", "/api/generate-description", {
          productName,
          category,
          features: fullFeatures,
          audience,
          brandVoice,
          keywords: targetKeywords,
          specs: shortInput
        });
        
        const result = await response.json();
        return { brandVoice, description: result.description };
      });
      
      const results = await Promise.all(promises);
      
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

  const applyToProductMutation = useMutation({
    mutationFn: async ({ productId, description }: { productId: string; description: string }) => {
      if (!productId) {
        throw new Error("No product selected");
      }
      const response = await apiRequest('POST', `/api/products/${productId}/apply-content`, {
        optimizedDescription: description
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Applied to Product!",
        description: "AI-generated description has been saved to your product.",
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

  const voiceButtons = [
    { id: "sales", label: "Sales", icon: <TrendingUp className="w-4 h-4" />, description: "Emotional & persuasive" },
    { id: "seo", label: "SEO", icon: <Search className="w-4 h-4" />, description: "Keyword-rich" },
    { id: "casual", label: "Casual", icon: <Heart className="w-4 h-4" />, description: "Friendly tone" },
  ];

  return (
    <PageShell
      title="Smart Product Descriptions"
      subtitle="Generate compelling product descriptions in multiple brand voices using AI"
      
    >
      <div className="space-y-6 sm:space-y-8">
        <DashboardCard
          title="How Zyra AI Works"
          description="Three simple steps to generate professional product descriptions"
          testId="card-how-it-works"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 text-[10px] sm:text-xs md:text-sm">
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
        </DashboardCard>

        <DashboardCard
          title="Product Information"
          description="Provide details about your product for AI-powered description generation"
          testId="card-product-info"
        >
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
              <div className="space-y-6">
                <div>
                  <Label htmlFor="productName" className="text-white">Product Name *</Label>
                  <Input
                    id="productName"
                    className="mt-2 form-input text-white placeholder:text-slate-400"
                    placeholder="e.g., Wireless Bluetooth Headphones"
                    {...form.register("productName", { required: true })}
                    data-testid="input-product-name"
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-white">Product Category</Label>
                  <Controller
                    name="category"
                    control={form.control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="mt-2 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 form-select text-white [&>option]:bg-[#14142B] [&>option]:text-slate-100 bg-[#14142b]"
                        data-testid="select-category"
                      >
                        <option value="Fashion & Apparel">Fashion & Apparel</option>
                        <option value="Electronics & Gadgets">Electronics & Gadgets</option>
                        <option value="Home & Kitchen">Home & Kitchen</option>
                        <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                        <option value="Health & Fitness">Health & Fitness</option>
                        <option value="Groceries & Food">Groceries & Food</option>
                        <option value="Books & Stationery">Books & Stationery</option>
                        <option value="Toys & Baby Products">Toys & Baby Products</option>
                        <option value="Automotive">Automotive</option>
                        <option value="Sports & Outdoor">Sports & Outdoor</option>
                        <option value="Pet Supplies">Pet Supplies</option>
                        <option value="Jewelry & Watches">Jewelry & Watches</option>
                        <option value="Furniture & Home Improvement">Furniture & Home Improvement</option>
                        <option value="Digital Products">Digital Products</option>
                        <option value="Arts & Crafts">Arts & Crafts</option>
                      </select>
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="audience" className="text-white">Target Audience</Label>
                  <Controller
                    name="audience"
                    control={form.control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="mt-2 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 form-select text-white [&>option]:bg-[#14142B] [&>option]:text-slate-100 bg-[#14142b]"
                        data-testid="select-audience"
                      >
                        <option value="General Consumers">General Consumers</option>
                        <option value="Tech Enthusiasts">Tech Enthusiasts</option>
                        <option value="Business Professionals">Business Professionals</option>
                        <option value="Athletes & Fitness Enthusiasts">Athletes & Fitness Enthusiasts</option>
                        <option value="Students">Students</option>
                        <option value="Parents & Families">Parents & Families</option>
                        <option value="Creative Professionals">Creative Professionals</option>
                        <option value="Eco-conscious Shoppers">Eco-conscious Shoppers</option>
                        <option value="Luxury Buyers">Luxury Buyers</option>
                        <option value="Travelers & Adventurers">Travelers & Adventurers</option>
                        <option value="Home Improvers">Home Improvers</option>
                        <option value="Pet Owners">Pet Owners</option>
                        <option value="Gamers">Gamers</option>
                        <option value="Beauty & Self-care Lovers">Beauty & Self-care Lovers</option>
                        <option value="Lifelong Learners">Lifelong Learners</option>
                      </select>
                    )}
                  />
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
                    data-testid="input-features"
                  />
                </div>

                <div>
                  <Label htmlFor="targetKeywords" className="text-white">Target Keywords (for SEO)</Label>
                  <Input
                    id="targetKeywords"
                    className="mt-2 form-input text-white placeholder:text-slate-400"
                    placeholder="e.g., best wireless headphones, noise canceling"
                    {...form.register("targetKeywords")}
                    data-testid="input-keywords"
                  />
                </div>

                <div>
                  <Label htmlFor="shortInput" className="text-white">Additional Context (Optional)</Label>
                  <Textarea
                    id="shortInput"
                    className="mt-2 h-24 resize-none form-textarea text-white placeholder:text-slate-400"
                    placeholder="Any specific details, benefits, or unique selling points"
                    {...form.register("shortInput")}
                    data-testid="input-context"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full gradient-button"
              disabled={generateMutation.isPending}
              data-testid="button-generate"
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
        </DashboardCard>

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
                        data-testid="button-copy-sales"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      {selectedProductId ? (
                        <Button 
                          onClick={() => applyToProductMutation.mutate({ productId: selectedProductId, description: generatedResults.sales! })}
                          disabled={applyToProductMutation.isPending}
                          className="gradient-button"
                          data-testid="button-apply-sales"
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
                      ) : null}
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
                        data-testid="button-copy-seo"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      {selectedProductId ? (
                        <Button 
                          onClick={() => applyToProductMutation.mutate({ productId: selectedProductId, description: generatedResults.seo! })}
                          disabled={applyToProductMutation.isPending}
                          className="gradient-button"
                          data-testid="button-apply-seo"
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
                      ) : null}
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
                        data-testid="button-copy-casual"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      {selectedProductId ? (
                        <Button 
                          onClick={() => applyToProductMutation.mutate({ productId: selectedProductId, description: generatedResults.casual! })}
                          disabled={applyToProductMutation.isPending}
                          className="gradient-button"
                          data-testid="button-apply-casual"
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
                      ) : null}
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
      </div>
    </PageShell>
  );
}
