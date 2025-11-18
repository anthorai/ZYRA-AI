import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Competitor form schema
const competitorSchema = z.object({
  competitorName: z.string().min(1, "Competitor name is required"),
  competitorUrl: z.string().url("Must be a valid URL"),
  competitorSku: z.string().optional(),
  productId: z.string().optional(),
  productTitle: z.string().min(1, "Product title is required"),
  scrapingEnabled: z.boolean(),
});

type CompetitorForm = z.infer<typeof competitorSchema>;

interface Competitor {
  id: string;
  productId: string | null;
  productName: string | null;
  competitorName: string;
  competitorUrl: string;
  competitorSku: string | null;
  productTitle: string;
  currentPrice: string | null;
  previousPrice: string | null;
  currency: string;
  inStock: boolean;
  lastScrapedAt: string | null;
  scrapingEnabled: boolean;
  matchConfidence: number | null;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  price: string;
  sku: string | null;
}

export default function CompetitorsPage() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<Competitor | null>(null);
  const [viewingPriceHistory, setViewingPriceHistory] = useState<Competitor | null>(null);

  // Fetch competitors
  const { data: competitors = [], isLoading } = useQuery<Competitor[]>({
    queryKey: ['/api/pricing/competitors'],
  });

  // Fetch user products for mapping
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Add competitor mutation
  const addMutation = useMutation({
    mutationFn: async (data: CompetitorForm) => {
      return await apiRequest("POST", "/api/pricing/competitors", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pricing/competitors'] });
      toast({
        title: "Success",
        description: "Competitor product added successfully",
      });
      setIsAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add competitor product",
        variant: "destructive",
      });
    },
  });

  // Update competitor mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CompetitorForm> }) => {
      return await apiRequest("PUT", `/api/pricing/competitors/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pricing/competitors'] });
      toast({
        title: "Success",
        description: "Competitor product updated successfully",
      });
      setEditingCompetitor(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update competitor product",
        variant: "destructive",
      });
    },
  });

  // Delete competitor mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/pricing/competitors/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pricing/competitors'] });
      toast({
        title: "Success",
        description: "Competitor product deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete competitor product",
        variant: "destructive",
      });
    },
  });

  // Toggle scraping mutation
  const toggleScrapingMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      return await apiRequest("PUT", `/api/pricing/competitors/${id}`, {
        scrapingEnabled: enabled,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pricing/competitors'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update scraping status",
        variant: "destructive",
      });
    },
  });

  const form = useForm<CompetitorForm>({
    resolver: zodResolver(competitorSchema),
    defaultValues: {
      competitorName: "",
      competitorUrl: "",
      competitorSku: "",
      productId: "",
      productTitle: "",
      scrapingEnabled: true,
    },
  });

  const editForm = useForm<CompetitorForm>({
    resolver: zodResolver(competitorSchema),
  });

  // Populate edit form when editing
  useEffect(() => {
    if (editingCompetitor) {
      editForm.reset({
        competitorName: editingCompetitor.competitorName,
        competitorUrl: editingCompetitor.competitorUrl,
        competitorSku: editingCompetitor.competitorSku || "",
        productId: editingCompetitor.productId || "",
        productTitle: editingCompetitor.productTitle,
        scrapingEnabled: editingCompetitor.scrapingEnabled,
      });
    }
  }, [editingCompetitor, editForm]);

  const onAddSubmit = async (data: CompetitorForm) => {
    await addMutation.mutateAsync(data);
    form.reset();
  };

  const onEditSubmit = async (data: CompetitorForm) => {
    if (!editingCompetitor) return;
    await updateMutation.mutateAsync({ id: editingCompetitor.id, data });
  };

  const getPriceChange = (current: string | null, previous: string | null) => {
    if (!current || !previous) return null;
    const currentNum = parseFloat(current);
    const previousNum = parseFloat(previous);
    const change = currentNum - previousNum;
    const percentChange = ((change / previousNum) * 100).toFixed(1);
    return { change, percentChange };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Competitor Monitoring</h1>
          <p className="text-slate-400 mt-1">
            Track competitor prices and automate your pricing strategy
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-competitor">
              <Plus className="w-4 h-4 mr-2" />
              Add Competitor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle className="text-white">Add Competitor Product</DialogTitle>
              <DialogDescription className="text-slate-400">
                Add a competitor product to monitor pricing
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="competitor-name" className="text-white">
                  Competitor Name
                </Label>
                <Input
                  id="competitor-name"
                  placeholder="e.g., Amazon, BestBuy"
                  {...form.register('competitorName')}
                  data-testid="input-competitor-name"
                />
                {form.formState.errors.competitorName && (
                  <p className="text-sm text-red-400">
                    {form.formState.errors.competitorName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="competitor-url" className="text-white">
                  Product URL
                </Label>
                <Input
                  id="competitor-url"
                  placeholder="https://..."
                  {...form.register('competitorUrl')}
                  data-testid="input-competitor-url"
                />
                {form.formState.errors.competitorUrl && (
                  <p className="text-sm text-red-400">
                    {form.formState.errors.competitorUrl.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-title" className="text-white">
                  Product Title
                </Label>
                <Input
                  id="product-title"
                  placeholder="Product name on competitor site"
                  {...form.register('productTitle')}
                  data-testid="input-product-title"
                />
                {form.formState.errors.productTitle && (
                  <p className="text-sm text-red-400">
                    {form.formState.errors.productTitle.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="competitor-sku" className="text-white">
                    Competitor SKU (Optional)
                  </Label>
                  <Input
                    id="competitor-sku"
                    placeholder="SKU123"
                    {...form.register('competitorSku')}
                    data-testid="input-competitor-sku"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product-mapping" className="text-white">
                    Map to Product (Optional)
                  </Label>
                  <Select
                    value={form.watch('productId')}
                    onValueChange={(value) => form.setValue('productId', value)}
                  >
                    <SelectTrigger id="product-mapping" data-testid="select-product-mapping">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="scraping-enabled"
                  checked={form.watch('scrapingEnabled')}
                  onCheckedChange={(checked) => form.setValue('scrapingEnabled', checked)}
                  data-testid="switch-scraping-enabled"
                />
                <Label htmlFor="scraping-enabled" className="text-white">
                  Enable price scraping
                </Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  data-testid="button-cancel-add"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addMutation.isPending}
                  data-testid="button-submit-add"
                >
                  {addMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Competitor"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total Competitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{competitors.length}</div>
            <p className="text-xs text-slate-400">
              {competitors.filter((c) => c.scrapingEnabled).length} actively monitored
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Products Mapped
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {competitors.filter((c) => c.productId).length}
            </div>
            <p className="text-xs text-slate-400">
              Out of {competitors.length} competitors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Last Scraped
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {competitors.some((c) => c.lastScrapedAt)
                ? formatDistanceToNow(
                    new Date(
                      Math.max(
                        ...competitors
                          .filter((c) => c.lastScrapedAt)
                          .map((c) => new Date(c.lastScrapedAt!).getTime())
                      )
                    ),
                    { addSuffix: true }
                  )
                : "Never"}
            </div>
            <p className="text-xs text-slate-400">Most recent update</p>
          </CardContent>
        </Card>
      </div>

      {/* Competitors Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Competitor Products</CardTitle>
          <CardDescription className="text-slate-400">
            Monitor and manage competitor pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {competitors.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No competitors added yet
              </h3>
              <p className="text-slate-400 mb-4">
                Add competitor products to start monitoring their prices
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-first-competitor">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Competitor
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white">Competitor</TableHead>
                    <TableHead className="text-white">Product</TableHead>
                    <TableHead className="text-white">Our Product</TableHead>
                    <TableHead className="text-white">Price</TableHead>
                    <TableHead className="text-white">Last Scraped</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-right text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competitors.map((competitor) => {
                    const priceChange = getPriceChange(
                      competitor.currentPrice,
                      competitor.previousPrice
                    );

                    return (
                      <TableRow key={competitor.id} data-testid={`row-competitor-${competitor.id}`}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-white">
                              {competitor.competitorName}
                            </div>
                            {competitor.competitorSku && (
                              <div className="text-sm text-slate-400">
                                SKU: {competitor.competitorSku}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="text-white">{competitor.productTitle}</span>
                            <a
                              href={competitor.competitorUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </TableCell>

                        <TableCell>
                          {competitor.productName ? (
                            <div className="text-white">{competitor.productName}</div>
                          ) : (
                            <Badge variant="secondary">Not Mapped</Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          {competitor.currentPrice ? (
                            <div className="space-y-1">
                              <div className="font-medium text-white">
                                ${parseFloat(competitor.currentPrice).toFixed(2)}
                              </div>
                              {priceChange && (
                                <div className="flex items-center space-x-1 text-sm">
                                  {priceChange.change > 0 ? (
                                    <>
                                      <TrendingUp className="w-3 h-3 text-red-400" />
                                      <span className="text-red-400">
                                        +{priceChange.percentChange}%
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <TrendingDown className="w-3 h-3 text-green-400" />
                                      <span className="text-green-400">
                                        {priceChange.percentChange}%
                                      </span>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">Not scraped</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="text-sm text-slate-400">
                            {competitor.lastScrapedAt
                              ? formatDistanceToNow(new Date(competitor.lastScrapedAt), {
                                  addSuffix: true,
                                })
                              : "Never"}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Switch
                            checked={competitor.scrapingEnabled}
                            onCheckedChange={(checked) =>
                              toggleScrapingMutation.mutate({
                                id: competitor.id,
                                enabled: checked,
                              })
                            }
                            data-testid={`switch-scraping-${competitor.id}`}
                          />
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {competitor.currentPrice && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setViewingPriceHistory(competitor)}
                                data-testid={`button-view-history-${competitor.id}`}
                                title="View price history"
                              >
                                <BarChart3 className="w-4 h-4" />
                              </Button>
                            )}

                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditingCompetitor(competitor)}
                              data-testid={`button-edit-${competitor.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  data-testid={`button-delete-${competitor.id}`}
                                >
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-white">
                                    Delete Competitor Product
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-slate-400">
                                    Are you sure you want to delete "{competitor.productTitle}"
                                    from {competitor.competitorName}? This action cannot be
                                    undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate(competitor.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                    data-testid={`button-confirm-delete-${competitor.id}`}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price History Dialog */}
      {viewingPriceHistory && (
        <Dialog open={!!viewingPriceHistory} onOpenChange={() => setViewingPriceHistory(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-white">Price History</DialogTitle>
              <DialogDescription className="text-slate-400">
                {viewingPriceHistory.productTitle} - {viewingPriceHistory.competitorName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Price Comparison Chart */}
              {viewingPriceHistory.currentPrice && viewingPriceHistory.previousPrice && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-white">
                      Price Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(() => {
                      const current = parseFloat(viewingPriceHistory.currentPrice);
                      const previous = parseFloat(viewingPriceHistory.previousPrice);
                      const maxPrice = Math.max(current, previous);
                      const currentPercent = (current / maxPrice) * 100;
                      const previousPercent = (previous / maxPrice) * 100;

                      return (
                        <div className="space-y-4">
                          {/* Previous Price Bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Previous</span>
                              <span className="text-white font-medium">
                                ${previous.toFixed(2)}
                              </span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-8 overflow-hidden">
                              <div
                                className="bg-blue-500 h-full flex items-center justify-end pr-3 rounded-full transition-all"
                                style={{ width: `${previousPercent}%` }}
                              >
                                <span className="text-xs text-white font-medium">
                                  {previousPercent.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Current Price Bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Current</span>
                              <span className="text-white font-medium">
                                ${current.toFixed(2)}
                              </span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-8 overflow-hidden">
                              <div
                                className={`h-full flex items-center justify-end pr-3 rounded-full transition-all ${
                                  current > previous
                                    ? "bg-red-500"
                                    : current < previous
                                    ? "bg-green-500"
                                    : "bg-blue-500"
                                }`}
                                style={{ width: `${currentPercent}%` }}
                              >
                                <span className="text-xs text-white font-medium">
                                  {currentPercent.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Price Comparison Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-400">
                      Current Price
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">
                      ${parseFloat(viewingPriceHistory.currentPrice || "0").toFixed(2)}
                    </div>
                    {viewingPriceHistory.lastScrapedAt && (
                      <p className="text-xs text-slate-400 mt-2">
                        As of{" "}
                        {formatDistanceToNow(new Date(viewingPriceHistory.lastScrapedAt), {
                          addSuffix: true,
                        })}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-400">
                      Previous Price
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {viewingPriceHistory.previousPrice ? (
                      <>
                        <div className="text-3xl font-bold text-white">
                          ${parseFloat(viewingPriceHistory.previousPrice).toFixed(2)}
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Last recorded</p>
                      </>
                    ) : (
                      <div className="text-2xl text-slate-500">No data</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Price Change Indicator */}
              {viewingPriceHistory.currentPrice &&
                viewingPriceHistory.previousPrice &&
                (() => {
                  const change = getPriceChange(
                    viewingPriceHistory.currentPrice,
                    viewingPriceHistory.previousPrice
                  );
                  return change ? (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">Price Change</span>
                          <div className="flex items-center space-x-2">
                            {change.change > 0 ? (
                              <>
                                <TrendingUp className="w-5 h-5 text-red-400" />
                                <span className="text-xl font-bold text-red-400">
                                  +${Math.abs(change.change).toFixed(2)} ({change.percentChange}
                                  %)
                                </span>
                              </>
                            ) : (
                              <>
                                <TrendingDown className="w-5 h-5 text-green-400" />
                                <span className="text-xl font-bold text-green-400">
                                  -${Math.abs(change.change).toFixed(2)} ({change.percentChange}
                                  %)
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null;
                })()}

              {/* Additional Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-white">
                    Product Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Competitor:</span>
                    <span className="text-white font-medium">
                      {viewingPriceHistory.competitorName}
                    </span>
                  </div>
                  {viewingPriceHistory.competitorSku && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">SKU:</span>
                      <span className="text-white font-medium">
                        {viewingPriceHistory.competitorSku}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Currency:</span>
                    <span className="text-white font-medium">
                      {viewingPriceHistory.currency}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">In Stock:</span>
                    <span className="text-white font-medium">
                      {viewingPriceHistory.inStock ? "Yes" : "No"}
                    </span>
                  </div>
                  {viewingPriceHistory.productName && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Mapped to:</span>
                      <span className="text-white font-medium">
                        {viewingPriceHistory.productName}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex items-center justify-center text-sm text-slate-500 pt-2">
                <p>
                  Note: Full historical tracking will be available once competitor scraping
                  begins running regularly
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Dialog */}
      {editingCompetitor && (
        <Dialog open={!!editingCompetitor} onOpenChange={() => setEditingCompetitor(null)}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Competitor Product</DialogTitle>
              <DialogDescription className="text-slate-400">
                Update competitor product details
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-competitor-name" className="text-white">
                  Competitor Name
                </Label>
                <Input
                  id="edit-competitor-name"
                  {...editForm.register('competitorName')}
                  data-testid="input-edit-competitor-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-competitor-url" className="text-white">
                  Product URL
                </Label>
                <Input
                  id="edit-competitor-url"
                  {...editForm.register('competitorUrl')}
                  data-testid="input-edit-competitor-url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-product-title" className="text-white">
                  Product Title
                </Label>
                <Input
                  id="edit-product-title"
                  {...editForm.register('productTitle')}
                  data-testid="input-edit-product-title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-competitor-sku" className="text-white">
                    Competitor SKU
                  </Label>
                  <Input
                    id="edit-competitor-sku"
                    {...editForm.register('competitorSku')}
                    data-testid="input-edit-competitor-sku"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-product-mapping" className="text-white">
                    Map to Product
                  </Label>
                  <Select
                    value={editForm.watch('productId')}
                    onValueChange={(value) => editForm.setValue('productId', value)}
                  >
                    <SelectTrigger id="edit-product-mapping" data-testid="select-edit-product-mapping">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-scraping-enabled"
                  checked={editForm.watch('scrapingEnabled')}
                  onCheckedChange={(checked) =>
                    editForm.setValue('scrapingEnabled', checked)
                  }
                  data-testid="switch-edit-scraping-enabled"
                />
                <Label htmlFor="edit-scraping-enabled" className="text-white">
                  Enable price scraping
                </Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingCompetitor(null)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  data-testid="button-submit-edit"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Competitor"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
