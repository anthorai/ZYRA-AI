/**
 * Product Detail Modal
 * 
 * Shows detailed product intelligence including:
 * - Action History Timeline (read-only memory moat)
 * - Revenue Proof
 * - Rollback capability
 * - Autonomy Control (plan-enforced)
 * 
 * Purpose: Deep trust-building - merchants see every ZYRA decision
 * and its proven impact. Creates switching cost through history.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  History, Shield, Brain, DollarSign, Check, Clock, 
  AlertTriangle, RotateCcw, X, Lock, TrendingUp
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";
import { useStoreCurrency } from "@/hooks/use-store-currency";
import { formatCurrency } from "@/lib/utils";

interface ActionHistoryItem {
  id: string;
  action_type: string;
  action_description: string;
  expected_revenue_impact: string | null;
  actual_revenue_impact: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
}

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  userPlan: string;
}

function ActionTypeIcon({ actionType }: { actionType: string }) {
  const iconClass = "w-4 h-4";
  switch (actionType) {
    case 'seo_optimized':
      return <TrendingUp className={`${iconClass} text-blue-400`} />;
    case 'content_refreshed':
      return <History className={`${iconClass} text-violet-400`} />;
    case 'pricing_adjusted':
      return <DollarSign className={`${iconClass} text-emerald-400`} />;
    default:
      return <Check className={`${iconClass} text-primary`} />;
  }
}

function ActionStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    completed: { label: 'Completed', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    monitoring: { label: 'Monitoring', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    pending: { label: 'Pending', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    rolled_back: { label: 'Rolled Back', className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  };
  
  const { label, className } = config[status] || config.completed;
  
  return (
    <Badge variant="outline" className={`${className} text-xs`}>
      {label}
    </Badge>
  );
}

function ActionHistoryTimeline({ productId, userId, currency }: { productId: string; userId: string; currency: string }) {
  const { data: history, isLoading } = useQuery<ActionHistoryItem[]>({
    queryKey: ['/api/products/actions', productId],
    enabled: !!productId,
  });
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }
  
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8">
        <History className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No ZYRA actions yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Actions will appear here as ZYRA optimizes this product
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
      {history.map((action, index) => {
        const expected = action.expected_revenue_impact ? parseFloat(action.expected_revenue_impact) : null;
        const actual = action.actual_revenue_impact ? parseFloat(action.actual_revenue_impact) : null;
        
        return (
          <div 
            key={action.id}
            className="relative pl-6 pb-3 border-l border-slate-700/50 last:border-l-0"
            data-testid={`action-history-item-${index}`}
          >
            <div className="absolute left-0 top-0 -translate-x-1/2 w-3 h-3 rounded-full bg-slate-800 border-2 border-primary" />
            
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <ActionTypeIcon actionType={action.action_type} />
                <span className="text-sm font-medium text-white">
                  {action.action_description}
                </span>
              </div>
              <ActionStatusBadge status={action.status} />
            </div>
            
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(action.created_at), 'MMM d, yyyy')}
              </span>
              
              {expected !== null && (
                <span>Expected: +{formatCurrency(expected, currency)}</span>
              )}
              
              {actual !== null && (
                <span className="text-emerald-400 font-medium">
                  Actual: +{formatCurrency(actual, currency)}
                </span>
              )}
            </div>
          </div>
        );
      })}
      
      <div className="flex items-center gap-2 pt-3 border-t border-slate-700/50">
        <Lock className="w-4 h-4 text-muted-foreground" />
        <p className="text-xs text-muted-foreground italic">
          This history is locked and cannot be edited or exported. 
          Switching tools resets this learning history.
        </p>
      </div>
    </div>
  );
}

function AutonomyControl({ 
  productId, 
  currentLevel, 
  userPlan 
}: { 
  productId: string; 
  currentLevel: string; 
  userPlan: string; 
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedLevel, setSelectedLevel] = useState(currentLevel);
  
  const normalizedPlan = userPlan?.toLowerCase() || 'trial';
  const isStarterOrTrial = normalizedPlan === 'trial' || normalizedPlan === 'starter' || normalizedPlan === 'starter+';
  const isGrowth = normalizedPlan === 'growth';
  
  const updateMutation = useMutation({
    mutationFn: async (level: string) => {
      const response = await apiRequest("PUT", `/api/product-autonomy/${productId}`, { autonomyLevel: level });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products/intelligence', productId] });
      toast({
        title: "Autonomy updated",
        description: "Product autonomy level has been changed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cannot change autonomy",
        description: error.message || "Your plan doesn't allow this autonomy level.",
        variant: "destructive",
      });
    },
  });
  
  const handleChange = (value: string) => {
    setSelectedLevel(value);
    updateMutation.mutate(value);
  };
  
  return (
    <div className="space-y-4">
      <RadioGroup value={selectedLevel} onValueChange={handleChange} className="space-y-3">
        <div className="flex items-start gap-3">
          <RadioGroupItem 
            value="manual" 
            id="manual" 
            className="mt-1"
            data-testid="radio-autonomy-manual"
          />
          <div className="flex-1">
            <Label htmlFor="manual" className="text-sm font-medium cursor-pointer">
              Manual approval required
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Every ZYRA action requires your approval before execution
            </p>
          </div>
          <Badge variant="outline" className="text-xs">All Plans</Badge>
        </div>
        
        <div className="flex items-start gap-3">
          <RadioGroupItem 
            value="low_risk_auto" 
            id="low_risk_auto" 
            className="mt-1"
            disabled={isStarterOrTrial}
            data-testid="radio-autonomy-low-risk"
          />
          <div className={`flex-1 ${isStarterOrTrial ? 'opacity-50' : ''}`}>
            <Label htmlFor="low_risk_auto" className="text-sm font-medium cursor-pointer">
              Auto-run low-risk actions
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              ZYRA automatically executes safe optimizations, approval for bigger changes
            </p>
          </div>
          <Badge variant="outline" className={`text-xs ${isStarterOrTrial ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : ''}`}>
            {isStarterOrTrial ? 'Growth+' : 'Available'}
          </Badge>
        </div>
        
        <div className="flex items-start gap-3">
          <RadioGroupItem 
            value="full_autonomy" 
            id="full_autonomy" 
            className="mt-1"
            disabled={isStarterOrTrial || isGrowth}
            data-testid="radio-autonomy-full"
          />
          <div className={`flex-1 ${(isStarterOrTrial || isGrowth) ? 'opacity-50' : ''}`}>
            <Label htmlFor="full_autonomy" className="text-sm font-medium cursor-pointer">
              Full autonomy
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              ZYRA runs all optimizations automatically with rollback protection
            </p>
          </div>
          <Badge variant="outline" className={`text-xs ${(isStarterOrTrial || isGrowth) ? 'bg-violet-500/10 text-violet-400 border-violet-500/30' : ''}`}>
            {(isStarterOrTrial || isGrowth) ? 'Scale' : 'Available'}
          </Badge>
        </div>
      </RadioGroup>
      
      {isStarterOrTrial && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-300">
            Upgrade to Growth to unlock partial autonomy and let ZYRA work faster for you.
          </p>
        </div>
      )}
    </div>
  );
}

export function ProductDetailModal({ product, isOpen, onClose, userPlan }: ProductDetailModalProps) {
  const { currency } = useStoreCurrency();
  if (!product) return null;
  
  const { data: intelligence } = useQuery({
    queryKey: ['/api/products/intelligence', product.id],
    enabled: !!product.id && isOpen,
  });
  
  const revenueAdded = (intelligence as any)?.revenueAdded || 0;
  const confidenceIndex = (intelligence as any)?.confidenceIndex || 0;
  const autonomyLevel = (intelligence as any)?.autonomyLevel || 'manual';
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {product.image && (
              <img 
                src={product.image} 
                alt={product.name}
                className="w-10 h-10 rounded-lg object-cover"
              />
            )}
            <div>
              <span data-testid="modal-product-name">{product.name}</span>
              <p className="text-sm font-normal text-muted-foreground mt-0.5">
                {product.category} • {formatCurrency(parseFloat(product.price), currency)}
              </p>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Product intelligence details and ZYRA action history
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Card className="gradient-card border-slate-700/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-400" data-testid="text-total-revenue">
                  +{formatCurrency(revenueAdded, currency)}
                </p>
                <p className="text-xs text-muted-foreground">Revenue by ZYRA</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="gradient-card border-slate-700/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-violet-400" data-testid="text-confidence">
                  {confidenceIndex}%
                </p>
                <p className="text-xs text-muted-foreground">ZYRA Confidence</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="gradient-card border-slate-700/50 mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="w-4 h-4" />
              Action History
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ActionHistoryTimeline productId={product.id} userId={product.userId} currency={currency} />
          </CardContent>
        </Card>
        
        <Card className="gradient-card border-slate-700/50 mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Autonomy Control
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <AutonomyControl 
              productId={product.id} 
              currentLevel={autonomyLevel}
              userPlan={userPlan}
            />
          </CardContent>
        </Card>
        
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose} data-testid="button-close-modal">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
