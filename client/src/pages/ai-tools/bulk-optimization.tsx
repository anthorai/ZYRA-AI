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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getToolCreditsPerProduct } from "@shared/ai-credits";
import { 
  Package,
  CheckCircle,
  CheckCircle2,
  Clock,
  FileText,
  Zap,
  AlertCircle,
  BarChart3,
  RefreshCw,
  Trash2,
  Play,
  Target,
  Search,
  Loader2,
  Copy,
  Edit,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Upload,
  Save,
  Tag
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

type SectionType = 'seoTitle' | 'metaTitle' | 'metaDescription' | 'keywords';

// SeoSection component for displaying and editing text-based SEO fields
interface SeoSectionProps {
  itemId: string;
  sectionKey: string;
  title: string;
  hint: string;
  value: string;
  originalValue: string;
  isApproved: boolean;
  isApplied: boolean;
  isEditing: boolean;
  onToggleApproved: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onValueChange: (value: string) => void;
  onCopy: (text: string) => void;
  countType: 'words' | 'characters';
  optimalRange: [number, number];
}

function SeoSection({
  itemId,
  sectionKey,
  title,
  hint,
  value,
  originalValue,
  isApproved,
  isApplied,
  isEditing,
  onToggleApproved,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onValueChange,
  onCopy,
  countType,
  optimalRange,
}: SeoSectionProps) {
  const count = countType === 'words' 
    ? value.split(/\s+/).filter(Boolean).length 
    : value.length;
  const [min, max] = optimalRange;
  const isOptimal = count >= min && count <= max;
  const isTooShort = count < min;

  return (
    <div className={`p-4 rounded-lg border ${
      isApplied ? 'border-green-600/50 bg-green-900/10' : 
      isApproved ? 'border-primary/50 bg-primary/5' : 
      'border-slate-700'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={isApproved}
            onCheckedChange={onToggleApproved}
            className={isApplied ? "border-green-500 data-[state=checked]:bg-green-600" : ""}
            data-testid={`checkbox-${sectionKey}-${itemId}`}
          />
          <div>
            <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
              {title}
              {isApplied && <CheckCircle2 className="w-4 h-4 text-green-500" />}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
          </div>
        </div>
        <div className="flex gap-1">
          {!isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy(value)}
                data-testid={`button-copy-${sectionKey}-${itemId}`}
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onStartEdit}
                data-testid={`button-edit-${sectionKey}-${itemId}`}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSaveEdit}
                data-testid={`button-save-${sectionKey}-${itemId}`}
              >
                <Save className="w-4 h-4 text-green-500" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelEdit}
                data-testid={`button-cancel-${sectionKey}-${itemId}`}
              >
                <X className="w-4 h-4 text-red-500" />
              </Button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <Textarea
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className="min-h-[80px] text-white"
          data-testid={`textarea-${sectionKey}-${itemId}`}
        />
      ) : (
        <p className="text-white leading-relaxed" data-testid={`text-${sectionKey}-${itemId}`}>
          {value}
        </p>
      )}

      <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-wrap items-center gap-3 text-xs text-slate-400">
        <span className="font-medium">
          {count} {countType === 'words' ? 'words' : 'characters'}
        </span>
        {isOptimal ? (
          <div className="flex items-center gap-1 text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Optimal length</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-yellow-400">
            <AlertCircle className="w-4 h-4" />
            <span>{isTooShort ? `Too short (need ${min}-${max} ${countType})` : `Too long (need ${min}-${max} ${countType})`}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// KeywordsSection component for displaying and editing keywords/tags
interface KeywordsSectionProps {
  itemId: string;
  keywords: string[];
  originalKeywords: string[];
  isApproved: boolean;
  isApplied: boolean;
  isEditing: boolean;
  onToggleApproved: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onValueChange: (value: string[]) => void;
  onCopy: (text: string) => void;
}

function KeywordsSection({
  itemId,
  keywords,
  originalKeywords,
  isApproved,
  isApplied,
  isEditing,
  onToggleApproved,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onValueChange,
  onCopy,
}: KeywordsSectionProps) {
  const count = keywords.length;
  const isOptimal = count >= 5 && count <= 10;
  const isTooFew = count < 5;

  return (
    <div className={`p-4 rounded-lg border ${
      isApplied ? 'border-green-600/50 bg-green-900/10' : 
      isApproved ? 'border-primary/50 bg-primary/5' : 
      'border-slate-700'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={isApproved}
            onCheckedChange={onToggleApproved}
            className={isApplied ? "border-green-500 data-[state=checked]:bg-green-600" : ""}
            data-testid={`checkbox-keywords-${itemId}`}
          />
          <div>
            <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Keywords / Tags
              {isApplied && <CheckCircle2 className="w-4 h-4 text-green-500" />}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">Golden Formula: 5-10 tags</p>
          </div>
        </div>
        <div className="flex gap-1">
          {!isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy(keywords.join(', '))}
                data-testid={`button-copy-keywords-${itemId}`}
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onStartEdit}
                data-testid={`button-edit-keywords-${itemId}`}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSaveEdit}
                data-testid={`button-save-keywords-${itemId}`}
              >
                <Save className="w-4 h-4 text-green-500" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelEdit}
                data-testid={`button-cancel-keywords-${itemId}`}
              >
                <X className="w-4 h-4 text-red-500" />
              </Button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <Textarea
          value={keywords.join(', ')}
          onChange={(e) => onValueChange(e.target.value.split(',').map(k => k.trim()).filter(Boolean))}
          placeholder="Enter keywords separated by commas"
          className="min-h-[80px] text-white"
          data-testid={`textarea-keywords-${itemId}`}
        />
      ) : (
        <div className="flex flex-wrap gap-2" data-testid={`list-keywords-${itemId}`}>
          {keywords.map((keyword, idx) => (
            <Badge 
              key={idx} 
              className="bg-primary/20 text-primary border-primary/30 px-3 py-1.5 text-sm"
            >
              <Tag className="w-3 h-3 mr-1" />
              {keyword}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-wrap items-center gap-3 text-xs text-slate-400">
        <span className="font-medium">{count} tags</span>
        {isOptimal ? (
          <div className="flex items-center gap-1 text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Optimal count</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-yellow-400">
            <AlertCircle className="w-4 h-4" />
            <span>{isTooFew ? 'Too few (need 5-10 tags)' : 'Too many (need 5-10 tags)'}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BulkOptimization() {
  const { toast } = useToast();
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [viewingJobId, setViewingJobId] = useState<string | null>(null);
  const [optimizationMode, setOptimizationMode] = useState<OptimizationMode>('fast');
  
  // State for detailed results view
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editedValues, setEditedValues] = useState<Record<string, Record<string, string | string[]>>>({});
  const [approvedSections, setApprovedSections] = useState<Record<string, Set<string>>>({});
  const [appliedSections, setAppliedSections] = useState<Record<string, Set<string>>>({});
  const [editingSection, setEditingSection] = useState<{ itemId: string; section: string } | null>(null);
  const [applyingItem, setApplyingItem] = useState<string | null>(null);

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

  // Apply to Shopify mutation
  const applyToShopifyMutation = useMutation({
    mutationFn: async ({ productId, content }: { 
      productId: string;
      content: { 
        seoTitle?: string; 
        metaDescription?: string;
        tags?: string[];
      }
    }) => {
      const response = await apiRequest('POST', `/api/shopify/publish/${productId}`, { content });
      return await response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Applied to Shopify",
        description: "Selected fields have been updated on your Shopify store.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: (error: any) => {
      toast({
        title: "Apply Failed",
        description: error.message || "Failed to apply content to Shopify.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setApplyingItem(null);
    },
  });

  // Helper functions for state management
  const toggleItemExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const getEditedValue = (itemId: string, section: string, originalValue: string | string[] | null) => {
    return editedValues[itemId]?.[section] ?? originalValue;
  };

  const setEditedValueForSection = (itemId: string, section: string, value: string | string[]) => {
    setEditedValues(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [section]: value
      }
    }));
  };

  const startEditing = (itemId: string, section: string) => {
    setEditingSection({ itemId, section });
  };

  const cancelEditing = (itemId: string, section: string) => {
    // Revert to original value by removing from editedValues
    setEditedValues(prev => {
      const newValues = { ...prev };
      if (newValues[itemId]) {
        delete newValues[itemId][section];
        if (Object.keys(newValues[itemId]).length === 0) {
          delete newValues[itemId];
        }
      }
      return newValues;
    });
    setEditingSection(null);
  };

  const saveEditing = () => {
    setEditingSection(null);
    toast({
      title: "Saved",
      description: "Changes saved locally. Apply to Shopify to publish.",
    });
  };

  const toggleSectionApproved = (itemId: string, section: string) => {
    setApprovedSections(prev => {
      const newApproved = { ...prev };
      if (!newApproved[itemId]) {
        newApproved[itemId] = new Set();
      }
      const sectionSet = new Set(newApproved[itemId]);
      if (sectionSet.has(section)) {
        sectionSet.delete(section);
      } else {
        sectionSet.add(section);
      }
      newApproved[itemId] = sectionSet;
      return newApproved;
    });
  };

  const isSectionApproved = (itemId: string, section: string) => {
    return approvedSections[itemId]?.has(section) ?? false;
  };

  const isSectionApplied = (itemId: string, section: string) => {
    return appliedSections[itemId]?.has(section) ?? false;
  };

  const approveAllForItem = (itemId: string) => {
    const sections = ['seoTitle', 'metaTitle', 'metaDescription', 'keywords'];
    setApprovedSections(prev => ({
      ...prev,
      [itemId]: new Set(sections)
    }));
  };

  const approveAllProducts = (items: BulkOptimizationItem[]) => {
    const sections = ['seoTitle', 'metaTitle', 'metaDescription', 'keywords'];
    const newApproved: Record<string, Set<string>> = {};
    items.filter(item => item.status === 'optimized').forEach(item => {
      newApproved[item.id] = new Set(sections);
    });
    setApprovedSections(prev => ({ ...prev, ...newApproved }));
    toast({
      title: "All Products Approved",
      description: `Approved all sections for ${Object.keys(newApproved).length} products.`,
    });
  };

  const handleApplySelectedForItem = async (item: BulkOptimizationItem) => {
    const approved = approvedSections[item.id];
    if (!approved || approved.size === 0) {
      toast({
        title: "No sections approved",
        description: "Please approve at least one section to apply.",
        variant: "destructive",
      });
      return;
    }

    setApplyingItem(item.id);
    
    const content: { seoTitle?: string; metaDescription?: string; tags?: string[] } = {};
    
    // For Shopify, both SEO Title and Meta Title map to the title tag
    // Prioritize Meta Title if approved, otherwise use SEO Title
    if (approved.has('metaTitle')) {
      const metaTitle = getEditedValue(item.id, 'metaTitle', item.metaTitle) as string;
      if (metaTitle) content.seoTitle = metaTitle;
    } else if (approved.has('seoTitle')) {
      const seoTitle = getEditedValue(item.id, 'seoTitle', item.seoTitle) as string;
      if (seoTitle) content.seoTitle = seoTitle;
    }
    
    if (approved.has('metaDescription')) {
      const metaDesc = getEditedValue(item.id, 'metaDescription', item.metaDescription) as string;
      if (metaDesc) content.metaDescription = metaDesc;
    }
    
    if (approved.has('keywords')) {
      const keywords = getEditedValue(item.id, 'keywords', item.keywords) as string[];
      if (keywords && keywords.length > 0) content.tags = keywords;
    }

    try {
      await applyToShopifyMutation.mutateAsync({ productId: item.productId, content });
      
      // Mark sections as applied
      setAppliedSections(prev => ({
        ...prev,
        [item.id]: new Set(approved)
      }));
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

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
        backTo="/dashboard?tab=ai-tools"
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

          {/* Approve All Products Button */}
          {jobDetails.status === 'completed' && jobDetails.items.some(item => item.status === 'optimized') && (
            <div className="flex items-center justify-between gap-4">
              <Button
                onClick={() => approveAllProducts(jobDetails.items)}
                variant="outline"
                data-testid="button-approve-all-products"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve All Products
              </Button>
              <span className="text-sm text-slate-400">
                {jobDetails.items.filter(item => item.status === 'optimized').length} products ready for review
              </span>
            </div>
          )}

          <DashboardCard title="Product Results" testId="card-job-items">
            <div className="space-y-4">
              {jobDetails.items.map((item) => {
                const isExpanded = expandedItems.has(item.id);
                const isOptimized = item.status === 'optimized';
                const allApproved = ['seoTitle', 'metaTitle', 'metaDescription', 'keywords'].every(
                  section => isSectionApproved(item.id, section)
                );
                const someApplied = ['seoTitle', 'metaTitle', 'metaDescription', 'keywords'].some(
                  section => isSectionApplied(item.id, section)
                );

                return (
                  <Collapsible
                    key={item.id}
                    open={isExpanded}
                    onOpenChange={() => toggleItemExpanded(item.id)}
                  >
                    <div
                      className={`rounded-lg border ${
                        someApplied ? 'border-green-600/50 bg-green-900/10' : 
                        allApproved ? 'border-primary/50 bg-primary/5' : 
                        'border-slate-700 bg-slate-800/30'
                      }`}
                      data-testid={`item-${item.id}`}
                    >
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-4 cursor-pointer hover-elevate rounded-lg">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {isOptimized && (
                              <div className={`p-2 rounded-full ${allApproved ? 'bg-primary/20' : 'bg-slate-700'}`}>
                                {allApproved ? (
                                  <CheckCircle2 className="w-5 h-5 text-primary" />
                                ) : (
                                  <FileText className="w-5 h-5 text-slate-400" />
                                )}
                              </div>
                            )}
                            <div className="text-left min-w-0">
                              <div className="font-medium text-white truncate">{item.productName}</div>
                              {item.seoTitle && (
                                <div className="text-sm text-slate-400 mt-0.5 truncate">
                                  {item.seoTitle}
                                </div>
                              )}
                              {item.errorMessage && (
                                <div className="text-sm text-red-400 mt-0.5">{item.errorMessage}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {item.seoScore !== null && (
                              <div className="text-center">
                                <div className={`text-lg font-bold ${
                                  item.seoScore >= 80 ? 'text-green-400' : 
                                  item.seoScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                                }`}>
                                  {item.seoScore}
                                </div>
                                <div className="text-xs text-slate-400">Score</div>
                              </div>
                            )}
                            {getStatusBadge(item.status)}
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        {isOptimized && (
                          <div className="px-4 pb-4 space-y-4 border-t border-slate-700/50">
                            {/* Action Buttons */}
                            <div className="flex items-center justify-between gap-2 pt-4 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  approveAllForItem(item.id);
                                }}
                                data-testid={`button-approve-all-${item.id}`}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Approve All
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApplySelectedForItem(item);
                                }}
                                disabled={applyingItem === item.id || !approvedSections[item.id]?.size}
                                className={someApplied ? "bg-green-600 hover:bg-green-700" : ""}
                                data-testid={`button-apply-selected-${item.id}`}
                              >
                                {applyingItem === item.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Applying...
                                  </>
                                ) : someApplied ? (
                                  <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Applied
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Apply Selected
                                  </>
                                )}
                              </Button>
                            </div>

                            {/* SEO Title Section */}
                            {item.seoTitle && (
                              <SeoSection
                                itemId={item.id}
                                sectionKey="seoTitle"
                                title="SEO Title"
                                hint="Golden Formula: 8-12 words"
                                value={getEditedValue(item.id, 'seoTitle', item.seoTitle) as string}
                                originalValue={item.seoTitle}
                                isApproved={isSectionApproved(item.id, 'seoTitle')}
                                isApplied={isSectionApplied(item.id, 'seoTitle')}
                                isEditing={editingSection?.itemId === item.id && editingSection?.section === 'seoTitle'}
                                onToggleApproved={() => toggleSectionApproved(item.id, 'seoTitle')}
                                onStartEdit={() => startEditing(item.id, 'seoTitle')}
                                onSaveEdit={saveEditing}
                                onCancelEdit={() => cancelEditing(item.id, 'seoTitle')}
                                onValueChange={(val) => setEditedValueForSection(item.id, 'seoTitle', val)}
                                onCopy={(text) => handleCopy(text, 'SEO Title')}
                                countType="words"
                                optimalRange={[8, 12]}
                              />
                            )}

                            {/* Meta Title Section */}
                            {item.metaTitle && (
                              <SeoSection
                                itemId={item.id}
                                sectionKey="metaTitle"
                                title="Meta Title"
                                hint="Golden Formula: 50-60 characters"
                                value={getEditedValue(item.id, 'metaTitle', item.metaTitle) as string}
                                originalValue={item.metaTitle}
                                isApproved={isSectionApproved(item.id, 'metaTitle')}
                                isApplied={isSectionApplied(item.id, 'metaTitle')}
                                isEditing={editingSection?.itemId === item.id && editingSection?.section === 'metaTitle'}
                                onToggleApproved={() => toggleSectionApproved(item.id, 'metaTitle')}
                                onStartEdit={() => startEditing(item.id, 'metaTitle')}
                                onSaveEdit={saveEditing}
                                onCancelEdit={() => cancelEditing(item.id, 'metaTitle')}
                                onValueChange={(val) => setEditedValueForSection(item.id, 'metaTitle', val)}
                                onCopy={(text) => handleCopy(text, 'Meta Title')}
                                countType="characters"
                                optimalRange={[50, 60]}
                              />
                            )}

                            {/* Meta Description Section */}
                            {item.metaDescription && (
                              <SeoSection
                                itemId={item.id}
                                sectionKey="metaDescription"
                                title="Meta Description"
                                hint="Golden Formula: 130-150 characters"
                                value={getEditedValue(item.id, 'metaDescription', item.metaDescription) as string}
                                originalValue={item.metaDescription}
                                isApproved={isSectionApproved(item.id, 'metaDescription')}
                                isApplied={isSectionApplied(item.id, 'metaDescription')}
                                isEditing={editingSection?.itemId === item.id && editingSection?.section === 'metaDescription'}
                                onToggleApproved={() => toggleSectionApproved(item.id, 'metaDescription')}
                                onStartEdit={() => startEditing(item.id, 'metaDescription')}
                                onSaveEdit={saveEditing}
                                onCancelEdit={() => cancelEditing(item.id, 'metaDescription')}
                                onValueChange={(val) => setEditedValueForSection(item.id, 'metaDescription', val)}
                                onCopy={(text) => handleCopy(text, 'Meta Description')}
                                countType="characters"
                                optimalRange={[130, 150]}
                              />
                            )}

                            {/* Keywords Section */}
                            {item.keywords && item.keywords.length > 0 && (
                              <KeywordsSection
                                itemId={item.id}
                                keywords={getEditedValue(item.id, 'keywords', item.keywords) as string[]}
                                originalKeywords={item.keywords}
                                isApproved={isSectionApproved(item.id, 'keywords')}
                                isApplied={isSectionApplied(item.id, 'keywords')}
                                isEditing={editingSection?.itemId === item.id && editingSection?.section === 'keywords'}
                                onToggleApproved={() => toggleSectionApproved(item.id, 'keywords')}
                                onStartEdit={() => startEditing(item.id, 'keywords')}
                                onSaveEdit={saveEditing}
                                onCancelEdit={() => cancelEditing(item.id, 'keywords')}
                                onValueChange={(val) => setEditedValueForSection(item.id, 'keywords', val)}
                                onCopy={(text) => handleCopy(text, 'Keywords')}
                              />
                            )}
                          </div>
                        )}
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
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
      backTo="/dashboard?tab=ai-tools"
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
                {createJobMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating optimization job...
                  </>
                ) : (
                  <>
                    {optimizationMode === 'competitive' ? (
                      <Target className="w-4 h-4 mr-2" />
                    ) : (
                      <Zap className="w-4 h-4 mr-2" />
                    )}
                    Create {optimizationMode === 'competitive' ? 'Competitive' : 'Fast'} Job for {selectedProducts.length} Product{selectedProducts.length > 1 ? 's' : ''} - {selectedProducts.length * getCreditsPerProduct()} credits
                  </>
                )}
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
