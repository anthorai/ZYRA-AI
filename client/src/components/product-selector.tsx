import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Search, Package, ChevronDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Utility function to strip HTML tags from text (exported for use in forms)
export function stripHtmlTags(html: string | null | undefined): string {
  if (!html) return '';
  // Create a temporary div element to parse HTML
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  // Get text content (automatically strips all HTML tags)
  return tmp.textContent || tmp.innerText || '';
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  category: string;
  image: string | null;
  features: string | null;
  tags: string | null;
}

interface ProductSelectorProps {
  value?: string;
  onSelect: (product: Product | null) => void;
  placeholder?: string;
  className?: string;
}

export function ProductSelector({ value, onSelect, placeholder = "Select Shopify product...", className }: ProductSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const selectedProduct = products.find((p) => p.id === value);

  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      (product.tags && product.tags.toLowerCase().includes(query))
    );
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-background/50 border-slate-700 hover:border-primary/50",
            !value && "text-muted-foreground",
            className
          )}
          data-testid="button-product-selector"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {selectedProduct ? (
              <>
                {selectedProduct.image && (
                  <img 
                    src={selectedProduct.image} 
                    alt={selectedProduct.name}
                    className="w-6 h-6 rounded object-cover flex-shrink-0"
                  />
                )}
                <Package className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="truncate">{selectedProduct.name}</span>
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  ${selectedProduct.price}
                </Badge>
              </>
            ) : (
              <>
                <Search className="w-4 h-4 text-muted-foreground" />
                <span>{placeholder}</span>
              </>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search products..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
            data-testid="input-product-search"
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? (
                <div className="py-6 text-center text-sm">Loading products...</div>
              ) : products.length === 0 ? (
                <div className="py-6 text-center text-sm">
                  <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p>No Shopify products synced yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Connect your store to import products</p>
                </div>
              ) : (
                <div className="py-6 text-center text-sm">No products found</div>
              )}
            </CommandEmpty>
            <CommandGroup heading="Your Products">
              {filteredProducts.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.id}
                  onSelect={() => {
                    onSelect(value === product.id ? null : product);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                  data-testid={`option-product-${product.id}`}
                >
                  <Check
                    className={cn(
                      "w-4 h-4",
                      value === product.id ? "opacity-100" : "opacity-0"
                    )}
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
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ${product.price}
                      </span>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
