/**
 * Master Automation Toggle - Global ON/OFF switch for autonomous AI control
 * 
 * When ON (green): AI operates autonomously - makes changes automatically
 * When OFF (gray): Manual mode - AI suggests actions, you approve them
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bot, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export function MasterAutomationToggle() {
  const { toast } = useToast();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingState, setPendingState] = useState<boolean | null>(null);

  // Fetch automation settings
  const { data: settings } = useQuery({
    queryKey: ['/api/automation/settings'],
  });

  const globalEnabled = settings?.globalAutopilotEnabled ?? true;

  // Toggle mutation
  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return await apiRequest('/api/automation/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ globalAutopilotEnabled: enabled })
      });
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pending-approvals'] });
      
      toast({
        title: enabled ? 'Autonomous Mode Enabled' : 'Manual Mode Enabled',
        description: enabled 
          ? 'AI will now operate autonomously and make changes automatically.'
          : 'AI will create recommendations for your approval before making any changes.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update automation mode',
        variant: 'destructive'
      });
    }
  });

  const handleToggle = (checked: boolean) => {
    setPendingState(checked);
    setShowConfirmDialog(true);
  };

  const handleConfirm = () => {
    if (pendingState !== null) {
      toggleMutation.mutate(pendingState);
    }
    setShowConfirmDialog(false);
    setPendingState(null);
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setPendingState(null);
  };

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-3">
        <Badge 
          variant={globalEnabled ? "default" : "secondary"}
          className={`
            flex items-center gap-1.5 px-2 sm:px-3 py-1
            ${globalEnabled 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
              : 'bg-slate-700 text-slate-300 border-slate-600'
            }
          `}
        >
          {globalEnabled ? (
            <>
              <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">Autonomous</span>
            </>
          ) : (
            <>
              <User className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">Manual</span>
            </>
          )}
        </Badge>
        
        <Switch
          checked={globalEnabled}
          onCheckedChange={handleToggle}
          disabled={toggleMutation.isPending}
          className="data-[state=checked]:bg-emerald-600"
          data-testid="switch-global-autopilot"
        />
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Switch to {pendingState ? 'Autonomous' : 'Manual'} Mode?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {pendingState ? (
                <>
                  <p className="font-medium text-foreground">Autonomous Mode:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>AI optimizes products automatically</li>
                    <li>Marketing campaigns sent without approval</li>
                    <li>Cart recovery messages automated</li>
                    <li>Prices adjusted based on competitors</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    Safety limits still apply (max daily actions, quiet hours, etc.)
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-foreground">Manual Mode:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>AI creates recommendations for you to review</li>
                    <li>You approve or reject each action</li>
                    <li>Full control over all changes</li>
                    <li>View pending approvals at any time</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    Perfect when you want more oversight of AI decisions
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Switch to {pendingState ? 'Autonomous' : 'Manual'} Mode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
