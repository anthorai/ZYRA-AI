import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AvatarMenu } from "@/components/ui/avatar-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  ArrowLeft,
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

  const handleGoBack = () => {
    setLocation('/dashboard');
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
              <h1 className="font-bold text-white text-base sm:text-lg lg:text-xl xl:text-2xl truncate flex items-center">
                <Brain className="w-5 h-5 text-primary mr-2" />
                Behavioral Triggers Setup
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm lg:text-base truncate">
                Configure automated triggers based on customer behavior
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end space-x-2 sm:space-x-4 flex-shrink-0">
            <AvatarMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-8">
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
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-primary" />
                AI Recommended Triggers
              </CardTitle>
              <CardDescription className="text-slate-300">
                Based on your store's performance and industry best practices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiRecommendations.map((recommendation, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors">
                  <span className="text-slate-300 flex-1">{recommendation}</span>
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 ml-4">
                    Apply
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Existing Triggers */}
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="text-white text-xl">Active Triggers ({existingTriggers.length})</CardTitle>
              <CardDescription className="text-slate-300">
                Manage your existing behavioral triggers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {existingTriggers.map((trigger) => (
                  <div key={trigger.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-600">
                    <div className="flex-1">
                      <div className="text-white font-medium text-lg">
                        {trigger.event} → {trigger.condition} → {trigger.action}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          trigger.status === 'Active' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {trigger.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
                        {trigger.status === 'Active' ? 'Pause' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Analytics */}
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="text-white text-xl">Trigger Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">1,847</div>
                  <div className="text-slate-300">Triggers Fired</div>
                  <div className="text-slate-400 text-sm">this month</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">34%</div>
                  <div className="text-slate-300">Conversion Rate</div>
                  <div className="text-slate-400 text-sm">trigger to action</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">$12,394</div>
                  <div className="text-slate-300">Revenue Generated</div>
                  <div className="text-slate-400 text-sm">from triggers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">8.7x</div>
                  <div className="text-slate-300">ROI</div>
                  <div className="text-slate-400 text-sm">vs manual campaigns</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}