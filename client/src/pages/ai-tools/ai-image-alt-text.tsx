import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AvatarMenu } from "@/components/ui/avatar-menu";
import NotificationCenter from "@/components/dashboard/notification-center";
import { 
  ArrowLeft,
  ImageIcon,
  Upload,
  Copy,
  CheckCircle,
  Clock,
  Zap,
  Eye,
  Search,
  X
} from "lucide-react";

interface ImageAnalysis {
  fileName: string;
  altText: string;
  seoKeywords: string[];
  accessibility: string;
  fileSize: string;
  dimensions: string;
}

export default function AIImageAltText() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null);
  const [additionalTags, setAdditionalTags] = useState("");

  // Handle back navigation
  const handleGoBack = () => {
    sessionStorage.setItem('navigationSource', 'ai-tools');
    setLocation('/dashboard');
  };

  // Mock AI image analysis mutation
  const analyzeImageMutation = useMutation({
    mutationFn: async (data: { file: File; tags: string }) => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const fileName = data.file.name.toLowerCase();
      const tags = data.tags;
      
      // Mock analysis based on filename and tags
      let baseDescription = "";
      let keywords: string[] = [];
      
      // Simulate AI vision analysis based on filename patterns
      if (fileName.includes('headphone') || fileName.includes('audio')) {
        baseDescription = "Professional product photography of wireless bluetooth headphones in black color";
        keywords = ["wireless headphones", "bluetooth audio", "premium sound"];
      } else if (fileName.includes('shirt') || fileName.includes('clothing')) {
        baseDescription = "High-quality product image of a stylish shirt on white background";
        keywords = ["fashion", "clothing", "apparel"];
      } else if (fileName.includes('phone') || fileName.includes('mobile')) {
        baseDescription = "Clean product shot of smartphone device showing modern design";
        keywords = ["smartphone", "mobile device", "technology"];
      } else {
        baseDescription = "Professional product photography showing detailed view of item";
        keywords = ["product", "e-commerce", "retail"];
      }
      
      // Add user tags to keywords
      if (tags) {
        keywords.push(...tags.split(',').map(tag => tag.trim()).filter(tag => tag));
      }
      
      // Generate comprehensive alt text
      const altText = `${baseDescription}${tags ? `, featuring ${tags}` : ''}, shot in studio lighting for e-commerce use`;
      
      // Generate accessibility description
      const accessibility = `Image shows ${baseDescription.toLowerCase()}. This image is suitable for screen readers and provides context for users with visual impairments.`;
      
      return {
        fileName: data.file.name,
        altText,
        seoKeywords: keywords,
        accessibility,
        fileSize: `${(data.file.size / 1024).toFixed(1)} KB`,
        dimensions: "1200x800" // Mock dimensions
      };
    },
    onSuccess: (result) => {
      setAnalysis(result);
      toast({
        title: "🎯 Analysis Complete!",
        description: "AI has generated optimized alt-text for your image!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze image",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file format",
        description: "Please upload an image file (JPG, PNG, WebP, etc.)",
        variant: "destructive",
      });
      return;
    }

    setUploadedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const analyzeImage = () => {
    if (!uploadedImage) {
      toast({
        title: "No image selected",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    analyzeImageMutation.mutate({ 
      file: uploadedImage, 
      tags: additionalTags 
    });
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    setAnalysis(null);
    setAdditionalTags("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard.`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen dark-theme-bg text-white">
      {/* Header */}
      <header className="gradient-surface backdrop-blur-sm border-b border-slate-700/50 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
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
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-6 h-6 text-primary" />
                <h1 className="font-bold text-white text-base sm:text-lg lg:text-xl xl:text-2xl truncate">
                  AI Image Alt-Text
                </h1>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm lg:text-base truncate">
                Auto-generate alt-text for accessibility and SEO optimization
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 sm:space-x-4 flex-shrink-0">
            <NotificationCenter />
            <AvatarMenu />
          </div>
        </div>
      </header>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
        {/* Benefits Overview */}
        <Card className="border-0 gradient-card rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Eye className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-white">Why Alt-Text Matters</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-green-400/20 text-green-400 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <span className="text-slate-300">Improves accessibility for screen readers</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-400/20 text-blue-400 flex items-center justify-center">
                  <Search className="w-4 h-4" />
                </div>
                <span className="text-slate-300">Boosts SEO with image search optimization</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-purple-400/20 text-purple-400 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-slate-300">Provides context when images fail to load</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Section */}
        <Card className="border-0 gradient-card rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Upload Product Image</CardTitle>
            <CardDescription className="text-slate-300">
              Upload your product image and Zyra AI will generate descriptive, SEO-optimized alt-text
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!uploadedImage ? (
              <div 
                className="border-2 border-dashed border-primary/30 rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer bg-slate-800/20"
                onClick={handleUploadClick}
              >
                <Upload className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Upload your product image</h3>
                <p className="text-slate-300 mb-4">Click here or drag & drop your image</p>
                <p className="text-sm text-slate-400">Supports JPG, PNG, WebP up to 10MB</p>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden" 
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Image Preview */}
                <div className="relative">
                  <img 
                    src={imagePreview!} 
                    alt="Uploaded product" 
                    className="w-full max-w-md mx-auto rounded-lg border border-slate-600"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Additional Tags Input */}
                <div>
                  <Label htmlFor="additionalTags" className="text-white">Additional Tags (Optional)</Label>
                  <Input
                    id="additionalTags"
                    value={additionalTags}
                    onChange={(e) => setAdditionalTags(e.target.value)}
                    className="mt-2 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                    placeholder="e.g., premium, wireless, black color"
                  />
                  <p className="text-xs text-slate-400 mt-1">Add specific features or attributes separated by commas</p>
                </div>

                {/* Analyze Button */}
                <Button
                  onClick={analyzeImage}
                  disabled={analyzeImageMutation.isPending}
                  className="w-full gradient-button transition-all duration-200 font-medium"
                >
                  {analyzeImageMutation.isPending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      AI analyzing image...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Generate Alt-Text
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h2 className="text-2xl font-semibold text-white">AI Analysis Results</h2>
            </div>

            {/* Image Info */}
            <Card className="border-2 border-slate-600/30 bg-gradient-to-br from-slate-900/20 to-slate-800/20">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Image Information</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">File Name:</span>
                    <div className="text-white font-medium">{analysis.fileName}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">File Size:</span>
                    <div className="text-white font-medium">{analysis.fileSize}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Dimensions:</span>
                    <div className="text-white font-medium">{analysis.dimensions}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generated Alt-Text */}
            <Card className="border-2 border-blue-400/30 bg-gradient-to-br from-blue-900/20 to-cyan-900/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="w-5 h-5 text-blue-400" />
                    <h3 className="text-xl font-semibold text-white">Optimized Alt-Text</h3>
                    <Badge className="bg-blue-400/20 text-blue-300">SEO Ready</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(analysis.altText, "Alt-text")}
                    className="text-blue-300 hover:text-blue-200 hover:bg-blue-400/10"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="bg-slate-800/30 p-4 rounded-lg border border-blue-400/20">
                  <p className="text-slate-100 leading-relaxed">
                    {analysis.altText}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Accessibility Description */}
            <Card className="border-2 border-green-400/30 bg-gradient-to-br from-green-900/20 to-emerald-900/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-5 h-5 text-green-400" />
                    <h3 className="text-xl font-semibold text-white">Accessibility Description</h3>
                    <Badge className="bg-green-400/20 text-green-300">Screen Reader Friendly</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(analysis.accessibility, "Accessibility description")}
                    className="text-green-300 hover:text-green-200 hover:bg-green-400/10"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="bg-slate-800/30 p-4 rounded-lg border border-green-400/20">
                  <p className="text-slate-100 leading-relaxed">
                    {analysis.accessibility}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* SEO Keywords */}
            <Card className="border-2 border-purple-400/30 bg-gradient-to-br from-purple-900/20 to-violet-900/20">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Search className="w-5 h-5 text-purple-400" />
                  <h3 className="text-xl font-semibold text-white">Extracted SEO Keywords</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.seoKeywords.map((keyword, index) => (
                    <Badge 
                      key={index} 
                      className="bg-purple-400/20 text-purple-300 hover:bg-purple-400/30 cursor-pointer"
                      onClick={() => copyToClipboard(keyword, "Keyword")}
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}