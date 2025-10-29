import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles,
  ShoppingCart,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function AIUpsellSuggestionsPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const mockProducts = [
    { id: 1, name: "Wireless Bluetooth Headphones", price: 89.99, image: "/api/placeholder/60/60" },
    { id: 2, name: "Smart Fitness Watch", price: 199.99, image: "/api/placeholder/60/60" },
    { id: 3, name: "Portable Phone Charger", price: 24.99, image: "/api/placeholder/60/60" },
    { id: 4, name: "Premium Coffee Beans", price: 18.99, image: "/api/placeholder/60/60" }
  ];

  const handleApproveUpsell = (productId: number) => {
    toast({
      title: "Upsell Approved!",
      description: `Product ${productId} approved for AI upsell suggestions.`,
    });
  };

  const handleRejectUpsell = (productId: number) => {
    toast({
      title: "Upsell Rejected",
      description: `Product ${productId} removed from upsell suggestions.`,
    });
  };

  return (
    <PageShell
      title="AI Upsell Suggestions"
      subtitle="AI-powered product recommendations to boost your average order value"
      backTo="/dashboard"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {mockProducts.map((product) => (
          <Card key={product.id} className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl dark-theme-bg">
            <CardContent className="p-3 sm:p-4 md:p-6 overflow-hidden">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-slate-700 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-10 h-10 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium text-lg">{product.name}</h4>
                  <p className="text-primary font-bold text-xl">${product.price}</p>
                  <p className="text-slate-400 text-sm mt-1">AI Confidence: 87%</p>
                  <div className="flex space-x-3 mt-4">
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 text-white flex-1"
                      onClick={() => handleApproveUpsell(product.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-red-600 text-red-400 hover:bg-red-600/20 flex-1"
                      onClick={() => handleRejectUpsell(product.id)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Insights Card */}
      <DashboardCard
        title="AI Insights"
        description="Based on customer behavior analysis"
        testId="card-ai-insights"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <div className="text-center overflow-hidden">
            <div className="text-3xl font-bold text-primary">+24%</div>
            <div className="text-slate-300 text-sm">Revenue Increase</div>
            <div className="text-slate-400 text-xs">vs. manual upsells</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">87%</div>
            <div className="text-slate-300 text-sm">Accuracy Rate</div>
            <div className="text-slate-400 text-xs">customer acceptance</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">1,247</div>
            <div className="text-slate-300 text-sm">Products Analyzed</div>
            <div className="text-slate-400 text-xs">in your catalog</div>
          </div>
        </div>
      </DashboardCard>
    </PageShell>
  );
}
