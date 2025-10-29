import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { useToast } from "@/hooks/use-toast";
import { 
  RotateCcw,
  Send
} from "lucide-react";

export default function MultiChannelRepurposingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [productDescription, setProductDescription] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  const handleGenerateContent = () => {
    toast({
      title: "Content Generated!",
      description: `AI generated multi-channel content for: ${productDescription}`,
    });
  };

  return (
    <PageShell
      title="Multi-Channel Repurposing"
      subtitle="Generate optimized content for all marketing channels with AI"
      
    >
      <DashboardCard
        title="Product Description"
        description="Enter your product description to generate content for all channels"
        testId="card-product-description"
      >
        <div className="space-y-6">
          <div>
            <Label className="text-white text-lg">Product Description</Label>
            <Textarea
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              placeholder="Enter your product description here..."
              className="mt-2 form-textarea text-white text-lg"
              rows={4}
            />
          </div>
          <Button onClick={handleGenerateContent} className="gradient-button px-8 py-3 text-lg">
            Generate AI Content
          </Button>
        </div>
      </DashboardCard>
      
      {productDescription && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl">
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="text-white text-base sm:text-lg md:text-xl flex items-center min-w-0">
                <Checkbox className="mr-2 sm:mr-3 flex-shrink-0" onCheckedChange={(checked) => {
                  if (checked) setSelectedChannels([...selectedChannels, 'email']);
                  else setSelectedChannels(selectedChannels.filter(c => c !== 'email'));
                }} />
                <span className="truncate">Email Subject + Body</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="space-y-2 sm:space-y-3 text-slate-300 text-[10px] sm:text-xs md:text-sm">
                <div className="truncate"><strong className="text-primary">Subject:</strong> "Transform Your Routine with Our Latest Innovation!"</div>
                <div className="line-clamp-3"><strong className="text-primary">Body:</strong> "Discover how our product can revolutionize your daily experience with cutting-edge features designed for modern lifestyles..."</div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl">
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="text-white text-base sm:text-lg md:text-xl flex items-center min-w-0">
                <Checkbox className="mr-2 sm:mr-3 flex-shrink-0" onCheckedChange={(checked) => {
                  if (checked) setSelectedChannels([...selectedChannels, 'sms']);
                  else setSelectedChannels(selectedChannels.filter(c => c !== 'sms'));
                }} />
                <span className="truncate">SMS Copy</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm line-clamp-4">
                "🎉 Limited time: 20% off your favorite product! Get yours before it's gone. Shop now: [link]"
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl">
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="text-white text-base sm:text-lg md:text-xl flex items-center min-w-0">
                <Checkbox className="mr-2 sm:mr-3 flex-shrink-0" onCheckedChange={(checked) => {
                  if (checked) setSelectedChannels([...selectedChannels, 'social']);
                  else setSelectedChannels(selectedChannels.filter(c => c !== 'social'));
                }} />
                <span className="truncate">Social Post Caption</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm line-clamp-4">
                "Ready to level up? 🚀 Our community loves this game-changer! Perfect for anyone looking to upgrade their daily routine. #Innovation #ProductLove #GameChanger"
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl">
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="text-white text-base sm:text-lg md:text-xl flex items-center min-w-0">
                <Checkbox className="mr-2 sm:mr-3 flex-shrink-0" onCheckedChange={(checked) => {
                  if (checked) setSelectedChannels([...selectedChannels, 'seo']);
                  else setSelectedChannels(selectedChannels.filter(c => c !== 'seo'));
                }} />
                <span className="truncate">SEO Snippet</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm line-clamp-4">
                "Premium quality product designed for modern lifestyle. Advanced features, reliable performance, and exceptional value. Free shipping, 30-day returns. Order today!"
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {selectedChannels.length > 0 && (
        <div className="flex justify-end">
          <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg">
            <Send className="w-5 h-5 mr-2" />
            Publish Selected ({selectedChannels.length})
          </Button>
        </div>
      )}
    </PageShell>
  );
}
