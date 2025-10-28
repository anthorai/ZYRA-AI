import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NotificationCenter from "@/components/dashboard/notification-center";
import { CardPageHeader, PageContainer } from "@/components/ui/standardized-layout";
import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/hooks/useLogout";
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
    <div className="min-h-screen dark-theme-bg">
      <CardPageHeader title="Cart Recovery Analytics" />
      <PageContainer>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl gradient-card">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="p-2 sm:p-3 rounded-full bg-slate-800/50 flex-shrink-0">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  {isLoading ? (
                    <Skeleton className="h-6 sm:h-8 w-16 sm:w-20 mb-2" />
                  ) : (
                    <h3 className="text-white font-bold text-base sm:text-lg md:text-xl truncate">{overview.totalCarts}</h3>
                  )}
                  <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Abandoned Carts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl gradient-card">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="p-2 sm:p-3 rounded-full bg-slate-800/50 flex-shrink-0">
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  {isLoading ? (
                    <Skeleton className="h-6 sm:h-8 w-16 sm:w-20 mb-2" />
                  ) : (
                    <h3 className="text-white font-bold text-base sm:text-lg md:text-xl truncate">{overview.recoveredCarts}</h3>
                  )}
                  <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Recovered Carts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl gradient-card">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="p-2 sm:p-3 rounded-full bg-slate-800/50 flex-shrink-0">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  {isLoading ? (
                    <Skeleton className="h-6 sm:h-8 w-16 sm:w-20 mb-2" />
                  ) : (
                    <h3 className="text-white font-bold text-base sm:text-lg md:text-xl truncate">{overview.recoveryRate.toFixed(1)}%</h3>
                  )}
                  <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Recovery Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl gradient-card">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="p-2 sm:p-3 rounded-full bg-slate-800/50 flex-shrink-0">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  {isLoading ? (
                    <Skeleton className="h-6 sm:h-8 w-16 sm:w-20 mb-2" />
                  ) : (
                    <h3 className="text-white font-bold text-base sm:text-lg md:text-xl truncate">${overview.recoveredValue}</h3>
                  )}
                  <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Recovered Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
            <Card className="gradient-card rounded-2xl">
              <CardHeader>
                <CardTitle className="text-white">Cart Recovery Distribution</CardTitle>
                <CardDescription className="text-slate-300">
                  Visualization of recovered vs lost abandoned carts
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue">
            <Card className="gradient-card rounded-2xl">
              <CardHeader>
                <CardTitle className="text-white">Revenue Potential Analysis</CardTitle>
                <CardDescription className="text-slate-300">
                  Track recovered revenue vs potential earnings from abandoned carts
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                          formatter={(value: any) => [`$${value}`, 'Amount']}
                        />
                        <Bar dataKey="value" name="Revenue ($)">
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
                          ${overview.totalValue}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                        <p className="text-slate-400 text-sm">Recovered Revenue</p>
                        <p className="text-white font-bold text-lg mt-1">
                          ${overview.recoveredValue}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                        <p className="text-slate-400 text-sm">Potential Revenue</p>
                        <p className="text-white font-bold text-lg mt-1">
                          ${overview.potentialRevenue}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-80 flex items-center justify-center text-slate-400">
                    No revenue data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </PageContainer>
    </div>
  );
}
