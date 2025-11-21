import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, TrendingDown, Minus, ShoppingCart, Mail, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useROISummary } from "@/hooks/use-roi-summary";

export function ROISummaryCard() {
  const { data, isLoading } = useROISummary();

  const getTrendIcon = () => {
    if (!data) return <Minus className="w-5 h-5" />;
    switch (data.comparison.trend) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'down':
        return <TrendingDown className="w-5 h-5 text-red-400" />;
      default:
        return <Minus className="w-5 h-5 text-slate-400" />;
    }
  };

  const getTrendColor = () => {
    if (!data) return 'text-slate-400';
    switch (data.comparison.trend) {
      case 'up':
        return 'text-green-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  if (isLoading) {
    return (
      <Card className="gradient-card rounded-2xl shadow-xl border-2 border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-48 bg-slate-700 mb-2" />
              <Skeleton className="h-4 w-64 bg-slate-700" />
            </div>
            <Skeleton className="w-12 h-12 rounded-full bg-slate-700" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-16 w-full bg-slate-700 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-20 bg-slate-700 rounded-lg" />
            <Skeleton className="h-20 bg-slate-700 rounded-lg" />
            <Skeleton className="h-20 bg-slate-700 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentTotal = data?.currentMonth.total || 0;
  const breakdown = data?.currentMonth.breakdown || { cartRecovery: 0, campaigns: 0, aiOptimization: 0 };
  const change = data?.comparison.change || 0;

  return (
    <Card 
      className="gradient-card rounded-2xl shadow-xl border-2 border-primary/20 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300"
      data-testid="card-roi-summary"
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-2xl font-bold text-white">
                Revenue Generated This Month
              </CardTitle>
              <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                {data?.currentMonth.period}
              </Badge>
            </div>
            <CardDescription className="text-slate-300 text-base">
              Total revenue attributed to Zyra AI across all channels
            </CardDescription>
          </div>
          <div className="p-4 rounded-full bg-primary/10 border-2 border-primary/30">
            <DollarSign className="w-8 h-8 text-primary" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Revenue Display */}
        <div className="p-6 bg-slate-800/40 rounded-xl border border-slate-700/50">
          <div className="flex items-baseline gap-4 flex-wrap">
            <h2 className="text-5xl font-bold text-white" data-testid="text-total-revenue">
              ${currentTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <div className={`flex items-center gap-2 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="text-xl font-semibold">
                {change > 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
              <span className="text-sm text-slate-400">vs last month</span>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Cart Recovery */}
          <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/30 hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <ShoppingCart className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-300">Cart Recovery</h3>
            </div>
            <p className="text-2xl font-bold text-white" data-testid="text-cart-recovery-revenue">
              ${breakdown.cartRecovery.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {currentTotal > 0 ? `${((breakdown.cartRecovery / currentTotal) * 100).toFixed(1)}%` : '0%'} of total
            </p>
          </div>

          {/* Email/SMS Campaigns */}
          <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/30 hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Mail className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-300">Marketing Campaigns</h3>
            </div>
            <p className="text-2xl font-bold text-white" data-testid="text-campaign-revenue">
              ${breakdown.campaigns.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {currentTotal > 0 ? `${((breakdown.campaigns / currentTotal) * 100).toFixed(1)}%` : '0%'} of total
            </p>
          </div>

          {/* AI Optimization */}
          <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/30 hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-300">AI Optimization</h3>
            </div>
            <p className="text-2xl font-bold text-white" data-testid="text-ai-optimization-revenue">
              ${breakdown.aiOptimization.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {currentTotal > 0 ? `${((breakdown.aiOptimization / currentTotal) * 100).toFixed(1)}%` : '0%'} of total
            </p>
          </div>
        </div>

        {/* Previous Month Comparison */}
        {data && data.previousMonth.total > 0 && (
          <div className="pt-4 border-t border-slate-700/50">
            <p className="text-sm text-slate-400">
              Previous month ({data.previousMonth.period}): 
              <span className="text-white font-semibold ml-2">
                ${data.previousMonth.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
