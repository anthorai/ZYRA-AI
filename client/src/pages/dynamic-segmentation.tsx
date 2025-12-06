import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Users,
  Crown,
  ShoppingCart,
  Percent,
  Clock,
  Heart,
  Star,
  AlertTriangle,
  Sparkles,
  Plus,
  RefreshCw,
  Trash2,
  Eye,
  Loader2,
  TrendingUp,
  UserCheck,
  Zap
} from "lucide-react";

interface CustomerSegment {
  id: string;
  name: string;
  description: string | null;
  segmentType: string;
  rules: any;
  color: string | null;
  icon: string | null;
  memberCount: number | null;
  isActive: boolean | null;
  isSystem: boolean | null;
  isAiGenerated: boolean | null;
  lastCalculatedAt: string | null;
}

interface SegmentMember {
  id: string;
  customerEmail: string;
  customerName: string | null;
  totalOrders: number | null;
  totalSpent: string | null;
  avgOrderValue: string | null;
  lastOrderDate: string | null;
  daysInactive: number | null;
}

interface AISuggestion {
  name: string;
  segmentType: string;
  description: string;
  rules: any;
  estimatedCount: number;
  color: string;
  icon: string;
}

interface AnalyticsSummary {
  totalCustomers: number;
  totalSegments: number;
  segmentedCustomers: number;
  coveragePercent: number;
  segments: { id: string; name: string; memberCount: number; segmentType: string; color: string }[];
}

const iconMap: Record<string, any> = {
  users: Users,
  crown: Crown,
  "shopping-cart": ShoppingCart,
  percent: Percent,
  clock: Clock,
  heart: Heart,
  star: Star,
  "alert-triangle": AlertTriangle
};

const segmentTypeLabels: Record<string, string> = {
  high_spenders: "High Spenders",
  first_timers: "First-Time Buyers",
  loyal_buyers: "Loyal Customers",
  discount_seekers: "Discount Seekers",
  dormant: "Dormant",
  cart_abandoners: "Cart Abandoners",
  vip: "VIP",
  at_risk: "At Risk",
  new_subscribers: "New Subscribers",
  custom: "Custom"
};

