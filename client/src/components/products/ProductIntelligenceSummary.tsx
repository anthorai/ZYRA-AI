/**
 * Product Intelligence Summary Bar
 * 
 * Top summary showing aggregate product intelligence:
 * - Total Products
 * - Revenue Protected by ZYRA ($)
 * - Products at Risk
 * - Products Fully Optimized
 * 
 * Purpose: At-a-glance proof of ZYRA's value across entire catalog
 */

import { useQuery } from "@tanstack/react-query";
import { Package, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductIntelligenceSummary {
  totalProducts: number;
  revenueProtected: number;
  productsAtRisk: number;
  productsFullyOptimized: number;
  avgConfidence: number;
}

export function ProductIntelligenceSummaryBar() {
  const { data: summary, isLoading } = useQuery<ProductIntelligenceSummary>({
    queryKey: ['/api/products/intelligence/summary'],
  });
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="gradient-card border-slate-700/50">
            <CardContent className="p-4">
              <Skeleton className="w-10 h-10 rounded-full mb-2" />
              <Skeleton className="h-6 w-16 mb-1" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  const stats = [
    {
      icon: Package,
      value: summary?.totalProducts || 0,
      label: "Total Products",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      valueColor: "text-white",
    },
    {
      icon: Shield,
      value: `$${(summary?.revenueProtected || 0).toLocaleString()}`,
      label: "Revenue Protected",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      valueColor: "text-emerald-400",
    },
    {
      icon: AlertTriangle,
      value: summary?.productsAtRisk || 0,
      label: "Products at Risk",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
      valueColor: summary?.productsAtRisk ? "text-amber-400" : "text-white",
    },
    {
      icon: CheckCircle2,
      value: summary?.productsFullyOptimized || 0,
      label: "Fully Optimized",
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-400",
      valueColor: "text-white",
    },
  ];
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, index) => (
        <Card 
          key={index} 
          className="gradient-card border-slate-700/50"
          data-testid={`card-summary-${index}`}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 rounded-full ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
            </div>
            <p className={`text-xl font-bold mt-2 ${stat.valueColor}`} data-testid={`text-summary-value-${index}`}>
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
