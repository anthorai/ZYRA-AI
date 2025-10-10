import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AvatarMenu } from "@/components/ui/avatar-menu";
import NotificationCenter from "@/components/dashboard/notification-center";
import { 
  ArrowLeft,
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
  Lightbulb
} from "lucide-react";

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
    toneMatch: number;
  };
}

interface CopyVariant {
  id: string;
  type: 'emotional' | 'logical' | 'hybrid';
  headline: string;
  copy: string;
  cta: string;
  qualityScore: QualityScore;
  framework: string;
  psychologicalTriggers: string[];
}

interface GeneratedCopy {
  variants: CopyVariant[];
  analysis: any;
  recommendedVariant: string;
}

export default function ProfessionalCopywriting() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [generatedCopy, setGeneratedCopy] = useState<GeneratedCopy | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>('hybrid');

  const form = useForm<CopyForm>({
    defaultValues: {
      productName: "",
      category: "Electronics",
      features: "",
      audience: "General consumers",
      framework: "AIDA",
      industry: "Technology & Electronics",
      maxWords: 150,
    },
  });

  // Fetch available frameworks
  const { data: frameworksData } = useQuery({
    queryKey: ['/api/copywriting/frameworks'],
    queryFn: async (): Promise<any> => {
      const response = await apiRequest("GET", "/api/copywriting/frameworks");
      return response.json();
    }
  });

  const handleGoBack = () => {
    sessionStorage.setItem('navigationSource', 'ai-tools');
    setLocation('/dashboard');
  };

  // Professional copy generation with multi-agent pipeline
  const generateMutation = useMutation({
    mutationFn: async (data: CopyForm) => {
      const response = await apiRequest("POST", "/api/generate-professional-copy", {
        productName: data.productName,
        category: data.category,
        features: data.features,
        audience: data.audience,
        framework: data.framework,
        industry: data.industry,
        psychologicalTriggers: ['Scarcity', 'Social Proof', 'Urgency'],
        maxWords: data.maxWords
      });
      
      return response.json();
    },
    onSuccess: (result) => {
      setGeneratedCopy(result);
      setSelectedVariant(result.recommendedVariant || 'hybrid');
      toast({
        title: "🚀 Professional Copy Generated!",
        description: `3 variants created using ${form.getValues('framework')} framework with quality scoring`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate professional copy",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CopyForm) => {
    if (!data.productName.trim()) {
      toast({
        title: "Product name required",
        description: "Please enter a product name to generate copy",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate(data);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "✓ Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="gradient-surface border-b border-border px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center">
          {/* Left Section - Back Button + Title */}
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <Button 
              onClick={handleGoBack} 
              variant="ghost" 
              size="icon"
              className="text-slate-200 hover:text-primary hover:bg-white/10 transition-all duration-300 ease-in-out flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-white text-base sm:text-lg lg:text-xl xl:text-2xl flex items-center gap-2">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                Copywriting AI
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm lg:text-base">Multi-agent pipeline with A/B variants and quality scoring</p>
            </div>
          </div>

          {/* Right Section - Notifications + Profile */}
          <div className="flex items-center justify-end space-x-2 sm:space-x-4 flex-shrink-0">
            <NotificationCenter />
            <AvatarMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                Copywriting Input
              </CardTitle>
              <CardDescription>Configure your product details and framework</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label>Product Name *</Label>
                  <Input
                    {...form.register("productName")}
                    placeholder="e.g., Wireless Noise-Canceling Headphones"
                    className="bg-gray-900 border-gray-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Framework</Label>
                    <Select 
                      value={form.watch("framework")} 
                      onValueChange={(value) => form.setValue("framework", value)}
                    >
                      <SelectTrigger className="bg-gray-900 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {frameworksData?.frameworks?.map((fw: any) => (
                          <SelectItem key={fw.acronym} value={fw.acronym}>
                            {fw.acronym} - {fw.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Industry</Label>
                    <Select 
                      value={form.watch("industry")} 
                      onValueChange={(value) => form.setValue("industry", value)}
                    >
                      <SelectTrigger className="bg-gray-900 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {frameworksData?.industries?.map((ind: any) => (
                          <SelectItem key={ind.industry} value={ind.industry}>
                            {ind.industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Target Audience</Label>
                  <Input
                    {...form.register("audience")}
                    placeholder="e.g., Busy professionals, music enthusiasts"
                    className="bg-gray-900 border-gray-600"
                  />
                </div>

                <div>
                  <Label>Key Features & Benefits</Label>
                  <Textarea
                    {...form.register("features")}
                    placeholder="List the key features and benefits that make this product special..."
                    rows={4}
                    className="bg-gray-900 border-gray-600"
                  />
                </div>

                <div>
                  <Label>Max Words: {form.watch("maxWords")}</Label>
                  <input
                    type="range"
                    min="100"
                    max="300"
                    step="50"
                    {...form.register("maxWords", { valueAsNumber: true })}
                    className="w-full"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      Generating Professional Copy...
                    </>
                  ) : (
                    <>
                      <Trophy className="w-4 h-4 mr-2" />
                      Generate A/B Variants
                    </>
                  )}
                </Button>
              </form>

              {/* Framework Info */}
              {frameworksData && form.watch("framework") && (
                <div className="mt-4 p-4 bg-gray-900/50 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">
                    {frameworksData.frameworks.find((f: any) => f.acronym === form.watch("framework"))?.name}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {frameworksData.frameworks.find((f: any) => f.acronym === form.watch("framework"))?.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {frameworksData.frameworks.find((f: any) => f.acronym === form.watch("framework"))?.steps.map((step: string) => (
                      <Badge key={step} variant="outline" className="text-xs">{step}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generated Results */}
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Generated Variants
              </CardTitle>
              <CardDescription>
                {generatedCopy ? 
                  `Recommended: ${generatedCopy.recommendedVariant.toUpperCase()} variant` : 
                  'A/B tested variants will appear here'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!generatedCopy ? (
                <div className="text-center py-12 text-gray-400">
                  <Lightbulb className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Generate professional copy to see A/B variants with quality scores</p>
                </div>
              ) : (
                <Tabs value={selectedVariant} onValueChange={setSelectedVariant}>
                  <TabsList className="grid w-full grid-cols-3 bg-gray-900">
                    {generatedCopy.variants.map((variant) => (
                      <TabsTrigger key={variant.id} value={variant.id} className="relative">
                        {variant.id === generatedCopy.recommendedVariant && (
                          <Trophy className="w-3 h-3 absolute top-1 right-1 text-yellow-500" />
                        )}
                        <div className="flex items-center gap-1">
                          {variant.type === 'emotional' && <Heart className="w-3 h-3" />}
                          {variant.type === 'logical' && <BarChart3 className="w-3 h-3" />}
                          {variant.type === 'hybrid' && <Zap className="w-3 h-3" />}
                          {variant.type.charAt(0).toUpperCase() + variant.type.slice(1)}
                        </div>
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {generatedCopy.variants.map((variant) => (
                    <TabsContent key={variant.id} value={variant.id} className="space-y-4 mt-4">
                      {/* Quality Score */}
                      <div className="bg-gray-900/50 p-4 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">Quality Score</h4>
                          <Badge variant={getScoreBadgeVariant(variant.qualityScore.overall)} className="text-lg px-3">
                            {variant.qualityScore.overall}/100
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-400">Conversion</span>
                              <span className={getScoreColor(variant.qualityScore.conversionPotential)}>
                                {variant.qualityScore.conversionPotential}
                              </span>
                            </div>
                            <Progress value={variant.qualityScore.conversionPotential} className="h-1" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-400">SEO</span>
                              <span className={getScoreColor(variant.qualityScore.seoScore)}>
                                {variant.qualityScore.seoScore}
                              </span>
                            </div>
                            <Progress value={variant.qualityScore.seoScore} className="h-1" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-400">Readability</span>
                              <span className={getScoreColor(variant.qualityScore.readability)}>
                                {variant.qualityScore.readability}
                              </span>
                            </div>
                            <Progress value={variant.qualityScore.readability} className="h-1" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-400">Emotional</span>
                              <span className={getScoreColor(variant.qualityScore.emotionalImpact)}>
                                {variant.qualityScore.emotionalImpact}
                              </span>
                            </div>
                            <Progress value={variant.qualityScore.emotionalImpact} className="h-1" />
                          </div>
                        </div>
                      </div>

                      {/* Headline */}
                      <div>
                        <Label className="text-xs text-gray-400">Headline</Label>
                        <div className="bg-gray-900 p-3 rounded-lg mt-1 flex items-center justify-between">
                          <p className="font-semibold">{variant.headline}</p>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => copyToClipboard(variant.headline, 'Headline')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Copy */}
                      <div>
                        <Label className="text-xs text-gray-400">Copy</Label>
                        <div className="bg-gray-900 p-4 rounded-lg mt-1 relative">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{variant.copy}</p>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="absolute top-2 right-2"
                            onClick={() => copyToClipboard(variant.copy, 'Copy')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* CTA */}
                      <div>
                        <Label className="text-xs text-gray-400">Call-to-Action</Label>
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-lg mt-1 flex items-center justify-between">
                          <p className="font-semibold">{variant.cta}</p>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => copyToClipboard(variant.cta, 'CTA')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Strengths & Improvements */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <Label className="text-green-500 text-xs mb-1">Strengths</Label>
                          <ul className="space-y-1">
                            {variant.qualityScore.breakdown.strengths.slice(0, 2).map((strength, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <CheckCircle className="w-3 h-3 text-green-500 mt-0.5" />
                                <span className="text-gray-300">{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <Label className="text-yellow-500 text-xs mb-1">Can Improve</Label>
                          <ul className="space-y-1">
                            {variant.qualityScore.breakdown.improvements.slice(0, 2).map((improvement, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <TrendingUp className="w-3 h-3 text-yellow-500 mt-0.5" />
                                <span className="text-gray-300">{improvement}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analysis Insights */}
        {generatedCopy?.analysis && (
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                Market Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="text-xs text-gray-400">Pain Points</Label>
                <ul className="mt-2 space-y-1">
                  {generatedCopy.analysis.painPoints?.slice(0, 3).map((point: string, i: number) => (
                    <li key={i} className="text-gray-300">• {point}</li>
                  ))}
                </ul>
              </div>
              <div>
                <Label className="text-xs text-gray-400">Emotional Triggers</Label>
                <div className="mt-2 flex flex-wrap gap-1">
                  {generatedCopy.analysis.emotionalTriggers?.slice(0, 4).map((trigger: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">{trigger}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-400">Recommended Tone</Label>
                <p className="mt-2 text-gray-300">{generatedCopy.analysis.recommendedTone}</p>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
}
