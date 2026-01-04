import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, Play, Clock, BookOpen } from "lucide-react";

export default function TutorialsPage() {
  const videoTutorials = [
    {
      id: "quickstart",
      title: "Quick Start Guide (5 min)",
      description: "Get up and running with Zyra AI in under 5 minutes",
      duration: "5:23",
      category: "getting-started",
      thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop"
    },
    {
      id: "connect-shopify",
      title: "Connecting Your Shopify Store",
      description: "Step-by-step guide to connecting and syncing your store",
      duration: "3:45",
      category: "getting-started",
      thumbnail: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=400&h=225&fit=crop"
    },
    {
      id: "product-descriptions",
      title: "Generating AI Product Descriptions",
      description: "Learn how to create compelling product copy with AI",
      duration: "7:12",
      category: "features",
      thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop"
    },
    {
      id: "seo-optimization",
      title: "SEO Optimization Masterclass",
      description: "Optimize your products for search engines",
      duration: "10:30",
      category: "features",
      thumbnail: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=400&h=225&fit=crop"
    },
    {
      id: "abandoned-cart",
      title: "Setting Up Abandoned Cart Recovery",
      description: "Configure email and SMS campaigns to recover lost sales",
      duration: "8:15",
      category: "features",
      thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=225&fit=crop"
    },
    {
      id: "analytics",
      title: "Understanding Your Analytics Dashboard",
      description: "Track performance, conversions, and ROI effectively",
      duration: "6:40",
      category: "advanced",
      thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop"
    },
    {
      id: "bulk-optimization",
      title: "Bulk Product Optimization",
      description: "Optimize hundreds of products at once",
      duration: "9:20",
      category: "advanced",
      thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop"
    },
    {
      id: "best-practices",
      title: "Best Practices for Maximum ROI",
      description: "Pro tips to get the most out of Zyra AI",
      duration: "12:05",
      category: "advanced",
      thumbnail: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=225&fit=crop"
    }
  ];

  const renderVideoGrid = (category: string) => {
    const filtered = videoTutorials.filter(v => v.category === category);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((video) => (
          <div
            key={video.id}
            className="bg-slate-800/50 rounded-lg overflow-hidden hover:bg-slate-800 transition-all group"
          >
            <div className="relative aspect-video bg-slate-700">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  size="icon"
                  className="w-14 h-14 rounded-full bg-primary/90 hover:bg-primary group-hover:scale-110 transition-transform"
                  data-testid={`button-play-${video.id}`}
                >
                  <Play className="w-6 h-6 text-white fill-white ml-1" />
                </Button>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{video.duration}</span>
              </div>
            </div>
            <div className="p-4">
              <h4 className="text-white font-semibold mb-1 line-clamp-1">{video.title}</h4>
              <p className="text-sm text-slate-400 line-clamp-2">{video.description}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <PageShell
      title="Video Tutorials"
      subtitle="Watch step-by-step guides to master Zyra AI"
      maxWidth="xl"
      spacing="normal"
      backTo="/settings/support"
    >
      {/* Featured Video */}
      <DashboardCard
        title="Featured Tutorial"
        description="Start here if you're new to Zyra AI"
        headerAction={<Video className="w-5 h-5 text-primary" />}
        testId="card-featured-tutorial"
      >
        <div className="bg-slate-800/50 rounded-lg overflow-hidden">
          <div className="relative aspect-video bg-slate-700">
            <img
              src="https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop"
              alt="Quick Start Guide"
              className="w-full h-full object-cover opacity-70"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                size="icon"
                className="w-20 h-20 rounded-full bg-primary/90 hover:bg-primary"
                data-testid="button-play-featured"
              >
                <Play className="w-8 h-8 text-white fill-white ml-1" />
              </Button>
            </div>
            <div className="absolute bottom-4 right-4 bg-black/80 px-3 py-2 rounded text-sm text-white flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>5:23</span>
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-white font-bold text-xl mb-2">Quick Start Guide</h3>
            <p className="text-slate-400 mb-4">
              Get up and running with Zyra AI in under 5 minutes. This tutorial covers account setup, 
              Shopify integration, and your first AI-generated product description.
            </p>
            <div className="flex items-center space-x-3">
              <Button className="gradient-button" data-testid="button-watch-featured">
                <Play className="w-4 h-4 mr-2" />
                Watch Now
              </Button>
              <Button variant="outline" className="border-slate-600 text-slate-300" data-testid="button-bookmark">
                Save for Later
              </Button>
            </div>
          </div>
        </div>
      </DashboardCard>

      {/* Tutorial Categories */}
      <DashboardCard
        title="All Tutorials"
        description="Browse tutorials by topic"
        testId="card-all-tutorials"
      >
        <Tabs defaultValue="getting-started" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 mb-6">
            <TabsTrigger value="getting-started" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              Getting Started
            </TabsTrigger>
            <TabsTrigger value="features" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              Features
            </TabsTrigger>
            <TabsTrigger value="advanced" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              Advanced
            </TabsTrigger>
          </TabsList>
          <TabsContent value="getting-started">
            {renderVideoGrid('getting-started')}
          </TabsContent>
          <TabsContent value="features">
            {renderVideoGrid('features')}
          </TabsContent>
          <TabsContent value="advanced">
            {renderVideoGrid('advanced')}
          </TabsContent>
        </Tabs>
      </DashboardCard>

      {/* Additional Resources */}
      <DashboardCard className="bg-primary/5" testId="card-additional-resources">
        <div className="flex items-start space-x-4">
          <div className="p-2 rounded-lg bg-primary/20">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-2">Prefer Reading?</h3>
            <p className="text-slate-400 text-sm mb-4">
              Check out our written guides and documentation for detailed explanations and code examples.
            </p>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
                data-testid="button-view-docs"
              >
                View Documentation
              </Button>
              <Button
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
                data-testid="button-best-practices"
              >
                Best Practices
              </Button>
            </div>
          </div>
        </div>
      </DashboardCard>
    </PageShell>
  );
}
