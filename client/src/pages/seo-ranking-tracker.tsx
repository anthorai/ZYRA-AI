import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import NotificationCenter from "@/components/dashboard/notification-center";
import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/hooks/useLogout";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Search,
  Award,
  Target,
  User, 
  LogOut, 
  Settings as SettingsIcon,
  Eye,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";

export default function SeoRankingTracker() {
  const { user } = useAuth();
  const { handleLogout } = useLogout();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const onLogoutClick = () => {
    handleLogout("/auth"); // Standardized logout with error handling and notifications
  };

  const handleGoBack = () => {
    window.history.back();
  };

  // Mock ranking data
  const rankingData = [
    {
      id: "1",
      keyword: "wireless headphones",
      currentRank: 3,
      previousRank: 7,
      change: 4,
      trend: "up",
      searchVolume: 12500,
      difficulty: "Medium",
      productName: "Wireless Bluetooth Headphones",
      url: "/products/wireless-headphones",
      lastUpdate: "2024-01-18"
    },
    {
      id: "2",
      keyword: "fitness tracker watch",
      currentRank: 5,
      previousRank: 5,
      change: 0,
      trend: "stable",
      searchVolume: 8900,
      difficulty: "High",
      productName: "Smart Fitness Watch",
      url: "/products/fitness-watch",
      lastUpdate: "2024-01-18"
    },
    {
      id: "3",
      keyword: "portable power bank",
      currentRank: 2,
      previousRank: 9,
      change: 7,
      trend: "up",
      searchVolume: 6750,
      difficulty: "Low",
      productName: "Portable Power Bank",
      url: "/products/power-bank",
      lastUpdate: "2024-01-18"
    },
    {
      id: "4",
      keyword: "gaming mouse wireless",
      currentRank: 8,
      previousRank: 4,
      change: -4,
      trend: "down",
      searchVolume: 4200,
      difficulty: "Medium",
      productName: "Wireless Gaming Mouse", 
      url: "/products/gaming-mouse",
      lastUpdate: "2024-01-18"
    },
    {
      id: "5",
      keyword: "bluetooth earbuds",
      currentRank: 6,
      previousRank: 12,
      change: 6,
      trend: "up",
      searchVolume: 15200,
      difficulty: "High",
      productName: "True Wireless Earbuds",
      url: "/products/earbuds",
      lastUpdate: "2024-01-18"
    }
  ];

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === "up") return <ArrowUp className="w-4 h-4 text-green-400" />;
    if (trend === "down") return <ArrowDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const getTrendColor = (trend: string) => {
    if (trend === "up") return "bg-green-500/20 text-green-400";
    if (trend === "down") return "bg-red-500/20 text-red-400"; 
    return "bg-slate-500/20 text-slate-400";
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Low": return "bg-green-500/20 text-green-400";
      case "Medium": return "bg-yellow-500/20 text-yellow-400";
      case "High": return "bg-red-500/20 text-red-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const averageRank = (rankingData.reduce((sum, item) => sum + item.currentRank, 0) / rankingData.length).toFixed(1);
  const improvingKeywords = rankingData.filter(item => item.change > 0).length;
  const totalVolume = rankingData.reduce((sum, item) => sum + item.searchVolume, 0);

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
                SEO Ranking Tracker
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm lg:text-base truncate">
                Track keyword positions and search visibility over time
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
                  onClick={onLogoutClick}
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
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl gradient-card">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0">
                <div className="p-2 sm:p-2.5 md:p-3 rounded-full bg-slate-800/50 flex-shrink-0">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-bold text-base sm:text-lg md:text-xl truncate">#{averageRank}</h3>
                  <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Avg Rank</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl gradient-card">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0">
                <div className="p-2 sm:p-2.5 md:p-3 rounded-full bg-slate-800/50 flex-shrink-0">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-bold text-base sm:text-lg md:text-xl truncate">{improvingKeywords}</h3>
                  <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Improving</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl gradient-card">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0">
                <div className="p-2 sm:p-2.5 md:p-3 rounded-full bg-slate-800/50 flex-shrink-0">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-bold text-base sm:text-lg md:text-xl truncate">{rankingData.length}</h3>
                  <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Keywords Tracked</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl gradient-card">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0">
                <div className="p-2 sm:p-2.5 md:p-3 rounded-full bg-slate-800/50 flex-shrink-0">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-bold text-base sm:text-lg md:text-xl truncate">{(totalVolume / 1000).toFixed(0)}K</h3>
                  <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Search Volume</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Keyword Rankings */}
        <Card className="dark-theme-bg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Keyword Rankings</CardTitle>
                <CardDescription className="text-slate-300">
                  Monitor your search engine rankings for targeted keywords
                </CardDescription>
              </div>
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-white/10">
                <RefreshCw className="w-4 h-4 mr-2" />
                Update Rankings
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {rankingData.map((item) => (
              <div key={item.id} className="bg-slate-800/30 rounded-lg p-4">
                <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-center">
                  <div className="lg:col-span-2">
                    <h3 className="text-white font-semibold">{item.keyword}</h3>
                    <p className="text-slate-400 text-sm">{item.productName}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-2xl font-bold text-white">#{item.currentRank}</span>
                      {item.change !== 0 && (
                        <Badge variant="secondary" className={getTrendColor(item.trend)}>
                          <div className="flex items-center space-x-1">
                            {getTrendIcon(item.trend, item.change)}
                            <span>{Math.abs(item.change)}</span>
                          </div>
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs mt-1">Current Rank</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-lg font-semibold text-slate-300">{item.searchVolume.toLocaleString()}</p>
                    <p className="text-slate-400 text-xs">Search Volume</p>
                  </div>
                  
                  <div className="text-center">
                    <Badge variant="secondary" className={getDifficultyColor(item.difficulty)}>
                      {item.difficulty}
                    </Badge>
                    <p className="text-slate-400 text-xs mt-1">Difficulty</p>
                  </div>
                  
                  <div className="flex space-x-2 justify-end">
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-white/10">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button size="sm" className="gradient-button">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      History
                    </Button>
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