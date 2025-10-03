import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { AvatarMenu } from "@/components/ui/avatar-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  ArrowLeft
} from "lucide-react";

export default function DynamicSegmentationPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [segmentRules, setSegmentRules] = useState({
    highSpenderThreshold: [500],
    dormantDays: [30],
    oneTimeBuyerDays: [90]
  });

  const mockCustomerSegments = [
    { id: "high-spenders", name: "High Spenders 💰", count: 1247, description: "Customers who spend over $500 annually" },
    { id: "one-time-buyers", name: "One-time Buyers 🛒", count: 3891, description: "Customers with only one purchase" },
    { id: "dormant-users", name: "Dormant Users 😴", count: 567, description: "Customers inactive for 30+ days" }
  ];

  const handleSaveSegments = () => {
    toast({
      title: "Segments Saved!",
      description: "Customer segmentation rules updated successfully.",
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
                <Users className="w-5 h-5 text-primary mr-2" />
                Dynamic Customer Segmentation
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm lg:text-base truncate">
                Configure automatic customer segmentation rules
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
          {mockCustomerSegments.map((segment) => (
            <Card key={segment.id} className="dark-theme-bg  hover:shadow-cyan-500/20 transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-white font-medium text-2xl">{segment.name}</h4>
                    <p className="text-slate-300 text-lg mt-1">{segment.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-primary">{segment.count.toLocaleString()}</div>
                    <div className="text-slate-400 text-sm">customers</div>
                  </div>
                </div>
                {segment.id === 'high-spenders' && (
                  <div className="space-y-4">
                    <Label className="text-white text-lg">Minimum Annual Spend: ${segmentRules.highSpenderThreshold[0]}</Label>
                    <Slider
                      value={segmentRules.highSpenderThreshold}
                      onValueChange={(value) => setSegmentRules({...segmentRules, highSpenderThreshold: value})}
                      max={2000}
                      min={100}
                      step={50}
                      className="mt-4"
                    />
                  </div>
                )}
                {segment.id === 'dormant-users' && (
                  <div className="space-y-4">
                    <Label className="text-white text-lg">Days Inactive: {segmentRules.dormantDays[0]} days</Label>
                    <Slider
                      value={segmentRules.dormantDays}
                      onValueChange={(value) => setSegmentRules({...segmentRules, dormantDays: value})}
                      max={180}
                      min={7}
                      step={7}
                      className="mt-4"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          <div className="flex justify-end">
            <Button onClick={handleSaveSegments} className="gradient-button px-8 py-3 text-lg">
              Save Segments
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}