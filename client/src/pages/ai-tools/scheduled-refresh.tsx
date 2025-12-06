import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { 
  RefreshCw,
  CheckCircle,
  Clock,
  Zap,
  Calendar,
  TrendingUp,
  AlertCircle,
  Settings,
  Play,
  Pause
} from "lucide-react";

interface ScheduleForm {
  frequency: string;
  productCategories: string;
  seasonalKeywords: boolean;
  trendingKeywords: boolean;
  notifyOnUpdate: boolean;
}

interface ScheduleStatus {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  nextRun: string;
  lastRun: string;
  productsUpdated: number;
  frequency: string;
}

export default function ScheduledRefresh() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [schedules, setSchedules] = useState<ScheduleStatus[]>([
    {
      id: '1',
      name: 'Electronics Seasonal Update',
      status: 'active',
      nextRun: '2024-02-15',
      lastRun: '2024-01-15',
      productsUpdated: 47,
      frequency: 'Monthly'
    },
    {
      id: '2',
      name: 'Fashion Trend Refresh',
      status: 'active',
      nextRun: '2024-02-01',
      lastRun: '2024-01-01',
      productsUpdated: 123,
      frequency: 'Monthly'
    }
  ]);

  const categories = [
    "All Products",
    "Electronics",
    "Fashion & Apparel",
    "Home & Garden",
    "Beauty & Personal Care",
    "Sports & Outdoors",
    "Toys & Games",
    "Books & Media",
    "Food & Beverage",
    "Health & Wellness",
    "Automotive",
    "Pet Supplies",
    "Office & Stationery",
    "Baby & Kids",
    "Arts & Crafts",
    "Jewelry & Accessories",
    "Tools & Hardware",
    "Musical Instruments"
  ];

  const form = useForm<ScheduleForm>({
    defaultValues: {
      frequency: "monthly",
      productCategories: "",
      seasonalKeywords: true,
      trendingKeywords: true,
      notifyOnUpdate: true,
    },
  });


  // Mock schedule creation mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (data: ScheduleForm) => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newSchedule: ScheduleStatus = {
        id: Date.now().toString(),
        name: `${data.productCategories || 'All Products'} Auto-Refresh`,
        status: 'active',
        nextRun: getNextRunDate(data.frequency),
        lastRun: 'Never',
        productsUpdated: 0,
        frequency: data.frequency.charAt(0).toUpperCase() + data.frequency.slice(1)
      };
      
      return newSchedule;
    },
    onSuccess: (result) => {
      setSchedules(prev => [...prev, result]);
      form.reset();
      toast({
        title: "📅 Schedule Created!",
        description: `Auto-refresh schedule is now active. Next update: ${result.nextRun}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Schedule creation failed",
        description: error.message || "Failed to create refresh schedule",
        variant: "destructive",
      });
    },
  });

  // Mock manual refresh mutation
  const manualRefreshMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const updatedCount = Math.floor(Math.random() * 50) + 10;
      return { scheduleId, updatedCount };
    },
    onSuccess: (result) => {
      setSchedules(prev => prev.map(schedule => 
        schedule.id === result.scheduleId 
          ? { 
              ...schedule, 
              lastRun: new Date().toISOString().split('T')[0],
              productsUpdated: schedule.productsUpdated + result.updatedCount
            }
          : schedule
      ));
      
      toast({
        title: "🔄 Refresh Complete!",
        description: `Updated ${result.updatedCount} products with fresh content and keywords.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Manual refresh failed",
        description: error.message || "Failed to refresh products",
        variant: "destructive",
      });
    },
  });

  const getNextRunDate = (frequency: string) => {
    const today = new Date();
    switch (frequency) {
      case 'weekly':
        today.setDate(today.getDate() + 7);
        break;
      case 'monthly':
        today.setMonth(today.getMonth() + 1);
        break;
      case 'quarterly':
        today.setMonth(today.getMonth() + 3);
        break;
      default:
        today.setMonth(today.getMonth() + 1);
    }
    return today.toISOString().split('T')[0];
  };

  const onSubmit = (data: ScheduleForm) => {
    createScheduleMutation.mutate(data);
  };

  const toggleSchedule = (scheduleId: string) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.id === scheduleId 
        ? { 
            ...schedule, 
            status: schedule.status === 'active' ? 'paused' : 'active'
          }
        : schedule
    ));
    
    const schedule = schedules.find(s => s.id === scheduleId);
    toast({
      title: schedule?.status === 'active' ? "Schedule Paused" : "Schedule Activated",
      description: schedule?.status === 'active' 
        ? "Auto-refresh has been paused" 
        : "Auto-refresh is now active",
    });
  };

  const runManualRefresh = (scheduleId: string) => {
    manualRefreshMutation.mutate(scheduleId);
  };

  return (
    <PageShell
      title="Scheduled Refresh"
      subtitle="Automatically update product content with seasonal trends and fresh keywords"
      backTo="/dashboard?tab=ai-tools"
    >
      {/* Benefits Overview */}
      <DashboardCard
        title="Why Schedule Content Refresh?"
        description="Keep your content fresh and relevant with automated, recurring updates"
      >
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-green-400/20 text-green-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-slate-300">Keep content fresh with seasonal trends</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-400/20 text-blue-400 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-slate-300">Automatic SEO keyword updates</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-purple-400/20 text-purple-400 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <span className="text-slate-300">Maintain search ranking positions</span>
              </div>
            </div>
      </DashboardCard>

      {/* Active Schedules */}
      <DashboardCard
        title="Active Refresh Schedules"
        description="Manage your automated content refresh schedules"
      >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {schedules.map((schedule) => (
                <Card key={schedule.id} className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl">
                  <CardContent className="p-3 sm:p-4 md:p-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          schedule.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'
                        }`} />
                        <h3 className="text-lg font-semibold text-white">{schedule.name}</h3>
                        <Badge className={`${
                          schedule.status === 'active' ? 'bg-green-400/20 text-green-300' : 'bg-yellow-400/20 text-yellow-300'
                        }`}>
                          {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleSchedule(schedule.id)}
                          className="text-white border-slate-600"
                        >
                          {schedule.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => runManualRefresh(schedule.id)}
                          disabled={manualRefreshMutation.isPending}
                          className="text-primary border-primary/30 hover:bg-primary/10"
                        >
                          {manualRefreshMutation.isPending ? (
                            <Clock className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Frequency:</span>
                        <div className="text-white font-medium">{schedule.frequency}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Next Run:</span>
                        <div className="text-white font-medium">{schedule.nextRun}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Last Run:</span>
                        <div className="text-white font-medium">{schedule.lastRun}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Products Updated:</span>
                        <div className="text-white font-medium">{schedule.productsUpdated}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
      </DashboardCard>

      {/* Create New Schedule */}
      <DashboardCard
        title="Create New Schedule"
        description="Set up automatic content refresh for your products"
      >
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="frequency" className="text-white">Refresh Frequency</Label>
                  <select 
                    {...form.register("frequency")}
                    className="mt-2 w-full bg-slate-800/50 border border-slate-600 text-white rounded-md px-3 py-2"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly (Recommended)</option>
                    <option value="quarterly">Quarterly (3 months)</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="productCategories" className="text-white">Product Categories (Optional)</Label>
                  <Controller
                    name="productCategories"
                    control={form.control}
                    render={({ field: { value, onChange } }) => (
                      <Select onValueChange={onChange} value={value ?? ""}>
                        <SelectTrigger className="mt-2 bg-slate-800/50 border-slate-600 text-white" data-testid="select-category">
                          <SelectValue placeholder="Select category or leave for all products" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Refresh Options</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Seasonal Keywords</h4>
                      <p className="text-sm text-slate-300">Update keywords based on seasonal trends and holidays</p>
                    </div>
                    <Switch 
                      checked={form.watch("seasonalKeywords")}
                      onCheckedChange={(checked) => form.setValue("seasonalKeywords", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Trending Keywords</h4>
                      <p className="text-sm text-slate-300">Include popular search terms and emerging trends</p>
                    </div>
                    <Switch 
                      checked={form.watch("trendingKeywords")}
                      onCheckedChange={(checked) => form.setValue("trendingKeywords", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Email Notifications</h4>
                      <p className="text-sm text-slate-300">Get notified when products are automatically updated</p>
                    </div>
                    <Switch 
                      checked={form.watch("notifyOnUpdate")}
                      onCheckedChange={(checked) => form.setValue("notifyOnUpdate", checked)}
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={createScheduleMutation.isPending}
                className="w-full gradient-button"
              >
                {createScheduleMutation.isPending ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Creating schedule...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Create Schedule
                  </>
                )}
              </Button>
            </form>
      </DashboardCard>

      {/* Refresh History */}
      <DashboardCard
        title="Recent Activity"
      >
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-slate-800/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div className="flex-1">
                  <div className="text-white font-medium">Electronics Seasonal Update</div>
                  <div className="text-sm text-slate-300">47 products updated with winter keywords</div>
                </div>
                <div className="text-sm text-slate-400">2 hours ago</div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 bg-slate-800/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div className="flex-1">
                  <div className="text-white font-medium">Fashion Trend Refresh</div>
                  <div className="text-sm text-slate-300">123 products updated with trending style keywords</div>
                </div>
                <div className="text-sm text-slate-400">1 day ago</div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 bg-slate-800/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <div className="flex-1">
                  <div className="text-white font-medium">Home & Garden Refresh</div>
                  <div className="text-sm text-slate-300">Schedule paused - manual review required</div>
                </div>
                <div className="text-sm text-slate-400">3 days ago</div>
              </div>
            </div>
      </DashboardCard>
    </PageShell>
  );
}