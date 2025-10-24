import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AvatarMenu } from "@/components/ui/avatar-menu";
import NotificationCenter from "@/components/dashboard/notification-center";
import { 
  ArrowLeft,
  RotateCcw, 
  History,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Calendar,
  User,
  Shield
} from "lucide-react";

interface VersionHistory {
  id: string;
  productName: string;
  changeDate: Date;
  changeType: 'ai-optimization' | 'manual-edit' | 'bulk-import' | 'shopify-sync';
  changedBy: string;
  changes: {
    field: string;
    before: string;
    after: string;
  }[];
  canRollback: boolean;
}

export default function RollbackChanges() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [rollingBack, setRollingBack] = useState<Set<string>>(new Set());

  const handleGoBack = () => {
    sessionStorage.setItem('navigationSource', 'automation');
    setLocation('/dashboard');
  };

  const [versionHistory] = useState<VersionHistory[]>([
    {
      id: "v_001",
      productName: "Wireless Bluetooth Headphones",
      changeDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      changeType: 'ai-optimization',
      changedBy: 'Zyra AI AI',
      canRollback: true,
      changes: [
        {
          field: 'Title',
          before: 'Wireless Headphones',
          after: '🎧 Premium Wireless Bluetooth Headphones - Noise Canceling | Free Shipping'
        },
        {
          field: 'Description',
          before: 'Good quality headphones for music',
          after: 'Transform your audio experience with our premium wireless headphones. Featuring advanced noise cancellation technology, crystal-clear sound quality, and all-day comfort. Perfect for music lovers, professionals, and students. 30-hour battery life, quick charging, and premium build quality. 30-day money-back guarantee.'
        },
        {
          field: 'Tags',
          before: 'headphones, audio',
          after: 'headphones, wireless, bluetooth, noise-canceling, premium, audio, music, electronics'
        }
      ]
    },
    {
      id: "v_002",
      productName: "Smart Fitness Watch",
      changeDate: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      changeType: 'ai-optimization',
      changedBy: 'Zyra AI AI',
      canRollback: true,
      changes: [
        {
          field: 'Title',
          before: 'Smart Watch',
          after: '⌚ Smart Fitness Watch - Heart Rate Monitor & GPS Tracking | Bestseller'
        },
        {
          field: 'Description',
          before: 'A good smartwatch for fitness',
          after: 'Stay connected and healthy with our advanced smart fitness watch. Features heart rate monitoring, GPS tracking, sleep analysis, and 50+ workout modes. Waterproof design with 7-day battery life. Compatible with iOS and Android. Perfect for athletes and fitness enthusiasts.'
        }
      ]
    },
    {
      id: "v_003",
      productName: "Ergonomic Laptop Stand",
      changeDate: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      changeType: 'bulk-import',
      changedBy: 'John Smith',
      canRollback: true,
      changes: [
        {
          field: 'Description',
          before: 'Useful laptop stand for desk',
          after: 'Improve your workspace ergonomics with our premium adjustable laptop stand. Features 6 height settings, built-in cooling, and sturdy aluminum construction.'
        }
      ]
    },
    {
      id: "v_004",
      productName: "Gaming Mouse Pro",
      changeDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      changeType: 'shopify-sync',
      changedBy: 'System',
      canRollback: false,
      changes: [
        {
          field: 'Price',
          before: '$79.99',
          after: '$69.99'
        }
      ]
    }
  ]);

  const handleRollback = async (versionId: string) => {
    setRollingBack(prev => new Set(prev).add(versionId));

    const version = versionHistory.find(v => v.id === versionId);
    
    toast({
      title: "🔄 Rolling Back Changes",
      description: `Reverting ${version?.productName} to previous version...`,
    });

    await new Promise(resolve => setTimeout(resolve, 2500));

    setRollingBack(prev => {
      const updated = new Set(prev);
      updated.delete(versionId);
      return updated;
    });

    toast({
      title: "✅ Rollback Complete",
      description: `${version?.productName} has been restored to its previous version`,
    });
  };

  const handleBulkRollback = async () => {
    const rollbackableItems = versionHistory.filter(v => v.canRollback);
    
    toast({
      title: "🔄 Bulk Rollback Started",
      description: `Rolling back ${rollbackableItems.length} products to previous versions...`,
    });

    await new Promise(resolve => setTimeout(resolve, 4000));

    toast({
      title: "✅ Bulk Rollback Complete",
      description: `${rollbackableItems.length} products successfully reverted to original copy`,
    });
  };

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'ai-optimization': return <CheckCircle className="w-4 h-4 text-blue-400" />;
      case 'manual-edit': return <User className="w-4 h-4 text-green-400" />;
      case 'bulk-import': return <FileText className="w-4 h-4 text-purple-400" />;
      case 'shopify-sync': return <Shield className="w-4 h-4 text-orange-400" />;
      default: return <History className="w-4 h-4 text-gray-400" />;
    }
  };

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'ai-optimization': return 'bg-blue-500/20 text-blue-300';
      case 'manual-edit': return 'bg-green-500/20 text-green-300';
      case 'bulk-import': return 'bg-purple-500/20 text-purple-300';
      case 'shopify-sync': return 'bg-orange-500/20 text-orange-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const rollbackableCount = versionHistory.filter(v => v.canRollback).length;
  const totalChanges = versionHistory.reduce((sum, v) => sum + v.changes.length, 0);

  return (
    <div className="min-h-screen dark-theme-bg text-white">
      {/* Header */}
      <header className="gradient-surface backdrop-blur-sm border-b border-slate-700/50 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left Section - Back Button + Title */}
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoBack}
              className="text-slate-200 hover:text-primary hover:bg-white/10 transition-all duration-300 ease-in-out flex-shrink-0"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-6 h-6 text-primary" />
                <h1 className="font-bold text-white text-base sm:text-lg lg:text-xl xl:text-2xl truncate">
                  Rollback Changes
                </h1>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm lg:text-base truncate">
                Safely restore previous versions of your product data
              </p>
            </div>
          </div>

          {/* Right Section - Notifications + Profile */}
          <div className="flex items-center justify-end space-x-2 sm:space-x-4 flex-shrink-0">
            <NotificationCenter />
            <AvatarMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8 ">
        {/* Summary & Bulk Actions */}
        <Card className="border-0 gradient-card rounded-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-white">Version History</CardTitle>
                <CardDescription className="text-slate-300">
                  View and rollback recent changes to ensure data safety
                </CardDescription>
              </div>
              <Button
                onClick={handleBulkRollback}
                className="bg-orange-600 hover:bg-orange-700 text-white"
                data-testid="button-bulk-rollback"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Rollback All Recent
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">{versionHistory.length}</div>
                <div className="text-slate-300 text-sm">Recent Changes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">{rollbackableCount}</div>
                <div className="text-slate-300 text-sm">Can Rollback</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">{totalChanges}</div>
                <div className="text-slate-300 text-sm">Total Modifications</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">24h</div>
                <div className="text-slate-300 text-sm">Retention Period</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Version History List */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white">Recent Changes</h2>
          
          {versionHistory.map((version) => (
            <Card key={version.id} className="border-0 gradient-card rounded-xl">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      {getChangeTypeIcon(version.changeType)}
                      <CardTitle className="text-lg text-white">{version.productName}</CardTitle>
                      <Badge className={getChangeTypeColor(version.changeType)}>
                        {version.changeType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{version.changeDate.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>by {version.changedBy}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {version.changes.length} changes
                      </Badge>
                    </div>
                  </div>
                  {version.canRollback ? (
                    <Button
                      onClick={() => handleRollback(version.id)}
                      disabled={rollingBack.has(version.id)}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                      data-testid={`button-rollback-${version.id}`}
                    >
                      {rollingBack.has(version.id) ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Rolling Back...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Rollback
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="flex items-center space-x-2 text-slate-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm">Cannot rollback</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="text-slate-300 font-medium">Before vs After Comparison</h4>
                {version.changes.map((change, idx) => (
                  <div key={idx} className="grid md:grid-cols-2 gap-6 p-4 bg-slate-800/30 rounded-lg">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-red-300 font-medium text-sm">{change.field} - Before</span>
                      </div>
                      <div className="bg-red-900/20 border border-red-400/20 p-3 rounded">
                        <p className="text-slate-300 text-sm">{change.before}</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-green-300 font-medium text-sm">{change.field} - After</span>
                      </div>
                      <div className="bg-green-900/20 border border-green-400/20 p-3 rounded">
                        <p className="text-slate-300 text-sm">{change.after}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Safety Information */}
        <Card className="border-0 bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-400/20">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Shield className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-white font-semibold mb-2">Safety & Data Protection</h3>
                <p className="text-slate-300 text-sm">
                  All changes are automatically versioned and stored for 30 days. Rollbacks are instant and preserve 
                  your data integrity. Critical system changes (like pricing sync) cannot be rolled back for security reasons.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}