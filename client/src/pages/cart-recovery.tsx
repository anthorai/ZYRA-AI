import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnifiedHeader } from "@/components/ui/unified-header";
import { DashboardCard, MetricCard } from "@/components/ui/dashboard-card";
import { PageShell } from "@/components/ui/page-shell";
import { useStoreCurrency } from "@/hooks/use-store-currency";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils";
import { 
  ShoppingCart, 
  TrendingUp, 
  DollarSign,
  Users,
  RefreshCw,
  Target
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

export default function CartRecovery() {
  const [, setLocation] = useLocation();
  const { currency } = useStoreCurrency();
  const currencySymbol = getCurrencySymbol(currency);

  const { data: cartRecoveryData, isLoading } = useQuery<{
    overview: {
      totalCarts: number;
      recoveredCarts: number;
      recoveryRate: number;
      totalValue: number;
      recoveredValue: number;
      potentialRevenue: number;
      campaignsSent: number;
      conversionRate: number;
    };
  }>({
    queryKey: ['/api/analytics/cart-recovery'],
  });

  const overview = cartRecoveryData?.overview || {
    totalCarts: 0,
    recoveredCarts: 0,
    recoveryRate: 0,
    totalValue: 0,
    recoveredValue: 0,
    potentialRevenue: 0,
    campaignsSent: 0,
    conversionRate: 0,
  };

  const recoveryPieData = [
    { name: 'Recovered', value: overview.recoveredCarts, color: '#00F0FF' },
    { name: 'Lost', value: overview.totalCarts - overview.recoveredCarts, color: '#475569' }
  ];

  const revenuePotentialData = [
    { category: 'Recovered', value: overview.recoveredValue },
    { category: 'Potential', value: overview.potentialRevenue },
    { category: 'Total Value', value: overview.totalValue }
  ];

  return (
    <PageShell
      title="Cart Recovery Analytics"
      subtitle="Track abandoned cart recovery campaigns and revenue impact"
      backTo="/dashboard"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <MetricCard
            icon={<ShoppingCart className="w-6 h-6" />}
            title="Abandoned Carts"
            value={isLoading ? "..." : overview.totalCarts}
            testId="card-abandoned-carts"
          />
          <MetricCard
            icon={<RefreshCw className="w-6 h-6" />}
            title="Recovered Carts"
            value={isLoading ? "..." : overview.recoveredCarts}
            testId="card-recovered-carts"
          />
          <MetricCard
            icon={<Target className="w-6 h-6" />}
            title="Recovery Rate"
            value={isLoading ? "..." : `${overview.recoveryRate.toFixed(1)}%`}
            testId="card-recovery-rate"
          />
          <MetricCard
            icon={<DollarSign className="w-6 h-6" />}
            title="Recovered Value"
            value={isLoading ? "..." : formatCurrency(overview.recoveredValue, currency)}
            testId="card-recovered-value"
          />
        </div>

        <Tabs defaultValue="recovery" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Recovery Analytics</h2>
            <TabsList className="bg-slate-800/50">
              <TabsTrigger value="recovery" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                Recovery Rate
              </TabsTrigger>
              <TabsTrigger value="revenue" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                Revenue Potential
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="recovery">
            <DashboardCard
              title="Cart Recovery Distribution"
              description="Visualization of recovered vs lost abandoned carts"
            >
              {isLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <Skeleton className="h-full w-full bg-slate-700" />
                </div>
              ) : overview.totalCarts > 0 ? (
                <>
                  <div className="flex justify-center">
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie
                          data={recoveryPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {recoveryPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#f1f5f9'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                      <p className="text-slate-400 text-sm">Recovery Rate</p>
                      <p className="text-white font-bold text-lg mt-1">
                        {overview.recoveryRate.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                      <p className="text-slate-400 text-sm">Campaigns Sent</p>
                      <p className="text-white font-bold text-lg mt-1">{overview.campaignsSent}</p>
                    </div>
                    <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                      <p className="text-slate-400 text-sm">Conversion Rate</p>
                      <p className="text-white font-bold text-lg mt-1">
                        {overview.conversionRate.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                      <p className="text-slate-400 text-sm">Campaign Success</p>
                      <p className="text-white font-bold text-lg mt-1">
                        {overview.campaignsSent > 0 
                          ? `${overview.recoveredCarts}/${overview.campaignsSent}`
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-80 flex items-center justify-center text-slate-400">
                  No cart recovery data available
                </div>
              )}
            </DashboardCard>
          </TabsContent>

          <TabsContent value="revenue">
            <DashboardCard
              title="Revenue Potential Analysis"
              description="Track recovered revenue vs potential earnings from abandoned carts"
            >
              {isLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <Skeleton className="h-full w-full bg-slate-700" />
                </div>
              ) : overview.totalCarts > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={320}>
                    <RechartsBarChart data={revenuePotentialData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="category" 
                        stroke="#94a3b8" 
                        tick={{ fill: '#94a3b8' }}
                      />
                      <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#f1f5f9'
                        }}
                        formatter={(value: any) => [formatCurrency(value, currency), 'Amount']}
                      />
                      <Bar dataKey="value" name={`Revenue (${currencySymbol})`}>
                        {revenuePotentialData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={
                            entry.category === 'Recovered' ? '#00F0FF' : 
                            entry.category === 'Potential' ? '#A78BFA' : 
                            '#10B981'
                          } />
                        ))}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                      <p className="text-slate-400 text-sm">Total Cart Value</p>
                      <p className="text-white font-bold text-lg mt-1">
                        {formatCurrency(overview.totalValue, currency)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                      <p className="text-slate-400 text-sm">Recovered Revenue</p>
                      <p className="text-white font-bold text-lg mt-1">
                        {formatCurrency(overview.recoveredValue, currency)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                      <p className="text-slate-400 text-sm">Potential Revenue</p>
                      <p className="text-white font-bold text-lg mt-1">
                        {formatCurrency(overview.potentialRevenue, currency)}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-80 flex items-center justify-center text-slate-400">
                  No revenue data available
                </div>
              )}
            </DashboardCard>
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}
