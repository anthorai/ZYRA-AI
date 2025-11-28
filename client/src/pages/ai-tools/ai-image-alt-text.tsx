import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { getToolCredits } from "@shared/ai-credits";
import { 
  Image as ImageIcon,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  ExternalLink,
  RefreshCw,
  Zap
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";

interface Product {
  id: string;
  name: string;
  shopifyId?: string;
}

interface BulkImageJob {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalProducts: number;
  totalImages: number;
  processedImages: number;
  optimizedImages: number;
  failedImages: number;
  missingImageProducts: number;
  progressPercentage: number;
  totalTokensUsed: number;
  estimatedCost: string;
  createdAt: string;
  completedAt?: string;
}

interface ProductImageInfo {
  productId: string;
  productName: string;
  shopifyProductId?: string;
  images: Array<{
    id: string;
    url: string;
    alt?: string;
    position: number;
  }>;
  hasImages: boolean;
  imageCount: number;
}

interface ImageOptimizationHistory {
  id: string;
  productName: string;
  imageUrl: string;
  oldAltText: string | null;
  newAltText: string;
  appliedToShopify: boolean;
  createdAt: string;
  aiAnalysis: {
    objects: string[];
    colors: string[];
    style: string;
    useCase: string;
    keywords: string[];
  };
}

export default function AIImageAltText() {
  const { toast } = useToast();
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [currentJob, setCurrentJob] = useState<BulkImageJob | null>(null);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);

  // Fetch user's products
  const { data: products = [], isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Fetch image optimization jobs
  const { data: jobs = [], refetch: refetchJobs } = useQuery<BulkImageJob[]>({
    queryKey: ['/api/image-optimization/jobs'],
  });

  // Fetch optimization history
  const { data: history = [], refetch: refetchHistory } = useQuery<ImageOptimizationHistory[]>({
    queryKey: ['/api/image-optimization/history'],
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async (productIds: string[]) => {
      const response = await fetch('/api/image-optimization/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productIds }),
      });
      if (!response.ok) throw new Error('Failed to create job');
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Job Created!",
        description: `Processing ${data.job.totalImages} images from ${data.job.totalProducts} products`,
      });
      setCurrentJob(data.job);
      setShowProductSelector(false);
      queryClient.invalidateQueries({ queryKey: ['/api/image-optimization/jobs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create job",
        description: error.message || "Unable to create optimization job",
        variant: "destructive",
      });
    },
  });

  // Process job mutation
  const processJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await fetch(`/api/image-optimization/jobs/${jobId}/process`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to process job');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Processing Started!",
        description: "AI is now analyzing your product images",
      });
      // Poll for updates
      const interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/image-optimization/jobs'] });
        queryClient.invalidateQueries({ queryKey: ['/api/image-optimization/history'] });
      }, 5000);
      
      setTimeout(() => clearInterval(interval), 60000); // Stop after 1 minute
    },
    onError: (error: any) => {
      toast({
        title: "Failed to process job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Apply to Shopify mutation
  const applyToShopifyMutation = useMutation({
    mutationFn: async (historyIds: string[]) => {
      const response = await fetch('/api/image-optimization/apply-to-shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ historyIds }),
      });
      if (!response.ok) throw new Error('Failed to apply changes');
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Applied to Shopify!",
        description: `Successfully updated ${data.applied} image alt-texts`,
      });
      setSelectedHistoryIds([]);
      refetchHistory();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to apply changes",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateJob = () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "No products selected",
        description: "Please select at least one product",
        variant: "destructive",
      });
      return;
    }
    createJobMutation.mutate(selectedProducts);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleHistorySelection = (historyId: string) => {
    setSelectedHistoryIds(prev => 
      prev.includes(historyId) 
        ? prev.filter(id => id !== historyId)
        : [...prev, historyId]
    );
  };

  const latestJob = jobs[0];
  const pendingOptimizations = history.filter((h: ImageOptimizationHistory) => !h.appliedToShopify);

  return (
    <PageShell
      title="AI Image Alt-Text Optimization"
      subtitle="Automatically generate SEO-optimized alt-text for all your product images using AI Vision"
    >
      {/* Overview Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <DashboardCard
          title="Total Images Optimized"
          description="Across all jobs"
          testId="card-total-optimized"
        >
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-white">
              {jobs.reduce((sum: number, job: BulkImageJob) => sum + job.optimizedImages, 0)}
            </div>
            <ImageIcon className="w-10 h-10 text-primary" />
          </div>
        </DashboardCard>

        <DashboardCard
          title="Pending Optimizations"
          description="Ready to apply to Shopify"
          testId="card-pending"
        >
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-white">
              {pendingOptimizations.length}
            </div>
            <Clock className="w-10 h-10 text-yellow-400" />
          </div>
        </DashboardCard>

        <DashboardCard
          title="Active Jobs"
          description="Currently processing"
          testId="card-active-jobs"
        >
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-white">
              {jobs.filter((j: BulkImageJob) => j.status === 'processing').length}
            </div>
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
        </DashboardCard>
      </div>

      {/* Create New Job */}
      <DashboardCard
        title="Create Optimization Job"
        description="Select products to optimize their image alt-texts"
      >
        <div className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
              <span className="text-slate-300">Select products</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
              <span className="text-slate-300">AI analyzes images</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
              <span className="text-slate-300">Generate alt-texts</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">4</div>
              <span className="text-slate-300">Apply to Shopify</span>
            </div>
          </div>

          <Button
            onClick={() => setShowProductSelector(true)}
            className="w-full gradient-button"
            disabled={loadingProducts}
            data-testid="button-select-products"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Select Products & Start Optimization - {getToolCredits('image-alt-text')} credit/image
          </Button>
        </div>
      </DashboardCard>

      {/* Latest Job Status */}
      {latestJob && (
        <DashboardCard
          title="Latest Job"
          description={`Created ${new Date(latestJob.createdAt).toLocaleDateString()}`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{latestJob.name}</h3>
                <p className="text-sm text-slate-400">
                  {latestJob.totalImages} images from {latestJob.totalProducts} products
                </p>
              </div>
              <Badge variant={latestJob.status === 'completed' ? 'default' : 'secondary'}>
                {latestJob.status}
              </Badge>
            </div>

            {latestJob.status === 'processing' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Progress</span>
                  <span className="text-white">{latestJob.progressPercentage}%</span>
                </div>
                <Progress value={latestJob.progressPercentage} />
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Processed</p>
                <p className="text-white font-semibold">{latestJob.processedImages}</p>
              </div>
              <div>
                <p className="text-slate-400">Optimized</p>
                <p className="text-green-400 font-semibold">{latestJob.optimizedImages}</p>
              </div>
              <div>
                <p className="text-slate-400">Failed</p>
                <p className="text-red-400 font-semibold">{latestJob.failedImages}</p>
              </div>
            </div>

            {latestJob.status === 'pending' && (
              <Button
                onClick={() => processJobMutation.mutate(latestJob.id)}
                disabled={processJobMutation.isPending}
                className="w-full"
                data-testid="button-start-processing"
              >
                <Zap className="w-4 h-4 mr-2" />
                Start AI Processing
              </Button>
            )}
          </div>
        </DashboardCard>
      )}

      {/* Optimization History */}
      {history.length > 0 && (
        <DashboardCard
          title="Optimization History"
          description="Recently optimized images"
        >
          <div className="space-y-4">
            {pendingOptimizations.length > 0 && (
              <Button
                onClick={() => applyToShopifyMutation.mutate(selectedHistoryIds)}
                disabled={selectedHistoryIds.length === 0 || applyToShopifyMutation.isPending}
                className="w-full"
                data-testid="button-apply-shopify"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Apply {selectedHistoryIds.length} Selected to Shopify
              </Button>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.slice(0, 10).map((item) => (
                <Card key={item.id} className="p-4 hover-elevate">
                  <div className="flex items-start space-x-4">
                    <Checkbox
                      checked={selectedHistoryIds.includes(item.id)}
                      onCheckedChange={() => toggleHistorySelection(item.id)}
                      disabled={item.appliedToShopify}
                      data-testid={`checkbox-history-${item.id}`}
                    />
                    
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-white">{item.productName}</h4>
                        {item.appliedToShopify && (
                          <Badge variant="default">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Applied
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="text-slate-400">Old:</span>
                          <span className="text-slate-300 ml-2">
                            {item.oldAltText || "None"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">New:</span>
                          <span className="text-white ml-2 font-medium">
                            {item.newAltText}
                          </span>
                        </div>
                      </div>

                      {item.aiAnalysis && (
                        <div className="flex flex-wrap gap-1">
                          {item.aiAnalysis.keywords.slice(0, 3).map((keyword: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </DashboardCard>
      )}

      {/* Product Selection Dialog */}
      <Dialog open={showProductSelector} onOpenChange={setShowProductSelector}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Products</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-400">
                {selectedProducts.length} of {products.length} products selected
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (selectedProducts.length === products.length) {
                    setSelectedProducts([]);
                  } else {
                    setSelectedProducts(products.map((p: Product) => p.id));
                  }
                }}
                data-testid="button-select-all"
              >
                {selectedProducts.length === products.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <div className="space-y-2">
              {products.map((product: Product) => (
                <Card
                  key={product.id}
                  className="p-3 cursor-pointer hover-elevate"
                  onClick={() => toggleProductSelection(product.id)}
                  data-testid={`product-${product.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() => toggleProductSelection(product.id)}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-white">{product.name}</p>
                      {!product.shopifyId && (
                        <Badge variant="destructive" className="text-xs mt-1">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Not linked to Shopify
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Button
              onClick={handleCreateJob}
              disabled={selectedProducts.length === 0 || createJobMutation.isPending}
              className="w-full gradient-button"
              data-testid="button-create-job"
            >
              {createJobMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating Job...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Optimization Job
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
