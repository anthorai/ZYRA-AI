import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import NotificationCenter from "@/components/dashboard/notification-center";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  Edit
} from "lucide-react";

export default function OptimizedProducts() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Handle logout
  const handleLogout = () => {
    logout();
    setLocation("/auth");
  };

  // Mock data for optimized products
  const optimizedProducts = [
    {
      id: "1",
      name: "Wireless Bluetooth Headphones",
      originalDescription: "Good headphones with bluetooth",
      optimizedDescription: "Experience crystal-clear audio with our premium wireless Bluetooth headphones. Featuring noise-cancellation technology, 30-hour battery life, and ergonomic design for all-day comfort. Perfect for music lovers, professionals, and fitness enthusiasts.",
      optimizedAt: "2024-01-15",
      improvement: "+85% engagement",
      status: "active"
    },
    {
      id: "2", 
      name: "Smart Fitness Watch",
      originalDescription: "Watch that tracks fitness",
      optimizedDescription: "Transform your fitness journey with our advanced smart watch. Monitor heart rate, track 50+ workout modes, receive smartphone notifications, and enjoy 7-day battery life. Water-resistant design with GPS tracking for accurate performance metrics.",
      optimizedAt: "2024-01-12",
      improvement: "+67% CTR",
      status: "active"
    },
    {
      id: "3",
      name: "Portable Power Bank",
      originalDescription: "Power bank for phones",
      optimizedDescription: "Never run out of power with our ultra-fast 20,000mAh portable charger. Features 3 USB ports, wireless charging pad, and intelligent charging technology. Compact design with LED display shows remaining battery. Essential for travel, work, and emergencies.",
      optimizedAt: "2024-01-10",
      improvement: "+92% conversions",
      status: "active"
    }
  ];

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen dark-theme-bg">
      {/* Header */}
      <header className="dark-theme-bg backdrop-blur-sm border border-border/50 rounded-2xl mx-4 sm:mx-6 mt-4 px-4 sm:px-6 py-3 sm:py-4 ml-[8px] mr-[8px]">
        <div className="flex items-center">
          {/* Left Section - Back Button + Title */}
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
                Optimized Products
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm lg:text-base truncate">
                Track products enhanced by Zyra AI with improved descriptions and SEO
              </p>
            </div>
          </div>

          {/* Right Section - Notifications + Profile */}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-slate-800/50">
                  <ShoppingBag className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-2xl">247</h3>
                  <p className="text-slate-300 text-sm">Total Products</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-slate-800/50">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-2xl">+78%</h3>
                  <p className="text-slate-300 text-sm">Avg Improvement</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-slate-800/50">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-2xl">23</h3>
                  <p className="text-slate-300 text-sm">This Week</p>
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
            {optimizedProducts.map((product) => (
              <div key={product.id} className="bg-slate-800/30 rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-lg">{product.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                        {product.improvement}
                      </Badge>
                      <span className="text-slate-400 text-sm">
                        Optimized on {new Date(product.optimizedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-white/10">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button size="sm" className="gradient-button">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-slate-300 font-medium mb-2">Original Description</h4>
                    <p className="text-slate-400 text-sm bg-slate-900/50 p-3 rounded">
                      {product.originalDescription}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-slate-300 font-medium mb-2">AI-Optimized Description</h4>
                    <p className="text-slate-300 text-sm bg-slate-800/50 p-3 rounded border border-primary/20">
                      {product.optimizedDescription}
                    </p>
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