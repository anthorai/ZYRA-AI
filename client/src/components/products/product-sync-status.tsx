import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { apiRequest } from '@/lib/queryClient';
import { 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SyncStatus {
  connected: boolean;
  syncing: boolean;
  lastSync: string | null;
  productCount: number;
  error: string | null;
}

interface ProductSyncStatusProps {
  variant?: 'compact' | 'full';
  onSyncClick?: () => void;
  isSyncing?: boolean;
}

export function ProductSyncStatus({ 
  variant = 'compact',
  onSyncClick,
  isSyncing = false
}: ProductSyncStatusProps) {
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);

  const { data: syncStatus, refetch } = useQuery({
    queryKey: ['/api/shopify/sync-status'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/shopify/sync-status');
        const data = await response.json();
        return data as SyncStatus;
      } catch (error) {
        return {
          connected: false,
          syncing: false,
          lastSync: null,
          productCount: 0,
          error: 'Failed to fetch sync status'
        };
      }
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Auto-refetch when syncing
  useEffect(() => {
    if (isSyncing || syncStatus?.syncing) {
      setIsAutoSyncing(true);
      const interval = setInterval(() => {
        refetch();
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setIsAutoSyncing(false);
    }
  }, [isSyncing, syncStatus?.syncing, refetch]);

  const getStatusBadge = () => {
    if (isSyncing || syncStatus?.syncing) {
      return (
        <Badge variant="outline" className="border-blue-500/50 bg-blue-500/10 text-blue-400 animate-pulse">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Syncing
        </Badge>
      );
    }

    if (!syncStatus?.connected) {
      return (
        <Badge variant="outline" className="border-red-500/50 bg-red-500/10 text-red-400">
          <XCircle className="w-3 h-3 mr-1" />
          Disconnected
        </Badge>
      );
    }

    if (syncStatus?.error) {
      return (
        <Badge variant="outline" className="border-yellow-500/50 bg-yellow-500/10 text-yellow-400">
          <AlertCircle className="w-3 h-3 mr-1" />
          Error
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-400">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Connected
      </Badge>
    );
  };

  const getLastSyncText = () => {
    if (!syncStatus?.lastSync) return 'Never synced';
    try {
      return formatDistanceToNow(new Date(syncStatus.lastSync), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              {onSyncClick && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onSyncClick}
                  disabled={isSyncing || syncStatus?.syncing}
                >
                  <RefreshCw className={`w-4 h-4 ${(isSyncing || syncStatus?.syncing) ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p className="font-semibold">Shopify Sync</p>
              <p className="text-muted-foreground">Last sync: {getLastSyncText()}</p>
              {syncStatus?.productCount !== undefined && (
                <p className="text-muted-foreground">{syncStatus.productCount} products</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-4 p-4 gradient-card rounded-lg border border-border/50">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          {getStatusBadge()}
          <span className="text-sm text-muted-foreground">Shopify Connection</span>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Last sync: {getLastSyncText()}</span>
          </div>
          {syncStatus?.productCount !== undefined && (
            <div className="flex items-center gap-1">
              <span>{syncStatus.productCount} products synced</span>
            </div>
          )}
        </div>
        
        {syncStatus?.error && (
          <p className="text-xs text-red-400 mt-1">{syncStatus.error}</p>
        )}
      </div>

      {onSyncClick && (
        <Button
          onClick={onSyncClick}
          disabled={isSyncing || syncStatus?.syncing}
          className="gradient-button"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${(isSyncing || syncStatus?.syncing) ? 'animate-spin' : ''}`} />
          {isSyncing || syncStatus?.syncing ? 'Syncing...' : 'Sync Now'}
        </Button>
      )}
    </div>
  );
}