export default function DynamicSegmentationPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedSegment, setSelectedSegment] = useState<CustomerSegment | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSegment, setNewSegment] = useState({
    name: "",
    description: "",
    segmentType: "custom",
    field: "totalSpent",
    operator: "gte",
    value: ""
  });

  // Fetch segments
  const { data: segments = [], isLoading: segmentsLoading, refetch: refetchSegments } = useQuery<CustomerSegment[]>({
    queryKey: ['/api/segments']
  });

  // Fetch analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsSummary>({
    queryKey: ['/api/segments/analytics/summary']
  });

  // Fetch segment members when viewing
  const { data: members = [], isLoading: membersLoading } = useQuery<SegmentMember[]>({
    queryKey: [`/api/segments/${selectedSegment?.id}/members`],
    enabled: !!selectedSegment && showMembers
  });

  // AI analyze mutation
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/segments/ai/analyze');
    },
    onSuccess: async (response) => {
      const data = await response.json();
      if (data.segments && data.segments.length > 0) {
        setAiSuggestions(data.segments);
        toast({
          title: "AI Analysis Complete",
          description: `Found ${data.segments.length} suggested segments from ${data.customerCount} customers.`,
        });
      } else {
        toast({
          title: "No Data",
          description: data.message || "Connect your Shopify store first to analyze customers.",
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze customers",
        variant: "destructive"
      });
    }
  });

  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);

  // Apply AI suggestion mutation
  const applySuggestionMutation = useMutation({
    mutationFn: async (suggestion: AISuggestion) => {
      return apiRequest('POST', '/api/segments/ai/apply', suggestion);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/segments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/segments/analytics/summary'] });
      toast({
        title: "Segment Created",
        description: "AI-suggested segment has been created and populated.",
      });
    }
  });

  // Create segment mutation
  const createSegmentMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/segments', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/segments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/segments/analytics/summary'] });
      toast({
        title: "Segment Created",
        description: "New segment has been created successfully.",
      });
      setShowCreateDialog(false);
      setNewSegment({ name: "", description: "", segmentType: "custom", field: "totalSpent", operator: "gte", value: "" });
    }
  });

  // Delete segment mutation
  const deleteSegmentMutation = useMutation({
    mutationFn: async (segmentId: string) => {
      return apiRequest('DELETE', `/api/segments/${segmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/segments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/segments/analytics/summary'] });
      toast({
        title: "Segment Deleted",
        description: "Segment has been removed.",
      });
    }
  });

  // Recalculate segment mutation
  const recalculateMutation = useMutation({
    mutationFn: async (segmentId: string) => {
      return apiRequest('POST', `/api/segments/${segmentId}/recalculate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/segments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/segments/analytics/summary'] });
      toast({
        title: "Segment Updated",
        description: "Segment members have been recalculated.",
      });
    }
  });

  // Seed defaults mutation
  const seedDefaultsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/segments/seed-defaults');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/segments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/segments/analytics/summary'] });
      toast({
        title: "Segments Created",
        description: "Default customer segments have been created.",
      });
    }
  });

  const handleCreateSegment = () => {
    if (!newSegment.name || !newSegment.value) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    createSegmentMutation.mutate({
      name: newSegment.name,
      description: newSegment.description,
      segmentType: newSegment.segmentType,
      rules: {
        field: newSegment.field,
        operator: newSegment.operator,
        value: parseFloat(newSegment.value)
      },
      color: "#3b82f6",
      icon: "users"
    });
  };

  const getIcon = (iconName: string | null) => {
    const Icon = iconMap[iconName || 'users'] || Users;
    return Icon;
  };

  return (
    <PageShell
      title="Dynamic Segmentation"
      subtitle="AI-powered customer segmentation based on real purchase behavior"
      backTo="/campaigns"
      rightActions={
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchSegments()}
            className="border-slate-600"
            data-testid="button-refresh-segments"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
            className="bg-gradient-to-r from-purple-600 to-cyan-600"
            data-testid="button-ai-analyze"
          >
            {analyzeMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            AI Analyze
          </Button>
        </div>
      }
    >
      {/* Analytics Overview */}
      <DashboardCard
        title="Segmentation Overview"
        testId="card-segmentation-overview"
      >
        {analyticsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="text-center p-4 bg-slate-800/30 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-primary mr-2" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-primary" data-testid="text-total-customers">
                {(analytics?.totalCustomers ?? 0).toLocaleString()}
              </div>
              <div className="text-slate-300 text-xs md:text-sm">Total Customers</div>
            </div>
            <div className="text-center p-4 bg-slate-800/30 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Zap className="w-5 h-5 text-cyan-400 mr-2" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-cyan-400" data-testid="text-total-segments">
                {analytics?.totalSegments ?? 0}
              </div>
              <div className="text-slate-300 text-xs md:text-sm">Active Segments</div>
            </div>
            <div className="text-center p-4 bg-slate-800/30 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <UserCheck className="w-5 h-5 text-green-400 mr-2" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-green-400" data-testid="text-segmented-customers">
                {(analytics?.segmentedCustomers ?? 0).toLocaleString()}
              </div>
              <div className="text-slate-300 text-xs md:text-sm">Segmented</div>
            </div>
            <div className="text-center p-4 bg-slate-800/30 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-purple-400 mr-2" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-purple-400" data-testid="text-coverage">
                {analytics?.coveragePercent ?? 0}%
              </div>
              <div className="text-slate-300 text-xs md:text-sm">Coverage</div>
            </div>
          </div>
        )}
      </DashboardCard>

      {/* AI Suggestions */}
      {aiSuggestions.length > 0 && (
        <DashboardCard
          title="AI-Suggested Segments"
          description="Based on your customer data analysis"
          testId="card-ai-suggestions"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiSuggestions.map((suggestion, index) => {
              const Icon = getIcon(suggestion.icon);
              return (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-slate-700 bg-slate-800/30 hover:border-cyan-500/50 transition-colors"
                  data-testid={`card-suggestion-${index}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div 
                        className="p-2 rounded-lg shrink-0"
                        style={{ backgroundColor: `${suggestion.color}20` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: suggestion.color }} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-white truncate">{suggestion.name}</h4>
                        <Badge variant="outline" className="text-xs mt-1">
                          {segmentTypeLabels[suggestion.segmentType] || suggestion.segmentType}
                        </Badge>
                      </div>
                    </div>
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 shrink-0">
                      AI
                    </Badge>
                  </div>
                  <p className="text-slate-400 text-sm mb-3">{suggestion.description}</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 text-sm">
                      ~{suggestion.estimatedCount} customers
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => applySuggestionMutation.mutate(suggestion)}
                      disabled={applySuggestionMutation.isPending}
                      className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                      data-testid={`button-apply-suggestion-${index}`}
                    >
                      {applySuggestionMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-1" />
                          Apply
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </DashboardCard>
      )}

      {/* Active Segments */}
      <DashboardCard
        title="Customer Segments"
        description="Manage your customer segments"
        testId="card-customer-segments"
        headerAction={
          <div className="flex gap-2 flex-wrap">
            {segments.length === 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => seedDefaultsMutation.mutate()}
                disabled={seedDefaultsMutation.isPending}
                className="border-slate-600"
                data-testid="button-seed-defaults"
              >
                {seedDefaultsMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Create Defaults
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setShowCreateDialog(true)}
              className="bg-primary"
              data-testid="button-create-segment"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Segment
            </Button>
          </div>
        }
      >
        {segmentsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : segments.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Segments Yet</h3>
            <p className="text-slate-400 mb-4">
              Create customer segments to organize and target your audience effectively.
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <Button
                variant="outline"
                onClick={() => seedDefaultsMutation.mutate()}
                disabled={seedDefaultsMutation.isPending}
                className="border-slate-600"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Create Default Segments
              </Button>
              <Button
                onClick={() => analyzeMutation.mutate()}
                disabled={analyzeMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-cyan-600"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Analyze Customers
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {segments.map((segment) => {
              const Icon = getIcon(segment.icon);
              return (
                <div
                  key={segment.id}
                  className="p-4 rounded-lg border border-slate-700 bg-slate-800/30 hover:border-primary/50 transition-colors"
                  data-testid={`card-segment-${segment.id}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div 
                        className="p-2 rounded-lg shrink-0"
                        style={{ backgroundColor: `${segment.color || '#3b82f6'}20` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: segment.color || '#3b82f6' }} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-white truncate">{segment.name}</h4>
                        <Badge variant="outline" className="text-xs mt-1">
                          {segmentTypeLabels[segment.segmentType] || segment.segmentType}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {segment.isAiGenerated && (
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                          AI
                        </Badge>
                      )}
                      {segment.isSystem && (
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                          System
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {segment.description && (
                    <p className="text-slate-400 text-sm mb-3">{segment.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-slate-500">Members</span>
                    <span className="text-white font-medium" data-testid={`text-member-count-${segment.id}`}>
                      {(segment.memberCount || 0).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedSegment(segment);
                        setShowMembers(true);
                      }}
                      className="flex-1 text-slate-400 hover:text-white"
                      data-testid={`button-view-members-${segment.id}`}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => recalculateMutation.mutate(segment.id)}
                      disabled={recalculateMutation.isPending}
                      className="text-slate-400 hover:text-white"
                      data-testid={`button-recalculate-${segment.id}`}
                    >
                      <RefreshCw className={`w-4 h-4 ${recalculateMutation.isPending ? 'animate-spin' : ''}`} />
                    </Button>
                    {!segment.isSystem && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteSegmentMutation.mutate(segment.id)}
                        disabled={deleteSegmentMutation.isPending}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        data-testid={`button-delete-segment-${segment.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DashboardCard>

      {/* View Members Dialog */}
      <Dialog open={showMembers} onOpenChange={setShowMembers}>
        <DialogContent className="max-w-3xl bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedSegment?.name} - Members
            </DialogTitle>
            <DialogDescription>
              {(selectedSegment?.memberCount || 0).toLocaleString()} customers in this segment
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-96 overflow-y-auto">
            {membersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No members in this segment yet
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-3 text-slate-400 text-sm">Customer</th>
                    <th className="text-right py-2 px-3 text-slate-400 text-sm">Orders</th>
                    <th className="text-right py-2 px-3 text-slate-400 text-sm">Total Spent</th>
                    <th className="text-right py-2 px-3 text-slate-400 text-sm">Last Order</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b border-slate-800">
                      <td className="py-2 px-3">
                        <div className="text-white">{member.customerName || 'Unknown'}</div>
                        <div className="text-slate-500 text-sm">{member.customerEmail}</div>
                      </td>
                      <td className="py-2 px-3 text-right text-white">
                        {member.totalOrders || 0}
                      </td>
                      <td className="py-2 px-3 text-right text-green-400">
                        ${parseFloat(member.totalSpent || '0').toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-400 text-sm">
                        {member.lastOrderDate 
                          ? new Date(member.lastOrderDate).toLocaleDateString() 
                          : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Segment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Segment</DialogTitle>
            <DialogDescription>
              Define rules to automatically categorize customers
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-white text-sm block mb-2">Segment Name</label>
              <Input
                placeholder="e.g., Premium Customers"
                value={newSegment.name}
                onChange={(e) => setNewSegment({ ...newSegment, name: e.target.value })}
                className="bg-slate-800/50 border-slate-600 text-white"
                data-testid="input-segment-name"
              />
            </div>
            
            <div>
              <label className="text-white text-sm block mb-2">Description</label>
              <Input
                placeholder="Describe this segment..."
                value={newSegment.description}
                onChange={(e) => setNewSegment({ ...newSegment, description: e.target.value })}
                className="bg-slate-800/50 border-slate-600 text-white"
                data-testid="input-segment-description"
              />
            </div>
            
            <div>
              <label className="text-white text-sm block mb-2">Segment Type</label>
              <Select 
                value={newSegment.segmentType} 
                onValueChange={(value) => setNewSegment({ ...newSegment, segmentType: value })}
              >
                <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white" data-testid="select-segment-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="high_spenders">High Spenders</SelectItem>
                  <SelectItem value="first_timers">First-Time Buyers</SelectItem>
                  <SelectItem value="loyal_buyers">Loyal Customers</SelectItem>
                  <SelectItem value="discount_seekers">Discount Seekers</SelectItem>
                  <SelectItem value="dormant">Dormant</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="at_risk">At Risk</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-white text-sm block mb-2">Field</label>
                <Select 
                  value={newSegment.field} 
                  onValueChange={(value) => setNewSegment({ ...newSegment, field: value })}
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white" data-testid="select-field">
                    <SelectValue placeholder="Field" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="totalSpent">Total Spent</SelectItem>
                    <SelectItem value="totalOrders">Total Orders</SelectItem>
                    <SelectItem value="avgOrderValue">Avg Order Value</SelectItem>
                    <SelectItem value="daysSinceLastOrder">Days Inactive</SelectItem>
                    <SelectItem value="discountUsagePercent">Discount Usage %</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-white text-sm block mb-2">Operator</label>
                <Select 
                  value={newSegment.operator} 
                  onValueChange={(value) => setNewSegment({ ...newSegment, operator: value })}
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white" data-testid="select-operator">
                    <SelectValue placeholder="Operator" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="gte">At least</SelectItem>
                    <SelectItem value="lte">At most</SelectItem>
                    <SelectItem value="eq">Equals</SelectItem>
                    <SelectItem value="gt">Greater than</SelectItem>
                    <SelectItem value="lt">Less than</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-white text-sm block mb-2">Value</label>
                <Input
                  type="number"
                  placeholder="500"
                  value={newSegment.value}
                  onChange={(e) => setNewSegment({ ...newSegment, value: e.target.value })}
                  className="bg-slate-800/50 border-slate-600 text-white"
                  data-testid="input-segment-value"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="border-slate-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSegment}
              disabled={createSegmentMutation.isPending}
              className="bg-primary"
              data-testid="button-save-segment"
            >
              {createSegmentMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Segment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
