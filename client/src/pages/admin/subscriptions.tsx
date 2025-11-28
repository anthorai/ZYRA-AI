import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Crown, 
  Search, 
  RefreshCw,
  Shield,
  ArrowLeft,
  Coins,
  Check,
  AlertCircle
} from "lucide-react";
import { Link } from "wouter";

interface UserWithSubscription {
  id: string;
  email: string;
  fullName: string;
  role: string;
  plan: string;
  createdAt: string;
  subscription?: {
    planId: string;
    planName: string;
    status: string;
  };
  credits?: {
    used: number;
    remaining: number;
    limit: number;
  };
}

interface SubscriptionPlan {
  id: string;
  planName: string;
  price: number;
  limits: {
    credits?: number;
  };
}

interface PaginatedResponse {
  users: UserWithSubscription[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminSubscriptions() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithSubscription | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: usersResponse, isLoading: usersLoading, refetch: refetchUsers } = useQuery<PaginatedResponse>({
    queryKey: ['/api/admin/users-with-subscriptions', currentPage],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users-with-subscriptions?page=${currentPage}&limit=50`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
  });
  
  const users = usersResponse?.users;
  const pagination = usersResponse?.pagination;

  const { data: plans } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription-plans'],
  });

  const assignPlanMutation = useMutation({
    mutationFn: async ({ userId, planId }: { userId: string; planId: string }) => {
      const response = await apiRequest('POST', '/api/admin/assign-plan', { userId, planId });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Plan Assigned",
        description: `Successfully assigned ${data.planName} to ${data.userEmail}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users-with-subscriptions'] });
      setIsDialogOpen(false);
      setSelectedUser(null);
      setSelectedPlanId("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign plan",
        variant: "destructive",
      });
    },
  });

  const resetCreditsMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('POST', '/api/admin/reset-credits', { userId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Credits Reset",
        description: "User credits have been reset to their plan limit",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users-with-subscriptions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset credits",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users?.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAssignDialog = (user: UserWithSubscription) => {
    setSelectedUser(user);
    setSelectedPlanId(user.subscription?.planId || "");
    setIsDialogOpen(true);
  };

  const handleAssignPlan = () => {
    if (selectedUser && selectedPlanId) {
      assignPlanMutation.mutate({ userId: selectedUser.id, planId: selectedPlanId });
    }
  };

  const getPlanBadgeVariant = (planName: string) => {
    switch (planName?.toLowerCase()) {
      case 'pro': return 'default';
      case 'growth': return 'secondary';
      case 'starter': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'default';
      case 'past_due': return 'destructive';
      case 'cancelled': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header - matches application header style */}
      <header className="backdrop-blur-sm border border-border rounded-2xl px-4 sm:px-6 py-3 sm:py-4 m-2 bg-[#16162c]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="text-slate-200 hover:text-primary hover:bg-white/10 transition-all duration-300 ease-in-out flex-shrink-0" data-testid="button-back-dashboard">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/20">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-white text-base sm:text-lg lg:text-xl" data-testid="heading-admin-subscriptions">
                  Admin Panel
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm hidden sm:block">Manage merchant subscriptions and credits</p>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 flex-shrink-0">
            Administrator Access
          </Badge>
        </div>
      </header>
      <div className="container mx-auto px-4 py-6 max-w-7xl">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold" data-testid="stat-total-users">{pagination?.total || users?.length || 0}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pro Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                <span className="text-2xl font-bold" data-testid="stat-pro-users">
                  {users?.filter(u => u.plan?.toLowerCase() === 'pro').length || 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">(on current page)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Growth Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-blue-500" />
                <span className="text-2xl font-bold" data-testid="stat-growth-users">
                  {users?.filter(u => u.plan?.toLowerCase() === 'growth').length || 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">(on current page)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Trial Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-400" />
                <span className="text-2xl font-bold" data-testid="stat-trial-users">
                  {users?.filter(u => u.plan?.toLowerCase().includes('trial') || u.plan?.toLowerCase() === 'free').length || 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">(on current page)</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>All Merchants</CardTitle>
                <CardDescription>View and manage subscription plans for all merchants</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search by email or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 ml-[0px] mr-[0px] pl-[33px] pr-[33px]"
                    data-testid="input-search-users"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => refetchUsers()}
                  data-testid="button-refresh-users"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers && filteredUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Current Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.fullName || 'Unknown'}</span>
                            <span className="text-sm text-muted-foreground">{user.email}</span>
                            {user.role === 'admin' && (
                              <Badge variant="outline" className="w-fit mt-1 text-xs bg-primary/10 text-primary border-primary/30">
                                Admin
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPlanBadgeVariant(user.plan)}>
                            {user.subscription?.planName || user.plan || 'No Plan'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(user.subscription?.status || 'none')}>
                            {user.subscription?.status || 'None'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Coins className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm">
                              {user.credits?.remaining ?? 0} / {user.credits?.limit ?? 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAssignDialog(user)}
                              data-testid={`button-assign-plan-${user.id}`}
                            >
                              <Crown className="w-4 h-4 mr-1" />
                              Assign Plan
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => resetCreditsMutation.mutate(user.id)}
                              disabled={resetCreditsMutation.isPending}
                              data-testid={`button-reset-credits-${user.id}`}
                            >
                              <RefreshCw className={`w-4 h-4 ${resetCreditsMutation.isPending ? 'animate-spin' : ''}`} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No users found matching your search' : 'No users found'}
                </p>
              </div>
            )}
            
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    data-testid="button-prev-page"
                  >
                    Previous
                  </Button>
                  <span className="text-sm px-2">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={currentPage >= pagination.totalPages}
                    data-testid="button-next-page"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Subscription Plan</DialogTitle>
              <DialogDescription>
                Assign a new subscription plan to {selectedUser?.email}. This will immediately update their access and credits.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Plan</label>
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                  <SelectTrigger data-testid="select-plan">
                    <SelectValue placeholder="Choose a plan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {plans?.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        <div className="flex items-center gap-2">
                          <span>{plan.planName}</span>
                          {plan.price > 0 && (
                            <span className="text-muted-foreground">(${plan.price}/mo)</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPlanId && plans && (
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <p className="text-sm font-medium">Plan Details:</p>
                  {(() => {
                    const plan = plans.find(p => p.id === selectedPlanId);
                    return plan ? (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <Coins className="w-4 h-4 text-yellow-500" />
                          <span>Credits: {plan.limits?.credits || 0} per month</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Crown className="w-4 h-4 text-primary" />
                          <span>Price: {plan.price === 0 ? 'Free' : `$${plan.price}/month`}</span>
                        </div>
                      </>
                    ) : null;
                  })()}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAssignPlan}
                disabled={!selectedPlanId || assignPlanMutation.isPending}
                data-testid="button-confirm-assign"
              >
                {assignPlanMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Assign Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
