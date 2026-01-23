import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { PageShell } from "@/components/ui/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingBag,
  Mail,
  MessageSquare,
  Target,
  BarChart3,
  AlertCircle
} from "lucide-react";

interface RevenueStats {
  totalRevenue: number;
  totalProofs: number;
  successfulProofs: number;
  pendingProofs: number;
  revenueByType: Record<string, number>;
  recentProofs: Array<{
    id: string;
    revenueDelta: string;
    verdict: string;
    createdAt: string;
  }>;
}

export default function RevenueImpact() {
  const [, setLocation] = useLocation();

  const { data: stats, isLoading, error } = useQuery<RevenueStats>({
    queryKey: ['/api/revenue-loop/stats'],
  });

  const totalRevenue = stats?.totalRevenue || 0;
  const hasData = totalRevenue > 0 || (stats?.totalProofs || 0) > 0;

  const getRevenueBreakdown = () => {
    if (!stats?.revenueByType) return [];
    
    const breakdown = [];
    const types = stats.revenueByType;
    const total = Object.values(types).reduce((sum, val) => sum + (Number(val) || 0), 0);
    
    if (types.seo_optimization && Number(types.seo_optimization) > 0) {
      breakdown.push({
        id: "seo",
        source: "SEO Optimization",
        icon: <Target className="w-6 h-6 text-primary" />,
        revenue: Number(types.seo_optimization),
        percentage: total > 0 ? (Number(types.seo_optimization) / total) * 100 : 0,
        description: "Revenue from improved search rankings"
      });
    }
    
    if (types.product_optimization && Number(types.product_optimization) > 0) {
      breakdown.push({
        id: "products",
        source: "Product Optimization",
        icon: <ShoppingBag className="w-6 h-6 text-primary" />,
        revenue: Number(types.product_optimization),
        percentage: total > 0 ? (Number(types.product_optimization) / total) * 100 : 0,
        description: "Revenue from AI-enhanced product descriptions"
      });
    }
    
    if (types.cart_recovery && Number(types.cart_recovery) > 0) {
      breakdown.push({
        id: "cart",
        source: "Cart Recovery",
        icon: <MessageSquare className="w-6 h-6 text-primary" />,
        revenue: Number(types.cart_recovery),
        percentage: total > 0 ? (Number(types.cart_recovery) / total) * 100 : 0,
        description: "Revenue from recovered abandoned carts"
      });
    }
    
    if (types.email_campaign && Number(types.email_campaign) > 0) {
      breakdown.push({
        id: "email",
        source: "Email Campaigns",
        icon: <Mail className="w-6 h-6 text-primary" />,
        revenue: Number(types.email_campaign),
        percentage: total > 0 ? (Number(types.email_campaign) / total) * 100 : 0,
        description: "Revenue from AI-optimized email marketing"
      });
    }
    
    return breakdown;
  };

  const revenueBreakdown = getRevenueBreakdown();

  if (isLoading) {
    return (
      <PageShell
        title="Revenue Impact"
        subtitle="Track revenue from ZYRA optimizations"
        backTo="/dashboard"
      >
        <DashboardCard>
          <div className="p-8 text-center space-y-4">
            <Skeleton className="h-12 w-12 rounded-full mx-auto" />
            <Skeleton className="h-12 w-48 mx-auto" />
            <Skeleton className="h-6 w-64 mx-auto" />
          </div>
        </DashboardCard>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell
        title="Revenue Impact"
        subtitle="Track revenue from ZYRA optimizations"
        backTo="/dashboard"
      >
        <DashboardCard>
          <div className="p-8 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Unable to load revenue data</h2>
            <p className="text-muted-foreground">Please try again later</p>
          </div>
        </DashboardCard>
      </PageShell>
    );
  }

  if (!hasData) {
    return (
      <PageShell
        title="Revenue Impact"
        subtitle="Track revenue from ZYRA optimizations"
        backTo="/dashboard"
      >
        <DashboardCard>
          <div className="p-8 text-center space-y-4">
            <div className="p-4 rounded-full bg-slate-800/50 inline-flex">
              <DollarSign className="w-12 h-12 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">No Revenue Data Yet</h2>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Revenue tracking will appear here once ZYRA completes optimizations and proves their impact on your store's sales.
              </p>
              <Button 
                className="mt-6" 
                onClick={() => setLocation('/dashboard')}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            </div>
          </div>
        </DashboardCard>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Revenue Impact"
      subtitle="Track revenue from ZYRA optimizations"
      backTo="/dashboard"
    >
      <DashboardCard>
        <div className="p-8">
          <div className="text-center space-y-4">
            <div className="p-4 rounded-full bg-slate-800/50 inline-flex">
              <DollarSign className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <p className="text-xl text-muted-foreground mt-2">Total Revenue Added</p>
              {stats?.successfulProofs && stats.successfulProofs > 0 && (
                <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-lg px-4 py-2 mt-4">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  {stats.successfulProofs} Successful Optimizations
                </Badge>
              )}
            </div>
          </div>
        </div>
      </DashboardCard>

      {revenueBreakdown.length > 0 && (
        <DashboardCard
          title="Revenue Breakdown by Source"
          description="Revenue attributed to each optimization type"
        >
          <div className="space-y-4">
            {revenueBreakdown.map((item) => (
              <div key={item.id} className="bg-slate-800/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-full bg-slate-800/50">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-foreground font-semibold text-lg">{item.source}</h3>
                      <p className="text-muted-foreground text-sm">{item.description}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="w-full bg-slate-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-primary to-blue-400 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">{item.percentage.toFixed(1)}% of total</p>
                  </div>
                  <div className="ml-6 text-right">
                    <p className="text-2xl font-bold text-foreground">
                      ${item.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      )}

      {stats?.recentProofs && stats.recentProofs.length > 0 && (
        <DashboardCard
          title="Recent Revenue Proofs"
          description="Latest optimization results"
        >
          <div className="space-y-3">
            {stats.recentProofs.slice(0, 5).map((proof) => (
              <div key={proof.id} className="bg-slate-800/30 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    proof.verdict === 'success' ? 'bg-green-500' : 
                    proof.verdict === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="text-muted-foreground text-sm">
                    {new Date(proof.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <span className={`font-semibold ${
                  Number(proof.revenueDelta) > 0 ? 'text-green-400' : 'text-muted-foreground'
                }`}>
                  {Number(proof.revenueDelta) > 0 ? '+' : ''}
                  ${Number(proof.revenueDelta).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={() => setLocation('/ai-tools/activity-timeline')}>
              <BarChart3 className="w-4 h-4 mr-2" />
              View All Activity
            </Button>
          </div>
        </DashboardCard>
      )}
    </PageShell>
  );
}
