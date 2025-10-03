import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import NotificationCenter from "@/components/dashboard/notification-center";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart,
  BarChart3,
  Calendar,
  User, 
  LogOut, 
  Settings as SettingsIcon,
  Eye,
  ArrowUpRight
} from "lucide-react";

export default function ContentROI() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    setLocation("/auth");
  };

  const handleGoBack = () => {
    window.history.back();
  };

  // Mock ROI tracking data
  const roiData = [
    {
      id: "1",
      productName: "Wireless Bluetooth Headphones",
      beforeRevenue: 2847.50,
      afterRevenue: 5294.80,
      uplift: 86.0,
      optimizedDate: "2024-01-15",
      ordersBefore: 23,
      ordersAfter: 42,
      conversionBefore: 2.1,
      conversionAfter: 3.9
    },
    {
      id: "2",
      productName: "Smart Fitness Watch",
      beforeRevenue: 4125.30,
      afterRevenue: 6847.90,
      uplift: 66.0,
      optimizedDate: "2024-01-12",
      ordersBefore: 18,
      ordersAfter: 29,
      conversionBefore: 1.8,
      conversionAfter: 2.8
    },
    {
      id: "3",
      productName: "Portable Power Bank",
      beforeRevenue: 1598.75,
      afterRevenue: 3124.60,
      uplift: 95.4,
      optimizedDate: "2024-01-10",
      ordersBefore: 12,
      ordersAfter: 24,
      conversionBefore: 1.5,
      conversionAfter: 3.1
    },
    {
      id: "4",
      productName: "Wireless Gaming Mouse",
      beforeRevenue: 3247.85,
      afterRevenue: 5156.40,
      uplift: 58.8,
      optimizedDate: "2024-01-08",
      ordersBefore: 26,
      ordersAfter: 41,
      conversionBefore: 2.3,
      conversionAfter: 3.6
    }
  ];

  const totalBeforeRevenue = roiData.reduce((sum, item) => sum + item.beforeRevenue, 0);
  const totalAfterRevenue = roiData.reduce((sum, item) => sum + item.afterRevenue, 0);
  const totalUplift = ((totalAfterRevenue - totalBeforeRevenue) / totalBeforeRevenue * 100).toFixed(1);
  const totalImpact = totalAfterRevenue - totalBeforeRevenue;

  return (
    <div className="min-h-screen dark-theme-bg">
      {/* Header */}
      <header className="dark-theme-bg backdrop-blur-sm border-b border-border/50 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoBack}
              className="text-slate-200 hover:text-primary hover:bg-white/10 transition-all duration-300 ease-in-out flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-white text-base sm:text-lg lg:text-xl xl:text-2xl truncate">
                Content ROI Tracking
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm lg:text-base truncate">
                AI-generated content performance and sales impact measurement
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 sm:space-x-4 flex-shrink-0">
            <NotificationCenter />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full text-slate-200 hover:text-primary transition-all duration-300 ease-in-out"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={user?.fullName || "User"} />
                    <AvatarFallback className="dark-theme-bg text-primary">
                      {user?.fullName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 dark-theme-bg text-white" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-bold text-white text-sm">{user?.fullName || "User"}</p>
                    <p className="text-xs text-slate-300">{user?.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-slate-700/30" />
                <DropdownMenuItem
                  className="text-slate-200 hover:text-white hover:bg-white/10 focus:text-white focus:bg-white/10 cursor-pointer"
                  onClick={() => setLocation("/profile")}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-slate-200 hover:text-white hover:bg-white/10 focus:text-white focus:bg-white/10 cursor-pointer"
                  onClick={() => setLocation("/billing")}
                >
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700/30" />
                <DropdownMenuItem
                  className="text-red-300 hover:text-red-200 hover:bg-red-500/20 focus:text-red-200 focus:bg-red-500/20 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="dark-theme-bg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-slate-800/50">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-2xl">${totalImpact.toFixed(0)}</h3>
                  <p className="text-slate-300 text-sm">Revenue Impact</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark-theme-bg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-slate-800/50">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-2xl">+{totalUplift}%</h3>
                  <p className="text-slate-300 text-sm">Avg ROI Uplift</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark-theme-bg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-slate-800/50">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-2xl">{roiData.length}</h3>
                  <p className="text-slate-300 text-sm">Products Tracked</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark-theme-bg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-slate-800/50">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-2xl">30</h3>
                  <p className="text-slate-300 text-sm">Days Tracking</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ROI Performance */}
        <Card className="dark-theme-bg /50">
          <CardHeader>
            <CardTitle className="text-white">Content ROI Performance</CardTitle>
            <CardDescription className="text-slate-300">
              Track sales uplift and revenue impact from AI-optimized content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {roiData.map((item) => (
              <div key={item.id} className="bg-slate-800/30 rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-lg">{item.productName}</h3>
                    <div className="flex items-center space-x-3 mt-2">
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                        <div className="flex items-center space-x-1">
                          <ArrowUpRight className="w-3 h-3" />
                          <span>+{item.uplift}% ROI</span>
                        </div>
                      </Badge>
                      <span className="text-slate-400 text-sm">
                        Optimized: {new Date(item.optimizedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-white/10">
                      <Eye className="w-4 h-4 mr-2" />
                      Details
                    </Button>
                    <Button size="sm" className="gradient-button">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analyze
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-slate-300 font-medium">Revenue Comparison</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-900/50 p-3 rounded-lg">
                        <p className="text-slate-400 text-sm">Before</p>
                        <p className="text-xl font-bold text-white">${item.beforeRevenue.toFixed(0)}</p>
                        <p className="text-slate-400 text-xs">{item.ordersBefore} orders</p>
                      </div>
                      <div className="bg-slate-800/50 p-3 rounded-lg border border-primary/20">
                        <p className="text-slate-400 text-sm">After</p>
                        <p className="text-xl font-bold text-white">${item.afterRevenue.toFixed(0)}</p>
                        <p className="text-slate-400 text-xs">{item.ordersAfter} orders</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-slate-300 font-medium">Conversion Rates</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-900/50 p-3 rounded-lg">
                        <p className="text-slate-400 text-sm">Before</p>
                        <p className="text-xl font-bold text-white">{item.conversionBefore}%</p>
                        <p className="text-slate-400 text-xs">Conversion rate</p>
                      </div>
                      <div className="bg-slate-800/50 p-3 rounded-lg border border-primary/20">
                        <p className="text-slate-400 text-sm">After</p>
                        <p className="text-xl font-bold text-white">{item.conversionAfter}%</p>
                        <p className="text-slate-400 text-xs">Conversion rate</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-green-400 font-medium">Revenue Increase</span>
                    <span className="text-green-400 font-bold text-lg">
                      +${(item.afterRevenue - item.beforeRevenue).toFixed(0)} ({item.uplift}%)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}