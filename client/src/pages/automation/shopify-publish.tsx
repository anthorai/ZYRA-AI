import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { 
  Share, 
  CheckCircle,
  Clock,
  Package,
  TrendingUp,
  Zap,
  ExternalLink
} from "lucide-react";

interface OptimizedProduct {
  id: string;
  title: string;
  originalTitle: string;
  description: string;
  originalDescription: string;
  tags: string[];
  originalTags: string[];
  altText: string;
  image: string;
  status: 'ready' | 'publishing' | 'published';
}

export default function ShopifyPublish() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedCount, setPublishedCount] = useState(0);

  const [optimizedProducts] = useState<OptimizedProduct[]>([
    {
      id: "prod_1",
      title: "🎧 Premium Wireless Bluetooth Headphones - Noise Canceling | Free Shipping",
      originalTitle: "Wireless Headphones",
      description: "Transform your audio experience with our premium wireless headphones. Featuring advanced noise cancellation technology, crystal-clear sound quality, and all-day comfort. Perfect for music lovers, professionals, and students. 30-hour battery life, quick charging, and premium build quality. 30-day money-back guarantee.",
      originalDescription: "Good quality headphones for music",
      tags: ["headphones", "wireless", "bluetooth", "noise-canceling", "premium", "audio", "music", "electronics"],
      originalTags: ["headphones", "audio"],
      altText: "Premium wireless Bluetooth headphones with noise canceling technology shown in sleek black design",
      image: "headphones.jpg",
      status: 'ready'
    },
    {
      id: "prod_2", 
      title: "⌚ Smart Fitness Watch - Heart Rate Monitor & GPS Tracking | Bestseller",
      originalTitle: "Smart Watch",
      description: "Stay connected and healthy with our advanced smart fitness watch. Features heart rate monitoring, GPS tracking, sleep analysis, and 50+ workout modes. Waterproof design with 7-day battery life. Compatible with iOS and Android. Perfect for athletes and fitness enthusiasts.",
      originalDescription: "A good smartwatch for fitness",
      tags: ["smartwatch", "fitness", "health", "gps", "heart-rate", "waterproof", "bestseller", "wearable"],
      originalTags: ["watch", "fitness"],
      altText: "Smart fitness watch displaying health metrics and GPS tracking on bright OLED screen",
      image: "smartwatch.jpg",
      status: 'ready'
    },
    {
      id: "prod_3",
      title: "💻 Ergonomic Laptop Stand - Adjustable Height & Cooling | Office Essential",
      originalTitle: "Laptop Stand",
      description: "Improve your workspace ergonomics with our premium adjustable laptop stand. Features 6 height settings, built-in cooling, and sturdy aluminum construction. Reduces neck strain and improves productivity. Compatible with all laptop sizes. Perfect for home office and remote work setups.",
      originalDescription: "Useful laptop stand for desk",
      tags: ["laptop-stand", "ergonomic", "office", "adjustable", "cooling", "aluminum", "productivity", "workspace"],
      originalTags: ["stand", "office"],
      altText: "Ergonomic aluminum laptop stand with adjustable height settings and built-in cooling vents",
      image: "laptop-stand.jpg",
      status: 'ready'
    }
  ]);

  const handlePublishAll = async () => {
    setIsPublishing(true);
    setPublishedCount(0);

    toast({
      title: "🚀 Publishing to Shopify",
      description: "Starting to publish optimized products to your store...",
    });

    // Simulate publishing each product
    for (let i = 0; i < optimizedProducts.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setPublishedCount(i + 1);
    }

    setIsPublishing(false);

    toast({
      title: "✅ Publishing Complete!",
      description: `Successfully published ${optimizedProducts.length} optimized products to your Shopify store`,
    });
  };

  const handlePublishSingle = async (productId: string) => {
    toast({
      title: "🚀 Publishing Product",
      description: "Publishing optimized product to Shopify...",
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    toast({
      title: "✅ Product Published",
      description: "Product successfully updated in your Shopify store",
    });
  };

  return (
    <PageShell
      title="Shopify Publish"
      subtitle="Publish your AI-optimized products directly to your Shopify store"
      backTo="/dashboard"
    >
      {/* Summary Card */}
      <DashboardCard
        title="Ready to Publish"
        description="Your optimized products are ready to be published to your Shopify store"
      >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">{optimizedProducts.length}</div>
                <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm">Products Ready</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-2">{publishedCount}</div>
                <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm">Published</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-2">{optimizedProducts.length - publishedCount}</div>
                <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm">Remaining</div>
              </div>
            </div>

            <Button
              onClick={handlePublishAll}
              disabled={isPublishing}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 font-medium text-lg py-6"
              data-testid="button-publish-all"
            >
              {isPublishing ? (
                <>
                  <Clock className="w-5 h-5 mr-2 animate-spin" />
                  Publishing {publishedCount}/{optimizedProducts.length}...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Publish All to Shopify ({optimizedProducts.length} products)
                </>
              )}
            </Button>
      </DashboardCard>

      {/* Products List */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white">Optimized Product Content</h2>
        
        {optimizedProducts.map((product) => (
          <DashboardCard
            key={product.id}
            testId={`card-product-${product.id}`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
                    <h3 className="text-base sm:text-lg md:text-xl text-white truncate min-w-0">{product.title}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-500/20 text-green-400">Optimized</Badge>
                    <Badge className="bg-blue-500/20 text-blue-400">SEO Enhanced</Badge>
                  </div>
                </div>
                <Button
                  onClick={() => handlePublishSingle(product.id)}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  data-testid={`button-publish-${product.id}`}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Publish
                </Button>
              </div>
                {/* Before/After Comparison */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-slate-300 font-medium mb-3">Original Content</h4>
                    <div className="bg-slate-800/30 p-4 rounded-lg space-y-2">
                      <div>
                        <span className="text-slate-400 text-sm font-medium">Title:</span>
                        <p className="text-slate-300 text-sm mt-1">{product.originalTitle}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-sm font-medium">Description:</span>
                        <p className="text-slate-300 text-sm mt-1">{product.originalDescription}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-sm font-medium">Tags:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.originalTags.map((tag, idx) => (
                            <span key={idx} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-slate-300 font-medium mb-3">AI-Optimized Content</h4>
                    <div className="bg-slate-800/30 p-4 rounded-lg border border-primary/20 space-y-2">
                      <div>
                        <span className="text-slate-400 text-sm font-medium">Title:</span>
                        <p className="text-slate-100 text-sm mt-1 font-medium">{product.title}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-sm font-medium">Description:</span>
                        <p className="text-slate-100 text-sm mt-1">{product.description}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-sm font-medium">Tags:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.tags.map((tag, idx) => (
                            <span key={idx} className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-sm font-medium">Alt Text:</span>
                        <p className="text-slate-100 text-sm mt-1">{product.altText}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Improvement Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 pt-4 border-t border-slate-700/50">
                  <div className="text-center">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-400 mx-auto mb-1 flex-shrink-0" />
                    <div className="text-[10px] sm:text-xs md:text-sm text-slate-300">SEO Score</div>
                    <div className="text-xs sm:text-sm font-bold text-green-400">+85%</div>
                  </div>
                  <div className="text-center">
                    <Package className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-400 mx-auto mb-1 flex-shrink-0" />
                    <div className="text-[10px] sm:text-xs md:text-sm text-slate-300">Keywords</div>
                    <div className="text-xs sm:text-sm font-bold text-blue-400">+{product.tags.length - product.originalTags.length}</div>
                  </div>
                  <div className="text-center">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-400 mx-auto mb-1 flex-shrink-0" />
                    <div className="text-[10px] sm:text-xs md:text-sm text-slate-300">Readability</div>
                    <div className="text-xs sm:text-sm font-bold text-purple-400">Perfect</div>
                  </div>
                </div>
            </div>
          </DashboardCard>
        ))}
      </div>
    </PageShell>
  );
}