import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import NotificationCenter from "@/components/dashboard/notification-center";
import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/hooks/useLogout";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  MessageSquare, 
  TrendingUp, 
  DollarSign,
  Users,
  ShoppingCart,
  User, 
  LogOut, 
  Settings as SettingsIcon,
  Eye,
  BarChart
} from "lucide-react";

export default function SmsConversion() {
  const { user, appUser } = useAuth();
  const { handleLogout } = useLogout();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const onLogoutClick = () => {
    handleLogout("/auth"); // Standardized logout with error handling and notifications
  };

  const handleGoBack = () => {
    setLocation('/dashboard');
  };

  // Mock SMS campaign data
  const smsCampaigns = [
    {
      id: "1",
      name: "Cart Recovery SMS",
      message: "Hi! You left items in your cart. Complete your order now and save 10%! [Link]",
      sent: 2440,
      delivered: 2398,
      clicked: 287,
      converted: 82,
      revenue: 2847.50,
      conversionRate: 28.6,
      sentDate: "2024-01-18"
    },
    {
      id: "2",
      name: "Flash Sale Alert",
      message: "⚡ FLASH SALE: 50% off everything! Limited time only. Shop now: [Link]",
      sent: 8750,
      delivered: 8690,
      clicked: 1042,
      converted: 312,
      revenue: 8924.75,
      conversionRate: 29.9,
      sentDate: "2024-01-15"
    },
    {
      id: "3",
      name: "Restock Notification",
      message: "Good news! The item you wanted is back in stock. Get yours before it's gone: [Link]",
      sent: 1250,
      delivered: 1238,
      clicked: 198,
      converted: 67,
      revenue: 2156.80,
      conversionRate: 33.8,
      sentDate: "2024-01-12"
    }
  ];

  const totalRevenue = smsCampaigns.reduce((sum, campaign) => sum + campaign.revenue, 0);
  const totalSent = smsCampaigns.reduce((sum, campaign) => sum + campaign.sent, 0);
  const totalConverted = smsCampaigns.reduce((sum, campaign) => sum + campaign.converted, 0);
  const avgConversionRate = (totalConverted / totalSent * 100).toFixed(1);

  return (
    <div className="min-h-screen dark-theme-bg">
      {/* Header */}
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
                SMS Conversion
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm lg:text-base truncate">
                SMS recovery campaigns and sales conversion tracking
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
              <DropdownMenuContent className="w-56 gradient-surface text-white" align="end" forceMount>
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

      {/* Main Content */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-slate-800/50">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-2xl">{totalSent.toLocaleString()}</h3>
                  <p className="text-slate-300 text-sm">Total SMS Sent</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-slate-800/50">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-2xl">{totalConverted}</h3>
                  <p className="text-slate-300 text-sm">Conversions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-slate-800/50">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-2xl">{avgConversionRate}%</h3>
                  <p className="text-slate-300 text-sm">Conversion Rate</p>
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
                  <h3 className="text-white font-bold text-2xl">${totalRevenue.toFixed(0)}</h3>
                  <p className="text-slate-300 text-sm">Revenue Generated</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Performance */}
        <Card className="dark-theme-bg">
          <CardHeader>
            <CardTitle className="text-white">SMS Campaign Performance</CardTitle>
            <CardDescription className="text-slate-300">
              Track abandoned cart recovery and SMS marketing campaign results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {smsCampaigns.length === 0 ? (
              <div className="text-center py-12" data-testid="empty-state-sms-campaigns">
                <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-white mb-2">No SMS campaigns yet</h3>
                <p className="text-slate-300 mb-6">Send your first SMS campaign to recover abandoned carts</p>
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => setLocation('/abandoned-cart-sms')}
                  data-testid="button-create-sms-campaign"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send SMS Campaign
                </Button>
              </div>
            ) : (
              smsCampaigns.map((campaign) => (
                <div key={campaign.id} className="bg-slate-800/30 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-lg">{campaign.name}</h3>
                    <p className="text-slate-300 text-sm max-w-2xl">{campaign.message}</p>
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
                      Details
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{campaign.sent}</p>
                    <p className="text-slate-400 text-sm">Sent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{campaign.delivered}</p>
                    <p className="text-slate-400 text-sm">Delivered</p>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-xs mt-1">
                      {((campaign.delivered / campaign.sent) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{campaign.clicked}</p>
                    <p className="text-slate-400 text-sm">Clicked</p>
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 text-xs mt-1">
                      {((campaign.clicked / campaign.delivered) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{campaign.converted}</p>
                    <p className="text-slate-400 text-sm">Converted</p>
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 text-xs mt-1">
                      {campaign.conversionRate}%
                    </Badge>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">${campaign.revenue.toFixed(0)}</p>
                    <p className="text-slate-400 text-sm">Revenue</p>
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 text-xs mt-1">
                      ${(campaign.revenue / campaign.converted).toFixed(0)} AOV
                    </Badge>
                  </div>
                </div>
              </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}