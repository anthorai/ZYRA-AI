import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Brain,
  ArrowRight,
  Sparkles,
  Plus,
  Loader2,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  TrendingUp,
  Zap,
  Target,
  DollarSign
} from "lucide-react";

interface BehavioralTrigger {
  id: string;
  name: string;
  description?: string;
  eventType: string;
  conditionType: string;
  conditionValue?: string;
  actionType: string;
  actionConfig?: any;
  isAiRecommended?: boolean;
  aiConfidenceScore?: string;
  aiReasoning?: string;
  status: 'active' | 'paused' | 'draft' | 'archived';
  priority?: number;
  cooldownHours?: number;
  maxTriggersPerCustomer?: number;
  lastFiredAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface AIRecommendation {
  name: string;
  description: string;
  eventType: string;
  conditionType: string;
  conditionValue: string;
  actionType: string;
  confidenceScore: number;
  reasoning: string;
  isAiRecommended?: boolean;
}

interface AnalyticsSummary {
  period: string;
  triggers: {
    total: number;
    active: number;
    paused: number;
    draft: number;
  };
  executions: {
    total: number;
    sent: number;
    clicks: number;
    conversions: number;
  };
  performance: {
    clickRate: number;
    conversionRate: number;
    revenue: number;
    avgRevenuePerTrigger: number;
  };
}

const eventTypeLabels: Record<string, string> = {
  'product_view': 'Product View',
  'cart_add': 'Cart Addition',
  'cart_abandon': 'Cart Abandon',
  'checkout_start': 'Checkout Started',
  'order_placed': 'Order Placed',
  'order_fulfilled': 'Order Fulfilled',
  'page_visit': 'Page Visit',
  'time_on_site': 'Time on Site',
  'return_visit': 'Return Visit',
  'first_purchase': 'First Purchase',
  'repeat_purchase': 'Repeat Purchase',
  'high_value_cart': 'High Value Cart',
  'browse_without_buy': 'Browse Without Buy',
  'wishlist_add': 'Wishlist Add',
  'search_query': 'Search Query'
};

const conditionTypeLabels: Record<string, string> = {
  'count_gte': 'Count >=',
  'count_lte': 'Count <=',
  'value_gte': 'Value >=',
  'value_lte': 'Value <=',
  'time_elapsed': 'Hours After',
  'time_on_site_gte': 'Minutes on Site >=',
  'is_first': 'First Time',
  'is_return': 'Return Customer',
  'no_action': 'No Follow-up Action',
  'segment_match': 'Segment Match'
};

const actionTypeLabels: Record<string, string> = {
  'send_email': 'Send Email',
  'send_sms': 'Send SMS',
  'show_popup': 'Show Popup',
  'offer_discount': 'Offer Discount',
  'assign_tag': 'Assign Tag',
  'add_to_segment': 'Add to Segment',
  'send_push': 'Send Push Notification',
  'trigger_webhook': 'Trigger Webhook'
};

export default function BehavioralTriggersPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [newTrigger, setNewTrigger] = useState({
    name: "",
    event: "",
    condition: "",
    conditionValue: "",
    action: ""
  });

  // Fetch existing triggers
  const { data: triggers = [], isLoading: triggersLoading, refetch: refetchTriggers } = useQuery<BehavioralTrigger[]>({
    queryKey: ['/api/behavioral-triggers']
  });

  // Fetch AI recommendations
  const { data: aiRecommendations = [], isLoading: aiLoading, refetch: refetchAI } = useQuery<AIRecommendation[]>({
    queryKey: ['/api/behavioral-triggers/ai/recommendations'],
    staleTime: 5 * 60 * 1000
  });

