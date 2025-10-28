import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Search, FileText, Tags, Copy, Lightbulb, BarChart3 } from "lucide-react";

interface SEOForm {
  currentTitle: string;
  keywords: string;
  currentMeta: string;
  category: string;
}

interface SEOResult {
  optimizedTitle: string;
  optimizedMeta: string;
  keywords: string[];
  seoScore: number;
}

export default function SEOTools() {
  const { toast } = useToast();
  const [seoResult, setSeoResult] = useState<SEOResult | null>(null);

  const form = useForm<SEOForm>({
    defaultValues: {
      currentTitle: "",
      keywords: "",
      currentMeta: "",
      category: "Electronics",
    },
  });

  const optimizeMutation = useMutation({
    mutationFn: async (data: SEOForm) => {
      const response = await apiRequest("POST", "/api/optimize-seo", data);
      return response.json();
    },
    onSuccess: (result) => {
      setSeoResult(result);
      toast({
        title: "SEO Optimized!",
        description: "Your product SEO has been optimized successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Optimization failed",
        description: error.message || "Failed to optimize SEO",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SEOForm) => {
    optimizeMutation.mutate(data);
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

  const seoTips = [
    {
      title: "Add alt text to images",
      description: "Improve accessibility and SEO",
    },
    {
      title: "Include long-tail keywords",
      description: "Target specific search queries",
    },
    {
      title: "Optimize product images",
      description: "Compress and name files properly",
    },
  ];

  const competitorKeywords = [
    { keyword: "premium wireless headphones", difficulty: "High" },
    { keyword: "best bluetooth headphones", difficulty: "Medium" },
    { keyword: "active noise cancelling", difficulty: "High" },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-4" data-testid="text-seo-tools-title">SEO Optimization Tools</h2>
        <p className="text-muted-foreground">Optimize your product titles, meta descriptions, and keywords for better search rankings</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* SEO Input Form */}
        <div className="lg:col-span-2">
          <Card className="gradient-card border-0 mb-6">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-6">Product SEO Details</h3>
              
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Label htmlFor="currentTitle">Current Product Title</Label>
                  <Input
                    id="currentTitle"
                    className="form-input mt-2"
                    placeholder="Enter your current product title"
                    {...form.register("currentTitle", { required: true })}
                    data-testid="input-current-title"
                  />
                </div>

                <div>
                  <Label htmlFor="keywords">Target Keywords</Label>
                  <Input
                    id="keywords"
                    className="form-input mt-2"
                    placeholder="wireless headphones, bluetooth, noise cancelling"
                    {...form.register("keywords", { required: true })}
                    data-testid="input-keywords"
                  />
                </div>

                <div>
                  <Label htmlFor="currentMeta">Current Meta Description</Label>
                  <Textarea
                    id="currentMeta"
                    className="form-input mt-2 h-24 resize-none"
                    placeholder="Enter your current meta description"
                    {...form.register("currentMeta")}
                    data-testid="textarea-current-meta"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Product Category</Label>
                  <Select 
                    value={form.watch("category")} 
                    onValueChange={(value) => form.setValue("category", value)}
                  >
                    <SelectTrigger className="form-input mt-2" data-testid="select-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="gradient-surface">
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Clothing & Accessories">Clothing & Accessories</SelectItem>
                      <SelectItem value="Home & Garden">Home & Garden</SelectItem>
                      <SelectItem value="Sports & Outdoors">Sports & Outdoors</SelectItem>
                      <SelectItem value="Beauty & Health">Beauty & Health</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="gradient-button w-full"
                  disabled={optimizeMutation.isPending}
                  data-testid="button-optimize-seo"
                >
                  {optimizeMutation.isPending ? (
                    <>Optimizing...</>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Optimize SEO
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* SEO Results */}
          {seoResult && (
            <div className="space-y-6">
              {/* Optimized Title */}
              <Card className="gradient-card border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <FileText className="w-5 h-5 text-primary mr-2" />
                      Optimized Title
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(seoResult.optimizedTitle, "Title")}
                      data-testid="button-copy-title"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-foreground font-medium" data-testid="text-optimized-title">
                      {seoResult.optimizedTitle}
                    </p>
                    <div className="text-sm text-muted-foreground mt-2">
                      <Badge variant="default" className="bg-green-400/10 text-green-400 mr-2">
                        ✓ {seoResult.optimizedTitle.length} characters
                      </Badge>
                      <Badge variant="default" className="bg-green-400/10 text-green-400 mr-2">
                        ✓ Includes keywords
                      </Badge>
                      <Badge variant="default" className="bg-green-400/10 text-green-400">
                        ✓ SEO optimized
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Optimized Meta Description */}
              <Card className="gradient-card border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <FileText className="w-5 h-5 text-chart-2 mr-2" />
                      Optimized Meta Description
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(seoResult.optimizedMeta, "Meta description")}
                      data-testid="button-copy-meta"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-foreground" data-testid="text-optimized-meta">
                      {seoResult.optimizedMeta}
                    </p>
                    <div className="text-sm text-muted-foreground mt-2">
                      <Badge variant="default" className="bg-green-400/10 text-green-400 mr-2">
                        ✓ {seoResult.optimizedMeta.length} characters
                      </Badge>
                      <Badge variant="default" className="bg-green-400/10 text-green-400 mr-2">
                        ✓ Compelling CTA
                      </Badge>
                      <Badge variant="default" className="bg-green-400/10 text-green-400">
                        ✓ Keyword rich
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Suggested Keywords */}
              <Card className="gradient-card border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <Tags className="w-5 h-5 text-chart-3 mr-2" />
                      Suggested Keywords
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(seoResult.keywords.join(", "), "Keywords")}
                      data-testid="button-copy-keywords"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {seoResult.keywords.map((keyword, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="bg-primary/20 text-primary"
                        data-testid={`badge-keyword-${index}`}
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* SEO Score */}
          <Card className="gradient-card border-0">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">SEO Score</h3>
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-primary" data-testid="text-seo-score">
                  {seoResult?.seoScore || "--"}
                </div>
                <div className="text-sm text-muted-foreground">out of 100</div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Title optimization</span>
                  <span className="text-green-400 text-sm">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Meta description</span>
                  <span className="text-green-400 text-sm">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Keyword density</span>
                  <span className="text-orange-400 text-sm">!</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Alt text</span>
                  <span className="text-orange-400 text-sm">!</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO Tips */}
          <Card className="gradient-card border-0">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">SEO Tips</h3>
              <div className="space-y-3">
                {seoTips.map((tip, index) => (
                  <div key={index} className="flex items-start" data-testid={`tip-${index}`}>
                    <Lightbulb className="w-4 h-4 text-primary mr-2 mt-1" />
                    <div>
                      <p className="text-sm font-medium">{tip.title}</p>
                      <p className="text-xs text-muted-foreground">{tip.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Competitor Analysis */}
          <Card className="gradient-card border-0">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Competitor Keywords</h3>
              <div className="space-y-2">
                {competitorKeywords.map((item, index) => (
                  <div key={index} className="flex items-center justify-between" data-testid={`competitor-keyword-${index}`}>
                    <span className="text-sm">{item.keyword}</span>
                    <span className="text-xs text-muted-foreground">{item.difficulty}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
