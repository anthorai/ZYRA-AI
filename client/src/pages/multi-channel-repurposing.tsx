import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AvatarMenu } from "@/components/ui/avatar-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  RotateCcw, 
  ArrowLeft,
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
                <RotateCcw className="w-5 h-5 text-primary mr-2" />
                Multi-Channel Content Generator
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm lg:text-base truncate">
                Generate AI-powered content for multiple marketing channels
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
          <Card className="dark-theme-bg ">
            <CardHeader>
              <CardTitle className="text-white text-xl">Product Description</CardTitle>
              <CardDescription className="text-slate-300">
                Enter your product description to generate content for all channels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
            </CardContent>
          </Card>
          
          {productDescription && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="dark-theme-bg ">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center">
                    <Checkbox className="mr-3" onCheckedChange={(checked) => {
                      if (checked) setSelectedChannels([...selectedChannels, 'email']);
                      else setSelectedChannels(selectedChannels.filter(c => c !== 'email'));
                    }} />
                    Email Subject + Body
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-slate-300">
                    <div><strong className="text-primary">Subject:</strong> "Transform Your Routine with Our Latest Innovation!"</div>
                    <div><strong className="text-primary">Body:</strong> "Discover how our product can revolutionize your daily experience with cutting-edge features designed for modern lifestyles..."</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark-theme-bg ">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center">
                    <Checkbox className="mr-3" onCheckedChange={(checked) => {
                      if (checked) setSelectedChannels([...selectedChannels, 'sms']);
                      else setSelectedChannels(selectedChannels.filter(c => c !== 'sms'));
                    }} />
                    SMS Copy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-slate-300">
                    "🎉 Limited time: 20% off your favorite product! Get yours before it's gone. Shop now: [link]"
                  </div>
                </CardContent>
              </Card>

              <Card className="dark-theme-bg ">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center">
                    <Checkbox className="mr-3" onCheckedChange={(checked) => {
                      if (checked) setSelectedChannels([...selectedChannels, 'social']);
                      else setSelectedChannels(selectedChannels.filter(c => c !== 'social'));
                    }} />
                    Social Post Caption
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-slate-300">
                    "Ready to level up? 🚀 Our community loves this game-changer! Perfect for anyone looking to upgrade their daily routine. #Innovation #ProductLove #GameChanger"
                  </div>
                </CardContent>
              </Card>

              <Card className="dark-theme-bg ">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center">
                    <Checkbox className="mr-3" onCheckedChange={(checked) => {
                      if (checked) setSelectedChannels([...selectedChannels, 'seo']);
                      else setSelectedChannels(selectedChannels.filter(c => c !== 'seo'));
                    }} />
                    SEO Snippet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-slate-300">
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
        </div>
      </div>
    </div>
  );
}