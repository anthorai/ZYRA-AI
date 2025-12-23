import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Palette,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Zap,
  Crown,
  Target,
  Megaphone,
  Briefcase,
  Package,
  ChevronRight,
  Loader2,
  RefreshCw,
  Upload,
  Eye
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  category: string;
  image: string | null;
  shopifyId: string | null;
}

interface BrandVoice {
  id: string;
  name: string;
  description: string;
}

interface Transformation {
  id: string;
  productId: string;
  brandVoice: string;
  originalDescription: string | null;
  originalFeatures: string[];
  originalCta: string | null;
  transformedDescription: string | null;
  transformedFeatures: string[];
  transformedCta: string | null;
  transformedMicrocopy: string | null;
  status: 'pending' | 'preview' | 'approved' | 'rejected' | 'applied';
  appliedToShopify: boolean;
  createdAt: string;
}

const VOICE_ICONS: Record<string, React.ReactNode> = {
  luxury: <Crown className="w-5 h-5" />,
  friendly: <Sparkles className="w-5 h-5" />,
  bold: <Target className="w-5 h-5" />,
  minimal: <Package className="w-5 h-5" />,
  energetic: <Zap className="w-5 h-5" />,
  professional: <Briefcase className="w-5 h-5" />
};

const VOICE_COLORS: Record<string, string> = {
  luxury: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  friendly: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  bold: 'bg-red-500/20 text-red-400 border-red-500/30',
  minimal: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  energetic: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  professional: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
};

