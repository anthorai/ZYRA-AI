import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import {
  Coins,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Download,
  ArrowLeft,
  Zap,
  Search,
  FileText,
  ShieldCheck,
  Mail,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Brain,
  Info
} from "lucide-react";

interface CreditBalance {
  creditsRemaining: number;
  creditsUsed: number;
  creditLimit: number;
  isLow: boolean;
}

interface CreditTransaction {
  id: string;
  actionType: string;
  actionLabel: string;
  creditsUsed: number;
  timestamp: string;
  status: 'success' | 'failed' | 'pending';
  details?: string;
}

interface UsageByType {
  type: string;
  label: string;
  icon: string;
  credits: number;
  percentage: number;
  count: number;
}

interface DailyUsage {
  date: string;
  credits: number;
}

const actionTypeIcons: Record<string, any> = {
  seo_basics: Search,
  product_copy_clarity: FileText,
  trust_signals: ShieldCheck,
  recovery_setup: Mail,
  bulk_optimization: RefreshCw,
  ai_generation: Brain,
  default: Zap
};

const actionTypeColors: Record<string, string> = {
  seo_basics: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  product_copy_clarity: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  trust_signals: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  recovery_setup: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  bulk_optimization: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  ai_generation: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  default: "text-primary bg-primary/10 border-primary/20"
};

