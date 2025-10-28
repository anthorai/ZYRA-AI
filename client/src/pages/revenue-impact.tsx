import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PageContainer, CardPageHeader } from "@/components/ui/standardized-layout";
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingBag,
  Mail,
  MessageSquare,
  Target,
  Eye,
  BarChart3
} from "lucide-react";

export default function RevenueImpact() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Mock revenue impact data by source
  const revenueBreakdown = [
    {
      id: "1",
      source: "Optimized Products",
      icon: <ShoppingBag className="w-6 h-6 text-primary" />,
      revenue: 45623.80,
      percentage: 42.5,
      growth: "+156%",
      description: "Revenue from AI-enhanced product descriptions"
    },
    {
      id: "2",
      source: "Email Campaigns",
      icon: <Mail className="w-6 h-6 text-primary" />,
      revenue: 28847.50,
      percentage: 26.8,
      growth: "+89%",
      description: "Revenue from AI-optimized email marketing"
    },
    {
      id: "3", 
      source: "SMS Conversions",
      icon: <MessageSquare className="w-6 h-6 text-primary" />,
      revenue: 18924.30,
      percentage: 17.6,
      growth: "+234%",
      description: "Revenue from SMS cart recovery campaigns"
    },
    {
      id: "4",
      source: "SEO Improvements",
      icon: <Target className="w-6 h-6 text-primary" />,
      revenue: 14156.40,
      percentage: 13.1,
      growth: "+78%",
      description: "Revenue from improved search rankings"
    }
  ];

  const totalRevenue = revenueBreakdown.reduce((sum, item) => sum + item.revenue, 0);

  // Mock monthly data
  const monthlyData = [
    { month: "Oct 2023", revenue: 15840.50 },
    { month: "Nov 2023", revenue: 23150.75 },
    { month: "Dec 2023", revenue: 34620.90 },
    { month: "Jan 2024", revenue: 52847.30 }
  ];

  return (
    <div className="min-h-screen dark-theme-bg">
      <CardPageHeader title="Revenue Impact" />
      <div className="container mx-auto py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6">
        <PageContainer>
        {/* Total Impact Card */}
        <Card className="dark-theme-bg">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="p-4 rounded-full bg-slate-800/50 inline-flex">
                <DollarSign className="w-12 h-12 text-primary" />
              </div>
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-white">${totalRevenue.toLocaleString()}</h2>
                <p className="text-xl text-slate-300 mt-2">Total Revenue Added This Month</p>
                <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-lg px-4 py-2 mt-4">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  +134% vs Last Month
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card className="dark-theme-bg">
          <CardHeader>
            <CardTitle className="text-white">Revenue Breakdown by Source</CardTitle>
            <CardDescription className="text-slate-300">
              See how different Zyra AI features contribute to your revenue growth
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {revenueBreakdown.map((item) => (
              <div key={item.id} className="bg-slate-800/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-full bg-slate-800/50">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">{item.source}</h3>
                      <p className="text-slate-400 text-sm">{item.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 mb-2">
                      {item.growth}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="w-full bg-slate-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-primary to-blue-400 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <p className="text-slate-400 text-sm mt-1">{item.percentage}% of total</p>
                  </div>
                  <div className="ml-6 text-right">
                    <p className="text-2xl font-bold text-white">${item.revenue.toLocaleString()}</p>
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-white/10 mt-2">
                      <Eye className="w-4 h-4 mr-2" />
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="dark-theme-bg">
          <CardHeader>
            <CardTitle className="text-white">Monthly Revenue Trend</CardTitle>
            <CardDescription className="text-slate-300">
              Track your revenue growth powered by Zyra AI over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {monthlyData.map((month, index) => (
                <div key={index} className="bg-slate-800/30 rounded-lg p-4 text-center">
                  <h4 className="text-slate-300 font-medium">{month.month}</h4>
                  <p className="text-2xl font-bold text-white mt-2">${month.revenue.toLocaleString()}</p>
                  {index > 0 && (
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-xs mt-2">
                      +{(((month.revenue - monthlyData[index-1].revenue) / monthlyData[index-1].revenue) * 100).toFixed(0)}%
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Button className="gradient-button">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Detailed Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
        </PageContainer>
      </div>
    </div>
  );
}