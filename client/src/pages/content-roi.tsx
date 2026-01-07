import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UnifiedHeader } from "@/components/ui/unified-header";
import { DashboardCard, MetricCard } from "@/components/ui/dashboard-card";
import { PageShell } from "@/components/ui/page-shell";
import { useToast } from "@/hooks/use-toast";
import { useStoreCurrency } from "@/hooks/use-store-currency";
import { formatCurrency } from "@/lib/utils";
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart,
  BarChart3,
  Calendar,
  Eye,
  ArrowUpRight
} from "lucide-react";

export default function ContentROI() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { currency } = useStoreCurrency();

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
    <PageShell
      title="Content ROI Tracker"
      subtitle="Track sales uplift and revenue impact from AI-optimized content"
      backTo="/dashboard"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <MetricCard
          icon={<DollarSign className="w-6 h-6" />}
          title="Revenue Impact"
          value={formatCurrency(totalImpact, currency)}
          testId="card-revenue-impact"
        />
        <MetricCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="Avg ROI Uplift"
          value={`+${totalUplift}%`}
          testId="card-avg-roi-uplift"
        />
        <MetricCard
          icon={<ShoppingCart className="w-6 h-6" />}
          title="Products Tracked"
          value={roiData.length}
          testId="card-products-tracked"
        />
        <MetricCard
          icon={<Calendar className="w-6 h-6" />}
          title="Days Tracking"
          value={30}
          testId="card-days-tracking"
        />
      </div>

      {/* ROI Performance */}
      <DashboardCard
        title="Content ROI Performance"
        description="Track sales uplift and revenue impact from AI-optimized content"
      >
        <div className="space-y-6">
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
                      <p className="text-xl font-bold text-white">{formatCurrency(item.beforeRevenue, currency)}</p>
                      <p className="text-slate-400 text-xs">{item.ordersBefore} orders</p>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-primary/20">
                      <p className="text-slate-400 text-sm">After</p>
                      <p className="text-xl font-bold text-white">{formatCurrency(item.afterRevenue, currency)}</p>
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
                    +{formatCurrency(item.afterRevenue - item.beforeRevenue, currency)} ({item.uplift}%)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>
    </PageShell>
  );
}
