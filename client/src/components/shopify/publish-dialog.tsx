import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useShopifyConnection, useShopifyPublish, PublishContent } from '@/hooks/use-shopify-publish';
import { Loader2, ShoppingBag, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { Link } from 'wouter';

interface ShopifyPublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
  productName?: string;
  content: PublishContent;
  onSuccess?: () => void;
}

export function ShopifyPublishDialog({
  open,
  onOpenChange,
  productId,
  productName,
  content,
  onSuccess,
}: ShopifyPublishDialogProps) {
  const { data: connectionData, isLoading: connectionLoading } = useShopifyConnection();
  const publishMutation = useShopifyPublish();

  const isConnected = connectionData?.isConnected;
  const shopName = connectionData?.connection?.storeName;

  const handlePublish = async () => {
    if (!productId) {
      return;
    }

    try {
      await publishMutation.mutateAsync({ productId, content });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      // Error is already handled by the mutation's onError callback
    }
  };

  if (connectionLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!isConnected) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Shopify Not Connected
            </DialogTitle>
            <DialogDescription>
              Connect your Shopify store to publish AI-generated content directly to your products.
            </DialogDescription>
          </DialogHeader>

          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              You need to connect your Shopify store before you can publish content.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Link href="/settings">
              <Button className="gap-2">
                <ExternalLink className="w-4 h-4" />
                Go to Settings
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-green-600" />
            Publish to Shopify
          </DialogTitle>
          <DialogDescription>
            Publish this AI-generated content to your Shopify store
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Shopify Store</span>
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-600" />
              {shopName}
            </Badge>
          </div>

          {productName && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Product</span>
              <span className="text-sm text-muted-foreground">{productName}</span>
            </div>
          )}

          <div className="space-y-2">
            <span className="text-sm font-medium">Content to Publish</span>
            <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-sm">
              {content.description && (
                <div>
                  <span className="font-medium text-primary">Description: </span>
                  <span className="text-muted-foreground">{content.description.substring(0, 100)}...</span>
                </div>
              )}
              {content.seoTitle && (
                <div>
                  <span className="font-medium text-primary">SEO Title: </span>
                  <span className="text-muted-foreground">{content.seoTitle}</span>
                </div>
              )}
              {content.metaDescription && (
                <div>
                  <span className="font-medium text-primary">Meta Description: </span>
                  <span className="text-muted-foreground">{content.metaDescription.substring(0, 80)}...</span>
                </div>
              )}
            </div>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              This will update your live Shopify product. The original content will be saved for rollback.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={publishMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePublish}
            disabled={publishMutation.isPending || !productId}
            className="gap-2"
          >
            {publishMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                Publish to Shopify
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
