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
import { PageContainer, CardPageHeader } from "@/components/ui/standardized-layout";
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
  };
}

interface GeneratedCopy {
  content: string;
  wordCount: number;
  framework: string;
  qualityScore: QualityScore;
  variants: string[];
  headline: string;
  callToAction: string;
}

export default function ProfessionalCopywriting() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [generatedCopy, setGeneratedCopy] = useState<GeneratedCopy | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  // Get session storage value for navigation source
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

  // Real AI copywriting generation mutation
  const generateCopyMutation = useMutation({
    mutationFn: async (data: CopyForm) => {
      setIsGenerating(true);
      setAnalysisProgress(0);

      // Simulate analysis progress
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
      setGeneratedCopy(result);
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
    <div>
      <CardPageHeader title="Professional Copywriting" />
      <PageContainer>
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
        {/* Frameworks Overview */}
        <Card className="border-0 gradient-card rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Choose Your Framework</CardTitle>
            <CardDescription className="text-slate-300">
              Select a proven copywriting framework that matches your product and goals
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Generation Form */}
        <Card className="border-0 gradient-card rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Product Information</CardTitle>
            <CardDescription className="text-slate-300">
              Provide details about your product for AI-powered copy generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="productName" className="text-white">Product Name *</Label>
                  <Input
                    id="productName"
                    className="mt-2 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                    placeholder="e.g., Premium Wireless Headphones"
                    {...form.register("productName", { required: true })}
                  />
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

              <div>
                <Label htmlFor="features" className="text-white">Key Features & Benefits *</Label>
                <Textarea
                  id="features"
                  className="mt-2 h-24 resize-none bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                  placeholder="List the main features and benefits of your product..."
                  {...form.register("features", { required: true })}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="audience" className="text-white">Target Audience</Label>
                  <Input
                    id="audience"
                    className="mt-2 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                    placeholder="e.g., Music enthusiasts, Professionals"
                    {...form.register("audience")}
                  />
                </div>

                <div>
                  <Label htmlFor="industry" className="text-white">Industry</Label>
                  <Input
                    id="industry"
                    className="mt-2 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                    placeholder="e.g., Consumer Electronics"
                    {...form.register("industry")}
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
                    <SelectTrigger className="mt-2 bg-slate-800/50 border-slate-600 text-white">
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
                  />
                </div>
              </div>

              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Crafting professional copy...</span>
                    <span className="text-white">{analysisProgress}%</span>
                  </div>
                  <Progress value={analysisProgress} className="h-2" />
                </div>
              )}

              <Button
                type="submit"
                disabled={generateCopyMutation.isPending}
                className="w-full gradient-button transition-all duration-200 font-medium"
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
          </CardContent>
        </Card>

        {/* Generated Copy Results */}
        {generatedCopy && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h2 className="text-2xl font-semibold text-white">Your Professional Copy</h2>
              <Badge className="bg-primary/20 text-primary">
                {generatedCopy.framework.toUpperCase()} Framework
              </Badge>
            </div>

            {/* Quality Score */}
            <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary-foreground/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-6 h-6 text-primary" />
                    <h3 className="text-2xl font-semibold text-white">Quality Score</h3>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary">{generatedCopy.qualityScore.overall}</div>
                    <div className="text-sm text-slate-300">out of 100</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-slate-800/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 text-sm">Conversion Potential</span>
                      <Award className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">{generatedCopy.qualityScore.conversionPotential}</div>
                  </div>

                  <div className="bg-slate-800/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 text-sm">SEO Score</span>
                      <Target className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">{generatedCopy.qualityScore.seoScore}</div>
                  </div>

                  <div className="bg-slate-800/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 text-sm">Emotional Impact</span>
                      <Heart className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">{generatedCopy.qualityScore.emotionalImpact}</div>
                  </div>
                </div>

                <div className="mt-6 grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-white font-semibold mb-2 flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                      Strengths
                    </h4>
                    <ul className="space-y-1">
                      {generatedCopy.qualityScore.breakdown.strengths.map((strength, index) => (
                        <li key={index} className="text-slate-300 text-sm flex items-start">
                          <span className="text-green-400 mr-2">•</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold mb-2 flex items-center">
                      <Lightbulb className="w-4 h-4 text-yellow-400 mr-2" />
                      Suggested Improvements
                    </h4>
                    <ul className="space-y-1">
                      {generatedCopy.qualityScore.breakdown.improvements.map((improvement, index) => (
                        <li key={index} className="text-slate-300 text-sm flex items-start">
                          <span className="text-yellow-400 mr-2">•</span>
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Copy */}
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
                    onClick={() => copyToClipboard(generatedCopy.content, "Main copy")}
                    className="text-blue-300 hover:text-blue-200 hover:bg-blue-400/10"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="bg-slate-800/30 p-4 rounded-lg border border-blue-400/20">
                  <p className="text-slate-100 leading-relaxed whitespace-pre-wrap">
                    {generatedCopy.content}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Headline & CTA */}
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
                      onClick={() => copyToClipboard(generatedCopy.headline, "Headline")}
                      className="text-purple-300 hover:text-purple-200 hover:bg-purple-400/10"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="bg-slate-800/30 p-4 rounded-lg border border-purple-400/20">
                    <p className="text-slate-100 font-medium">
                      {generatedCopy.headline}
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
                      onClick={() => copyToClipboard(generatedCopy.callToAction, "Call to action")}
                      className="text-green-300 hover:text-green-200 hover:bg-green-400/10"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="bg-slate-800/30 p-4 rounded-lg border border-green-400/20">
                    <p className="text-slate-100 font-medium">
                      {generatedCopy.callToAction}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alternative Variants */}
            {generatedCopy.variants && generatedCopy.variants.length > 0 && (
              <Card className="border-0 gradient-card rounded-xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">Alternative Variations</CardTitle>
                  <CardDescription className="text-slate-300">
                    Different angles and approaches for A/B testing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="variant-1" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
                      {generatedCopy.variants.map((_, index) => (
                        <TabsTrigger key={index} value={`variant-${index + 1}`} className="text-white">
                          Variant {index + 1}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {generatedCopy.variants.map((variant, index) => (
                      <TabsContent key={index} value={`variant-${index + 1}`} className="mt-4">
                        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-600 relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(variant, `Variant ${index + 1}`)}
                            className="absolute top-2 right-2 text-slate-300 hover:text-white"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <p className="text-slate-100 leading-relaxed whitespace-pre-wrap pr-10">
                            {variant}
                          </p>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        </div>
      </PageContainer>
    </div>
  );
}
