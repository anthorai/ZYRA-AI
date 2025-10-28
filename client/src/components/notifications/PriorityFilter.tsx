import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, AlertTriangle, Info, Zap } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { NotificationPreferences } from "@shared/schema";

const priorities = [
  { value: 'low', label: 'All Priorities', description: 'Show everything', icon: Info, color: 'text-blue-400' },
  { value: 'medium', label: 'Medium & Above', description: 'Hide low priority', icon: AlertCircle, color: 'text-yellow-400' },
  { value: 'high', label: 'High Priority', description: 'Important only', icon: AlertTriangle, color: 'text-orange-400' },
  { value: 'urgent', label: 'Urgent Only', description: 'Critical alerts', icon: Zap, color: 'text-red-400' }
];

export default function PriorityFilter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: preferences } = useQuery<NotificationPreferences>({
    queryKey: ['/api/notification-preferences'],
  });

  const [minPriority, setMinPriority] = useState('low');

  useEffect(() => {
    if (preferences?.minPriority) {
      setMinPriority(preferences.minPriority);
    }
  }, [preferences]);

  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: any) => {
      return apiRequest('PUT', '/api/notification-preferences', updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-preferences'] });
      toast({
        title: "Priority Filter Updated",
        description: "Notification priority threshold has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update priority filter",
        variant: "destructive",
      });
    },
  });

  const handlePriorityChange = (value: string) => {
    setMinPriority(value);
    updatePreferencesMutation.mutate({ minPriority: value });
  };

  const selectedPriority = priorities.find(p => p.value === minPriority) || priorities[0];
  const Icon = selectedPriority.icon;

  return (
    <Card className="gradient-card border-0">
      <CardHeader>
        <CardTitle className="text-white">Priority Filter</CardTitle>
        <CardDescription className="text-slate-400">
          Set the minimum priority level for notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-slate-800/30 border border-border/20">
          <Label className="text-white font-medium mb-3 block">Minimum Priority Level</Label>
          <div className="flex items-center gap-3">
            <Icon className={`w-5 h-5 ${selectedPriority.color}`} />
            <Select
              value={minPriority}
              onValueChange={handlePriorityChange}
            >
              <SelectTrigger 
                className="flex-1 bg-slate-800/50 border-border/40"
                data-testid="select-priority"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((priority) => (
                  <SelectItem 
                    key={priority.value} 
                    value={priority.value}
                    data-testid={`option-priority-${priority.value}`}
                  >
                    <div className="flex items-center gap-2">
                      <priority.icon className={`w-4 h-4 ${priority.color}`} />
                      <div>
                        <div className="font-medium">{priority.label}</div>
                        <div className="text-xs text-slate-400">{priority.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Visual Indicator */}
        <div className="grid grid-cols-4 gap-2">
          {priorities.map((priority, index) => {
            const PriorityIcon = priority.icon;
            const isActive = priorities.findIndex(p => p.value === minPriority) <= index;
            
            return (
              <div
                key={priority.value}
                className={`p-3 rounded-lg border transition-all ${
                  isActive 
                    ? 'bg-slate-800/50 border-primary/40' 
                    : 'bg-slate-800/20 border-border/20 opacity-50'
                }`}
                data-testid={`indicator-${priority.value}`}
              >
                <PriorityIcon className={`w-4 h-4 mx-auto mb-1 ${isActive ? priority.color : 'text-slate-600'}`} />
                <div className="text-xs text-center text-slate-400">{priority.value}</div>
              </div>
            );
          })}
        </div>

        <div className="text-sm text-slate-300 bg-slate-800/30 p-3 rounded-lg border border-border/20">
          <span className="font-medium text-white">Current Setting: </span>
          {selectedPriority.description}
        </div>
      </CardContent>
    </Card>
  );
}
