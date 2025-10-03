import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { AvatarMenu } from "@/components/ui/avatar-menu";
import NotificationCenter from "@/components/dashboard/notification-center";
import { 
  ArrowLeft,
  Package,
  Upload,
  Download,
  CheckCircle,
  Clock,
  FileText,
  Zap,
  AlertCircle,
  BarChart3
} from "lucide-react";

interface BulkJob {
  id: string;
  fileName: string;
  totalProducts: number;
  processedProducts: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  results?: {
    optimized: number;
    errors: number;
    downloadUrl?: string;
  };
}

export default function BulkOptimization() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentJob, setCurrentJob] = useState<BulkJob | null>(null);
  const [progress, setProgress] = useState(0);

  // Handle back navigation
  const handleGoBack = () => {
    sessionStorage.setItem('navigationSource', 'ai-tools');
    setLocation('/dashboard');
  };

  // Mock bulk processing mutation
  const bulkProcessMutation = useMutation({
    mutationFn: async (file: File) => {
      const jobId = Math.random().toString(36).substr(2, 9);
      const totalProducts = Math.floor(Math.random() * 80) + 20; // 20-100 products
      
      // Initialize job
      const job: BulkJob = {
        id: jobId,
        fileName: file.name,
        totalProducts,
        processedProducts: 0,
        status: 'uploading'
      };
      
      setCurrentJob(job);
      
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Start processing
      setCurrentJob(prev => prev ? { ...prev, status: 'processing' } : null);
      
      // Simulate processing with progress updates
      for (let i = 0; i <= totalProducts; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        const progressPercent = (i / totalProducts) * 100;
        setProgress(progressPercent);
        setCurrentJob(prev => prev ? { ...prev, processedProducts: i } : null);
      }
      
      // Complete processing
      const optimizedCount = Math.floor(totalProducts * 0.95);
      const errorCount = totalProducts - optimizedCount;
      
      return {
        optimized: optimizedCount,
        errors: errorCount,
        downloadUrl: `bulk-optimized-${jobId}.csv`
      };
    },
    onSuccess: (result) => {
      setCurrentJob(prev => prev ? { 
        ...prev, 
        status: 'completed',
        results: result
      } : null);
      
      toast({
        title: "🎉 Bulk Optimization Complete!",
        description: `Successfully optimized ${result.optimized} products. Download your results below.`,
      });
    },
    onError: (error: any) => {
      setCurrentJob(prev => prev ? { ...prev, status: 'error' } : null);
      toast({
        title: "Bulk processing failed",
        description: error.message || "Failed to process your CSV file",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file format",
        description: "Please upload a CSV file containing your product data",
        variant: "destructive",
      });
      return;
    }

    bulkProcessMutation.mutate(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const downloadResults = () => {
    // Simulate download
    toast({
      title: "Download started",
      description: "Your optimized products CSV is downloading...",
    });
  };

  const resetJob = () => {
    setCurrentJob(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen dark-theme-bg text-white">
      {/* Header */}
      <header className="gradient-surface backdrop-blur-sm border-b border-slate-700/50 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoBack}
              className="text-slate-200 hover:text-primary hover:bg-white/10 transition-all duration-300 ease-in-out flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <Package className="w-6 h-6 text-primary" />
                <h1 className="font-bold text-white text-base sm:text-lg lg:text-xl xl:text-2xl truncate">
                  Bulk Optimization
                </h1>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm lg:text-base truncate">
                Optimize 20-100+ products in one go with AI-powered enhancements
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 sm:space-x-4 flex-shrink-0">
            <NotificationCenter />
            <AvatarMenu />
          </div>
        </div>
      </header>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
        {/* Process Overview */}
        <Card className="border-0 gradient-card rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-white">Bulk Processing Workflow</h2>
            </div>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                <span className="text-slate-300">Upload CSV with product data</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                <span className="text-slate-300">AI optimizes descriptions & SEO</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
                <span className="text-slate-300">Auto-generate tags & titles</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">4</div>
                <span className="text-slate-300">Download optimized CSV</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Area */}
        {!currentJob && (
          <Card className="border-0 gradient-card rounded-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Upload Your Products</CardTitle>
              <CardDescription className="text-slate-300">
                Upload a CSV file with your product data. Zyra AI will optimize descriptions, generate SEO titles, and create tags for each product.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="border-2 border-dashed border-primary/30 rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer bg-slate-800/20"
                onClick={handleUploadClick}
              >
                <Upload className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Drag & drop your CSV file here</h3>
                <p className="text-slate-300 mb-4">or click to browse and select your file</p>
                <p className="text-sm text-slate-400">Supports CSV files up to 10MB with 20-100+ products</p>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden" 
                />
              </div>
              
              <div className="mt-6 bg-slate-800/30 p-4 rounded-lg">
                <h4 className="text-white font-medium mb-2">Required CSV Columns:</h4>
                <div className="grid md:grid-cols-2 gap-2 text-sm text-slate-300">
                  <div>• product_name (required)</div>
                  <div>• category (optional)</div>
                  <div>• current_description (optional)</div>
                  <div>• price (optional)</div>
                  <div>• features (optional)</div>
                  <div>• target_audience (optional)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing Status */}
        {currentJob && (
          <Card className="border-0 gradient-card rounded-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-white flex items-center space-x-2">
                    {currentJob.status === 'uploading' && <Clock className="w-6 h-6 text-blue-400 animate-spin" />}
                    {currentJob.status === 'processing' && <Zap className="w-6 h-6 text-yellow-400 animate-pulse" />}
                    {currentJob.status === 'completed' && <CheckCircle className="w-6 h-6 text-green-400" />}
                    {currentJob.status === 'error' && <AlertCircle className="w-6 h-6 text-red-400" />}
                    <span>
                      {currentJob.status === 'uploading' && 'Uploading...'}
                      {currentJob.status === 'processing' && 'Processing...'}
                      {currentJob.status === 'completed' && 'Completed!'}
                      {currentJob.status === 'error' && 'Error'}
                    </span>
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    File: {currentJob.fileName} ({currentJob.totalProducts} products)
                  </CardDescription>
                </div>
                {currentJob.status === 'completed' && (
                  <Button onClick={resetJob} variant="outline" className="text-white border-slate-600">
                    Process Another File
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress Bar */}
              {(currentJob.status === 'uploading' || currentJob.status === 'processing') && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">
                      {currentJob.status === 'uploading' ? 'Uploading and analyzing...' : 'Optimizing products...'}
                    </span>
                    <span className="text-white">
                      {currentJob.processedProducts} / {currentJob.totalProducts}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Results */}
              {currentJob.status === 'completed' && currentJob.results && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card className="bg-green-900/20 border-green-400/30">
                      <CardContent className="p-4 text-center">
                        <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">{currentJob.results.optimized}</div>
                        <div className="text-sm text-slate-300">Products Optimized</div>
                      </CardContent>
                    </Card>
                    
                    {currentJob.results.errors > 0 && (
                      <Card className="bg-red-900/20 border-red-400/30">
                        <CardContent className="p-4 text-center">
                          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-white">{currentJob.results.errors}</div>
                          <div className="text-sm text-slate-300">Errors</div>
                        </CardContent>
                      </Card>
                    )}

                    <Card className="bg-blue-900/20 border-blue-400/30">
                      <CardContent className="p-4 text-center">
                        <BarChart3 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">
                          {Math.round((currentJob.results.optimized / currentJob.totalProducts) * 100)}%
                        </div>
                        <div className="text-sm text-slate-300">Success Rate</div>
                      </CardContent>
                    </Card>
                  </div>

                  <Button 
                    onClick={downloadResults}
                    className="w-full gradient-button"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Optimized CSV
                  </Button>
                </div>
              )}

              {/* Error State */}
              {currentJob.status === 'error' && (
                <div className="text-center space-y-4">
                  <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Processing Failed</h3>
                    <p className="text-slate-300">Please check your CSV format and try again.</p>
                  </div>
                  <Button onClick={resetJob} className="gradient-button">
                    Try Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Features */}
        <Card className="border-0 gradient-card rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-white">What Gets Optimized</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h4 className="text-white font-medium">Product Descriptions</h4>
                    <p className="text-slate-300 text-sm">AI rewrites descriptions for better engagement and SEO</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Zap className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h4 className="text-white font-medium">SEO Titles</h4>
                    <p className="text-slate-300 text-sm">Keyword-rich titles optimized for search rankings</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Package className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h4 className="text-white font-medium">Product Tags</h4>
                    <p className="text-slate-300 text-sm">Auto-generated tags for better categorization</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <BarChart3 className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h4 className="text-white font-medium">Meta Descriptions</h4>
                    <p className="text-slate-300 text-sm">Search-optimized meta descriptions for each product</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}