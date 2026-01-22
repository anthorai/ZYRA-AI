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
import { Bot, User, Settings, Coins } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useEffect } from "react";

interface AutomationSettings {
  globalAutopilotEnabled?: boolean;
  autopilotEnabled?: boolean;
  autonomousCreditLimit?: number;
  maxDailyActions?: number;
}

export function MasterAutomationToggle() {
  const { toast } = useToast();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingState, setPendingState] = useState<boolean | null>(null);
  const [creditLimit, setCreditLimit] = useState<number | undefined>(undefined);
  const [showSettings, setShowSettings] = useState(false);

  // Fetch automation settings
  const { data: settings } = useQuery<AutomationSettings>({
    queryKey: ['/api/automation/settings'],
  });

  const globalEnabled = settings?.globalAutopilotEnabled ?? true;
  const currentCreditLimit = settings?.autonomousCreditLimit ?? 100;

  // Initialize credit limit from settings
  useEffect(() => {
    if (creditLimit === undefined && settings?.autonomousCreditLimit) {
      setCreditLimit(settings.autonomousCreditLimit);
    }
  }, [settings?.autonomousCreditLimit, creditLimit]);

  // Toggle mutation
  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await apiRequest('PUT', '/api/automation/settings', { 
        globalAutopilotEnabled: enabled 
      });
      return response.json();
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

  // Credit limit mutation
  const creditLimitMutation = useMutation({
    mutationFn: async (limit: number) => {
      const response = await apiRequest('PUT', '/api/automation/settings', { 
        autonomousCreditLimit: limit 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/settings'] });
      setShowSettings(false);
      
      toast({
        title: 'Credit Limit Updated',
        description: `Autonomous mode credit limit set to ${creditLimit} credits per day.`,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update credit limit',
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

  const handleSaveCreditLimit = () => {
    if (creditLimit && creditLimit >= 1 && creditLimit <= 1000) {
      creditLimitMutation.mutate(creditLimit);
    } else {
      toast({
        title: 'Invalid Credit Limit',
        description: 'Please enter a value between 1 and 1000.',
        variant: 'destructive'
      });
    }
  };

  return (
    <>
      <Switch
        checked={globalEnabled}
        onCheckedChange={handleToggle}
        disabled={toggleMutation.isPending}
        className="data-[state=checked]:bg-emerald-600 scale-90 sm:scale-100"
        data-testid="switch-global-autopilot"
      />

      <Popover open={showSettings} onOpenChange={setShowSettings}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="hidden sm:flex h-8 w-8 sm:h-9 sm:w-9"
            data-testid="button-autonomous-settings"
          >
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="end">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Coins className="h-4 w-4" />
                Autonomous Credit Limit
              </h4>
              <p className="text-xs text-muted-foreground">
                Maximum credits that autonomous mode can use per day. This helps control costs while AI works automatically.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="credit-limit" className="text-xs">
                Daily credit limit (1-1000)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="credit-limit"
                  type="number"
                  min={1}
                  max={1000}
                  value={creditLimit ?? currentCreditLimit}
                  onChange={(e) => setCreditLimit(parseInt(e.target.value) || 0)}
                  className="bg-background"
                  data-testid="input-credit-limit"
                />
                <Button 
                  onClick={handleSaveCreditLimit}
                  disabled={creditLimitMutation.isPending}
                  data-testid="button-save-credit-limit"
                >
                  {creditLimitMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Current: {currentCreditLimit} credits/day
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>

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
                    Safety limits still apply (max {currentCreditLimit} credits/day, quiet hours, etc.)
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
