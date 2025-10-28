import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { 
  Eye, 
  MousePointer, 
  Search, 
  Mail,
  Download,
  TrendingUp,
  BarChart3,
  ChevronDown,
  FileText,
  FileSpreadsheet
} from "lucide-react";
import { generateCSV, generatePDF, downloadFile, getExportFilename, type ExportData } from "@/lib/exportUtils";

export default function Analytics() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  
  // Fetch analytics data from the API
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ["/api/analytics"],
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">Analytics Unavailable</h3>
        <p className="text-muted-foreground mb-6">Unable to load analytics data. Please try again later.</p>
        <Button className="gradient-button" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  // Sample metrics for display - in production these would come from the API
  const keyMetrics = [
    {
      icon: <Eye className="w-6 h-6" />,
      title: "Page Views",
      value: "147,325",
      change: "+25.3%",
      positive: true,
    },
    {
      icon: <MousePointer className="w-6 h-6" />,
      title: "Click Rate", 
      value: "4.2%",
      change: "+18.7%",
      positive: true,
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: "Avg. Search Rank",
      value: "12",
      change: "+42.1%",
      positive: true,
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email Open Rate",
      value: "68.5%", 
      change: "+12.8%",
      positive: true,
    },
  ];

  const topProducts = (products as any)?.slice(0, 3) || [];

  // Prepare export data
  const prepareExportData = (): ExportData => {
    return {
      keyMetrics: keyMetrics.map(metric => ({
        title: metric.title,
        value: metric.value,
        change: metric.change,
        positive: metric.positive
      })),
      products: (products as any) || [],
      emailPerformance: {
        delivered: "12,450",
        opened: "8,523 (68.5%)",
        clicked: "1,247 (14.6%)",
        converted: "324 (26%)"
      },
      smsPerformance: {
        sent: "3,240",
        delivered: "3,186 (98.3%)",
        clicked: "892 (28%)",
        recovered: "267 (30%)"
      },
      seoPerformance: {
        optimizedProducts: (products as any)?.filter((p: any) => p.isOptimized).length || 0,
        rankingImprovement: "+8 positions",
        organicTraffic: "+42%",
        keywordRankings: "234 in top 10"
      }
    };
  };

  // Handle export functionality
  const handleExport = async (format: 'csv' | 'pdf') => {
    if (isExporting) return;
    
    setIsExporting(true);
    
    try {
      const exportData = prepareExportData();
      const filename = getExportFilename(format);
      
      if (format === 'csv') {
        const csvContent = generateCSV(exportData);
        downloadFile(csvContent, filename, 'csv');
        toast({
          title: "✅ CSV Export Successful",
          description: `Your analytics report has been downloaded as ${filename}`,
        });
      } else if (format === 'pdf') {
        const pdfDoc = generatePDF(exportData);
        downloadFile(pdfDoc, filename, 'pdf');
        toast({
          title: "✅ PDF Export Successful", 
          description: `Your analytics report has been downloaded as ${filename}`,
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "❌ Export Failed",
        description: "There was an error generating your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Add slight delay to show loading state
      setTimeout(() => setIsExporting(false), 500);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2" data-testid="text-analytics-title">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Track your optimization performance and ROI</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select defaultValue="7days">
            <SelectTrigger className="form-input w-40" data-testid="select-date-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="gradient-surface">
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                className="gradient-button transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg" 
                disabled={isExporting}
                data-testid="button-export-report"
              >
                <Download className={`w-4 h-4 mr-2 ${isExporting ? 'animate-pulse' : ''}`} />
                {isExporting ? 'Generating...' : 'Export Report'}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                className="cursor-pointer hover:bg-accent transition-colors"
                data-testid="menu-export-csv"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                Export as CSV
                <span className="ml-auto text-xs text-muted-foreground">Excel/Sheets</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
                className="cursor-pointer hover:bg-accent transition-colors"
                data-testid="menu-export-pdf"
              >
                <FileText className="w-4 h-4 mr-2 text-red-600" />
                Export as PDF
                <span className="ml-auto text-xs text-muted-foreground">Document</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {keyMetrics.map((metric, index) => (
          <Card key={index} className="stat-card border-0" data-testid={`card-metric-${index}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                  {metric.icon}
                </div>
                <Badge 
                  variant={metric.positive ? "default" : "destructive"}
                  className={metric.positive ? "bg-green-400/10 text-green-400" : "bg-orange-400/10 text-orange-400"}
                >
                  {metric.change}
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-1" data-testid={`text-metric-value-${index}`}>{metric.value}</div>
              <div className="text-sm text-muted-foreground" data-testid={`text-metric-title-${index}`}>{metric.title}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Performance Chart */}
        <Card className="gradient-card border-0">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-6" data-testid="text-performance-chart-title">Optimization Performance</h3>
            <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground" data-testid="text-chart-placeholder">Performance Chart</p>
                <p className="text-sm text-muted-foreground">Revenue, conversions, and optimization metrics over time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="gradient-card border-0">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-6" data-testid="text-top-products-title">Top Performing Products</h3>
            <div className="space-y-4">
              {topProducts.length > 0 ? (
                topProducts.map((product: any, index: number) => (
                  <div key={product.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg" data-testid={`card-top-product-${index}`}>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mr-4">
                        <TrendingUp className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium" data-testid={`text-product-name-${index}`}>{product.name}</div>
                        <div className="text-sm text-muted-foreground" data-testid={`text-product-optimized-${index}`}>
                          {product.isOptimized ? "Optimized" : "Not optimized"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-400" data-testid={`text-product-improvement-${index}`}>
                        {product.isOptimized ? "+32%" : "--"}
                      </div>
                      <div className="text-sm text-muted-foreground">Conversion</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground" data-testid="text-no-products">No products available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Email Performance */}
        <Card className="gradient-card border-0">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4" data-testid="text-email-performance-title">Email Campaign Performance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Delivered</span>
                <span className="font-medium" data-testid="text-email-delivered">12,450</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Opened</span>
                <span className="font-medium" data-testid="text-email-opened">8,523 (68.5%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Clicked</span>
                <span className="font-medium" data-testid="text-email-clicked">1,247 (14.6%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Converted</span>
                <span className="font-medium" data-testid="text-email-converted">324 (26%)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SMS Performance */}
        <Card className="gradient-card border-0">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4" data-testid="text-sms-performance-title">SMS Campaign Performance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Sent</span>
                <span className="font-medium" data-testid="text-sms-sent">3,240</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Delivered</span>
                <span className="font-medium" data-testid="text-sms-delivered">3,186 (98.3%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Clicked</span>
                <span className="font-medium" data-testid="text-sms-clicked">892 (28%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Recovered</span>
                <span className="font-medium" data-testid="text-sms-recovered">267 (30%)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEO Performance */}
        <Card className="gradient-card border-0">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4" data-testid="text-seo-performance-title">SEO Performance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Optimized Products</span>
                <span className="font-medium" data-testid="text-seo-optimized-products">
                  {(products as any)?.filter((p: any) => p.isOptimized).length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg. Ranking Improvement</span>
                <span className="font-medium text-green-400" data-testid="text-seo-ranking-improvement">+8 positions</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Organic Traffic</span>
                <span className="font-medium text-green-400" data-testid="text-seo-organic-traffic">+42%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Keyword Rankings</span>
                <span className="font-medium" data-testid="text-seo-keyword-rankings">234 in top 10</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
