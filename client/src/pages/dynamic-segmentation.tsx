import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { useToast } from "@/hooks/use-toast";
import { 
  Users
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

  return (
    <PageShell
      title="Dynamic Segmentation"
      subtitle="Automatically segment customers based on behavior and spending patterns"
      
    >
      {mockCustomerSegments.map((segment) => (
        <DashboardCard 
          key={segment.id}
          testId={`card-segment-${segment.id}`}
        >
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
        </DashboardCard>
      ))}
      <div className="flex justify-end">
        <Button onClick={handleSaveSegments} className="gradient-button px-8 py-3 text-lg">
          Save Segments
        </Button>
      </div>
    </PageShell>
  );
}
