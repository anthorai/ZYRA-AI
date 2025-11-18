import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Undo2,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface AutonomousAction {
  id: string;
  actionType: string;
  status: string;
  entityId: string;
  entityType: string;
  reasoning: any;
  result: any;
  createdAt: string;
  completedAt: string | null;
}

export default function ActivityTimeline() {
  const { toast } = useToast();

  // Fetch autonomous actions
  const { data: actions, isLoading } = useQuery<AutonomousAction[]>({
    queryKey: ['/api/autonomous-actions'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Rollback mutation
  const rollback = useMutation({
    mutationFn: async (actionId: string) => {
      return await apiRequest(`/api/autonomous-actions/${actionId}/rollback`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/autonomous-actions'] });
      toast({
        title: "Action rolled back",
        description: "The change has been reverted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Rollback failed",
        description: error.message || "Failed to rollback action",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case 'rolled_back':
        return <Undo2 className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge variant="secondary">Running</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'rolled_back':
        return <Badge variant="secondary" className="bg-orange-500">Rolled Back</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getActionTitle = (action: AutonomousAction) => {
    switch (action.actionType) {
      case 'optimize_seo':
        return 'SEO Optimization';
      case 'fix_product':
        return 'Product Fix';
      case 'send_cart_recovery':
        return 'Cart Recovery Email';
      default:
        return action.actionType;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading activity...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Activity Timeline</h1>
        <p className="text-muted-foreground">
          View all autonomous actions performed by your AI Store Manager
        </p>
      </div>

      {!actions || actions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No activity yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Enable Autopilot in settings to start autonomous optimizations. Your AI will scan your store daily and make improvements automatically.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {actions.map((action) => (
            <Card key={action.id} data-testid={`card-action-${action.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getStatusIcon(action.status)}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        {getActionTitle(action)}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {action.createdAt && formatDistanceToNow(new Date(action.createdAt), { addSuffix: true })}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(action.status)}
                    {action.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`button-rollback-${action.id}`}
                        onClick={() => rollback.mutate(action.id)}
                        disabled={rollback.isPending}
                      >
                        <Undo2 className="w-4 h-4 mr-1" />
                        Rollback
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Reasoning */}
                  {action.reasoning?.reason && (
                    <div>
                      <div className="text-sm font-medium mb-1">Reasoning</div>
                      <div className="text-sm text-muted-foreground">
                        {action.reasoning.reason}
                      </div>
                    </div>
                  )}

                  {/* Result */}
                  {action.result && action.status === 'completed' && (
                    <div>
                      <div className="text-sm font-medium mb-1">Changes Made</div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {action.result.seoTitle && (
                          <div>
                            <span className="font-medium">SEO Title:</span> {action.result.seoTitle}
                          </div>
                        )}
                        {action.result.metaDescription && (
                          <div>
                            <span className="font-medium">Meta Description:</span> {action.result.metaDescription}
                          </div>
                        )}
                        {action.result.seoScore && (
                          <div>
                            <span className="font-medium">SEO Score:</span> {action.result.seoScore}/100
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {action.result?.error && action.status === 'failed' && (
                    <Alert variant="destructive">
                      <AlertDescription className="text-sm">
                        {action.result.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
