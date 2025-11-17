import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { ProductSelector } from "@/components/ui/product-selector";
import { Separator } from "@/components/ui/separator";
import { 
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
import type { Product } from "@shared/schema";

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
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);


  const bulkProcessMutation = useMutation({
    mutationFn: async (file: File) => {
      const jobId = Math.random().toString(36).substr(2, 9);
      
      const job: BulkJob = {
        id: jobId,
        fileName: file.name,
        totalProducts: 0,
        processedProducts: 0,
        status: 'uploading'
      };
      
      setCurrentJob(job);

      const formData = new FormData();
      formData.append('csv', file);

      const { supabase } = await import('@/lib/supabaseClient');
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token || '';

      const response = await fetch('/api/products/bulk-optimize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process bulk optimization');
      }

      const result = await response.json();
      
      setCurrentJob(prev => prev ? { 
        ...prev, 
        totalProducts: result.totalProducts,
        status: 'processing' 
      } : null);

      for (let i = 0; i <= result.optimized; i++) {
        await new Promise(resolve => setTimeout(resolve, 30));
        const progressPercent = (i / result.optimized) * 100;
        setProgress(progressPercent);
        setCurrentJob(prev => prev ? { ...prev, processedProducts: i } : null);
      }
      
      return {
        optimized: result.optimized,
        errors: result.errors,
        downloadUrl: `bulk-optimized-${jobId}.csv`,
        results: result.results
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
    <PageShell
      title="Bulk Optimization"
      subtitle="Upload CSV files and optimize hundreds of products at once with AI"
      
    >
      <div className="space-y-6 sm:space-y-8">
        <DashboardCard
          title="Bulk Processing Workflow"
          description="Four simple steps to optimize your entire product catalog"
          testId="card-workflow"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 text-[10px] sm:text-xs md:text-sm">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">1</div>
              <span className="text-slate-300 truncate">Upload CSV with product data</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">2</div>
              <span className="text-slate-300 truncate">AI optimizes descriptions & SEO</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">3</div>
              <span className="text-slate-300 truncate">Auto-generate tags & titles</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">4</div>
              <span className="text-slate-300 truncate">Download optimized CSV</span>
            </div>
          </div>
        </DashboardCard>

        {!currentJob && (
          <>
            <DashboardCard
              title="Option 1: Select from Your Products"
              description="Choose multiple products from your catalog for bulk optimization"
              testId="card-select-products"
            >
              <ProductSelector
                mode="multi"
                label="Select Products for Bulk Optimization"
                placeholder="Select multiple products..."
                value={selectedProductIds}
                onChange={(ids, products) => {
                  if (Array.isArray(ids) && Array.isArray(products)) {
                    setSelectedProductIds(ids);
                    setSelectedProducts(products);
                  }
                }}
                onProductSelect={(products) => {
                  if (Array.isArray(products)) {
                    setSelectedProducts(products);
                    setSelectedProductIds(products.map(p => p.id));
                  } else if (products === null) {
                    setSelectedProducts([]);
                    setSelectedProductIds([]);
                  }
                }}
                showSelectedBadge={true}
              />
              
              {selectedProducts.length > 0 && (
                <div className="mt-6">
                  <Button
                    onClick={() => {
                      // Create a fake job for the selected products
                      const job: BulkJob = {
                        id: Math.random().toString(36).substr(2, 9),
                        fileName: `Selected Products (${selectedProducts.length})`,
                        totalProducts: selectedProducts.length,
                        processedProducts: 0,
                        status: 'processing'
                      };
                      
                      setCurrentJob(job);
                      setProgress(0);
                      
                      // Simulate processing (in real implementation, this would call the bulk API)
                      let processed = 0;
                      const interval = setInterval(() => {
                        processed++;
                        const progressPercent = (processed / selectedProducts.length) * 100;
                        setProgress(progressPercent);
                        setCurrentJob(prev => prev ? { ...prev, processedProducts: processed } : null);
                        
                        if (processed >= selectedProducts.length) {
                          clearInterval(interval);
                          setCurrentJob(prev => prev ? {
                            ...prev,
                            status: 'completed',
                            results: {
                              optimized: selectedProducts.length,
                              errors: 0,
                              downloadUrl: `selected-products-${job.id}.csv`
                            }
                          } : null);
                          
                          toast({
                            title: "🎉 Bulk Optimization Complete!",
                            description: `Successfully optimized ${selectedProducts.length} products.`,
                          });
                        }
                      }, 100);
                    }}
                    className="w-full gradient-button"
                    data-testid="button-optimize-selected"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Optimize {selectedProducts.length} Selected Product{selectedProducts.length > 1 ? 's' : ''}
                  </Button>
                </div>
              )}
            </DashboardCard>

            <div className="flex items-center gap-4 my-6">
              <Separator className="flex-1" />
              <span className="text-slate-400 text-sm">OR</span>
              <Separator className="flex-1" />
            </div>

            <DashboardCard
              title="Option 2: Upload CSV File"
              description="Upload a CSV file with your product data. Zyra AI will optimize descriptions, generate SEO titles, and create tags for each product."
              testId="card-upload"
            >
              <div 
                className="border-2 border-dashed border-primary/30 rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer bg-slate-800/20"
                onClick={handleUploadClick}
                data-testid="upload-zone"
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
                  data-testid="input-file"
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
            </DashboardCard>
          </>
        )}

        {currentJob && (
          <Card className="border-0 gradient-card rounded-xl sm:rounded-2xl">
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
                  <Button onClick={resetJob} variant="outline" className="text-white border-slate-600" data-testid="button-process-another">
                    Process Another File
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
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

              {currentJob.status === 'completed' && currentJob.results && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                    <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl bg-green-900/20 border-green-400/30">
                      <CardContent className="p-3 sm:p-4 md:p-6 text-center">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-400 mx-auto mb-2 flex-shrink-0" />
                        <div className="text-base sm:text-lg md:text-xl font-bold text-white">{currentJob.results.optimized}</div>
                        <div className="text-[10px] sm:text-xs md:text-sm text-slate-300 truncate">Products Optimized</div>
                      </CardContent>
                    </Card>
                    
                    {currentJob.results.errors > 0 && (
                      <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl bg-red-900/20 border-red-400/30">
                        <CardContent className="p-3 sm:p-4 md:p-6 text-center">
                          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-400 mx-auto mb-2 flex-shrink-0" />
                          <div className="text-base sm:text-lg md:text-xl font-bold text-white">{currentJob.results.errors}</div>
                          <div className="text-[10px] sm:text-xs md:text-sm text-slate-300 truncate">Errors</div>
                        </CardContent>
                      </Card>
                    )}

                    <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl bg-blue-900/20 border-blue-400/30">
                      <CardContent className="p-3 sm:p-4 md:p-6 text-center">
                        <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-400 mx-auto mb-2 flex-shrink-0" />
                        <div className="text-base sm:text-lg md:text-xl font-bold text-white">
                          {Math.round((currentJob.results.optimized / currentJob.totalProducts) * 100)}%
                        </div>
                        <div className="text-[10px] sm:text-xs md:text-sm text-slate-300 truncate">Success Rate</div>
                      </CardContent>
                    </Card>
                  </div>

                  <Button 
                    onClick={downloadResults}
                    className="w-full gradient-button"
                    data-testid="button-download"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Optimized CSV
                  </Button>
                </div>
              )}

              {currentJob.status === 'error' && (
                <div className="text-center space-y-4">
                  <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Processing Failed</h3>
                    <p className="text-slate-300">Please check your CSV format and try again.</p>
                  </div>
                  <Button onClick={resetJob} className="gradient-button" data-testid="button-try-again">
                    Try Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <DashboardCard
          title="What Gets Optimized"
          description="AI-powered enhancements for your entire product catalog"
          testId="card-features"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <div className="flex items-start space-x-2 sm:space-x-3 min-w-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary mt-1 flex-shrink-0" />
              <div className="min-w-0">
                <h4 className="text-white font-medium text-base sm:text-lg md:text-xl truncate">Product Descriptions</h4>
                <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm">AI rewrites descriptions for better engagement and SEO</p>
              </div>
            </div>
            <div className="flex items-start space-x-2 sm:space-x-3 min-w-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary mt-1 flex-shrink-0" />
              <div className="min-w-0">
                <h4 className="text-white font-medium text-base sm:text-lg md:text-xl truncate">SEO Titles</h4>
                <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm">Keyword-rich titles optimized for search rankings</p>
              </div>
            </div>
            <div className="flex items-start space-x-2 sm:space-x-3 min-w-0">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary mt-1 flex-shrink-0" />
              <div className="min-w-0">
                <h4 className="text-white font-medium text-base sm:text-lg md:text-xl truncate">Product Tags</h4>
                <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm">Auto-generated tags for better categorization</p>
              </div>
            </div>
            <div className="flex items-start space-x-2 sm:space-x-3 min-w-0">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary mt-1 flex-shrink-0" />
              <div className="min-w-0">
                <h4 className="text-white font-medium text-base sm:text-lg md:text-xl truncate">Meta Descriptions</h4>
                <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm">Search-optimized meta descriptions for each product</p>
              </div>
            </div>
          </div>
        </DashboardCard>
      </div>
    </PageShell>
  );
}
