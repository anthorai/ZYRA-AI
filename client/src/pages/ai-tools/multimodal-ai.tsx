import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PageContainer, CardPageHeader } from "@/components/ui/standardized-layout";
import { 
  Camera,
  Upload,
  Copy,
  CheckCircle,
  Clock,
  Zap,
  Image as ImageIcon,
  FileText,
  Eye,
  X,
  Plus
} from "lucide-react";

interface MultimodalForm {
  productName: string;
  category: string;
  attributes: string;
  targetKeywords: string;
}

interface ImageAnalysis {
  colors: string[];
  materials: string[];
  style: string;
  features: string[];
  visualElements: string[];
}

interface GeneratedContent {
  richDescription: string;
  visualDescription: string;
  seoContent: string;
  marketingCopy: string;
  imageAnalysis: ImageAnalysis;
}

export default function MultimodalAI() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);

  const form = useForm<MultimodalForm>({
    defaultValues: {
      productName: "",
      category: "",
      attributes: "",
      targetKeywords: "",
    },
  });


  // Mock multimodal AI generation mutation
  const generateMultimodalMutation = useMutation({
    mutationFn: async (data: MultimodalForm & { images: File[] }) => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      const { productName, category, attributes, targetKeywords, images } = data;
      
      // Mock image analysis based on filenames
      const primaryImage = images[0];
      const fileName = primaryImage?.name.toLowerCase() || '';
      
      let imageAnalysis: ImageAnalysis = {
        colors: ['Black', 'Silver'],
        materials: ['Plastic', 'Metal'],
        style: 'Modern',
        features: ['Sleek design', 'Compact'],
        visualElements: ['Product shot', 'Clean background']
      };
      
      // Simulate vision AI analysis based on filename
      if (fileName.includes('headphone') || fileName.includes('audio')) {
        imageAnalysis = {
          colors: ['Black', 'Silver', 'Blue accents'],
          materials: ['Premium plastic', 'Metal hinges', 'Soft padding'],
          style: 'Modern tech',
          features: ['Over-ear design', 'Adjustable headband', 'Control buttons'],
          visualElements: ['Studio lighting', 'Angle view', 'Detail shots']
        };
      } else if (fileName.includes('shirt') || fileName.includes('clothing')) {
        imageAnalysis = {
          colors: ['Navy blue', 'White'],
          materials: ['Cotton blend', 'Breathable fabric'],
          style: 'Casual modern',
          features: ['Button front', 'Collar', 'Regular fit'],
          visualElements: ['Model wearing', 'Lifestyle shot', 'Natural lighting']
        };
      } else if (fileName.includes('phone') || fileName.includes('mobile')) {
        imageAnalysis = {
          colors: ['Space gray', 'Glass back'],
          materials: ['Aluminum frame', 'Gorilla glass'],
          style: 'Minimalist tech',
          features: ['Edge-to-edge screen', 'Multiple cameras', 'Wireless charging'],
          visualElements: ['Product angles', 'Screen detail', 'Professional lighting']
        };
      }
      
      // Generate rich content combining visual and text inputs
      const richDescription = `Experience the ${imageAnalysis.style.toLowerCase()} design of our ${productName}. ${attributes ? `Featuring ${attributes}, ` : ''}this ${category.toLowerCase()} showcases beautiful ${imageAnalysis.colors.join(' and ')} tones with premium ${imageAnalysis.materials.join(' and ')} construction. The ${imageAnalysis.features.join(', ')} create an elegant combination of form and function that stands out in any setting.`;
      
      const visualDescription = `The product image reveals a stunning ${imageAnalysis.style.toLowerCase()} aesthetic with ${imageAnalysis.colors.join(', ')} color palette. Key visual elements include ${imageAnalysis.visualElements.join(', ')}, highlighting the ${imageAnalysis.features.join(' and ')} in crisp detail.`;
      
      const seoContent = `${productName} ${targetKeywords ? `- ${targetKeywords} ` : ''}| ${imageAnalysis.colors.join(' ')} ${category} with ${imageAnalysis.materials.join(', ')}. ${imageAnalysis.features.join(', ')}. Premium quality ${productName.toLowerCase()} available now with free shipping.`;
      
      const marketingCopy = `🎯 Introducing the ${productName} - where ${imageAnalysis.style.toLowerCase()} meets functionality! \n\n✨ Stunning ${imageAnalysis.colors.join(' & ')} design\n🔥 Premium ${imageAnalysis.materials.join(' and ')} build\n💫 ${imageAnalysis.features.join(' + ')}\n\nSee it to believe it. Feel the difference quality makes. #${productName.replace(/\s/g, '')} #${category}`;
      
      return {
        richDescription,
        visualDescription,
        seoContent,
        marketingCopy,
        imageAnalysis
      };
    },
    onSuccess: (result) => {
      setGeneratedContent(result);
      toast({
        title: "🎨 Multimodal AI Complete!",
        description: "Rich content generated from your images and text inputs!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate multimodal content",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate file types
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length !== files.length) {
      toast({
        title: "Invalid file format",
        description: "Please upload only image files",
        variant: "destructive",
      });
      return;
    }

    // Limit to 3 images
    const selectedFiles = imageFiles.slice(0, 3);
    setUploadedImages(prev => [...prev, ...selectedFiles].slice(0, 3));
    
    // Create previews
    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const onSubmit = (data: MultimodalForm) => {
    if (uploadedImages.length === 0) {
      toast({
        title: "Images required",
        description: "Please upload at least one product image",
        variant: "destructive",
      });
      return;
    }

    if (!data.productName.trim()) {
      toast({
        title: "Product name required",
        description: "Please enter a product name",
        variant: "destructive",
      });
      return;
    }

    generateMultimodalMutation.mutate({ ...data, images: uploadedImages });
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
    <div>
      <CardPageHeader title="Multimodal AI" />
      <PageContainer>
        {/* Multimodal AI Overview */}
        <Card className="border-0 gradient-card rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Eye className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-white">Visual + Text AI Generation</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6 text-[10px] sm:text-xs md:text-sm">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">1</div>
                <span className="text-slate-300 truncate">Upload product images (up to 3)</span>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">2</div>
                <span className="text-slate-300 truncate">AI analyzes visual + text attributes</span>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">3</div>
                <span className="text-slate-300 truncate">Generate rich, contextual copy</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload and Form */}
        <Card className="border-0 gradient-card rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Upload Images & Product Details</CardTitle>
            <CardDescription className="text-slate-300">
              Combine visual and text inputs for the most accurate AI-generated content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image Upload Section */}
            <div>
              <Label className="text-white">Product Images (Up to 3)</Label>
              <div className="mt-2 space-y-4">
                {/* Upload Area */}
                {uploadedImages.length < 3 && (
                  <div 
                    className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-slate-800/20"
                    onClick={handleUploadClick}
                  >
                    <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Upload Product Images</h3>
                    <p className="text-slate-300">Click to browse or drag & drop multiple images</p>
                    <p className="text-sm text-slate-400 mt-2">JPG, PNG, WebP up to 10MB each</p>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden" 
                    />
                  </div>
                )}

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl overflow-hidden">
                        <img 
                          src={preview} 
                          alt={`Product ${index + 1}`} 
                          className="w-full h-32 sm:h-40 md:h-48 object-cover"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white"
                        >
                          <X className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" />
                        </Button>
                        <Badge className="absolute bottom-2 left-2 bg-slate-800/80 text-white text-[10px] sm:text-xs">
                          Image {index + 1}
                        </Badge>
                      </div>
                    ))}
                    {uploadedImages.length < 3 && (
                      <div 
                        className="h-32 sm:h-40 md:h-48 border-2 border-dashed border-slate-600 rounded-xl sm:rounded-2xl flex items-center justify-center cursor-pointer hover:border-slate-500 transition-colors"
                        onClick={handleUploadClick}
                      >
                        <div className="text-center">
                          <Plus className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-slate-400 mx-auto mb-2 flex-shrink-0" />
                          <p className="text-slate-400 text-[10px] sm:text-xs md:text-sm truncate">Add Another</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Product Information Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="productName" className="text-white">Product Name *</Label>
                  <Input
                    id="productName"
                    className="mt-2 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                    placeholder="e.g., Premium Wireless Headphones"
                    {...form.register("productName", { required: true })}
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-white">Category</Label>
                  <Input
                    id="category"
                    className="mt-2 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                    placeholder="e.g., Electronics, Audio"
                    {...form.register("category")}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="attributes" className="text-white">Product Attributes</Label>
                <Textarea
                  id="attributes"
                  className="mt-2 h-24 resize-none bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                  placeholder="e.g., Noise-canceling, 30-hour battery, wireless charging case, premium build"
                  {...form.register("attributes")}
                />
              </div>

              <div>
                <Label htmlFor="targetKeywords" className="text-white">Target Keywords</Label>
                <Input
                  id="targetKeywords"
                  className="mt-2 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                  placeholder="e.g., wireless headphones, noise canceling, premium audio"
                  {...form.register("targetKeywords")}
                />
              </div>

              <Button
                type="submit"
                disabled={generateMultimodalMutation.isPending || uploadedImages.length === 0}
                className="w-full gradient-button transition-all duration-200 font-medium"
              >
                {generateMultimodalMutation.isPending ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    AI analyzing images and text...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Multimodal Content
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Generated Results */}
        {generatedContent && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h2 className="text-2xl font-semibold text-white">AI-Generated Multimodal Content</h2>
            </div>

            {/* Image Analysis */}
            <Card className="border-2 border-cyan-400/30 bg-gradient-to-br from-cyan-900/20 to-blue-900/20">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Eye className="w-5 h-5 text-cyan-400 mr-2" />
                  Visual Analysis
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  <div className="min-w-0">
                    <h4 className="text-white font-medium mb-2 text-base sm:text-lg md:text-xl truncate">Colors Detected</h4>
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.imageAnalysis.colors.map((color, index) => (
                        <Badge key={index} className="bg-cyan-400/20 text-cyan-300 text-[10px] sm:text-xs truncate">
                          {color}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-white font-medium mb-2 text-base sm:text-lg md:text-xl truncate">Materials</h4>
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.imageAnalysis.materials.map((material, index) => (
                        <Badge key={index} className="bg-slate-600/50 text-slate-300 text-[10px] sm:text-xs truncate">
                          {material}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-white font-medium mb-2 text-base sm:text-lg md:text-xl truncate">Style</h4>
                    <Badge className="bg-purple-400/20 text-purple-300 text-[10px] sm:text-xs truncate">
                      {generatedContent.imageAnalysis.style}
                    </Badge>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-white font-medium mb-2 text-base sm:text-lg md:text-xl truncate">Visual Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.imageAnalysis.features.map((feature, index) => (
                        <Badge key={index} className="bg-blue-400/20 text-blue-300 text-[10px] sm:text-xs truncate">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rich Description */}
            <Card className="border-2 border-green-400/30 bg-gradient-to-br from-green-900/20 to-emerald-900/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-green-400" />
                    <h3 className="text-xl font-semibold text-white">Rich Description</h3>
                    <Badge className="bg-green-400/20 text-green-300">Multimodal</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(generatedContent.richDescription, "Rich description")}
                    className="text-green-300 hover:text-green-200 hover:bg-green-400/10"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="bg-slate-800/30 p-4 rounded-lg border border-green-400/20">
                  <p className="text-slate-100 leading-relaxed">
                    {generatedContent.richDescription}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Visual Description */}
            <Card className="border-2 border-blue-400/30 bg-gradient-to-br from-blue-900/20 to-cyan-900/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="w-5 h-5 text-blue-400" />
                    <h3 className="text-xl font-semibold text-white">Visual Description</h3>
                    <Badge className="bg-blue-400/20 text-blue-300">Image-Based</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(generatedContent.visualDescription, "Visual description")}
                    className="text-blue-300 hover:text-blue-200 hover:bg-blue-400/10"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="bg-slate-800/30 p-4 rounded-lg border border-blue-400/20">
                  <p className="text-slate-100 leading-relaxed">
                    {generatedContent.visualDescription}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* SEO Content & Marketing Copy */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-2 border-purple-400/30 bg-gradient-to-br from-purple-900/20 to-violet-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-purple-400" />
                      <h3 className="text-lg font-semibold text-white">SEO Content</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(generatedContent.seoContent, "SEO content")}
                      className="text-purple-300 hover:text-purple-200 hover:bg-purple-400/10"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="bg-slate-800/30 p-4 rounded-lg border border-purple-400/20">
                    <p className="text-slate-100 leading-relaxed text-sm">
                      {generatedContent.seoContent}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-pink-400/30 bg-gradient-to-br from-pink-900/20 to-rose-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Camera className="w-5 h-5 text-pink-400" />
                      <h3 className="text-lg font-semibold text-white">Marketing Copy</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(generatedContent.marketingCopy, "Marketing copy")}
                      className="text-pink-300 hover:text-pink-200 hover:bg-pink-400/10"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="bg-slate-800/30 p-4 rounded-lg border border-pink-400/20">
                    <pre className="text-slate-100 leading-relaxed text-sm whitespace-pre-wrap">
                      {generatedContent.marketingCopy}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  );
}