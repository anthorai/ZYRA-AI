import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@shared/schema";

interface ProductSelectorProps {
  mode?: "single" | "multi";
  value?: string | string[];
  onChange?: (value: string | string[], productData?: Product | Product[]) => void;
  onProductSelect?: (product: Product | Product[] | null) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  showSelectedBadge?: boolean;
  autoFillEnabled?: boolean;
}

export function ProductSelector({
  mode = "single",
  value,
  onChange,
  onProductSelect,
  label = "Select Product",
  placeholder = "Choose a product...",
  className,
  showSelectedBadge = true,
  autoFillEnabled = true,
}: ProductSelectorProps) {
  // Use controlled value directly instead of internal state
  const controlledValue = value !== undefined 
    ? (Array.isArray(value) ? value : value ? [value] : [])
    : [];
  
  const [isOpen, setIsOpen] = useState(false);
  const [hasAutoFilled, setHasAutoFilled] = useState(false);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const handleSingleSelect = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    
    if (onChange) {
      onChange(productId, product);
    }
    // Only trigger auto-fill once per selection
    if (onProductSelect && product && !hasAutoFilled) {
      setHasAutoFilled(true);
      onProductSelect(product);
      // Reset after a delay to allow re-selection
      setTimeout(() => setHasAutoFilled(false), 1000);
    } else if (onProductSelect && product) {
      onProductSelect(product);
    }
  };

  const handleMultiToggle = (productId: string) => {
    const newSelection = controlledValue.includes(productId)
      ? controlledValue.filter((id) => id !== productId)
      : [...controlledValue, productId];
    
    const selectedProductsData = products.filter((p) => newSelection.includes(p.id));
    
    if (onChange) {
      onChange(newSelection, selectedProductsData);
    }
    if (onProductSelect) {
      onProductSelect(selectedProductsData.length > 0 ? selectedProductsData : null);
    }
  };

  const clearSelection = () => {
    setHasAutoFilled(false);
    if (onChange) {
      onChange(mode === "single" ? "" : [], undefined);
    }
    if (onProductSelect) {
      onProductSelect(null);
    }
  };

  const getSelectedProduct = () => {
    if (controlledValue.length === 0) return null;
    return products.find((p) => p.id === controlledValue[0]);
  };

  const getSelectedProducts = () => {
    return products.filter((p) => controlledValue.includes(p.id));
  };

  if (mode === "single") {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between">
          <Label htmlFor="product-selector" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {label}
          </Label>
          {controlledValue.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="h-6 px-2"
              data-testid="button-clear-product"
            >
              <X className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>

        <Select
          value={controlledValue[0] || ""}
          onValueChange={handleSingleSelect}
          disabled={isLoading}
        >
          <SelectTrigger id="product-selector" data-testid="select-product-trigger">
            <SelectValue placeholder={isLoading ? "Loading products..." : placeholder} />
          </SelectTrigger>
          <SelectContent>
            {products.length === 0 && !isLoading && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No products found. Add products first.
              </div>
            )}
            {products.map((product) => (
              <SelectItem 
                key={product.id} 
                value={product.id}
                data-testid={`select-product-option-${product.id}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{product.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {product.category}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showSelectedBadge && controlledValue.length > 0 && getSelectedProduct() && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-primary/10 border border-primary/20">
            <Package className="h-4 w-4 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium" data-testid="text-selected-product-name">
                {getSelectedProduct()?.name}
              </p>
              <p className="text-xs text-muted-foreground" data-testid="text-selected-product-category">
                Category: {getSelectedProduct()?.category}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Multi-select mode
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          {label}
        </Label>
        {controlledValue.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" data-testid="badge-selected-count">
              {controlledValue.length} selected
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="h-6 px-2"
              data-testid="button-clear-products"
            >
              <X className="h-3 w-3" />
              Clear All
            </Button>
          </div>
        )}
      </div>

      <div className="relative">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between"
          disabled={isLoading}
          data-testid="button-multi-select-trigger"
        >
          <span>
            {controlledValue.length > 0
              ? `${controlledValue.length} product${controlledValue.length > 1 ? "s" : ""} selected`
              : placeholder}
          </span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </Button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-popover border rounded-md shadow-lg overflow-hidden">
            {products.length === 0 && !isLoading && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No products found. Add products first.
              </div>
            )}
            {products.length > 0 && (
              <div className="max-h-60 overflow-y-auto p-2">
                {products.map((product, index) => (
                  <div
                    key={product.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-md hover-elevate cursor-pointer transition-all",
                      index !== products.length - 1 && "mb-1"
                    )}
                    onClick={() => handleMultiToggle(product.id)}
                    data-testid={`checkbox-product-${product.id}`}
                  >
                    <Checkbox
                      checked={controlledValue.includes(product.id)}
                      onCheckedChange={() => handleMultiToggle(product.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug mb-1">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.category || 'Uncategorized'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showSelectedBadge && controlledValue.length > 0 && (
        <div className="p-3 rounded-md bg-primary/10 border border-primary/20 space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Selected Products ({controlledValue.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {getSelectedProducts().map((product) => (
              <Badge
                key={product.id}
                variant="secondary"
                className="flex items-center gap-1"
                data-testid={`badge-selected-product-${product.id}`}
              >
                {product.name}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMultiToggle(product.id);
                  }}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