export default function DynamicTemplates() {
  const { toast } = useToast();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [viewingTransformation, setViewingTransformation] = useState<Transformation | null>(null);

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products']
  });

  const { data: voices = [] } = useQuery<BrandVoice[]>({
    queryKey: ['/api/brand-voice/voices']
  });

  const { data: transformations = [], isLoading: transformationsLoading, refetch: refetchTransformations } = useQuery<Transformation[]>({
    queryKey: ['/api/brand-voice/transformations'],
    refetchInterval: 5000
  });

  const transformMutation = useMutation({
    mutationFn: async ({ productId, brandVoice }: { productId: string; brandVoice: string }) => {
      return apiRequest('/api/brand-voice/transform', {
        method: 'POST',
        body: JSON.stringify({ productId, brandVoice })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/brand-voice/transformations'] });
      toast({
        title: "Transformation Started",
        description: "Your product copy is being transformed..."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Transformation Failed",
        description: error.message || "Failed to transform product copy",
        variant: "destructive"
      });
    }
  });

  const bulkTransformMutation = useMutation({
    mutationFn: async ({ productIds, brandVoice }: { productIds: string[]; brandVoice: string }) => {
      return apiRequest('/api/brand-voice/bulk-transform', {
        method: 'POST',
        body: JSON.stringify({ productIds, brandVoice })
      });
    },
    onSuccess: (_, variables) => {
      setSelectedProducts([]);
      queryClient.invalidateQueries({ queryKey: ['/api/brand-voice/transformations'] });
      toast({
        title: "Bulk Transformation Started",
        description: `Transforming ${variables.productIds.length} products...`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Bulk Transformation Failed",
        description: error.message || "Failed to start bulk transformation",
        variant: "destructive"
      });
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/brand-voice/transformations/${id}/approve`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/brand-voice/transformations'] });
      setViewingTransformation(null);
      toast({
        title: "Approved",
        description: "Transformation approved and ready for Shopify"
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/brand-voice/transformations/${id}/reject`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/brand-voice/transformations'] });
      setViewingTransformation(null);
      toast({
        title: "Rejected",
        description: "Transformation rejected"
      });
    }
  });

  const applyToShopifyMutation = useMutation({
    mutationFn: async (transformationIds: string[]) => {
      return apiRequest('/api/brand-voice/apply-to-shopify', {
        method: 'POST',
        body: JSON.stringify({ transformationIds })
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/brand-voice/transformations'] });
      toast({
        title: "Applied to Shopify",
        description: `${data.applied} transformations pushed to Shopify`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed",
        description: error.message || "Failed to apply to Shopify",
        variant: "destructive"
      });
    }
  });

  const handleProductSelect = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const handleTransform = () => {
    if (!selectedVoice || selectedProducts.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select products and a brand voice",
        variant: "destructive"
      });
      return;
    }

    if (selectedProducts.length === 1) {
      transformMutation.mutate({ productId: selectedProducts[0], brandVoice: selectedVoice });
    } else {
      bulkTransformMutation.mutate({ productIds: selectedProducts, brandVoice: selectedVoice });
    }
  };

  const approvedTransformations = transformations.filter(t => t.status === 'approved');
  const previewTransformations = transformations.filter(t => t.status === 'preview');
  const appliedTransformations = transformations.filter(t => t.status === 'applied');

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'Unknown Product';
  };

  return (
    <PageShell
      title="Dynamic Tone Templates"
      description="Transform product copy into consistent brand voice - no manual writing required"
      icon={<Palette className="w-6 h-6 text-primary" />}
      backLink="/ai-tools"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <DashboardCard
            title="Select Products"
            description="Choose products to transform with your brand voice"
            headerAction={
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSelectAll}
                data-testid="button-select-all"
              >
                {selectedProducts.length === products.length ? 'Deselect All' : 'Select All'}
              </Button>
            }
          >
            {productsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No products found. Sync your Shopify store first.</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {products.map(product => (
                    <div 
                      key={product.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                        selectedProducts.includes(product.id) 
                          ? 'bg-primary/10 border-primary/30' 
                          : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                      }`}
                      onClick={() => handleProductSelect(product.id)}
                      data-testid={`product-row-${product.id}`}
                    >
                      <Checkbox 
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => handleProductSelect(product.id)}
                        data-testid={`checkbox-product-${product.id}`}
                      />
                      {product.image && (
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{product.category}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0">${product.price}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            
            {selectedProducts.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
                </span>
              </div>
            )}
          </DashboardCard>

          <DashboardCard
            title="Choose Brand Voice"
            description="Select a tone style for your product copy"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {voices.map(voice => (
                <button
                  key={voice.id}
                  onClick={() => setSelectedVoice(voice.id)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    selectedVoice === voice.id
                      ? `${VOICE_COLORS[voice.id]} border-2`
                      : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                  }`}
                  data-testid={`button-voice-${voice.id}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {VOICE_ICONS[voice.id]}
                    <span className="font-medium">{voice.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{voice.description}</p>
                </button>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <Button 
                className="flex-1"
                onClick={handleTransform}
                disabled={!selectedVoice || selectedProducts.length === 0 || transformMutation.isPending || bulkTransformMutation.isPending}
                data-testid="button-transform"
              >
                {(transformMutation.isPending || bulkTransformMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Transform {selectedProducts.length > 0 ? `${selectedProducts.length} Product${selectedProducts.length > 1 ? 's' : ''}` : 'Products'}
              </Button>
            </div>
          </DashboardCard>
        </div>

        <div className="space-y-6">
          <DashboardCard
            title="Pending Review"
            description="Approve or reject transformations"
            headerAction={
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => refetchTransformations()}
                data-testid="button-refresh-transformations"
              >
                <RefreshCw className={`w-4 h-4 ${transformationsLoading ? 'animate-spin' : ''}`} />
              </Button>
            }
          >
            {previewTransformations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No pending transformations</p>
              </div>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {previewTransformations.map(t => (
                    <div 
                      key={t.id}
                      className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 cursor-pointer"
                      onClick={() => setViewingTransformation(t)}
                      data-testid={`transformation-preview-${t.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{getProductName(t.productId)}</span>
                        <Badge className={VOICE_COLORS[t.brandVoice]} variant="outline">
                          {t.brandVoice}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Button size="sm" variant="outline" className="flex-1" data-testid={`button-view-${t.id}`}>
                          <Eye className="w-3 h-3 mr-1" /> Preview
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </DashboardCard>

          <DashboardCard
            title="Ready for Shopify"
            description="Approved transformations ready to push"
          >
            {approvedTransformations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No approved transformations</p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[150px]">
                  <div className="space-y-2">
                    {approvedTransformations.map(t => (
                      <div 
                        key={t.id}
                        className="p-3 rounded-lg bg-green-500/10 border border-green-500/30"
                        data-testid={`transformation-approved-${t.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate text-green-400">{getProductName(t.productId)}</span>
                          <Badge className={VOICE_COLORS[t.brandVoice]} variant="outline">
                            {t.brandVoice}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Button 
                  className="w-full mt-4"
                  onClick={() => applyToShopifyMutation.mutate(approvedTransformations.map(t => t.id))}
                  disabled={applyToShopifyMutation.isPending}
                  data-testid="button-apply-to-shopify"
                >
                  {applyToShopifyMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Push {approvedTransformations.length} to Shopify
                </Button>
              </>
            )}
          </DashboardCard>

          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending Review</span>
                <span className="font-medium">{previewTransformations.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Approved</span>
                <span className="font-medium text-green-400">{approvedTransformations.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Applied to Shopify</span>
                <span className="font-medium text-blue-400">{appliedTransformations.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {viewingTransformation && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setViewingTransformation(null)}>
          <Card 
            className="w-full max-w-3xl max-h-[90vh] overflow-hidden bg-slate-900 border-slate-700"
            onClick={e => e.stopPropagation()}
          >
            <CardHeader className="border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Preview Transformation</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getProductName(viewingTransformation.productId)} - {viewingTransformation.brandVoice} voice
                  </p>
                </div>
                <Badge className={VOICE_COLORS[viewingTransformation.brandVoice]} variant="outline">
                  {viewingTransformation.brandVoice}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Original Description</h4>
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 text-sm">
                    {viewingTransformation.originalDescription || 'No original description'}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-primary mb-2">Transformed Description</h4>
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/30 text-sm">
                    {viewingTransformation.transformedDescription || 'No transformation available'}
                  </div>
                </div>
              </div>

              {viewingTransformation.transformedFeatures && viewingTransformation.transformedFeatures.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-primary mb-2">Transformed Features</h4>
                  <ul className="space-y-2">
                    {viewingTransformation.transformedFeatures.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {viewingTransformation.transformedCta && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-primary mb-2">Call to Action</h4>
                  <Badge className="text-base py-1 px-4">{viewingTransformation.transformedCta}</Badge>
                </div>
              )}

              {viewingTransformation.transformedMicrocopy && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-primary mb-2">Microcopy</h4>
                  <p className="text-sm text-muted-foreground italic">{viewingTransformation.transformedMicrocopy}</p>
                </div>
              )}
            </CardContent>
            <div className="border-t border-slate-700/50 p-4 flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => rejectMutation.mutate(viewingTransformation.id)}
                disabled={rejectMutation.isPending}
                data-testid="button-reject-transformation"
              >
                {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                Reject
              </Button>
              <Button
                onClick={() => approveMutation.mutate(viewingTransformation.id)}
                disabled={approveMutation.isPending}
                data-testid="button-approve-transformation"
              >
                {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Approve
              </Button>
            </div>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