export default function Reports() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [timeRange, setTimeRange] = useState("7d");
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch credit balance
  const { data: creditBalance, isLoading: isLoadingBalance } = useQuery<CreditBalance>({
    queryKey: ['/api/credits/balance'],
    enabled: !!user,
  });

  // Fetch credit transactions/history
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<CreditTransaction[]>({
    queryKey: ['/api/credits/transactions', timeRange],
    enabled: !!user,
  });

  // Fetch usage breakdown by type
  const { data: usageByType, isLoading: isLoadingUsageByType } = useQuery<UsageByType[]>({
    queryKey: ['/api/credits/usage-by-type', timeRange],
    enabled: !!user,
  });

  // Fetch daily usage for chart
  const { data: dailyUsage, isLoading: isLoadingDailyUsage } = useQuery<DailyUsage[]>({
    queryKey: ['/api/credits/daily-usage', timeRange],
    enabled: !!user,
  });

  // Calculate usage percentage
  const usagePercentage = creditBalance 
    ? Math.round((creditBalance.creditsUsed / creditBalance.creditLimit) * 100) 
    : 0;

  const getStatusBadge = () => {
    if (!creditBalance) return null;
    if (creditBalance.creditsRemaining === 0) {
      return <Badge variant="outline" className="text-red-400 border-red-500/30 bg-red-500/10">Empty</Badge>;
    }
    if (creditBalance.isLow) {
      return <Badge variant="outline" className="text-yellow-400 border-yellow-500/30 bg-yellow-500/10">Low</Badge>;
    }
    return <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10">Healthy</Badge>;
  };

  // Use real data from API - show empty states when no data
  const displayTransactions = transactions || [];
  const displayUsageByType = usageByType || [];
  const displayDailyUsage = dailyUsage || [];
  const hasTransactions = displayTransactions.length > 0;
  const hasUsageByType = displayUsageByType.length > 0;
  const hasDailyUsage = displayDailyUsage.length > 0;

  const maxDailyCredits = hasDailyUsage 
    ? Math.max(...displayDailyUsage.map((d: DailyUsage) => d.credits), 1) 
    : 1;

  return (
    <div className="min-h-screen dark-theme-bg">
      {/* Header */}
      <div className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/dashboard")}
                className="text-slate-400 hover:text-white"
                data-testid="button-back-to-dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2" data-testid="text-page-title">
                  <BarChart3 className="w-6 h-6 text-primary" />
                  Credit Reports
                </h1>
                <p className="text-sm text-slate-400" data-testid="text-page-subtitle">
                  Track your AI credit usage and optimize your workflow
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700" data-testid="select-time-range">
                  <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d" data-testid="select-option-7d">Last 7 days</SelectItem>
                  <SelectItem value="30d" data-testid="select-option-30d">Last 30 days</SelectItem>
                  <SelectItem value="90d" data-testid="select-option-90d">Last 90 days</SelectItem>
                  <SelectItem value="all" data-testid="select-option-all">All time</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="gap-2" data-testid="button-export">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Credit Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Credits */}
          <Card className="bg-gradient-to-br from-primary/10 via-slate-900/50 to-slate-900/50 border-primary/20" data-testid="card-total-credits">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-primary" />
                </div>
                {getStatusBadge()}
              </div>
              {isLoadingBalance ? (
                <Skeleton className="h-8 w-24 mb-2" />
              ) : (
                <div className="text-3xl font-bold text-white mb-1" data-testid="text-credits-remaining">
                  {creditBalance?.creditsRemaining ?? 0}
                </div>
              )}
              <p className="text-sm text-slate-400">Credits Remaining</p>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Used: {creditBalance?.creditsUsed ?? 0}</span>
                  <span>Limit: {creditBalance?.creditLimit ?? 100}</span>
                </div>
                <Progress value={usagePercentage} className="h-2" data-testid="progress-credits-usage" />
              </div>
            </CardContent>
          </Card>

          {/* Credits Used */}
          <Card className="bg-slate-900/50 border-slate-800/50" data-testid="card-credits-used">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-400" />
                </div>
                <Badge variant="outline" className="text-blue-400 border-blue-500/30">
                  {timeRange === "7d" ? "This Week" : timeRange === "30d" ? "This Month" : "Period"}
                </Badge>
              </div>
              {isLoadingBalance ? (
                <Skeleton className="h-8 w-24 mb-2" />
              ) : (
                <div className="text-3xl font-bold text-white mb-1" data-testid="text-credits-used">
                  {creditBalance?.creditsUsed ?? 0}
                </div>
              )}
              <p className="text-sm text-slate-400">Credits Used</p>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">+12%</span>
                <span className="text-slate-500">vs last period</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions Completed */}
          <Card className="bg-slate-900/50 border-slate-800/50" data-testid="card-actions-completed">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
              {isLoadingTransactions ? (
                <Skeleton className="h-8 w-24 mb-2" />
              ) : (
                <div className="text-3xl font-bold text-white mb-1" data-testid="text-actions-count">
                  {displayTransactions.length}
                </div>
              )}
              <p className="text-sm text-slate-400">Actions Completed</p>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-slate-400">All successful</span>
              </div>
            </CardContent>
          </Card>

          {/* Avg Credits/Action */}
          <Card className="bg-slate-900/50 border-slate-800/50" data-testid="card-avg-credits">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <PieChart className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              {isLoadingBalance ? (
                <Skeleton className="h-8 w-24 mb-2" />
              ) : (
                <div className="text-3xl font-bold text-white mb-1" data-testid="text-avg-credits">
                  {displayTransactions.length > 0 
                    ? Math.round(displayTransactions.reduce((sum, t) => sum + t.creditsUsed, 0) / displayTransactions.length)
                    : 0}
                </div>
              )}
              <p className="text-sm text-slate-400">Avg Credits / Action</p>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">-5%</span>
                <span className="text-slate-500">more efficient</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid="tab-overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="breakdown" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid="tab-breakdown">
              <PieChart className="w-4 h-4 mr-2" />
              Breakdown
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid="tab-history">
              <Clock className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Usage Chart */}
              <Card className="bg-slate-900/50 border-slate-800/50" data-testid="card-daily-chart">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Daily Credit Usage
                  </CardTitle>
                  <CardDescription>Credits consumed each day</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingDailyUsage ? (
                    <div className="flex items-end justify-between gap-2 h-48">
                      {[...Array(7)].map((_, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                          <Skeleton className="w-full h-20 rounded-t-lg" />
                          <Skeleton className="w-8 h-4" />
                        </div>
                      ))}
                    </div>
                  ) : !hasDailyUsage ? (
                    <div className="flex items-center justify-center h-48 text-slate-500">
                      <div className="text-center">
                        <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No usage data available for this period</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-end justify-between gap-2 h-48">
                      {displayDailyUsage.map((day, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                          <div 
                            className="w-full bg-gradient-to-t from-primary/80 to-primary/40 rounded-t-lg transition-all duration-300 hover:from-primary hover:to-primary/60"
                            style={{ height: `${(day.credits / maxDailyCredits) * 100}%`, minHeight: '4px' }}
                            data-testid={`bar-day-${idx}`}
                          />
                          <span className="text-xs text-slate-500">{day.date}</span>
                          <span className="text-xs font-medium text-slate-300">{day.credits}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Usage by Type */}
              <Card className="bg-slate-900/50 border-slate-800/50" data-testid="card-usage-by-type">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-purple-400" />
                    Usage by Action Type
                  </CardTitle>
                  <CardDescription>Where your credits are going</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingUsageByType ? (
                    <div className="space-y-4">
                      {[...Array(4)].map((_, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-6 w-16" />
                          </div>
                          <Skeleton className="h-1.5 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : !hasUsageByType ? (
                    <div className="flex items-center justify-center h-32 text-slate-500">
                      <div className="text-center">
                        <PieChart className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No action types used yet</p>
                      </div>
                    </div>
                  ) : (
                    displayUsageByType.map((usage, idx) => {
                      const IconComponent = actionTypeIcons[usage.type] || actionTypeIcons.default;
                      const colorClass = actionTypeColors[usage.type] || actionTypeColors.default;
                      
                      return (
                        <div key={idx} className="space-y-2" data-testid={`usage-type-${idx}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${colorClass}`}>
                                <IconComponent className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{usage.label}</p>
                                <p className="text-xs text-slate-500">{usage.count} actions</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-white">{usage.credits}</p>
                              <p className="text-xs text-slate-500">{usage.percentage}%</p>
                            </div>
                          </div>
                          <Progress value={usage.percentage} className="h-1.5" />
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <Card className="bg-slate-900/50 border-slate-800/50" data-testid="card-quick-stats">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-400" />
                  Quick Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white" data-testid="text-most-used">SEO Optimization</p>
                      <p className="text-xs text-slate-400">Most used action</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white" data-testid="text-peak-time">2-4 PM</p>
                      <p className="text-xs text-slate-400">Peak usage time</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white" data-testid="text-efficiency">92%</p>
                      <p className="text-xs text-slate-400">Success rate</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Breakdown Tab */}
          <TabsContent value="breakdown" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayUsageByType.map((usage, idx) => {
                const IconComponent = actionTypeIcons[usage.type] || actionTypeIcons.default;
                const colorClass = actionTypeColors[usage.type] || actionTypeColors.default;
                
                return (
                  <Card key={idx} className="bg-slate-900/50 border-slate-800/50 hover-elevate" data-testid={`breakdown-card-${idx}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center border ${colorClass}`}>
                          <IconComponent className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white">{usage.label}</h3>
                          <p className="text-sm text-slate-400 mb-4">{usage.count} actions completed</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-2xl font-bold text-white">{usage.credits}</p>
                              <p className="text-xs text-slate-500">Credits used</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-white">{usage.percentage}%</p>
                              <p className="text-xs text-slate-500">Of total</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-800/50" data-testid="card-transaction-history">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-400" />
                  Credit Transaction History
                </CardTitle>
                <CardDescription>Detailed log of all credit usage</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTransactions ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-40 mb-2" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                ) : !hasTransactions ? (
                  <div className="text-center py-12">
                    <Coins className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No transactions yet</p>
                    <p className="text-sm text-slate-500">Your credit usage will appear here after running AI optimizations</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayTransactions.map((tx, idx) => {
                      const IconComponent = actionTypeIcons[tx.actionType] || actionTypeIcons.default;
                      const colorClass = actionTypeColors[tx.actionType] || actionTypeColors.default;
                      
                      return (
                        <div 
                          key={tx.id} 
                          className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 hover-elevate"
                          data-testid={`transaction-row-${idx}`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colorClass}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-white truncate">{tx.actionLabel}</p>
                              <Badge 
                                variant="outline" 
                                className={tx.status === 'success' 
                                  ? 'text-emerald-400 border-emerald-500/30 text-[10px]' 
                                  : tx.status === 'failed' 
                                    ? 'text-red-400 border-red-500/30 text-[10px]' 
                                    : 'text-yellow-400 border-yellow-500/30 text-[10px]'
                                }
                              >
                                {tx.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{tx.details}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-white flex items-center gap-1">
                              <Coins className="w-3.5 h-3.5 text-primary" />
                              -{tx.creditsUsed}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Upgrade CTA if low on credits */}
        {creditBalance?.isLow && (
          <Card className="mt-8 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border-primary/30" data-testid="card-upgrade-cta">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Running low on credits</h3>
                    <p className="text-sm text-slate-400">Upgrade your plan to unlock more AI-powered optimizations</p>
                  </div>
                </div>
                <Button className="gap-2" onClick={() => setLocation("/billing")} data-testid="button-upgrade">
                  Upgrade Plan
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
