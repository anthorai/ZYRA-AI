import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { supabase } from "@/lib/supabaseClient";
import AdminLayout from "@/components/layouts/AdminLayout";
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
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Crown, 
  Search, 
  RefreshCw,
  Coins,
  Check,
  AlertCircle,
  Trash2,
  Ban,
  UserCheck
} from "lucide-react";

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
    expiresAt?: string | null;
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
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserWithSubscription | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: usersResponse, isLoading: usersLoading, refetch: refetchUsers } = useQuery<PaginatedResponse>({
    queryKey: ['/api/admin/users-with-subscriptions', currentPage],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/users-with-subscriptions?page=${currentPage}&limit=50`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
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
      setResettingUserId(userId);
      const response = await apiRequest('POST', '/api/admin/reset-credits', { userId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Credits Reset",
        description: "User credits have been reset to their plan limit",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users-with-subscriptions'] });
      setResettingUserId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset credits",
        variant: "destructive",
      });
      setResettingUserId(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/delete-user/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete user');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Account Deleted",
        description: data.message || "User account has been permanently deleted",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users-with-subscriptions'] });
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user account",
        variant: "destructive",
      });
    },
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: 'active' | 'suspended' }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update user status');
      }
      return res.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: variables.status === 'suspended' ? "User Suspended" : "User Activated",
        description: variables.status === 'suspended' 
          ? "User has been suspended and cannot access the platform" 
          : "User has been reactivated and can access the platform",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users-with-subscriptions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  const openDeleteDialog = (user: UserWithSubscription) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

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

  useEffect(() => {
    const redirectToShopifyPricing = async () => {
      try {
        const response = await fetch('/api/shopify/billing/managed-url');
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          // Stay on page if redirect fails, but we don't need a custom PageShell
          toast({
            title: "Redirect Failed",
            description: data.message || "Could not generate Shopify pricing URL",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Redirect error:", error);
      }
    };

    // Only redirect if explicitly asked or if this is the intended behavior for this admin page
    // For now, we'll keep the UI but add a button to trigger the redirect
  }, [toast]);

  const handleShopifyRedirect = async () => {
    try {
      const response = await fetch('/api/shopify/billing/managed-url');
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Redirect Failed",
          description: data.message || "Could not generate Shopify pricing URL",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 bg-[#0D0D1F]">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold" data-testid="heading-admin-subscriptions">Users & Subscriptions</h1>
            <p className="text-muted-foreground">Manage merchant subscriptions and credits</p>
          </div>
          <Button onClick={handleShopifyRedirect} variant="outline" className="gap-2">
            <ExternalLink className="w-4 h-4" />
            Shopify Managed Pricing
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground whitespace-nowrap">Total</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-2xl font-bold" data-testid="stat-total-users">{pagination?.total || users?.length || 0}</span>
              </div>
              <p className="text-xs text-muted-foreground">(all pages)</p>
            </CardContent>
          </Card>
          
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground whitespace-nowrap">Pro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                <span className="text-2xl font-bold" data-testid="stat-pro-users">
                  {users?.filter(u => u.plan?.toLowerCase() === 'pro').length || 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">(on current page)</p>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground whitespace-nowrap">Growth</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <span className="text-2xl font-bold" data-testid="stat-growth-users">
                  {users?.filter(u => u.plan?.toLowerCase() === 'growth').length || 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">(on current page)</p>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground whitespace-nowrap">Starter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-2xl font-bold" data-testid="stat-starter-users">
                  {users?.filter(u => u.plan?.toLowerCase() === 'starter').length || 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">(on current page)</p>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground whitespace-nowrap">Trial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-400 flex-shrink-0" />
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
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search by email or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 pr-10 bg-background text-foreground placeholder:text-muted-foreground"
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
                      <TableHead>Expires</TableHead>
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
                            <div className="flex items-center gap-1 mt-1">
                              {user.role === 'admin' && (
                                <Badge variant="outline" className="w-fit text-xs bg-primary/10 text-primary border-primary/30">
                                  Admin
                                </Badge>
                              )}
                              {user.plan === 'suspended' && (
                                <Badge variant="destructive" className="w-fit text-xs">
                                  Suspended
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPlanBadgeVariant(user.plan)}>
                            {(() => {
                              const planName = user.subscription?.planName || user.plan || 'No Plan';
                              return planName === '7-Day Free Trial' ? 'Trial' : planName;
                            })()}
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
                              {user.credits?.remaining ?? 0}/{user.credits?.limit ?? 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.subscription?.expiresAt ? (
                            <div className="flex flex-col">
                              <span className="text-sm">
                                {new Date(user.subscription.expiresAt).toLocaleDateString()}
                              </span>
                              {new Date(user.subscription.expiresAt) < new Date() && (
                                <Badge variant="destructive" className="w-fit mt-1 text-xs">
                                  Expired
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          )}
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
                              disabled={resettingUserId === user.id}
                              data-testid={`button-reset-credits-${user.id}`}
                            >
                              <RefreshCw className={`w-4 h-4 ${resettingUserId === user.id ? 'animate-spin' : ''}`} />
                            </Button>
                            {user.role !== 'admin' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateUserStatusMutation.mutate({ 
                                    userId: user.id, 
                                    status: user.plan === 'suspended' ? 'active' : 'suspended' 
                                  })}
                                  disabled={updateUserStatusMutation.isPending}
                                  className={user.plan === 'suspended' 
                                    ? "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20" 
                                    : "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                  }
                                  title={user.plan === 'suspended' ? 'Activate User' : 'Suspend User'}
                                  data-testid={`button-toggle-status-${user.id}`}
                                >
                                  {user.plan === 'suspended' ? (
                                    <UserCheck className="w-4 h-4" />
                                  ) : (
                                    <Ban className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDeleteDialog(user)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  data-testid={`button-delete-user-${user.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
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

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                Delete User Account
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  Are you sure you want to permanently delete the account for <strong>{userToDelete?.email}</strong>?
                </p>
                <p className="text-destructive font-medium">
                  This action cannot be undone. All user data including products, campaigns, and settings will be permanently removed.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={() => setUserToDelete(null)}
                data-testid="button-cancel-delete"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                disabled={deleteUserMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                {deleteUserMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
