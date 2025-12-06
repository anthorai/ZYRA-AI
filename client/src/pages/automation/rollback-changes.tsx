import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  RotateCcw, 
  History,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Calendar,
  User,
  Shield,
  Inbox,
  AlertCircle,
  RefreshCw
} from "lucide-react";

interface VersionHistory {
  id: string;
  productName: string;
  changeDate: string;
  changeType: 'ai-optimization' | 'manual-edit' | 'bulk-import' | 'shopify-sync';
  changedBy: string;
  changes: {
    field: string;
    before: string;
    after: string;
  }[];
  canRollback: boolean;
}

export default function RollbackChanges() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch product history
  const { data: versionHistory = [], isLoading, error, isError } = useQuery<VersionHistory[]>({
    queryKey: ['/api/products/history'],
  });

  // Show toast notification when errors occur
  useEffect(() => {
    if (isError && error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load version history",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  // Rollback mutation
  const rollbackMutation = useMutation({
    mutationFn: async (historyId: string) => {
      return apiRequest("POST", `/api/products/history/rollback/${historyId}`);
    },
    onSuccess: (data: any, historyId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/products/history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      
      const version = versionHistory.find(v => v.id === historyId);
      toast({
        title: "✅ Rollback Complete",
        description: data?.message || `${version?.productName} has been restored to its previous version`,
      });
    },
    onError: (error: any, historyId) => {
      const version = versionHistory.find(v => v.id === historyId);
      toast({
        title: "❌ Rollback Failed",
        description: error?.message || `Failed to rollback ${version?.productName}`,
        variant: "destructive",
      });
    },
  });

  const handleRollback = async (versionId: string) => {
    const version = versionHistory.find(v => v.id === versionId);
    
    toast({
      title: "🔄 Rolling Back Changes",
      description: `Reverting ${version?.productName} to previous version...`,
    });

    rollbackMutation.mutate(versionId);
  };

  const handleBulkRollback = async () => {
    const rollbackableItems = versionHistory.filter(v => v.canRollback);
    
    if (rollbackableItems.length === 0) {
      toast({
        title: "No Items to Rollback",
        description: "There are no rollbackable items in the history",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "🔄 Bulk Rollback Started",
      description: `Rolling back ${rollbackableItems.length} products to previous versions...`,
    });

    // Rollback all items sequentially
    for (const item of rollbackableItems) {
      await rollbackMutation.mutateAsync(item.id);
    }

    toast({
      title: "✅ Bulk Rollback Complete",
      description: `${rollbackableItems.length} products successfully reverted to original copy`,
    });
  };

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'ai-optimization': return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-400" />;
      case 'manual-edit': return <User className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-400" />;
      case 'bulk-import': return <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-400" />;
      case 'shopify-sync': return <Shield className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-orange-400" />;
      default: return <History className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-400" />;
    }
  };

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'ai-optimization': return 'bg-blue-500/20 text-blue-300';
      case 'manual-edit': return 'bg-green-500/20 text-green-300';
      case 'bulk-import': return 'bg-purple-500/20 text-purple-300';
      case 'shopify-sync': return 'bg-orange-500/20 text-orange-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const rollbackableCount = isError ? 0 : versionHistory.filter(v => v.canRollback).length;
  const totalChanges = isError ? 0 : versionHistory.reduce((sum, v) => sum + v.changes.length, 0);

  // Error State
  if (isError) {
    return (
      <PageShell
        title="Rollback Changes"
        subtitle="View and restore previous versions of your product data"
        backTo="/dashboard?tab=automate"
      >
        <DashboardCard testId="error-state">
          <div className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Failed to Load Version History</h3>
            <p className="text-red-400 mb-4">Please try again.</p>
            <Button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/products/history'] })}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-retry"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </DashboardCard>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Rollback Changes"
      subtitle="View and restore previous versions of your product data"
      backTo="/dashboard?tab=automate"
    >
      {/* Summary & Bulk Actions */}
      <DashboardCard
        title="Version History"
        description="View and rollback recent changes to ensure data safety"
        headerAction={
          <Button
            onClick={handleBulkRollback}
            disabled={isLoading || rollbackableCount === 0 || rollbackMutation.isPending}
            className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
            data-testid="button-bulk-rollback"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Rollback All Recent
          </Button>
        }
      >
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="text-center">
                    <Skeleton className="h-10 w-16 mx-auto mb-2" />
                    <Skeleton className="h-4 w-32 mx-auto" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                <div className="text-center" data-testid="stat-recent-changes">
                  <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">{versionHistory.length}</div>
                  <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm">Recent Changes</div>
                </div>
                <div className="text-center" data-testid="stat-can-rollback">
                  <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-2">{rollbackableCount}</div>
                  <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm">Can Rollback</div>
                </div>
                <div className="text-center" data-testid="stat-total-modifications">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-400 mb-2">{totalChanges}</div>
                  <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm">Total Modifications</div>
                </div>
                <div className="text-center" data-testid="stat-retention-period">
                  <div className="text-2xl sm:text-3xl font-bold text-purple-400 mb-2">30d</div>
                  <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm">Retention Period</div>
                </div>
              </div>
            )}
      </DashboardCard>

      {/* Version History List */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white">Recent Changes</h2>
        
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <DashboardCard key={i}>
                <div className="space-y-3">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </DashboardCard>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && versionHistory.length === 0 && (
          <DashboardCard testId="empty-state">
            <div className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-slate-800/50 p-6 mb-4">
                <Inbox className="w-16 h-16 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Version History</h3>
              <p className="text-slate-400 text-center max-w-md">
                Your product changes will appear here once you start optimizing or making updates.
                All changes are automatically tracked for easy rollback.
              </p>
            </div>
          </DashboardCard>
        )}

        {/* Version History Items */}
        {!isLoading && versionHistory.map((version) => (
          <DashboardCard key={version.id}>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getChangeTypeIcon(version.changeType)}
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl text-white truncate min-w-0">{version.productName}</h3>
                    <Badge className={getChangeTypeColor(version.changeType)}>
                      {version.changeType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-[10px] sm:text-xs md:text-sm text-slate-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" />
                        <span className="truncate" data-testid={`date-${version.id}`}>
                          {new Date(version.changeDate).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" />
                        <span className="truncate" data-testid={`changed-by-${version.id}`}>by {version.changedBy}</span>
                      </div>
                    <Badge variant="outline" className="text-xs" data-testid={`changes-count-${version.id}`}>
                      {version.changes.length} changes
                    </Badge>
                  </div>
                </div>
                {version.canRollback ? (
                  <Button
                    onClick={() => handleRollback(version.id)}
                    disabled={rollbackMutation.isPending}
                    className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
                    data-testid={`button-rollback-${version.id}`}
                  >
                    {rollbackMutation.isPending ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Rolling Back...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Rollback
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="flex items-center space-x-2 text-slate-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">Cannot rollback</span>
                  </div>
                )}
              </div>
              <h4 className="text-slate-300 font-medium">Before vs After Comparison</h4>
              {version.changes.map((change, idx) => (
                <div key={idx} className="grid md:grid-cols-2 gap-6 p-4 bg-slate-800/30 rounded-lg">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-red-300 font-medium text-sm">{change.field} - Before</span>
                      </div>
                      <div className="bg-red-900/20 border border-red-400/20 p-3 rounded">
                        <p className="text-slate-300 text-sm">{change.before}</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-green-300 font-medium text-sm">{change.field} - After</span>
                      </div>
                      <div className="bg-green-900/20 border border-green-400/20 p-3 rounded">
                        <p className="text-slate-300 text-sm">{change.after}</p>
                      </div>
                    </div>
                </div>
              ))}
            </div>
          </DashboardCard>
        ))}
      </div>

      {/* Safety Information */}
      <DashboardCard className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-400/20">
        <div className="flex items-start space-x-4">
          <Shield className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-white font-semibold mb-2">Safety & Data Protection</h3>
            <p className="text-slate-300 text-sm">
              All changes are automatically versioned and stored for 30 days. Rollbacks are instant and preserve 
              your data integrity. Critical system changes (like pricing sync) cannot be rolled back for security reasons.
            </p>
          </div>
        </div>
      </DashboardCard>
    </PageShell>
  );
}