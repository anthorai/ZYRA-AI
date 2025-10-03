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
  Zap, 
  TrendingUp, 
  Award,
  Target,
  Users,
  MousePointer,
  User, 
  LogOut, 
  Settings as SettingsIcon,
  Eye,
  BarChart3,
  Trophy,
  Activity
} from "lucide-react";

export default function ABTestResults() {
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

  // Mock A/B test data
  const abTests = [
    {
      id: "1",
      testName: "Product Description Length",
      status: "completed",
      duration: 14,
      participants: 2847,
      variantA: {
        name: "Short Description",
        visitors: 1423,
        conversions: 89,
        conversionRate: 6.3,
        revenue: 3247.50
      },
      variantB: {
        name: "Detailed Description",
        visitors: 1424,
        conversions: 127,
        conversionRate: 8.9,
        revenue: 4632.80
      },
      winner: "B",
      significance: 95.4,
      improvement: 41.3,
      startDate: "2024-01-04",
      endDate: "2024-01-18"
    },
    {
      id: "2",
      testName: "Email Subject Line A/B Test",
      status: "completed",
      duration: 7,
      participants: 5640,
      variantA: {
        name: "Question Format",
        visitors: 2820,
        conversions: 198,
        conversionRate: 7.0,
        revenue: 5847.20
      },
      variantB: {
        name: "Urgent Format",
        visitors: 2820,
        conversions: 254,
        conversionRate: 9.0,
        revenue: 7294.60
      },
      winner: "B",
      significance: 98.2,
      improvement: 28.6,
      startDate: "2024-01-11",
      endDate: "2024-01-18"
    },
    {
      id: "3",
      testName: "CTA Button Color",
      status: "running",
      duration: 5,
      participants: 1840,
      variantA: {
        name: "Blue Button",
        visitors: 920,
        conversions: 67,
        conversionRate: 7.3,
        revenue: 2156.40
      },
      variantB: {
        name: "Orange Button", 
        visitors: 920,
        conversions: 78,
        conversionRate: 8.5,
        revenue: 2547.90
      },
      winner: "B",
      significance: 87.6,
      improvement: 16.4,
      startDate: "2024-01-13",
      endDate: "2024-01-20"
    },
    {
      id: "4",
      testName: "SMS Recovery Timing",
      status: "completed",
      duration: 21,
      participants: 3250,
      variantA: {
        name: "1 Hour Delay",
        visitors: 1625,
        conversions: 142,
        conversionRate: 8.7,
        revenue: 4521.30
      },
      variantB: {
        name: "3 Hour Delay",
        visitors: 1625,
        conversions: 98,
        conversionRate: 6.0,
        revenue: 3124.70
      },
      winner: "A",
      significance: 96.8,
      improvement: 45.0,
      startDate: "2023-12-28",
      endDate: "2024-01-18"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/20 text-green-400";
      case "running": return "bg-blue-500/20 text-blue-400";
      case "draft": return "bg-slate-500/20 text-slate-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getSignificanceColor = (significance: number) => {
    if (significance >= 95) return "bg-green-500/20 text-green-400";
    if (significance >= 80) return "bg-yellow-500/20 text-yellow-400";
    return "bg-red-500/20 text-red-400";
  };

  const totalTests = abTests.length;
  const completedTests = abTests.filter(test => test.status === "completed").length;
  const avgImprovement = (abTests.filter(test => test.status === "completed").reduce((sum, test) => sum + test.improvement, 0) / completedTests).toFixed(1);
  const totalParticipants = abTests.reduce((sum, test) => sum + test.participants, 0);

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
                A/B Test Results
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm lg:text-base truncate">
                Performance comparison of different content versions and optimization tests
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
              <DropdownMenuContent className="w-56 gradient-surface/50 text-white" align="end" forceMount>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-slate-800/50">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-2xl">{totalTests}</h3>
                  <p className="text-slate-300 text-sm">Total Tests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-slate-800/50">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-2xl">{completedTests}</h3>
                  <p className="text-slate-300 text-sm">Completed</p>
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
                  <h3 className="text-white font-bold text-2xl">+{avgImprovement}%</h3>
                  <p className="text-slate-300 text-sm">Avg Improvement</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-slate-800/50">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-2xl">{(totalParticipants / 1000).toFixed(1)}K</h3>
                  <p className="text-slate-300 text-sm">Participants</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* A/B Test Results */}
        <Card className="dark-theme-bg /50">
          <CardHeader>
            <CardTitle className="text-white">A/B Test Performance</CardTitle>
            <CardDescription className="text-slate-300">
              Compare different versions and track which optimizations perform better
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {abTests.map((test) => (
              <div key={test.id} className="bg-slate-800/30 rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-lg">{test.testName}</h3>
                    <div className="flex items-center space-x-3 mt-2">
                      <Badge variant="secondary" className={getStatusColor(test.status)}>
                        {test.status}
                      </Badge>
                      <Badge variant="secondary" className={getSignificanceColor(test.significance)}>
                        {test.significance}% significance
                      </Badge>
                      <span className="text-slate-400 text-sm">
                        {test.duration} days • {test.participants.toLocaleString()} participants
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
                  <div className={`bg-slate-900/50 p-4 rounded-lg ${test.winner === 'A' ? 'border border-yellow-500/30' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-slate-300 font-medium">Variant A: {test.variantA.name}</h4>
                      {test.winner === 'A' && (
                        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                          <Award className="w-3 h-3 mr-1" />
                          Winner
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-400">Visitors</p>
                        <p className="text-white font-semibold">{test.variantA.visitors.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Conversions</p>
                        <p className="text-white font-semibold">{test.variantA.conversions}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Conv. Rate</p>
                        <p className="text-white font-semibold">{test.variantA.conversionRate}%</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Revenue</p>
                        <p className="text-white font-semibold">${test.variantA.revenue.toFixed(0)}</p>
                      </div>
                    </div>
                  </div>

                  <div className={`bg-slate-900/50 p-4 rounded-lg ${test.winner === 'B' ? 'border border-yellow-500/30' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-slate-300 font-medium">Variant B: {test.variantB.name}</h4>
                      {test.winner === 'B' && (
                        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                          <Award className="w-3 h-3 mr-1" />
                          Winner
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-400">Visitors</p>
                        <p className="text-white font-semibold">{test.variantB.visitors.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Conversions</p>
                        <p className="text-white font-semibold">{test.variantB.conversions}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Conv. Rate</p>
                        <p className="text-white font-semibold">{test.variantB.conversionRate}%</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Revenue</p>
                        <p className="text-white font-semibold">${test.variantB.revenue.toFixed(0)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {test.status === 'completed' && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-green-400 font-medium">
                        Variant {test.winner} won with {test.improvement}% improvement
                      </span>
                      <span className="text-green-400 text-sm">
                        {test.significance}% statistical significance
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}