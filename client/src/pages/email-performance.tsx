import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { PageContainer, CardPageHeader, CardGrid } from "@/components/ui/standardized-layout";
import { 
  Mail, 
  TrendingUp, 
  Users,
  MousePointer,
  Eye,
  BarChart
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart as RechartsBarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function EmailPerformance() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Fetch real campaign data from API
  const { data: campaignsData, isLoading } = useQuery<any[]>({ 
    queryKey: ['/api/campaigns'],
    select: (data) => {
      // Transform API data to match expected format
      return data
        .filter((c: any) => c.status === 'sent' || c.status === 'completed')
        .map((c: any) => ({
          id: c.id,
          name: c.name,
          subject: c.subject || c.name,
          sent: c.sentCount || 0,
          opens: Math.round((c.sentCount || 0) * (c.openRate || 0) / 100),
          clicks: Math.round((c.sentCount || 0) * (c.clickRate || 0) / 100),
          openRate: c.openRate || 0,
          clickRate: c.clickRate || 0,
          sentDate: c.sentDate || c.createdAt
        }));
    }
  });

  const campaigns = campaignsData || [];

  // Calculate summary stats from real data
  const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0);
  const totalOpens = campaigns.reduce((sum, c) => sum + c.opens, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const avgOpenRate = campaigns.length > 0 
    ? (campaigns.reduce((sum, c) => sum + c.openRate, 0) / campaigns.length).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen dark-theme-bg">
      <CardPageHeader title="Email Performance" />
      <PageContainer>

        {/* Summary Cards */}
        <CardGrid>
          <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl gradient-card">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="p-2 sm:p-3 rounded-full bg-slate-800/50 flex-shrink-0">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  {isLoading ? (
                    <Skeleton className="h-6 sm:h-8 w-16 sm:w-20 mb-2" />
                  ) : (
                    <h3 className="text-white font-bold text-base sm:text-lg md:text-xl truncate">{totalSent.toLocaleString()}</h3>
                  )}
                  <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Total Sent</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl gradient-card">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="p-2 sm:p-3 rounded-full bg-slate-800/50 flex-shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  {isLoading ? (
                    <Skeleton className="h-6 sm:h-8 w-16 sm:w-20 mb-2" />
                  ) : (
                    <h3 className="text-white font-bold text-base sm:text-lg md:text-xl truncate">{totalOpens.toLocaleString()}</h3>
                  )}
                  <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Total Opens</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl gradient-card">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="p-2 sm:p-3 rounded-full bg-slate-800/50 flex-shrink-0">
                  <MousePointer className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  {isLoading ? (
                    <Skeleton className="h-6 sm:h-8 w-16 sm:w-20 mb-2" />
                  ) : (
                    <h3 className="text-white font-bold text-base sm:text-lg md:text-xl truncate">{totalClicks.toLocaleString()}</h3>
                  )}
                  <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Total Clicks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl gradient-card">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="p-2 sm:p-3 rounded-full bg-slate-800/50 flex-shrink-0">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  {isLoading ? (
                    <Skeleton className="h-6 sm:h-8 w-16 sm:w-20 mb-2" />
                  ) : (
                    <h3 className="text-white font-bold text-base sm:text-lg md:text-xl truncate">{avgOpenRate}%</h3>
                  )}
                  <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Avg Open Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardGrid>

        {/* Engagement Charts */}
        <Tabs defaultValue="trends" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Performance Analytics</h2>
            <TabsList className="bg-slate-800/50">
              <TabsTrigger value="trends" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                Engagement Trends
              </TabsTrigger>
              <TabsTrigger value="comparison" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                Campaign Comparison
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="trends">
            <Card className="gradient-card rounded-2xl">
              <CardHeader>
                <CardTitle className="text-white">Email Engagement Over Time</CardTitle>
                <CardDescription className="text-slate-300">
                  Track open rates and click rates across all campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <Skeleton className="h-full w-full bg-slate-700" />
                  </div>
                ) : campaigns.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={campaigns.slice(0, 10).reverse()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#94a3b8" 
                          tick={{ fill: '#94a3b8' }}
                          angle={-30}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#f1f5f9'
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="openRate" 
                          stroke="#00F0FF" 
                          strokeWidth={2}
                          name="Open Rate (%)"
                          dot={{ fill: '#00F0FF' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="clickRate" 
                          stroke="#A78BFA" 
                          strokeWidth={2}
                          name="Click Rate (%)"
                          dot={{ fill: '#A78BFA' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                        <p className="text-slate-400 text-sm">Best Open Rate</p>
                        <p className="text-white font-bold text-lg mt-1">
                          {Math.max(...campaigns.map(c => c.openRate)).toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                        <p className="text-slate-400 text-sm">Best Click Rate</p>
                        <p className="text-white font-bold text-lg mt-1">
                          {Math.max(...campaigns.map(c => c.clickRate)).toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                        <p className="text-slate-400 text-sm">Total Campaigns</p>
                        <p className="text-white font-bold text-lg mt-1">{campaigns.length}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-80 flex items-center justify-center text-slate-400">
                    No campaign data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison">
            <Card className="gradient-card rounded-2xl">
              <CardHeader>
                <CardTitle className="text-white">Campaign Performance Comparison</CardTitle>
                <CardDescription className="text-slate-300">
                  Compare engagement metrics across your top performing campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <Skeleton className="h-full w-full bg-slate-700" />
                  </div>
                ) : campaigns.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={320}>
                      <RechartsBarChart data={campaigns.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#94a3b8" 
                          tick={{ fill: '#94a3b8' }}
                          angle={-30}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#f1f5f9'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="openRate" fill="#00F0FF" name="Open Rate (%)" />
                        <Bar dataKey="clickRate" fill="#A78BFA" name="Click Rate (%)" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                      <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                        <p className="text-slate-400 text-sm">Avg Open Rate</p>
                        <p className="text-white font-bold text-lg mt-1">{avgOpenRate}%</p>
                      </div>
                      <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                        <p className="text-slate-400 text-sm">Avg Click Rate</p>
                        <p className="text-white font-bold text-lg mt-1">
                          {campaigns.length > 0 
                            ? (campaigns.reduce((sum, c) => sum + c.clickRate, 0) / campaigns.length).toFixed(1)
                            : "0.0"}%
                        </p>
                      </div>
                      <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                        <p className="text-slate-400 text-sm">Top Performer</p>
                        <p className="text-white font-bold text-sm mt-1">
                          {campaigns.reduce((top, c) => c.openRate > top.openRate ? c : top, campaigns[0]).name.slice(0, 15)}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                        <p className="text-slate-400 text-sm">Engagement Score</p>
                        <p className="text-white font-bold text-lg mt-1">
                          {campaigns.length > 0 
                            ? ((campaigns.reduce((sum, c) => sum + c.openRate + c.clickRate, 0) / campaigns.length) / 2).toFixed(0)
                            : "0"}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-80 flex items-center justify-center text-slate-400">
                    No campaign data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Campaign Performance */}
        <Card className="gradient-card">
          <CardHeader>
            <CardTitle className="text-white">Recent Email Campaigns</CardTitle>
            <CardDescription className="text-slate-300">
              Performance metrics for your latest email marketing campaigns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              // Loading skeleton for campaign data
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-slate-800/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-6 w-1/3" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <div className="flex space-x-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="text-center space-y-2">
                        <Skeleton className="h-8 w-20 mx-auto" />
                        <Skeleton className="h-3 w-16 mx-auto" />
                        <Skeleton className="h-5 w-14 mx-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : campaigns.length === 0 ? (
              <div className="text-center py-12" data-testid="empty-state-campaigns">
                <Mail className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-white mb-2">No email campaigns yet</h3>
                <p className="text-slate-300 mb-6">Create your first email campaign to start engaging with customers</p>
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => setLocation('/email-campaigns')}
                  data-testid="button-create-campaign"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              </div>
            ) : (
              campaigns.map((campaign) => (
                <div key={campaign.id} className="bg-slate-800/30 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-lg">{campaign.name}</h3>
                    <p className="text-slate-300 text-sm">{campaign.subject}</p>
                    <p className="text-slate-400 text-xs mt-1">
                      Sent on {new Date(campaign.sentDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-white/10">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button size="sm" className="gradient-button">
                      <BarChart className="w-4 h-4 mr-2" />
                      Analyze
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  <div className="text-center min-w-0">
                    <p className="text-base sm:text-lg md:text-xl font-bold text-white truncate">{campaign.sent.toLocaleString()}</p>
                    <p className="text-slate-400 text-[10px] sm:text-xs md:text-sm truncate">Sent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{campaign.opens.toLocaleString()}</p>
                    <p className="text-slate-400 text-sm">Opens</p>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-xs mt-1">
                      {campaign.openRate}%
                    </Badge>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{campaign.clicks.toLocaleString()}</p>
                    <p className="text-slate-400 text-sm">Clicks</p>
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 text-xs mt-1">
                      {campaign.clickRate}%
                    </Badge>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">
                      {campaign.opens > 0 ? Math.round(campaign.clicks / campaign.opens * 100) : 0}%
                    </p>
                    <p className="text-slate-400 text-sm">Click-to-Open</p>
                  </div>
                </div>
              </div>
              ))
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </div>
  );
}