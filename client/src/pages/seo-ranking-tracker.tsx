import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import NotificationCenter from "@/components/dashboard/notification-center";
import { UnifiedHeader } from "@/components/ui/unified-header";
import { DashboardCard, MetricCard } from "@/components/ui/dashboard-card";
import { PageShell } from "@/components/ui/page-shell";
import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/hooks/useLogout";
import { useToast } from "@/hooks/use-toast";
import { 
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
    handleLogout("/auth");
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

  // Right actions (notification center + user dropdown)
  const rightActions = (
    <>
      <NotificationCenter />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 w-10 rounded-full text-slate-200 hover:text-primary transition-all duration-300 ease-in-out"
            data-testid="button-user-menu"
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
            onClick={onLogoutClick}
            data-testid="menu-logout"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  return (
    <PageShell
      title="SEO Ranking Tracker"
      subtitle="Track keyword positions and search visibility over time"
      rightActions={rightActions}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <MetricCard
          icon={<Award className="w-6 h-6" />}
          title="Avg Rank"
          value={`#${averageRank}`}
          testId="card-avg-rank"
        />
        <MetricCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="Improving"
          value={improvingKeywords}
          testId="card-improving-keywords"
        />
        <MetricCard
          icon={<Search className="w-6 h-6" />}
          title="Keywords Tracked"
          value={rankingData.length}
          testId="card-keywords-tracked"
        />
        <MetricCard
          icon={<Target className="w-6 h-6" />}
          title="Search Volume"
          value={`${(totalVolume / 1000).toFixed(0)}K`}
          testId="card-search-volume"
        />
      </div>

      {/* Keyword Rankings */}
      <DashboardCard
        title={
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white text-xl font-semibold">Keyword Rankings</h3>
              <p className="text-slate-300 text-sm mt-1">
                Monitor your search engine rankings for targeted keywords
              </p>
            </div>
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-white/10">
              <RefreshCw className="w-4 h-4 mr-2" />
              Update Rankings
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
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
        </div>
      </DashboardCard>
    </PageShell>
  );
}
