import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AvatarMenu } from "@/components/ui/avatar-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  ArrowLeft,
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

  const handleGoBack = () => {
    setLocation('/dashboard');
  };

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
                <Sparkles className="w-5 h-5 text-primary mr-2" />
                AI Upsell Suggestions
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm lg:text-base truncate">
                Review and approve AI-suggested upsell products for your customers
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockProducts.map((product) => (
              <Card key={product.id} className="dark-theme-bg  hover:shadow-cyan-500/20 transition-all duration-300">
                <CardContent className="p-6">
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
          <Card className="dark-theme-bg ">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>AI Insights</span>
              </CardTitle>
              <CardDescription className="text-slate-300">
                Based on customer behavior analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}