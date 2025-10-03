import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Package, DollarSign, Archive, Image as ImageIcon, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertProductSchema } from "@shared/schema";
import type { Product, InsertProduct } from "@shared/schema";
import { z } from "zod";
import Sidebar from "@/components/dashboard/sidebar";
import Footer from "@/components/ui/footer";
import { useAuth } from "@/hooks/useAuth";

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
    <Card className="group hover:shadow-lg transition-shadow duration-200" data-testid={`card-product-${product.id}`}>
      <CardContent className="p-4">
        <div className="aspect-square bg-muted rounded-lg mb-4 overflow-hidden">
          {product.image && !imageError ? (
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
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          {imageLoading && product.image && (
            <Skeleton className="w-full h-full" />
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold text-lg truncate" data-testid={`text-product-name-${product.id}`}>
            {product.name}
          </h3>
          
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-product-description-${product.id}`}>
              {product.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span className="font-medium" data-testid={`text-product-price-${product.id}`}>
                ${parseFloat(product.price).toFixed(2)}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <Archive className="w-4 h-4" />
              <span data-testid={`text-product-stock-${product.id}`}>
                {product.stock} in stock
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {product.category}
            </span>
            
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onEdit(product)}
                data-testid={`button-edit-product-${product.id}`}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onDelete(product.id)}
                data-testid={`button-delete-product-${product.id}`}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="aspect-square mb-4" />
              <Skeleton className="h-5 mb-2" />
              <Skeleton className="h-4 w-2/3 mb-3" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No products yet</h3>
        <p className="text-muted-foreground mb-6">Add your first product to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
      isOptimized: true
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
      isOptimized: false
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
          </div>
        </header>

        {/* Products Content */}
        <div className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
          {/* Products Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Product Catalog</h2>
              <p className="text-muted-foreground">
                Add and manage your product inventory
              </p>
            </div>
            
            <Dialog open={isAddDialogOpen || !!editingProduct} onOpenChange={(open) => {
              if (!open) resetForm();
              else setIsAddDialogOpen(true);
            }}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-product-main">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
          
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct 
                  ? "Update your product information below."
                  : "Fill out the form below to add a new product to your catalog."
                }
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter product name" 
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
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-product-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="gradient-surface">
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
                </div>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter product description" 
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ""} 
                          data-testid="textarea-product-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="0.00" 
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
                        <FormLabel>Stock Quantity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
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
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL (optional)</FormLabel>
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
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetForm}
                    data-testid="button-cancel-product"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => form.reset()}
                    data-testid="button-reset-product"
                  >
                    Reset
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-product"
                  >
                    {createMutation.isPending || updateMutation.isPending 
                      ? "Saving..." 
                      : editingProduct 
                        ? "Update Product" 
                        : "Add Product"
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
            </Dialog>
          </div>

          {/* Products Grid */}
          <ProductGrid 
            products={products}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}