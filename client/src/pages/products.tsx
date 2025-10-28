import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Package, DollarSign, Archive, Image as ImageIcon, Menu, ShoppingBag, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertProductSchema } from "@shared/schema";
import type { Product, InsertProduct } from "@shared/schema";
import { z } from "zod";
import Sidebar from "@/components/dashboard/sidebar";
import Footer from "@/components/ui/footer";
import { useAuth } from "@/hooks/useAuth";
import { PageContainer } from "@/components/ui/standardized-layout";

// Product categories - you can expand this list
const PRODUCT_CATEGORIES = [
  "Electronics",
  "Clothing",
  "Home & Garden",
  "Books",
  "Sports",
  "Beauty",
  "Food",
  "Toys",
  "Automotive",
  "Health",
  "Other"
];

// Form validation schema for frontend
const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.string().min(1, "Price is required").refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Price must be a positive number"),
  category: z.string().min(1, "Category is required"),
  stock: z.string().min(1, "Stock is required").refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, "Stock must be 0 or greater"),
  image: z.string().url("Please enter a valid URL").optional().or(z.literal(""))
});

type ProductFormData = z.infer<typeof productFormSchema>;

function ProductCard({ product, onEdit, onDelete }: { product: Product; onEdit: (product: Product) => void; onDelete: (id: string) => void }) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <Card className="group relative overflow-hidden gradient-card rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:scale-[1.02] border border-slate-700/50 hover:border-primary/30" data-testid={`card-product-${product.id}`}>
      <div className="h-full p-3 sm:p-4 md:p-6 flex flex-col">
        <CardHeader className="p-0 flex-1 space-y-2 sm:space-y-3">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="text-primary flex-shrink-0">
                {product.image && !imageError ? (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className={`w-full h-full object-cover transition-opacity duration-200 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                      onLoad={() => setImageLoading(false)}
                      onError={() => {
                        setImageError(true);
                        setImageLoading(false);
                      }}
                      loading="lazy"
                      data-testid={`img-product-${product.id}`}
                    />
                  </div>
                ) : (
                  <ImageIcon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
                )}
              </div>
              <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white leading-tight truncate" data-testid={`text-product-name-${product.id}`}>
                {product.name}
              </CardTitle>
            </div>
            {product.isOptimized && (
              <Badge className="bg-green-500 text-white text-xs px-2 py-1 rounded-full hover:bg-green-500 flex-shrink-0 ml-2">
                Optimized
              </Badge>
            )}
          </div>
          
          <CardDescription className="text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-3 min-w-0">
            {product.description || "No description available"}
          </CardDescription>

          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-400">Price:</span>
              <span className="font-semibold text-primary" data-testid={`text-product-price-${product.id}`}>
                ${parseFloat(product.price).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-400">Stock:</span>
              <span className="font-semibold text-white" data-testid={`text-product-stock-${product.id}`}>
                {product.stock} units
              </span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-400">Category:</span>
              <Badge variant="outline" className="text-xs truncate max-w-[120px]">
                {product.category}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <div className="flex gap-2 mt-3 sm:mt-4">
          <Button
            onClick={() => onEdit(product)}
            className="flex-1 bg-primary hover:bg-primary/90 text-slate-900 font-semibold rounded-full px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/50"
            data-testid={`button-edit-product-${product.id}`}
          >
            <Edit2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
            Edit
          </Button>
          <Button
            onClick={() => onDelete(product.id)}
            variant="outline"
            className="px-3 sm:px-4 py-2 sm:py-3 rounded-full border-slate-600 hover:bg-red-500/10 hover:border-red-500"
            data-testid={`button-delete-product-${product.id}`}
          >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ProductGrid({ products, isLoading, onEdit, onDelete }: { 
  products: Product[]; 
  isLoading: boolean; 
  onEdit: (product: Product) => void; 
  onDelete: (id: string) => void; 
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="gradient-card shadow-lg border border-slate-700/50 rounded-xl sm:rounded-2xl">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <Skeleton className="h-8 w-8 rounded-lg mb-2 sm:mb-3" />
              <Skeleton className="h-4 sm:h-5 mb-2" />
              <Skeleton className="h-3 sm:h-4 w-2/3 mb-2 sm:mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-3 sm:h-4 w-full" />
                <Skeleton className="h-3 sm:h-4 w-full" />
                <Skeleton className="h-3 sm:h-4 w-full" />
              </div>
              <Skeleton className="h-9 w-full mt-3 sm:mt-4 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto text-muted-foreground mb-4 flex-shrink-0" />
        <h3 className="text-lg sm:text-xl font-semibold mb-2">No products yet</h3>
        <p className="text-sm sm:text-base text-muted-foreground mb-6">Add your first product to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default function ProductsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Form setup
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      category: "",
      stock: "",
      image: "",
    },
  });

  // Fetch products with real-time updates
  // Mock products data for UI-only mode
  const mockProducts: Product[] = [
    {
      id: "1",
      name: "Premium Wireless Headphones",
      description: "High-quality wireless headphones with noise cancellation and premium sound quality. Perfect for music lovers and professionals.",
      price: "299.99",
      category: "Electronics",
      stock: 45,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
      userId: "mock-user",
      createdAt: new Date(Date.now() - 86400000),
      updatedAt: new Date(Date.now() - 3600000),
      isOptimized: true,
      shopifyId: null,
      originalDescription: null,
      originalCopy: null,
      features: null,
      optimizedCopy: null,
      tags: null
    },
    {
      id: "2", 
      name: "Organic Cotton T-Shirt",
      description: "Comfortable and sustainable organic cotton t-shirt available in multiple colors. Made from 100% organic materials.",
      price: "39.99",
      category: "Clothing",
      stock: 120,
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
      userId: "mock-user",
      createdAt: new Date(Date.now() - 172800000),
      updatedAt: new Date(Date.now() - 7200000),
      isOptimized: false,
      shopifyId: null,
      originalDescription: null,
      originalCopy: null,
      features: null,
      optimizedCopy: null,
      tags: null
    }
  ];

  // Use mock data instead of API calls
  const products = mockProducts;
  const isLoading = false;

  // Create product mutation
  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const payload = {
        name: data.name,
        description: data.description || null,
        price: data.price,
        category: data.category,
        stock: parseInt(data.stock),
        image: data.image || null,
      };
      const response = await apiRequest("POST", "/api/products", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Product added!",
        description: "Your product has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    },
  });

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProductFormData> }) => {
      const payload: any = {};
      if (data.name) payload.name = data.name;
      if (data.description !== undefined) payload.description = data.description || null;
      if (data.price) payload.price = data.price;
      if (data.category) payload.category = data.category;
      if (data.stock) payload.stock = parseInt(data.stock);
      if (data.image !== undefined) payload.image = data.image || null;
      
      const response = await apiRequest("PATCH", `/api/products/${id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setEditingProduct(null);
      form.reset();
      toast({
        title: "Product updated!",
        description: "Your product has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/products/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "Product deleted!",
        description: "Your product has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      description: product.description || "",
      price: product.price,
      category: product.category,
      stock: product.stock.toString(),
      image: product.image || "",
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    form.reset();
    setEditingProduct(null);
    setIsAddDialogOpen(false);
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar 
        activeTab="products" 
        onTabChange={() => {}} 
        user={user} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'lg:ml-64' : 'ml-0'
      }`}>
        {/* Top Bar */}
        <header className="gradient-surface border-b border-border px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hover:bg-muted flex-shrink-0"
                data-testid="button-toggle-sidebar"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">Products</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Manage your product catalog</p>
              </div>
            </div>
            <Dialog open={isAddDialogOpen || !!editingProduct} onOpenChange={(open) => {
              if (!open) resetForm();
              else setIsAddDialogOpen(true);
            }}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-slate-900 font-semibold flex-shrink-0" data-testid="button-add-product-main">
                  <Plus className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="hidden sm:inline">Add Product</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </DialogTrigger>
          
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct 
                  ? "Update your product details below" 
                  : "Fill in the details to add a new product to your catalog"}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Premium Wireless Headphones" 
                          {...field} 
                          data-testid="input-product-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your product..." 
                          rows={4}
                          {...field} 
                          data-testid="input-product-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price *</FormLabel>
                        <FormControl>
                          <Input 
                            type="text" 
                            placeholder="29.99" 
                            {...field} 
                            data-testid="input-product-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock *</FormLabel>
                        <FormControl>
                          <Input 
                            type="text" 
                            placeholder="100" 
                            {...field} 
                            data-testid="input-product-stock"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        data-testid="select-product-category"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRODUCT_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input 
                          type="url" 
                          placeholder="https://example.com/image.jpg" 
                          {...field} 
                          data-testid="input-product-image"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="flex-1"
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90 text-slate-900 font-semibold"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <>
                        <Zap className="w-4 h-4 mr-2 animate-spin" />
                        {editingProduct ? "Updating..." : "Adding..."}
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        {editingProduct ? "Update Product" : "Add Product"}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
          </div>
        </header>

        {/* Products Content */}
        <div className="flex-1 p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
            <div>
              <PageContainer>
                {/* Products Grid */}
                <ProductGrid 
                  products={products} 
                  isLoading={isLoading}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </PageContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
