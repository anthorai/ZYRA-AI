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


  const generateSEOMutation = useMutation({
    mutationFn: async (data: SEOForm) => {
      const { productName, targetKeywords, category, primaryBenefit, priceRange } = data;
      
      // Build current title and meta from form data
      const currentTitle = `${productName} - ${category}`;
      const currentMeta = primaryBenefit || '';
      
      // Call the real AI API endpoint
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token || '';

      const response = await fetch('/api/optimize-seo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentTitle,
          keywords: targetKeywords,
          currentMeta,
          category
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate SEO content');
      }

      const result = await response.json();
      
      // Transform API response to match component expectations
      const title = result.optimizedTitle || currentTitle;
      const metaDescription = result.optimizedMeta || currentMeta;
      const titleLength = title.length;
      const metaLength = metaDescription.length;
      
      // Calculate keyword density from AI-suggested keywords
      const keywords = result.keywords || [];
      const keywordDensity = keywords.length > 0 ? 
        (title.toLowerCase().includes(keywords[0]?.toLowerCase() || '') ? 1 : 0) +
        (metaDescription.toLowerCase().includes(keywords[0]?.toLowerCase() || '') ? 1 : 0) : 0;
      
      return {
        title,
        metaDescription,
        titleLength,
        metaLength,
        keywordDensity,
        seoScore: result.seoScore || 75
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
    <PageShell
      title="SEO Titles & Meta Descriptions"
      subtitle="Generate search-optimized titles and meta descriptions for better rankings"
      backTo="/dashboard"
    >
      <div className="space-y-6 sm:space-y-8">
        <DashboardCard
          title="SEO Best Practices"
          description="Guidelines for creating effective SEO titles and meta descriptions"
          testId="card-best-practices"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 text-[10px] sm:text-xs md:text-sm">
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
        </DashboardCard>

        <DashboardCard
          title="Product SEO Information"
          description="Provide product details and target keywords for optimized SEO content"
          testId="card-seo-form"
        >
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
                    data-testid="input-product-name"
                  />
                </div>

                <div>
                  <Label htmlFor="targetKeywords" className="text-white">Target Keywords *</Label>
                  <Input
                    id="targetKeywords"
                    className="mt-2 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                    placeholder="e.g., best wireless headphones, noise canceling"
                    {...form.register("targetKeywords", { required: true })}
                    data-testid="input-keywords"
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
                    data-testid="input-category"
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
                    data-testid="input-benefit"
                  />
                </div>

                <div>
                  <Label htmlFor="priceRange" className="text-white">Price Range</Label>
                  <select 
                    {...form.register("priceRange")}
                    className="mt-2 w-full bg-slate-800/50 border border-slate-600 text-white rounded-md px-3 py-2"
                    data-testid="select-price-range"
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
              data-testid="button-generate"
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
        </DashboardCard>

        {seoResult && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h2 className="text-2xl font-semibold text-white">Your SEO-Optimized Content</h2>
            </div>

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 text-[10px] sm:text-xs md:text-sm">
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
                    data-testid="button-copy-title"
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
                    data-testid="button-copy-meta"
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
      </div>
    </PageShell>
  );
}
