import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Loader2,
  Send,
  Mail,
  MessageSquare,
  Share2,
  Search,
  Megaphone,
  Copy,
  Check,
  Sparkles
} from "lucide-react";

interface GeneratedContent {
  email: {
    subject: string;
    body: string;
  };
  sms: string;
  social: string;
  seo: string;
  adCopy: string;
}

export default function MultiChannelRepurposingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [productDescription, setProductDescription] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const generateMutation = useMutation({
    mutationFn: async (description: string) => {
      const response = await apiRequest('POST', '/api/ai/multi-channel-content', { 
        productDescription: description 
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedContent(data.content);
      toast({
        title: "Content Generated!",
        description: "AI has created optimized content for all channels.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleGenerateContent = () => {
    if (!productDescription.trim()) {
      toast({
        title: "Description Required",
        description: "Please enter a product description first.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate(productDescription);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: "Copied!",
        description: "Content copied to clipboard.",
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const toggleChannel = (channel: string, checked: boolean) => {
    if (checked) {
      setSelectedChannels([...selectedChannels, channel]);
    } else {
      setSelectedChannels(selectedChannels.filter(c => c !== channel));
    }
  };

  const channelCards = [
    {
      id: 'email',
      title: 'Email Subject + Body',
      icon: Mail,
      getContent: () => generatedContent?.email ? 
        `Subject: ${generatedContent.email.subject}\n\nBody: ${generatedContent.email.body}` : null,
      renderContent: () => generatedContent?.email && (
        <div className="space-y-2 sm:space-y-3 text-slate-300 text-xs sm:text-sm">
          <div><strong className="text-primary">Subject:</strong> {generatedContent.email.subject}</div>
          <div><strong className="text-primary">Body:</strong> {generatedContent.email.body}</div>
        </div>
      )
    },
    {
      id: 'sms',
      title: 'SMS Copy',
      icon: MessageSquare,
      getContent: () => generatedContent?.sms || null,
      renderContent: () => generatedContent?.sms && (
        <div className="text-slate-300 text-xs sm:text-sm">
          {generatedContent.sms}
        </div>
      )
    },
    {
      id: 'social',
      title: 'Social Post Caption',
      icon: Share2,
      getContent: () => generatedContent?.social || null,
      renderContent: () => generatedContent?.social && (
        <div className="text-slate-300 text-xs sm:text-sm">
          {generatedContent.social}
        </div>
      )
    },
    {
      id: 'seo',
      title: 'SEO Meta Description',
      icon: Search,
      getContent: () => generatedContent?.seo || null,
      renderContent: () => generatedContent?.seo && (
        <div className="text-slate-300 text-xs sm:text-sm">
          {generatedContent.seo}
        </div>
      )
    },
    {
      id: 'adCopy',
      title: 'Ad Copy',
      icon: Megaphone,
      getContent: () => generatedContent?.adCopy || null,
      renderContent: () => generatedContent?.adCopy && (
        <div className="text-slate-300 text-xs sm:text-sm">
          {generatedContent.adCopy}
        </div>
      )
    }
  ];

  return (
    <PageShell
      title="Multi-Channel Repurposing"
      subtitle="Generate optimized content for all marketing channels with AI"
      backTo="/campaigns"
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
              placeholder="Enter your product description here... Include key features, benefits, target audience, and any promotional details."
              className="mt-2 form-textarea text-white text-base min-h-[120px]"
              rows={5}
              data-testid="input-product-description"
            />
          </div>
          <Button 
            onClick={handleGenerateContent} 
            disabled={generateMutation.isPending || !productDescription.trim()}
            className="gradient-button px-8 py-3 text-lg"
            data-testid="button-generate-content"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate AI Content
              </>
            )}
          </Button>
        </div>
      </DashboardCard>
      
      {generatedContent && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Generated Content</h2>
            <p className="text-slate-400 text-sm">Select channels to publish</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {channelCards.map((channel) => {
              const Icon = channel.icon;
              const content = channel.getContent();
              const isSelected = selectedChannels.includes(channel.id);
              
              return (
                <Card 
                  key={channel.id}
                  className={`shadow-lg border transition-all duration-300 rounded-xl sm:rounded-2xl ${
                    isSelected 
                      ? 'border-primary/50 shadow-primary/20' 
                      : 'border-slate-700/50 hover:border-primary/30'
                  }`}
                  data-testid={`card-channel-${channel.id}`}
                >
                  <CardHeader className="p-4 md:p-6 pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-base sm:text-lg flex items-center gap-3">
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={(checked) => toggleChannel(channel.id, !!checked)}
                          data-testid={`checkbox-${channel.id}`}
                        />
                        <Icon className="w-5 h-5 text-primary" />
                        <span>{channel.title}</span>
                      </CardTitle>
                      {content && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyToClipboard(content, channel.id)}
                          data-testid={`button-copy-${channel.id}`}
                        >
                          {copiedField === channel.id ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 pt-2">
                    {channel.renderContent()}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
      
      {selectedChannels.length > 0 && (
        <div className="flex justify-end mt-6">
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
            data-testid="button-publish-selected"
          >
            <Send className="w-5 h-5 mr-2" />
            Use Selected Content ({selectedChannels.length})
          </Button>
        </div>
      )}

      {!generatedContent && !generateMutation.isPending && (
        <div className="text-center py-12 text-slate-400">
          <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Enter a product description and click generate to create content for all channels</p>
        </div>
      )}
    </PageShell>
  );
}
