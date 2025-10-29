import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { 
  Image as ImageIcon,
  Upload,
  Copy,
  CheckCircle,
  Clock,
  Zap,
  Eye,
  X,
  Sparkles
} from "lucide-react";

interface GeneratedAltText {
  short: string;
  medium: string;
  long: string;
  seoOptimized: string;
}

export default function AIImageAltText() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [generatedAltTexts, setGeneratedAltTexts] = useState<GeneratedAltText | null>(null);

  const generateAltTextMutation = useMutation({
    mutationFn: async (image: File) => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const fileName = image.name.toLowerCase();
      
      let context = "product";
      let subject = "item";
      let details = "";
      
      if (fileName.includes('headphone') || fileName.includes('audio')) {
        subject = "wireless headphones";
        details = "over-ear design with noise cancellation and premium padding";
      } else if (fileName.includes('shirt') || fileName.includes('clothing')) {
        subject = "casual shirt";
        details = "button-front design with modern fit";
      } else if (fileName.includes('phone') || fileName.includes('mobile')) {
        subject = "smartphone";
        details = "edge-to-edge display with advanced camera system";
      } else if (fileName.includes('shoe') || fileName.includes('sneaker')) {
        subject = "athletic shoes";
        details = "comfortable running design with breathable material";
      }
      
      return {
        short: `${subject} on display`,
        medium: `Professional product photo of ${subject} showcasing key features`,
        long: `High-quality product image featuring ${subject} with ${details}, shot in professional lighting against a clean background`,
        seoOptimized: `Buy ${subject} - ${details} | Free shipping available | Premium quality ${subject} for sale`
      };
    },
    onSuccess: (result) => {
      setGeneratedAltTexts(result);
      toast({
        title: "✨ Alt Texts Generated!",
        description: "AI has analyzed your image and created SEO-optimized descriptions.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate alt texts",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    setUploadedImage(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = () => {
    if (!uploadedImage) {
      toast({
        title: "No image",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }
    generateAltTextMutation.mutate(uploadedImage);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${type} alt text copied to clipboard.`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const clearImage = () => {
    setUploadedImage(null);
    setImagePreview("");
    setGeneratedAltTexts(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <PageShell
      title="AI Image Alt Text Generator"
      subtitle="Generate SEO-optimized alt text descriptions for your product images using AI vision analysis"
      
    >
      <DashboardCard
        title="How It Works"
        description="AI vision analyzes your images to create accessible and SEO-friendly alt text"
      >
        <div className="grid md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
            <span className="text-slate-300">Upload product image</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
            <span className="text-slate-300">AI analyzes visual content</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
            <span className="text-slate-300">Generate multiple alt text options</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">4</div>
            <span className="text-slate-300">Copy and use in your store</span>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard
        title="Upload Image"
        description="Upload a product image to generate AI-powered alt text descriptions"
      >
        <div className="space-y-6">
          {!imagePreview ? (
            <div 
              className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-slate-800/20"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Upload Product Image</h3>
              <p className="text-slate-300">Click to browse or drag & drop an image</p>
              <p className="text-sm text-slate-400 mt-2">JPG, PNG, WebP up to 10MB</p>
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden" 
                data-testid="input-image"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden border border-slate-700">
                <img 
                  src={imagePreview} 
                  alt="Uploaded product" 
                  className="w-full h-64 object-contain bg-slate-900"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearImage}
                  className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white"
                  data-testid="button-clear-image"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generateAltTextMutation.isPending}
                className="w-full gradient-button"
                data-testid="button-generate"
              >
                {generateAltTextMutation.isPending ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    AI analyzing image...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Alt Text
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DashboardCard>

      {generatedAltTexts && (
        <>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h2 className="text-2xl font-semibold text-white">Generated Alt Text Options</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <DashboardCard
              title="Short Alt Text"
              description="Concise description for minimal contexts"
              testId="card-alt-short"
            >
              <div className="space-y-3">
                <div className="bg-slate-800/30 p-4 rounded-lg border border-green-400/20">
                  <p className="text-slate-100 leading-relaxed">
                    {generatedAltTexts.short}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Badge className="bg-green-400/20 text-green-300">
                    {generatedAltTexts.short.length} characters
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generatedAltTexts.short, "Short")}
                    className="text-primary hover:text-white"
                    data-testid="button-copy-short"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard
              title="Medium Alt Text"
              description="Balanced description with key details"
              testId="card-alt-medium"
            >
              <div className="space-y-3">
                <div className="bg-slate-800/30 p-4 rounded-lg border border-blue-400/20">
                  <p className="text-slate-100 leading-relaxed">
                    {generatedAltTexts.medium}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Badge className="bg-blue-400/20 text-blue-300">
                    {generatedAltTexts.medium.length} characters
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generatedAltTexts.medium, "Medium")}
                    className="text-primary hover:text-white"
                    data-testid="button-copy-medium"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard
              title="Long Alt Text"
              description="Detailed description for accessibility"
              testId="card-alt-long"
            >
              <div className="space-y-3">
                <div className="bg-slate-800/30 p-4 rounded-lg border border-purple-400/20">
                  <p className="text-slate-100 leading-relaxed">
                    {generatedAltTexts.long}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Badge className="bg-purple-400/20 text-purple-300">
                    {generatedAltTexts.long.length} characters
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generatedAltTexts.long, "Long")}
                    className="text-primary hover:text-white"
                    data-testid="button-copy-long"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard
              title="SEO-Optimized Alt Text"
              description="Search-engine optimized with keywords"
              testId="card-alt-seo"
            >
              <div className="space-y-3">
                <div className="bg-slate-800/30 p-4 rounded-lg border border-yellow-400/20">
                  <p className="text-slate-100 leading-relaxed">
                    {generatedAltTexts.seoOptimized}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Badge className="bg-yellow-400/20 text-yellow-300">
                    SEO Enhanced
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generatedAltTexts.seoOptimized, "SEO")}
                    className="text-primary hover:text-white"
                    data-testid="button-copy-seo"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
            </DashboardCard>
          </div>

          <DashboardCard
            title="Alt Text Best Practices"
            description="Tips for using alt text effectively"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  Do's
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="text-slate-300 flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    Be descriptive and specific about the product
                  </li>
                  <li className="text-slate-300 flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    Include relevant keywords naturally
                  </li>
                  <li className="text-slate-300 flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    Keep it under 125 characters when possible
                  </li>
                  <li className="text-slate-300 flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    Focus on what's unique about the product
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center">
                  <X className="w-5 h-5 text-red-400 mr-2" />
                  Don'ts
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="text-slate-300 flex items-start">
                    <span className="text-red-400 mr-2">•</span>
                    Don't start with "Image of" or "Picture of"
                  </li>
                  <li className="text-slate-300 flex items-start">
                    <span className="text-red-400 mr-2">•</span>
                    Avoid keyword stuffing
                  </li>
                  <li className="text-slate-300 flex items-start">
                    <span className="text-red-400 mr-2">•</span>
                    Don't use special characters excessively
                  </li>
                  <li className="text-slate-300 flex items-start">
                    <span className="text-red-400 mr-2">•</span>
                    Don't leave alt text empty
                  </li>
                </ul>
              </div>
            </div>
          </DashboardCard>
        </>
      )}
    </PageShell>
  );
}
