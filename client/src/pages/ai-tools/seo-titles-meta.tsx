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
import { PageContainer, CardPageHeader } from "@/components/ui/standardized-layout";
import { 
  Search,
  Copy,
  CheckCircle,
  Clock,
  Zap,
  Target,
  BarChart3,
  TrendingUp
} from "lucide-react";

interface SEOForm {
  productName: string;
  targetKeywords: string;
  category: string;
  primaryBenefit: string;
  priceRange: string;
}

interface SEOResult {
  title: string;
  metaDescription: string;
  titleLength: number;
  metaLength: number;
  keywordDensity: number;
  seoScore: number;
}

export default function SEOTitlesMeta() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [seoResult, setSEOResult] = useState<SEOResult | null>(null);

  const form = useForm<SEOForm>({
    defaultValues: {
      productName: "",
      targetKeywords: "",
      category: "",
      primaryBenefit: "",
      priceRange: "mid-range",
    },
  });


  // Mock SEO generation mutation
  const generateSEOMutation = useMutation({
    mutationFn: async (data: SEOForm) => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const { productName, targetKeywords, category, primaryBenefit, priceRange } = data;
      
      // Generate SEO title (max 70 characters)
      const keywords = targetKeywords.split(',').map(k => k.trim()).filter(k => k);
      const primaryKeyword = keywords[0] || productName;
      
      const title = `${productName} ${primaryKeyword ? `- ${primaryKeyword}` : ''} | ${priceRange === 'budget' ? 'Best Price' : priceRange === 'premium' ? 'Premium' : 'Quality'} ${category}`.substring(0, 70);
      
      // Generate meta description (155-160 characters)
      const metaDescription = `Shop ${productName} ${keywords.length > 0 ? `for ${keywords.slice(0, 2).join(', ')}` : ''}. ${primaryBenefit || 'High-quality product'} with free shipping. ${priceRange === 'budget' ? 'Best prices guaranteed' : priceRange === 'premium' ? 'Premium quality' : 'Great value'}. Order now!`.substring(0, 160);
      
      // Calculate metrics
      const titleLength = title.length;
      const metaLength = metaDescription.length;
      const keywordDensity = keywords.length > 0 ? 
        (title.toLowerCase().includes(keywords[0].toLowerCase()) ? 1 : 0) +
        (metaDescription.toLowerCase().includes(keywords[0].toLowerCase()) ? 1 : 0) : 0;
      
      // Calculate SEO score (mock)
      let seoScore = 50;
      if (titleLength >= 50 && titleLength <= 60) seoScore += 20;
      if (metaLength >= 150 && metaLength <= 160) seoScore += 20;
      if (keywordDensity >= 2) seoScore += 10;
      
      return {
        title,
        metaDescription,
        titleLength,
        metaLength,
        keywordDensity,
        seoScore: Math.min(seoScore, 100)
      };
    },
    onSuccess: (result) => {
      setSEOResult(result);
      toast({
        title: "🎯 SEO Content Generated!",
        description: `SEO score: ${result.seoScore}/100. Your title and meta description are ready!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate SEO content",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SEOForm) => {
    if (!data.productName.trim()) {
      toast({
        title: "Product name required",
        description: "Please enter a product name to generate SEO content",
        variant: "destructive",
      });
      return;
    }
    generateSEOMutation.mutate(data);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard.`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-400/20 border-green-400/30";
    if (score >= 60) return "bg-yellow-400/20 border-yellow-400/30";
    return "bg-red-400/20 border-red-400/30";
  };

  return (
    <div>
      <CardPageHeader title="SEO Titles & Meta Descriptions" />
      <PageContainer>
        {/* SEO Guidelines */}
        <Card className="border-0 gradient-card rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-white">SEO Best Practices</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6 text-[10px] sm:text-xs md:text-sm">
              <div className="space-y-2 min-w-0">
                <h4 className="text-white font-medium text-base sm:text-lg md:text-xl truncate">Title Optimization:</h4>
                <ul className="text-slate-300 space-y-1">
                  <li>• Keep between 50-60 characters for best results</li>
                  <li>• Include primary keyword near the beginning</li>
                  <li>• Use compelling, clickable language</li>
                  <li>• Include brand name when relevant</li>
                </ul>
              </div>
              <div className="space-y-2 min-w-0">
                <h4 className="text-white font-medium text-base sm:text-lg md:text-xl truncate">Meta Description:</h4>
                <ul className="text-slate-300 space-y-1">
                  <li>• Aim for 150-160 characters</li>
                  <li>• Include call-to-action</li>
                  <li>• Use 2-3 relevant keywords naturally</li>
                  <li>• Describe the value proposition clearly</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generation Form */}
        <Card className="border-0 gradient-card rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Product SEO Information</CardTitle>
            <CardDescription className="text-slate-300">
              Provide product details and target keywords for optimized SEO content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="productName" className="text-white">Product Name *</Label>
                    <Input
                      id="productName"
                      className="mt-2 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                      placeholder="e.g., Wireless Bluetooth Headphones"
                      {...form.register("productName", { required: true })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="targetKeywords" className="text-white">Target Keywords *</Label>
                    <Input
                      id="targetKeywords"
                      className="mt-2 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                      placeholder="e.g., best wireless headphones, noise canceling"
                      {...form.register("targetKeywords", { required: true })}
                    />
                    <p className="text-xs text-slate-400 mt-1">Separate multiple keywords with commas</p>
                  </div>

                  <div>
                    <Label htmlFor="category" className="text-white">Category</Label>
                    <Input
                      id="category"
                      className="mt-2 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                      placeholder="e.g., Electronics, Audio"
                      {...form.register("category")}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="primaryBenefit" className="text-white">Primary Benefit</Label>
                    <Textarea
                      id="primaryBenefit"
                      className="mt-2 h-24 resize-none bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                      placeholder="e.g., Crystal clear sound quality with 30-hour battery life"
                      {...form.register("primaryBenefit")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="priceRange" className="text-white">Price Range</Label>
                    <select 
                      {...form.register("priceRange")}
                      className="mt-2 w-full bg-slate-800/50 border border-slate-600 text-white rounded-md px-3 py-2"
                    >
                      <option value="budget">Budget-friendly</option>
                      <option value="mid-range">Mid-range</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full gradient-button transition-all duration-200 font-medium"
                disabled={generateSEOMutation.isPending}
              >
                {generateSEOMutation.isPending ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Optimizing SEO content...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate SEO Content
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Generated Results */}
        {seoResult && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h2 className="text-2xl font-semibold text-white">Your SEO-Optimized Content</h2>
            </div>

            {/* SEO Score */}
            <Card className={`border-2 ${getScoreBg(seoResult.seoScore)}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-semibold text-white">SEO Score</h3>
                  </div>
                  <div className={`text-3xl font-bold ${getScoreColor(seoResult.seoScore)}`}>
                    {seoResult.seoScore}/100
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6 text-[10px] sm:text-xs md:text-sm">
                  <div className="text-center min-w-0">
                    <div className="text-white font-medium text-base sm:text-lg md:text-xl truncate">{seoResult.titleLength}/70</div>
                    <div className="text-slate-300 truncate">Title Length</div>
                  </div>
                  <div className="text-center min-w-0">
                    <div className="text-white font-medium text-base sm:text-lg md:text-xl truncate">{seoResult.metaLength}/160</div>
                    <div className="text-slate-300 truncate">Meta Length</div>
                  </div>
                  <div className="text-center min-w-0">
                    <div className="text-white font-medium text-base sm:text-lg md:text-xl truncate">{seoResult.keywordDensity}</div>
                    <div className="text-slate-300 truncate">Keyword Hits</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SEO Title */}
            <Card className="border-2 border-blue-400/30 bg-gradient-to-br from-blue-900/20 to-cyan-900/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    <h3 className="text-xl font-semibold text-white">SEO Title</h3>
                    <Badge className="bg-blue-400/20 text-blue-300">{seoResult.titleLength} characters</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(seoResult.title, "SEO Title")}
                    className="text-blue-300 hover:text-blue-200 hover:bg-blue-400/10"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="bg-slate-800/30 p-4 rounded-lg border border-blue-400/20">
                  <p className="text-slate-100 leading-relaxed font-medium">
                    {seoResult.title}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Meta Description */}
            <Card className="border-2 border-purple-400/30 bg-gradient-to-br from-purple-900/20 to-violet-900/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Search className="w-5 h-5 text-purple-400" />
                    <h3 className="text-xl font-semibold text-white">Meta Description</h3>
                    <Badge className="bg-purple-400/20 text-purple-300">{seoResult.metaLength} characters</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(seoResult.metaDescription, "Meta Description")}
                    className="text-purple-300 hover:text-purple-200 hover:bg-purple-400/10"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="bg-slate-800/30 p-4 rounded-lg border border-purple-400/20">
                  <p className="text-slate-100 leading-relaxed">
                    {seoResult.metaDescription}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </PageContainer>
    </div>
  );
}