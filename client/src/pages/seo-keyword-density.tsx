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
  Search, 
  TrendingUp, 
  BarChart3,
  Target,
  Award,
  User, 
  LogOut, 
  Settings as SettingsIcon,
  Eye,
  RefreshCw
} from "lucide-react";

export default function SeoKeywordDensity() {
  const { user, appUser, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    setLocation("/auth");
  };

  const handleGoBack = () => {
    window.history.back();
  };

  // Mock keyword analysis data
  const keywordAnalysis = [
    {
      id: "1",
      productName: "Wireless Bluetooth Headphones",
      primaryKeywords: [
        { keyword: "wireless headphones", density: 4.2, target: 3.5, status: "optimal" },
        { keyword: "bluetooth headphones", density: 3.1, target: 2.5, status: "good" },
        { keyword: "noise cancelling", density: 2.8, target: 2.0, status: "good" },
        { keyword: "audio quality", density: 1.9, target: 2.0, status: "low" }
      ],
      seoScore: 78,
      lastAnalyzed: "2024-01-18"
    },
    {
      id: "2",
      productName: "Smart Fitness Watch",
      primaryKeywords: [
        { keyword: "fitness tracker", density: 3.8, target: 3.0, status: "good" },
        { keyword: "smart watch", density: 4.5, target: 3.5, status: "high" },
        { keyword: "heart rate monitor", density: 2.1, target: 2.5, status: "low" },
        { keyword: "waterproof watch", density: 1.7, target: 2.0, status: "low" }
      ],
      seoScore: 72,
      lastAnalyzed: "2024-01-16"
    },
    {
      id: "3",
      productName: "Portable Power Bank",
      primaryKeywords: [
        { keyword: "portable charger", density: 3.9, target: 3.5, status: "optimal" },
        { keyword: "power bank", density: 4.1, target: 4.0, status: "optimal" },
        { keyword: "fast charging", density: 2.7, target: 2.5, status: "good" },
        { keyword: "mobile battery", density: 2.2, target: 2.0, status: "good" }
      ],
      seoScore: 85,
      lastAnalyzed: "2024-01-14"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "optimal": return "bg-green-500/20 text-green-400";
      case "good": return "bg-blue-500/20 text-blue-400";
      case "low": return "bg-yellow-500/20 text-yellow-400";
      case "high": return "bg-orange-500/20 text-orange-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "optimal": return <Award className="w-4 h-4" />;
      case "good": return <TrendingUp className="w-4 h-4" />;
      case "low": return <Target className="w-4 h-4" />;
      case "high": return <BarChart3 className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen dark-theme-bg">
      {/* Header */}
      <header className="dark-theme-bg backdrop-blur-sm border-b border-border/50 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl">
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
                SEO Keyword Density
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm lg:text-base truncate">
                Keyword optimization and search ranking improvements
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
                    <AvatarImage src="" alt={appUser?.fullName || "User"} />
                    <AvatarFallback className="dark-theme-bg text-primary">
                      {appUser?.fullName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 gradient-surface text-white" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-bold text-white text-sm">{appUser?.fullName || "User"}</p>
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
          <Card className="gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-slate-800/50">
                  <Search className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-2xl">247</h3>
                  <p className="text-slate-300 text-sm">Products Analyzed</p>
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
                  <h3 className="text-white font-bold text-2xl">78.5</h3>
                  <p className="text-slate-300 text-sm">Avg SEO Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-slate-800/50">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-2xl">156</h3>
                  <p className="text-slate-300 text-sm">Optimal Keywords</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-slate-800/50">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-2xl">3.2%</h3>
                  <p className="text-slate-300 text-sm">Avg Density</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Keyword Analysis */}
        <Card className="dark-theme-bg">
          <CardHeader>
            <CardTitle className="text-white">Product Keyword Analysis</CardTitle>
            <CardDescription className="text-slate-300">
              AI-powered keyword density analysis and SEO optimization recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {keywordAnalysis.map((product) => (
              <div key={product.id} className="bg-slate-800/30 rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-lg">{product.productName}</h3>
                    <div className="flex items-center space-x-3 mt-2">
                      <Badge variant="secondary" className={`${product.seoScore >= 80 ? 'bg-green-500/20 text-green-400' : product.seoScore >= 70 ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        SEO Score: {product.seoScore}
                      </Badge>
                      <span className="text-slate-400 text-sm">
                        Last analyzed: {new Date(product.lastAnalyzed).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-white/10">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button size="sm" className="gradient-button">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Re-analyze
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {product.primaryKeywords.map((kw, index) => (
                    <div key={index} className="bg-slate-900/50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium text-sm">{kw.keyword}</span>
                        <Badge variant="secondary" className={`text-xs ${getStatusColor(kw.status)}`}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(kw.status)}
                            <span>{kw.status}</span>
                          </div>
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Current:</span>
                          <span className="text-white font-semibold">{kw.density}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Target:</span>
                          <span className="text-slate-300">{kw.target}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              kw.status === 'optimal' ? 'bg-green-500' :
                              kw.status === 'good' ? 'bg-blue-500' :
                              kw.status === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${Math.min((kw.density / kw.target) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}