import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AvatarMenu } from "@/components/ui/avatar-menu";
import NotificationCenter from "@/components/dashboard/notification-center";
import { 
  ArrowLeft,
  Brain, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Search,
  FileText,
  Image,
  Zap,
  RefreshCw
} from "lucide-react";

interface ProductIssue {
  id: string;
  productName: string;
  issues: Array<{
    type: 'low-ctr' | 'poor-seo' | 'missing-alt' | 'short-description';
    severity: 'high' | 'medium' | 'low';
    description: string;
    suggestion: string;
  }>;
  currentCTR?: number;
  seoScore?: number;
  status: 'needs-fix' | 'fixing' | 'fixed';
}

export default function SmartBulkSuggestions() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [fixingProducts, setFixingProducts] = useState<Set<string>>(new Set());

  const handleGoBack = () => {
    sessionStorage.setItem('navigationSource', 'automation');
    setLocation('/dashboard');
  };

  const [productIssues] = useState<ProductIssue[]>([
    {
      id: "prod_1",
      productName: "Wireless Headphones",
      currentCTR: 1.2,
      seoScore: 35,
      status: 'needs-fix',
      issues: [
        {
          type: 'low-ctr',
          severity: 'high',
          description: 'Click-through rate is 67% below industry average',
          suggestion: 'Add emotional triggers and urgency in title (e.g., "Premium", "Limited Time")'
        },
        {
          type: 'poor-seo',
          severity: 'high', 
          description: 'SEO keyword density is too low (0.8%)',
          suggestion: 'Include target keywords: "wireless bluetooth headphones", "noise canceling"'
        },
        {
          type: 'short-description',
          severity: 'medium',
          description: 'Product description is only 15 words long',
          suggestion: 'Expand to 150-200 words with benefits, features, and social proof'
        }
      ]
    },
    {
      id: "prod_2",
      productName: "Smart Watch Pro",
      currentCTR: 0.9,
      seoScore: 28,
      status: 'needs-fix',
      issues: [
        {
          type: 'low-ctr',
          severity: 'high',
          description: 'CTR is 73% below average for electronics category',
          suggestion: 'Highlight unique features in title: "Heart Rate Monitor", "GPS Tracking"'
        },
        {
          type: 'missing-alt',
          severity: 'medium',
          description: 'Product images missing alt text for accessibility',
          suggestion: 'Add descriptive alt text: "Smart watch displaying fitness metrics on OLED screen"'
        },
        {
          type: 'poor-seo',
          severity: 'high',
          description: 'Missing long-tail keywords for better ranking',
          suggestion: 'Add keywords: "fitness tracker", "smartwatch for athletes", "waterproof"'
        }
      ]
    },
    {
      id: "prod_3",
      productName: "Laptop Stand",
      currentCTR: 2.1,
      seoScore: 42,
      status: 'needs-fix',
      issues: [
        {
          type: 'short-description',
          severity: 'high',
          description: 'Description lacks benefit-focused content',
          suggestion: 'Emphasize ergonomic benefits, productivity gains, and health improvements'
        },
        {
          type: 'poor-seo',
          severity: 'medium',
          description: 'Title missing search volume keywords',
          suggestion: 'Include "ergonomic", "adjustable", "laptop stand for desk"'
        }
      ]
    }
  ]);

  const handleAnalyzeStore = async () => {
    setIsAnalyzing(true);
    setAnalysisComplete(false);

    toast({
      title: "🔍 Analyzing Your Store",
      description: "AI is scanning all products for optimization opportunities...",
    });

    // Simulate analysis time
    await new Promise(resolve => setTimeout(resolve, 4000));

    setIsAnalyzing(false);
    setAnalysisComplete(true);

    toast({
      title: "✅ Analysis Complete!",
      description: `Found ${productIssues.length} products with optimization opportunities`,
    });
  };

  const handleFixIssue = async (productId: string) => {
    setFixingProducts(prev => new Set(prev).add(productId));

    toast({
      title: "🤖 Fixing Issues",
      description: "AI is optimizing this product...",
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    setFixingProducts(prev => {
      const updated = new Set(prev);
      updated.delete(productId);
      return updated;
    });

    toast({
      title: "✅ Product Optimized!",
      description: "All issues have been automatically fixed by AI",
    });
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'low-ctr': return <TrendingUp className="w-4 h-4" />;
      case 'poor-seo': return <Search className="w-4 h-4" />;
      case 'missing-alt': return <Image className="w-4 h-4" />;
      case 'short-description': return <FileText className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'low': return 'text-blue-400 bg-blue-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const totalIssues = productIssues.reduce((sum, product) => sum + product.issues.length, 0);
  const highSeverityIssues = productIssues.reduce((sum, product) => 
    sum + product.issues.filter(issue => issue.severity === 'high').length, 0
  );

  return (
    <div className="min-h-screen text-white dark-theme-bg">
      {/* Header */}
      <header className="dark-theme-bg backdrop-blur-sm border-b border-border/50 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left Section - Back Button + Title */}
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoBack}
              className="text-slate-200 hover:text-primary hover:bg-white/10 transition-all duration-300 ease-in-out flex-shrink-0"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <Brain className="w-6 h-6 text-primary" />
                <h1 className="font-bold text-white text-base sm:text-lg lg:text-xl xl:text-2xl truncate">
                  Smart Bulk Suggestions
                </h1>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm lg:text-base truncate">
                AI analyzes your products and suggests improvements for better performance
              </p>
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
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
        {/* Analysis Control */}
        <Card className="gradient-card">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Store Analysis</CardTitle>
            <CardDescription className="text-slate-300">
              Let AI scan your entire product catalog for optimization opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!analysisComplete ? (
              <div className="text-center py-8">
                <Button
                  onClick={handleAnalyzeStore}
                  disabled={isAnalyzing}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 font-medium text-lg px-8 py-4"
                  data-testid="button-analyze"
                >
                  {isAnalyzing ? (
                    <>
                      <Clock className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing Store...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5 mr-2" />
                      Start Smart Analysis
                    </>
                  )}
                </Button>
                {isAnalyzing && (
                  <p className="text-slate-400 text-sm mt-4">
                    Scanning products for CTR issues, SEO problems, and missing content...
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">{productIssues.length}</div>
                  <div className="text-slate-300 text-sm">Products Need Attention</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-400 mb-2">{highSeverityIssues}</div>
                  <div className="text-slate-300 text-sm">Critical Issues</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">{totalIssues}</div>
                  <div className="text-slate-300 text-sm">Total Issues Found</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">+78%</div>
                  <div className="text-slate-300 text-sm">Avg. Improvement</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Issues List */}
        {analysisComplete && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">⚠️ Fix Me Recommendations</h2>
              <Badge className="bg-red-500/20 text-red-300">Needs Immediate Attention</Badge>
            </div>
            
            {productIssues.map((product) => (
              <Card key={product.id} className="gradient-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg text-white">{product.productName}</CardTitle>
                      <div className="flex items-center space-x-4 text-sm">
                        {product.currentCTR && (
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-4 h-4 text-red-400" />
                            <span className="text-slate-300">CTR: {product.currentCTR}%</span>
                          </div>
                        )}
                        {product.seoScore && (
                          <div className="flex items-center space-x-1">
                            <Search className="w-4 h-4 text-yellow-400" />
                            <span className="text-slate-300">SEO: {product.seoScore}/100</span>
                          </div>
                        )}
                        <Badge className={`${getSeverityColor(product.issues[0]?.severity)} text-xs`}>
                          {product.issues.length} Issues
                        </Badge>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleFixIssue(product.id)}
                      disabled={fixingProducts.has(product.id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      data-testid={`button-fix-${product.id}`}
                    >
                      {fixingProducts.has(product.id) ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Fixing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          One-Click Fix
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {product.issues.map((issue, idx) => (
                    <div key={idx} className="bg-slate-800/30 p-4 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-full ${getSeverityColor(issue.severity)}`}>
                          {getIssueIcon(issue.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-slate-200 capitalize">
                              {issue.type.replace('-', ' ')}
                            </h4>
                            <Badge className={`${getSeverityColor(issue.severity)} text-xs`}>
                              {issue.severity}
                            </Badge>
                          </div>
                          <p className="text-slate-300 text-sm mb-2">{issue.description}</p>
                          <div className="bg-blue-900/20 border border-blue-400/20 p-3 rounded">
                            <div className="flex items-start space-x-2">
                              <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-blue-300 font-medium text-sm">AI Suggestion:</div>
                                <p className="text-blue-200 text-sm">{issue.suggestion}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}