  // Fetch analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsSummary>({
    queryKey: ['/api/behavioral-triggers/analytics/summary']
  });

  // Create trigger mutation
  const createTriggerMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/behavioral-triggers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/behavioral-triggers'] });
      toast({
        title: "Trigger Created",
        description: "New behavioral trigger has been created successfully.",
      });
      setNewTrigger({ name: "", event: "", condition: "", conditionValue: "", action: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create trigger",
        variant: "destructive"
      });
    }
  });

  // Toggle trigger status mutation
  const toggleTriggerMutation = useMutation({
    mutationFn: async (triggerId: string) => {
      return apiRequest('POST', `/api/behavioral-triggers/${triggerId}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/behavioral-triggers'] });
      toast({
        title: "Trigger Updated",
        description: "Trigger status has been updated.",
      });
    }
  });

  // Delete trigger mutation
  const deleteTriggerMutation = useMutation({
    mutationFn: async (triggerId: string) => {
      return apiRequest('DELETE', `/api/behavioral-triggers/${triggerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/behavioral-triggers'] });
      toast({
        title: "Trigger Deleted",
        description: "Trigger has been removed.",
      });
    }
  });

  // Apply AI recommendation mutation
  const applyRecommendationMutation = useMutation({
    mutationFn: async (recommendation: AIRecommendation) => {
      return apiRequest('POST', '/api/behavioral-triggers/ai/apply', recommendation);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/behavioral-triggers'] });
      toast({
        title: "Recommendation Applied",
        description: "AI-recommended trigger has been created as a draft.",
      });
    }
  });

  const handleSaveTrigger = () => {
    if (!newTrigger.name || !newTrigger.event || !newTrigger.condition || !newTrigger.action) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    createTriggerMutation.mutate({
      name: newTrigger.name,
      eventType: newTrigger.event,
      conditionType: newTrigger.condition,
      conditionValue: newTrigger.conditionValue || "1",
      actionType: newTrigger.action,
      status: 'draft'
    });
  };

  const activeTriggers = triggers.filter(t => t.status === 'active');
  const pausedTriggers = triggers.filter(t => t.status === 'paused');
  const draftTriggers = triggers.filter(t => t.status === 'draft');

  return (
    <PageShell
      title="Behavioral Triggers"
      subtitle="Set up automated marketing actions based on customer behavior"
      backTo="/dashboard?tab=campaigns"
      rightActions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refetchTriggers();
            refetchAI();
          }}
          className="border-slate-600"
          data-testid="button-refresh-triggers"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      }
    >
      {/* Performance Analytics */}
      <DashboardCard
        title="Trigger Performance"
        testId="card-trigger-performance"
      >
        {analyticsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="text-center p-4 bg-slate-800/30 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Zap className="w-5 h-5 text-primary mr-2" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-primary" data-testid="text-triggers-fired">
                {(analytics?.executions?.total ?? 0).toLocaleString()}
              </div>
              <div className="text-slate-300 text-xs md:text-sm">Triggers Fired</div>
              <div className="text-slate-400 text-xs">this month</div>
            </div>
            <div className="text-center p-4 bg-slate-800/30 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-green-400 mr-2" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-green-400" data-testid="text-conversion-rate">
                {(analytics?.performance?.conversionRate ?? 0).toFixed(1)}%
              </div>
              <div className="text-slate-300 text-xs md:text-sm">Conversion Rate</div>
              <div className="text-slate-400 text-xs">trigger to action</div>
            </div>
            <div className="text-center p-4 bg-slate-800/30 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="w-5 h-5 text-emerald-400 mr-2" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-emerald-400" data-testid="text-revenue">
                ${(analytics?.performance?.revenue ?? 0).toLocaleString()}
              </div>
              <div className="text-slate-300 text-xs md:text-sm">Revenue Generated</div>
              <div className="text-slate-400 text-xs">from triggers</div>
            </div>
            <div className="text-center p-4 bg-slate-800/30 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-cyan-400 mr-2" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-cyan-400" data-testid="text-click-rate">
                {(analytics?.performance?.clickRate ?? 0).toFixed(1)}%
              </div>
              <div className="text-slate-300 text-xs md:text-sm">Click Rate</div>
              <div className="text-slate-400 text-xs">engagement</div>
            </div>
          </div>
        )}
      </DashboardCard>

      {/* Create New Trigger */}
      <DashboardCard
        title="Create New Trigger"
        description="Set up automated actions based on customer behavior"
        testId="card-create-trigger"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-white text-sm block mb-2">Trigger Name</label>
              <Input 
                placeholder="e.g., Welcome Email After First Purchase"
                value={newTrigger.name}
                onChange={(e) => setNewTrigger({...newTrigger, name: e.target.value})}
                className="bg-slate-800/50 border-slate-600 text-white"
                data-testid="input-trigger-name"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-white text-sm block mb-2">Event</label>
              <Select value={newTrigger.event} onValueChange={(value) => setNewTrigger({...newTrigger, event: value})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white" data-testid="select-event">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="product_view">Product View</SelectItem>
                  <SelectItem value="cart_add">Cart Addition</SelectItem>
                  <SelectItem value="cart_abandon">Cart Abandon</SelectItem>
                  <SelectItem value="checkout_start">Checkout Started</SelectItem>
                  <SelectItem value="order_placed">Order Placed</SelectItem>
                  <SelectItem value="first_purchase">First Purchase</SelectItem>
                  <SelectItem value="repeat_purchase">Repeat Purchase</SelectItem>
                  <SelectItem value="high_value_cart">High Value Cart</SelectItem>
                  <SelectItem value="browse_without_buy">Browse Without Buy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-white text-sm block mb-2">Condition</label>
              <Select value={newTrigger.condition} onValueChange={(value) => setNewTrigger({...newTrigger, condition: value})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white" data-testid="select-condition">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="count_gte">Count at least Value</SelectItem>
                  <SelectItem value="value_gte">Amount at least Value</SelectItem>
                  <SelectItem value="time_elapsed">Hours After Event</SelectItem>
                  <SelectItem value="is_first">First Occurrence</SelectItem>
                  <SelectItem value="is_return">Return Customer</SelectItem>
                  <SelectItem value="no_action">No Follow-up Action</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-white text-sm block mb-2">Value</label>
              <Input 
                placeholder="e.g., 3 or 200"
                value={newTrigger.conditionValue}
                onChange={(e) => setNewTrigger({...newTrigger, conditionValue: e.target.value})}
                className="bg-slate-800/50 border-slate-600 text-white"
                data-testid="input-condition-value"
              />
            </div>
            <div>
              <label className="text-white text-sm block mb-2">Action</label>
              <Select value={newTrigger.action} onValueChange={(value) => setNewTrigger({...newTrigger, action: value})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white" data-testid="select-action">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="send_email">Send Email</SelectItem>
                  <SelectItem value="send_sms">Send SMS</SelectItem>
                  <SelectItem value="offer_discount">Offer Discount</SelectItem>
                  <SelectItem value="show_popup">Show Popup</SelectItem>
                  <SelectItem value="assign_tag">Assign Tag</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            onClick={handleSaveTrigger} 
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
            disabled={!newTrigger.name || !newTrigger.event || !newTrigger.condition || !newTrigger.action || createTriggerMutation.isPending}
            data-testid="button-save-trigger"
          >
            {createTriggerMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Create Trigger
          </Button>
        </div>
      </DashboardCard>

      {/* AI Recommended Triggers */}
      <DashboardCard
        title="AI Recommended Triggers"
        description="Based on your store's performance and industry best practices"
        testId="card-ai-recommendations"
        headerAction={
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => refetchAI()}
            disabled={aiLoading}
            data-testid="button-refresh-ai"
          >
            <RefreshCw className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} />
          </Button>
        }
      >
        {aiLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
            <span className="text-slate-300">Generating AI recommendations...</span>
          </div>
        ) : aiRecommendations.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No recommendations available yet.</p>
            <p className="text-sm">Connect your Shopify store to get personalized suggestions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiRecommendations.map((recommendation, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700 hover:border-primary/30 transition-all" data-testid={`card-recommendation-${index}`}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="font-medium text-white text-sm">{recommendation.name}</span>
                      </div>
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full flex-shrink-0">
                        {recommendation.confidenceScore}%
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs line-clamp-2">{recommendation.description}</p>
                    <div className="flex flex-wrap gap-1 text-xs">
                      <span className="bg-slate-700 px-2 py-1 rounded text-slate-300">
                        {eventTypeLabels[recommendation.eventType] || recommendation.eventType}
                      </span>
                      <span className="bg-slate-700 px-2 py-1 rounded text-slate-300">
                        {actionTypeLabels[recommendation.actionType] || recommendation.actionType}
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full bg-primary/20 text-primary hover:bg-primary/30"
                      onClick={() => applyRecommendationMutation.mutate(recommendation)}
                      disabled={applyRecommendationMutation.isPending}
                      data-testid={`button-apply-${index}`}
                    >
                      {applyRecommendationMutation.isPending ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Plus className="w-3 h-3 mr-1" />
                      )}
                      Apply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DashboardCard>

      {/* Active Triggers */}
      <DashboardCard
        title={`Active Triggers (${activeTriggers.length})`}
        description="Currently running behavioral triggers"
        testId="card-active-triggers"
      >
        {triggersLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : activeTriggers.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No active triggers yet.</p>
            <p className="text-sm">Create a trigger above or apply an AI recommendation.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTriggers.map((trigger) => (
              <Card key={trigger.id} className="bg-slate-800/50 border-slate-700 hover:border-green-500/30 transition-all" data-testid={`card-trigger-${trigger.id}`}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-white text-sm flex items-center gap-2">
                          {trigger.name}
                          {trigger.isAiRecommended && (
                            <Sparkles className="w-3 h-3 text-primary" />
                          )}
                        </div>
                        <div className="text-slate-400 text-xs mt-1">
                          {eventTypeLabels[trigger.eventType]} {conditionTypeLabels[trigger.conditionType]} {trigger.conditionValue}
                        </div>
                      </div>
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full flex-shrink-0">
                        Active
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Action: {actionTypeLabels[trigger.actionType]}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                        onClick={() => toggleTriggerMutation.mutate(trigger.id)}
                        disabled={toggleTriggerMutation.isPending}
                        data-testid={`button-pause-${trigger.id}`}
                      >
                        <Pause className="w-3 h-3 mr-1" />
                        Pause
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-red-600/50 text-red-400 hover:bg-red-600/20"
                        onClick={() => deleteTriggerMutation.mutate(trigger.id)}
                        disabled={deleteTriggerMutation.isPending}
                        data-testid={`button-delete-${trigger.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DashboardCard>

      {/* Paused & Draft Triggers */}
      {(pausedTriggers.length > 0 || draftTriggers.length > 0) && (
        <DashboardCard
          title={`Other Triggers (${pausedTriggers.length + draftTriggers.length})`}
          description="Paused and draft triggers"
          testId="card-other-triggers"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...pausedTriggers, ...draftTriggers].map((trigger) => (
              <Card key={trigger.id} className="bg-slate-800/50 border-slate-700" data-testid={`card-trigger-${trigger.id}`}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-white text-sm">{trigger.name}</div>
                        <div className="text-slate-400 text-xs mt-1">
                          {eventTypeLabels[trigger.eventType]} {conditionTypeLabels[trigger.conditionType]} {trigger.conditionValue}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                        trigger.status === 'paused' 
                          ? 'bg-yellow-500/20 text-yellow-400' 
                          : 'bg-slate-600/50 text-slate-400'
                      }`}>
                        {trigger.status === 'paused' ? 'Paused' : 'Draft'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 border-green-600/50 text-green-400 hover:bg-green-600/20"
                        onClick={() => toggleTriggerMutation.mutate(trigger.id)}
                        disabled={toggleTriggerMutation.isPending}
                        data-testid={`button-activate-${trigger.id}`}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Activate
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-red-600/50 text-red-400 hover:bg-red-600/20"
                        onClick={() => deleteTriggerMutation.mutate(trigger.id)}
                        disabled={deleteTriggerMutation.isPending}
                        data-testid={`button-delete-${trigger.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DashboardCard>
      )}
    </PageShell>
  );
}
