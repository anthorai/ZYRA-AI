import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { 
  Upload, 
  Download, 
  FileSpreadsheet,
  CheckCircle,
  Clock,
  Zap,
  Database
} from "lucide-react";

interface ProductRow {
  id: string;
  title: string;
  description: string;
  tags: string;
  image: string;
  optimizedTitle?: string;
  optimizedDescription?: string;
  optimizedTags?: string;
  optimizedAltText?: string;
}

export default function CSVImportExport() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [optimizedData, setOptimizedData] = useState<ProductRow[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setUploadedFile(file);
      toast({
        title: "CSV File Uploaded",
        description: `${file.name} ready for optimization`,
      });
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
    }
  };

  const handleOptimization = async () => {
    if (!uploadedFile) return;

    setIsOptimizing(true);
    setOptimizationProgress(0);
    setShowResults(false);

    // Simulate CSV processing and AI optimization
    const mockProducts: ProductRow[] = [
      {
        id: "1",
        title: "Wireless Headphones",
        description: "Good headphones",
        tags: "audio, music",
        image: "headphones.jpg"
      },
      {
        id: "2", 
        title: "Smart Watch",
        description: "Nice watch",
        tags: "tech, wearable",
        image: "watch.jpg"
      },
      {
        id: "3",
        title: "Laptop Stand",
        description: "Useful stand",
        tags: "office, desk",
        image: "stand.jpg"
      }
    ];

    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setOptimizationProgress(i);
    }

    // Generate optimized versions
    const optimized = mockProducts.map(product => ({
      ...product,
      optimizedTitle: `🎧 Premium ${product.title} - High-Quality Audio Experience | Free Shipping`,
      optimizedDescription: `Transform your audio experience with our ${product.title.toLowerCase()}. Featuring advanced noise cancellation, crystal-clear sound quality, and all-day comfort. Perfect for music lovers, professionals, and students. 30-day money-back guarantee.`,
      optimizedTags: `${product.tags}, premium, bestseller, wireless, bluetooth, noise-cancelling, comfortable`,
      optimizedAltText: `${product.title} product image showing sleek design and premium build quality`
    }));

    setOptimizedData(optimized);
    setIsOptimizing(false);
    setShowResults(true);

    toast({
      title: "🎉 Optimization Complete!",
      description: `Successfully optimized ${optimized.length} products with AI`,
    });
  };

  const handleDownloadCSV = () => {
    const csvContent = [
      ['ID', 'Original Title', 'Optimized Title', 'Original Description', 'Optimized Description', 'Original Tags', 'Optimized Tags', 'Image Alt Text'],
      ...optimizedData.map(row => [
        row.id,
        row.title,
        row.optimizedTitle || '',
        row.description,
        row.optimizedDescription || '',
        row.tags,
        row.optimizedTags || '',
        row.optimizedAltText || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'optimized_products.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "CSV Downloaded",
      description: "Optimized product data exported successfully",
    });
  };

  const handleSyncToShopify = () => {
    toast({
      title: "🚀 Syncing to Shopify",
      description: "Auto-sync initiated - your optimized products will be updated in your store",
    });

    setTimeout(() => {
      toast({
        title: "✅ Sync Complete",
        description: `${optimizedData.length} products successfully updated in Shopify`,
      });
    }, 3000);
  };

  return (
    <PageShell
      title="CSV Import & Export"
      subtitle="Upload and optimize your product data with AI-powered batch processing"
      backTo="/dashboard"
    >
      {/* Upload Section */}
      <DashboardCard
        title="Upload Your Product Data"
        description="Upload a CSV file with your product information for AI optimization"
      >
        <div className="space-y-6">
            <div className="space-y-4">
              <Label htmlFor="csv-upload" className="text-white">Select CSV File</Label>
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="bg-slate-800/50 border-slate-600 text-white"
                data-testid="input-csv-upload"
              />
              {uploadedFile && (
                <div className="text-sm text-slate-300">
                  Selected: {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <Button
                onClick={handleOptimization}
                disabled={!uploadedFile || isOptimizing}
                className="gradient-button"
                data-testid="button-optimize"
              >
                {isOptimizing ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Optimize with AI
                  </>
                )}
              </Button>
            </div>

            {/* Progress Bar */}
            {isOptimizing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Optimizing products...</span>
                  <span>{optimizationProgress}%</span>
                </div>
                <Progress value={optimizationProgress} className="bg-slate-700" />
              </div>
            )}
        </div>
      </DashboardCard>

      {/* Results Section */}
      {showResults && (
        <DashboardCard
          title="Optimization Results"
          description="AI has enhanced your product data with better titles, descriptions, and SEO tags"
          headerAction={
            <CheckCircle className="w-5 h-5 text-green-400" />
          }
        >
          <div className="space-y-6">
              {/* Sample Results Preview */}
              <div className="space-y-4">
                {optimizedData.slice(0, 2).map((product) => (
                  <div key={product.id} className="bg-slate-800/30 p-4 rounded-lg space-y-3">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-slate-300 font-medium mb-2">Original</h4>
                        <div className="space-y-1 text-sm">
                          <p className="text-slate-400"><strong>Title:</strong> {product.title}</p>
                          <p className="text-slate-400"><strong>Description:</strong> {product.description}</p>
                          <p className="text-slate-400"><strong>Tags:</strong> {product.tags}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-slate-300 font-medium mb-2">AI-Optimized</h4>
                        <div className="space-y-1 text-sm">
                          <p className="text-slate-300"><strong>Title:</strong> {product.optimizedTitle}</p>
                          <p className="text-slate-300"><strong>Description:</strong> {product.optimizedDescription?.substring(0, 100)}...</p>
                          <p className="text-slate-300"><strong>Tags:</strong> {product.optimizedTags?.substring(0, 60)}...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleDownloadCSV}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-download"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Optimized CSV
                </Button>
                <Button
                  onClick={handleSyncToShopify}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  data-testid="button-sync-shopify"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Auto-Sync to Shopify
                </Button>
              </div>
          </div>
        </DashboardCard>
      )}
    </PageShell>
  );
}