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
import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/hooks/useLogout";
import { 
  ArrowLeft, 
  ShoppingCart, 
  TrendingUp, 
  DollarSign,
  Users,
  User, 
  LogOut, 
  Settings as SettingsIcon,
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
  const { user, appUser } = useAuth();
  const { handleLogout } = useLogout();
  const [, setLocation] = useLocation();

  const onLogoutClick = () => {
    handleLogout("/auth");
  };

  const handleGoBack = () => {
    setLocation('/dashboard');
  };

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
      <header className="dark-theme-bg backdrop-blur-sm border-b border-border/50 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl">
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
                Cart Recovery Analytics
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm lg:text-base truncate">
                Track abandoned cart recovery performance and potential revenue
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
                    <AvatarImage src="" alt={appUser?.fullName || "User"} />
                    <AvatarFallback className="dark-theme-bg text-primary">
                      {appUser?.fullName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 dark-theme-bg text-white" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-bold text-white text-sm">{appUser?.fullName || "User"}</p>
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

      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-slate-800/50">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 mb-2" />
                  ) : (
                    <h3 className="text-white font-bold text-2xl">{overview.totalCarts}</h3>
                  )}
                  <p className="text-slate-300 text-sm">Abandoned Carts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-slate-800/50">
                  <RefreshCw className="w-6 h-6 text-primary" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 mb-2" />
                  ) : (
                    <h3 className="text-white font-bold text-2xl">{overview.recoveredCarts}</h3>
                  )}
                  <p className="text-slate-300 text-sm">Recovered Carts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-slate-800/50">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 mb-2" />
                  ) : (
                    <h3 className="text-white font-bold text-2xl">{overview.recoveryRate.toFixed(1)}%</h3>
                  )}
                  <p className="text-slate-300 text-sm">Recovery Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-slate-800/50">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 mb-2" />
                  ) : (
                    <h3 className="text-white font-bold text-2xl">${overview.recoveredValue}</h3>
                  )}
                  <p className="text-slate-300 text-sm">Recovered Value</p>
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
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    <div className="mt-6 grid grid-cols-3 gap-4">
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
    </div>
  );
}
