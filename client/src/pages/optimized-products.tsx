import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import NotificationCenter from "@/components/dashboard/notification-center";
import { CardPageHeader, PageContainer } from "@/components/ui/standardized-layout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { products } from "@shared/schema";
import { 
  ArrowLeft, 
  ShoppingBag, 
  TrendingUp, 
  Calendar,
  Filter,
  Search,
  Menu, 
  User, 
  LogOut, 
  Settings as SettingsIcon,
  Eye,
  Edit,
  AlertCircle,
  RefreshCw,
  Sparkles
} from "lucide-react";

type Product = typeof products.$inferSelect;

export default function OptimizedProducts() {
  const { user, appUser, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get display name and initials (matching dashboard pattern)
  const getDisplayName = () => {
    if (appUser?.fullName) return appUser.fullName;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.user_metadata?.name) return user.user_metadata.name;
    if (user?.email) return user.email.split('@')[0];
    return "User";
  };

  const getInitials = () => {
    const name = getDisplayName();
    if (name === "User") return "U";
    return name.charAt(0).toUpperCase();
  };

  const displayName = getDisplayName();
  const initials = getInitials();

  // Handle logout
  const handleLogout = () => {
    logout();
    setLocation("/auth");
  };

  // Fetch optimized products from API
  const { data: products = [], isLoading, error, isError } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    enabled: !!user,
  });

  // Filter only optimized products
  const optimizedProducts = isError ? [] : products.filter((p) => p.isOptimized === true);

  // Calculate statistics (guarded against errors)
  const totalOptimized = isError ? 0 : optimizedProducts.length;
  
  // Calculate products optimized this week (guarded against errors)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const optimizedThisWeek = isError ? 0 : optimizedProducts.filter((p: any) => {
    const updatedDate = new Date(p.updatedAt);
    return updatedDate >= oneWeekAgo;
  }).length;


  // Show toast notification on error
  useEffect(() => {
    if (isError && error) {
      toast({
        title: "Error",
        description: error.message || "Failed to load products",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen dark-theme-bg">
        {/* Header */}
        <header className="dark-theme-bg backdrop-blur-sm border border-border/50 rounded-2xl mx-4 sm:mx-6 mt-4 px-4 sm:px-6 py-3 sm:py-4 ml-[8px] mr-[8px]">
          <div className="flex items-center">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.history.back()}
                className="text-slate-200 hover:text-primary hover:bg-white/10 transition-all duration-300 ease-in-out flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-white text-base sm:text-lg lg:text-xl xl:text-2xl truncate">
                  Optimized Products
                </h1>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2 sm:space-x-4 flex-shrink-0">
              <NotificationCenter />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full text-slate-200 hover:text-primary transition-all duration-300 ease-in-out">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={displayName} />
                      <AvatarFallback className="dark-theme-bg text-primary">{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 dark-theme-bg text-white" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-bold text-white text-sm">{displayName}</p>
                      <p className="text-xs text-slate-300">{appUser?.email || user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-slate-700/30" />
                  <DropdownMenuItem className="text-slate-200 hover:text-white hover:bg-white/10 focus:text-white focus:bg-white/10 cursor-pointer" onClick={() => setLocation("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-slate-200 hover:text-white hover:bg-white/10 focus:text-white focus:bg-white/10 cursor-pointer" onClick={() => setLocation("/billing")}>
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-700/30" />
                  <DropdownMenuItem className="text-red-300 hover:text-red-200 hover:bg-red-500/20 focus:text-red-200 focus:bg-red-500/20 cursor-pointer" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Error State */}
        <div className="p-4 sm:p-6">
          <Card className="gradient-card" data-testid="error-state">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold text-lg mb-2">Failed to Load Products</h3>
              <p className="text-slate-300 mb-6">
                We couldn't load your optimized products. Please try again.
              </p>
              <Button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/products'] })}
                className="gradient-button"
                data-testid="button-retry"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark-theme-bg">
      {/* Header */}
      <header className="dark-theme-bg backdrop-blur-sm border border-border/50 rounded-2xl mx-4 sm:mx-6 mt-4 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Back Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="text-slate-200 hover:text-primary hover:bg-white/10 transition-all duration-300 ease-in-out flex-shrink-0"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>

          {/* Right Section - Notifications + Profile */}
          <div className="flex items-center justify-end space-x-2 sm:space-x-4 flex-shrink-0">
            <NotificationCenter />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full text-slate-200 hover:text-primary transition-all duration-300 ease-in-out"
                  data-testid="button-user-menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={displayName} />
                    <AvatarFallback className="dark-theme-bg text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 dark-theme-bg text-white" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-bold text-white text-sm">{displayName}</p>
                    <p className="text-xs text-slate-300">{appUser?.email || user?.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-slate-700/30" />
                <DropdownMenuItem
                  className="text-slate-200 hover:text-white hover:bg-white/10 focus:text-white focus:bg-white/10 cursor-pointer"
                  onClick={() => setLocation("/profile")}
                  data-testid="menu-profile"
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-slate-200 hover:text-white hover:bg-white/10 focus:text-white focus:bg-white/10 cursor-pointer"
                  onClick={() => setLocation("/billing")}
                  data-testid="menu-settings"
                >
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700/30" />
                <DropdownMenuItem
                  className="text-red-300 hover:text-red-200 hover:bg-red-500/20 focus:text-red-200 focus:bg-red-500/20 cursor-pointer"
                  onClick={handleLogout}
                  data-testid="menu-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Page Header and Main Content */}
      <div className="px-4 sm:px-6 mt-4 sm:mt-6">
        <div>
          <CardPageHeader title="Optimized Products" />
          <PageContainer>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                <div className="p-2 sm:p-2.5 md:p-3 rounded-full bg-slate-800/50 flex-shrink-0">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-white font-bold text-base sm:text-lg md:text-xl truncate" data-testid="text-total-optimized">
                    {isLoading ? "..." : totalOptimized}
                  </h3>
                  <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Total Optimized</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                <div className="p-2 sm:p-2.5 md:p-3 rounded-full bg-slate-800/50 flex-shrink-0">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-white font-bold text-base sm:text-lg md:text-xl truncate" data-testid="text-total-products">
                    {isLoading ? "..." : products.length}
                  </h3>
                  <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Total Products</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                <div className="p-2 sm:p-2.5 md:p-3 rounded-full bg-slate-800/50 flex-shrink-0">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-white font-bold text-base sm:text-lg md:text-xl truncate" data-testid="text-this-week">
                    {isLoading ? "..." : optimizedThisWeek}
                  </h3>
                  <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products List */}
        <Card className="gradient-card">
          <CardHeader>
            <CardTitle className="text-white">Recently Optimized Products</CardTitle>
            <CardDescription className="text-slate-300">
              Products enhanced with AI-generated descriptions and SEO optimization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-slate-400">
                Loading optimized products...
              </div>
            ) : optimizedProducts.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No optimized products yet. Start optimizing your products to see them here.
              </div>
            ) : (
              optimizedProducts.map((product: any) => {
                const optimizedCopy = product.optimizedCopy as any;
                const optimizedDescription = optimizedCopy?.description || product.description;
                const originalDesc = product.originalDescription || product.description;
                
                return (
                  <div key={product.id} className="bg-slate-800/30 rounded-lg p-4 space-y-4" data-testid={`card-product-${product.id}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-white font-semibold text-lg" data-testid={`text-product-name-${product.id}`}>
                          {product.name}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                            Optimized
                          </Badge>
                          <span className="text-slate-400 text-sm">
                            {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'Recently'}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-slate-600 text-slate-300 hover:bg-white/10"
                          onClick={() => setLocation(`/products/${product.id}`)}
                          data-testid={`button-view-${product.id}`}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          className="gradient-button"
                          onClick={() => setLocation(`/products/${product.id}`)}
                          data-testid={`button-edit-${product.id}`}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-slate-300 font-medium mb-2">Original Description</h4>
                        <p className="text-slate-400 text-sm bg-slate-900/50 p-3 rounded">
                          {originalDesc || 'No original description'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-slate-300 font-medium mb-2">AI-Optimized Description</h4>
                        <p className="text-slate-300 text-sm bg-slate-800/50 p-3 rounded border border-primary/20">
                          {optimizedDescription || 'No optimized description'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
          </PageContainer>
        </div>
      </div>
    </div>
  );
}