import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { ProductSelector } from "@/components/ui/product-selector";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getToolCreditsPerProduct } from "@shared/ai-credits";
import { 
  Package,
  CheckCircle,
  Clock,
  FileText,
  Zap,
  AlertCircle,
  BarChart3,
  RefreshCw,
  Trash2,
  Play,
  Target,
  Search
} from "lucide-react";
import type { Product } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface BulkOptimizationJob {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalItems: number;
  processedItems: number;
  optimizedItems: number;
  failedItems: number;
  skippedItems: number;
  progressPercentage: number;
  totalTokensUsed: number;
  estimatedCost: string;
  createdAt: string;
  completedAt: string | null;
  updatedAt: string;
  errorMessage: string | null;
}

interface BulkOptimizationItem {
  id: string;
  jobId: string;
  productId: string;
  productName: string;
  status: 'pending' | 'processing' | 'optimized' | 'failed' | 'retrying' | 'skipped';
  retryCount: number;
  errorMessage: string | null;
  seoTitle: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string[] | null;
  seoScore: number | null;
  tokensUsed: number | null;
  createdAt: string;
  updatedAt: string;
}

type OptimizationMode = 'fast' | 'competitive';

export default function BulkOptimization() {
  const { toast } = useToast();
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [viewingJobId, setViewingJobId] = useState<string | null>(null);
  const [optimizationMode, setOptimizationMode] = useState<OptimizationMode>('fast');

  // Fetch all jobs
  const { data: jobs = [], isLoading: jobsLoading } = useQuery<BulkOptimizationJob[]>({
    queryKey: ['/api/bulk-optimization'],
    refetchInterval: (query) => {
      // Refetch every 2 seconds if any job is processing
      const hasProcessing = query.state.data?.some((job: BulkOptimizationJob) => job.status === 'processing');
      return hasProcessing ? 2000 : false;
    },
  });

  // Fetch job details with items
  const { data: jobDetails, isLoading: jobDetailsLoading } = useQuery<BulkOptimizationJob & { items: BulkOptimizationItem[] }>({
    queryKey: ['/api/bulk-optimization', viewingJobId],
    enabled: !!viewingJobId,
    refetchInterval: (query) => {
      // Refetch every 2 seconds if job is processing
      return query.state.data?.status === 'processing' ? 2000 : false;
    },
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async ({ productIds, mode }: { productIds: string[]; mode: OptimizationMode }) => {
      return await apiRequest('POST', '/api/bulk-optimization', { productIds, optimizationMode: mode });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/bulk-optimization'] });
      toast({
        title: "Job created successfully",
        description: `Created bulk optimization job for ${selectedProducts.length} products`,
      });
      setSelectedProductIds([]);
      setSelectedProducts([]);
      setViewingJobId(data.id);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create job",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Start job mutation
  const startJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return await apiRequest('POST', `/api/bulk-optimization/${jobId}/start`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bulk-optimization'] });
      toast({
        title: "Job started",
        description: "Bulk optimization is now processing in the background",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to start job",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Retry failed items mutation
  const retryJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return await apiRequest('POST', `/api/bulk-optimization/${jobId}/retry`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bulk-optimization'] });
      toast({
        title: "Retry started",
        description: "Retrying failed items in the background",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to retry",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return await apiRequest('DELETE', `/api/bulk-optimization/${jobId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bulk-optimization'] });
      setViewingJobId(null);
      toast({
        title: "Job deleted",
        description: "Bulk optimization job has been deleted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete job",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleCreateJob = () => {
    if (selectedProductIds.length === 0) {
      toast({
        title: "No products selected",
        description: "Please select at least one product to optimize",
        variant: "destructive",
      });
      return;
    }
    createJobMutation.mutate({ productIds: selectedProductIds, mode: optimizationMode });
  };

  // Calculate credit cost based on mode
  const getCreditsPerProduct = () => {
    return optimizationMode === 'competitive' 
      ? getToolCreditsPerProduct('bulk-optimization-competitive')
      : getToolCreditsPerProduct('bulk-optimization');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: "secondary", icon: Clock, label: "Pending" },
      processing: { variant: "default", icon: Zap, label: "Processing" },
      completed: { variant: "default", icon: CheckCircle, label: "Completed" },
      failed: { variant: "destructive", icon: AlertCircle, label: "Failed" },
      optimized: { variant: "default", icon: CheckCircle, label: "Optimized" },
      retrying: { variant: "secondary", icon: RefreshCw, label: "Retrying" },
      skipped: { variant: "secondary", icon: AlertCircle, label: "Skipped" },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  // If viewing a specific job
  if (viewingJobId && jobDetails) {
    return (
      <PageShell
        title="Bulk Optimization Job"
        subtitle={`Job ID: ${viewingJobId}`}
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setViewingJobId(null)}
              data-testid="button-back-to-jobs"
            >
              ← Back to Jobs
            </Button>
            {jobDetails.status === 'pending' && (
              <Button
                onClick={() => startJobMutation.mutate(viewingJobId)}
                disabled={startJobMutation.isPending}
                data-testid="button-start-job"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Processing
              </Button>
            )}
            {jobDetails.status === 'completed' && jobDetails.failedItems > 0 && (
              <Button
                onClick={() => retryJobMutation.mutate(viewingJobId)}
                disabled={retryJobMutation.isPending}
                data-testid="button-retry-failed"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Failed Items ({jobDetails.failedItems})
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => deleteJobMutation.mutate(viewingJobId)}
              disabled={deleteJobMutation.isPending}
              data-testid="button-delete-job"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Job
            </Button>
          </div>

          <DashboardCard title="Job Progress" testId="card-job-progress">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-300">Status:</span>
                  {getStatusBadge(jobDetails.status)}
                </div>
                <span className="text-sm text-slate-300">
                  {jobDetails.processedItems} / {jobDetails.totalItems} items
                </span>
              </div>
              <Progress value={jobDetails.progressPercentage} className="h-2" />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{jobDetails.optimizedItems}</div>
                  <div className="text-xs text-slate-400">Optimized</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{jobDetails.failedItems}</div>
                  <div className="text-xs text-slate-400">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{jobDetails.totalTokensUsed.toLocaleString()}</div>
                  <div className="text-xs text-slate-400">Tokens Used</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">${parseFloat(jobDetails.estimatedCost).toFixed(4)}</div>
                  <div className="text-xs text-slate-400">Est. Cost</div>
                </div>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="Individual Items" testId="card-job-items">
            <div className="space-y-2">
              {jobDetails.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30 hover-elevate"
                  data-testid={`item-${item.id}`}
                >
                  <div className="flex-1">
                    <div className="font-medium text-white">{item.productName}</div>
                    {item.seoTitle && (
                      <div className="text-sm text-slate-400 mt-1">SEO Title: {item.seoTitle}</div>
                    )}
                    {item.errorMessage && (
                      <div className="text-sm text-red-400 mt-1">Error: {item.errorMessage}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {item.seoScore !== null && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-400">{item.seoScore}</div>
                        <div className="text-xs text-slate-400">Score</div>
                      </div>
                    )}
                    {item.tokensUsed !== null && (
                      <div className="text-sm text-slate-400">{item.tokensUsed} tokens</div>
                    )}
                    {getStatusBadge(item.status)}
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </PageShell>
    );
  }

  // Main jobs list view
  return (
    <PageShell
      title="Bulk Optimization"
      subtitle="Optimize multiple products at once using AI-powered batch processing"
    >
      <div className="space-y-6">
        <DashboardCard
          title="Bulk Processing Workflow"
          description="Three simple steps to optimize your entire product catalog"
          testId="card-workflow"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">1</div>
              <span className="text-slate-300">Select products from your catalog</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">2</div>
              <span className="text-slate-300">AI optimizes descriptions & SEO</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">3</div>
              <span className="text-slate-300">View results and apply changes</span>
            </div>
          </div>
        </DashboardCard>

        {/* Optimization Mode Selector */}
        <DashboardCard
          title="Optimization Mode"
          description="Choose your SEO generation strategy"
          testId="card-optimization-mode"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fast Mode */}
            <div
              className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                optimizationMode === 'fast'
                  ? 'border-primary bg-primary/10'
                  : 'border-slate-700 hover:border-slate-500'
              }`}
              onClick={() => setOptimizationMode('fast')}
              data-testid="mode-fast"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${optimizationMode === 'fast' ? 'bg-primary/20' : 'bg-slate-800'}`}>
                  <Zap className={`w-5 h-5 ${optimizationMode === 'fast' ? 'text-primary' : 'text-slate-400'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">Fast Mode</h3>
                    <Badge variant="secondary" className="text-xs">
                      {getToolCreditsPerProduct('bulk-optimization')} credits/product
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    AI-powered SEO using proven patterns
                  </p>
                </div>
              </div>
              {optimizationMode === 'fast' && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
              )}
            </div>

            {/* Competitive Intelligence Mode */}
            <div
              className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                optimizationMode === 'competitive'
                  ? 'border-primary bg-primary/10'
                  : 'border-slate-700 hover:border-slate-500'
              }`}
              onClick={() => setOptimizationMode('competitive')}
              data-testid="mode-competitive"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${optimizationMode === 'competitive' ? 'bg-primary/20' : 'bg-slate-800'}`}>
                  <Target className={`w-5 h-5 ${optimizationMode === 'competitive' ? 'text-primary' : 'text-slate-400'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">Competitive Intelligence</h3>
                    <Badge variant="secondary" className="text-xs">
                      {getToolCreditsPerProduct('bulk-optimization-competitive')} credits/product
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    Real-time Google SERP analysis + AI
                  </p>
                </div>
              </div>
              {optimizationMode === 'competitive' && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
              )}
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Create New Bulk Optimization Job"
          description="Select products from your catalog to optimize with AI"
          testId="card-create-job"
        >
          <div className="space-y-3">
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
              <Button
                onClick={handleCreateJob}
                disabled={createJobMutation.isPending}
                className="w-full"
                data-testid="button-create-job"
              >
                {optimizationMode === 'competitive' ? (
                  <Target className="w-4 h-4 mr-2" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Create {optimizationMode === 'competitive' ? 'Competitive' : 'Fast'} Job for {selectedProducts.length} Product{selectedProducts.length > 1 ? 's' : ''} - {selectedProducts.length * getCreditsPerProduct()} credits
              </Button>
            )}
          </div>
        </DashboardCard>

        <DashboardCard
          title="Your Bulk Optimization Jobs"
          description="View and manage your bulk optimization jobs"
          testId="card-jobs-list"
        >
          {jobsLoading ? (
            <div className="text-center py-8 text-slate-400">Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No bulk optimization jobs yet. Create one above to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30 hover-elevate cursor-pointer"
                  onClick={() => setViewingJobId(job.id)}
                  data-testid={`job-${job.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-white">{job.totalItems} Products</span>
                      {getStatusBadge(job.status)}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      Created: {new Date(job.createdAt).toLocaleString()}
                    </div>
                    {job.status === 'processing' && (
                      <Progress value={job.progressPercentage} className="h-1 mt-2" />
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-sm">
                      <span className="text-green-400">{job.optimizedItems} optimized</span>
                      {job.failedItems > 0 && (
                        <span className="text-red-400 ml-2">{job.failedItems} failed</span>
                      )}
                    </div>
                    {job.status === 'completed' && (
                      <div className="text-xs text-slate-400">
                        ${parseFloat(job.estimatedCost).toFixed(4)} • {job.totalTokensUsed.toLocaleString()} tokens
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardCard>

        <DashboardCard
          title="What Gets Optimized"
          description="AI-powered enhancements for your entire product catalog"
          testId="card-features"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-slate-800/30 hover-elevate transition-all">
              <div className="p-3 rounded-full bg-primary/10 mb-3">
                <FileText className="w-6 h-6 text-primary flex-shrink-0" />
              </div>
              <h4 className="text-white font-semibold text-base mb-2">Product Descriptions</h4>
              <p className="text-slate-400 text-sm leading-relaxed">AI rewrites descriptions for better engagement and SEO</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-slate-800/30 hover-elevate transition-all">
              <div className="p-3 rounded-full bg-primary/10 mb-3">
                <Zap className="w-6 h-6 text-primary flex-shrink-0" />
              </div>
              <h4 className="text-white font-semibold text-base mb-2">SEO Titles</h4>
              <p className="text-slate-400 text-sm leading-relaxed">Keyword-rich titles optimized for search rankings</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-slate-800/30 hover-elevate transition-all">
              <div className="p-3 rounded-full bg-primary/10 mb-3">
                <Package className="w-6 h-6 text-primary flex-shrink-0" />
              </div>
              <h4 className="text-white font-semibold text-base mb-2">Keywords</h4>
              <p className="text-slate-400 text-sm leading-relaxed">Auto-generated keywords for better categorization</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-slate-800/30 hover-elevate transition-all">
              <div className="p-3 rounded-full bg-primary/10 mb-3">
                <BarChart3 className="w-6 h-6 text-primary flex-shrink-0" />
              </div>
              <h4 className="text-white font-semibold text-base mb-2">Meta Descriptions</h4>
              <p className="text-slate-400 text-sm leading-relaxed">Search-optimized meta descriptions for each product</p>
            </div>
          </div>
        </DashboardCard>
      </div>
    </PageShell>
  );
}
