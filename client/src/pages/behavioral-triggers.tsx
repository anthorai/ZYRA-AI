import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageContainer, CardPageHeader } from "@/components/ui/standardized-layout";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain,
  ArrowRight,
  Sparkles,
  Plus
} from "lucide-react";

export default function BehavioralTriggersPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [newTrigger, setNewTrigger] = useState({
    event: "",
    condition: "",
    action: ""
  });

  const handleSaveTrigger = () => {
    toast({
      title: "Trigger Saved!",
      description: "New behavioral trigger has been created successfully.",
    });
    setNewTrigger({ event: "", condition: "", action: "" });
  };

  const aiRecommendations = [
    "Send welcome email after first purchase",
    "SMS discount for 3+ product views without purchase", 
    "Follow-up email 7 days after order",
    "Abandoned cart email after 2 hours",
    "VIP upgrade offer for high-value customers"
  ];

  const existingTriggers = [
    { id: 1, event: "View Product", condition: "3+ views", action: "Send Email", status: "Active" },
    { id: 2, event: "Cart Value", condition: "Over $200", action: "Offer Discount", status: "Active" },
    { id: 3, event: "Order Placed", condition: "First order", action: "Send SMS", status: "Paused" }
  ];

  return (
    <div className="min-h-screen dark-theme-bg">
      <CardPageHeader title="Behavioral Triggers Setup" />
      <PageContainer>
          {/* Create New Trigger */}
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Create New Trigger
              </CardTitle>
              <CardDescription className="text-slate-300">
                Set up automated actions based on customer behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-white text-lg block mb-2">Event</label>
                  <Select value={newTrigger.event} onValueChange={(value) => setNewTrigger({...newTrigger, event: value})}>
                    <SelectTrigger className="form-select text-white">
                      <SelectValue placeholder="Select event" />
                    </SelectTrigger>
                    <SelectContent className="gradient-surface">
                      <SelectItem value="view-product">View Product</SelectItem>
                      <SelectItem value="cart-value">Cart Value</SelectItem>
                      <SelectItem value="order-placed">Order Placed</SelectItem>
                      <SelectItem value="page-visit">Page Visit</SelectItem>
                      <SelectItem value="time-on-site">Time on Site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-white text-lg block mb-2">Condition</label>
                  <Select value={newTrigger.condition} onValueChange={(value) => setNewTrigger({...newTrigger, condition: value})}>
                    <SelectTrigger className="form-select text-white">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent className="gradient-surface">
                      <SelectItem value="3-views">3+ views</SelectItem>
                      <SelectItem value="over-200">Over $200</SelectItem>
                      <SelectItem value="first-order">First order</SelectItem>
                      <SelectItem value="return-customer">Return customer</SelectItem>
                      <SelectItem value="5-minutes">5+ minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-white text-lg block mb-2">Action</label>
                  <Select value={newTrigger.action} onValueChange={(value) => setNewTrigger({...newTrigger, action: value})}>
                    <SelectTrigger className="form-select text-white">
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent className="gradient-surface">
                      <SelectItem value="send-email">Send Email</SelectItem>
                      <SelectItem value="send-sms">Send SMS</SelectItem>
                      <SelectItem value="offer-discount">Offer Discount</SelectItem>
                      <SelectItem value="show-popup">Show Popup</SelectItem>
                      <SelectItem value="assign-tag">Assign Tag</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                onClick={handleSaveTrigger} 
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
                disabled={!newTrigger.event || !newTrigger.condition || !newTrigger.action}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Save Trigger
              </Button>
            </CardContent>
          </Card>

          {/* AI Recommended Triggers */}
          <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl gradient-card">
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="text-white text-base sm:text-lg md:text-xl flex items-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 text-primary flex-shrink-0" />
                <span className="truncate min-w-0">AI Recommended Triggers</span>
              </CardTitle>
              <CardDescription className="text-slate-300 text-[10px] sm:text-xs md:text-sm">
                Based on your store's performance and industry best practices
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {aiRecommendations.map((recommendation, index) => (
                  <Card key={index} className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl bg-slate-800/50">
                    <CardContent className="p-3 sm:p-4 md:p-6">
                      <div className="space-y-3">
                        <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm min-w-0 line-clamp-3">{recommendation}</p>
                        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 w-full text-[10px] sm:text-xs md:text-sm">
                          Apply
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Existing Triggers */}
          <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl gradient-card">
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="text-white text-base sm:text-lg md:text-xl">Active Triggers ({existingTriggers.length})</CardTitle>
              <CardDescription className="text-slate-300 text-[10px] sm:text-xs md:text-sm">
                Manage your existing behavioral triggers
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {existingTriggers.map((trigger) => (
                  <Card key={trigger.id} className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl bg-slate-800/50">
                    <CardContent className="p-3 sm:p-4 md:p-6">
                      <div className="space-y-3 min-w-0">
                        <div className="min-w-0">
                          <div className="text-white font-medium text-[10px] sm:text-xs md:text-sm truncate">
                            {trigger.event}
                          </div>
                          <div className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs truncate">
                            {trigger.condition} → {trigger.action}
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[9px] sm:text-[10px] px-2 py-1 rounded-full flex-shrink-0 ${
                            trigger.status === 'Active' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {trigger.status}
                          </span>
                          <div className="flex space-x-1 min-w-0">
                            <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 text-[9px] sm:text-[10px] px-2 py-1 h-auto">
                              Edit
                            </Button>
                            <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 text-[9px] sm:text-[10px] px-2 py-1 h-auto truncate">
                              {trigger.status === 'Active' ? 'Pause' : 'Activate'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Analytics */}
          <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl gradient-card">
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="text-white text-base sm:text-lg md:text-xl">Trigger Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                <div className="text-center min-w-0">
                  <div className="text-lg sm:text-2xl md:text-3xl font-bold text-primary truncate">1,847</div>
                  <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Triggers Fired</div>
                  <div className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs truncate">this month</div>
                </div>
                <div className="text-center min-w-0">
                  <div className="text-lg sm:text-2xl md:text-3xl font-bold text-primary truncate">34%</div>
                  <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Conversion Rate</div>
                  <div className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs truncate">trigger to action</div>
                </div>
                <div className="text-center min-w-0">
                  <div className="text-lg sm:text-2xl md:text-3xl font-bold text-primary truncate">$12,394</div>
                  <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Revenue Generated</div>
                  <div className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs truncate">from triggers</div>
                </div>
                <div className="text-center min-w-0">
                  <div className="text-lg sm:text-2xl md:text-3xl font-bold text-primary truncate">8.7x</div>
                  <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">ROI</div>
                  <div className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs truncate">vs manual campaigns</div>
                </div>
              </div>
            </CardContent>
          </Card>
      </PageContainer>
    </div>
  );
}