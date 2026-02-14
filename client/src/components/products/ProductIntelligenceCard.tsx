/**
 * Product Intelligence Card
 * 
 * Displays product with all ZYRA intelligence layers:
 * - Revenue Health Score (color-coded 0-100)
 * - ZYRA Protection Status (Protecting/Monitoring/Not Active)
 * - Revenue Added by ZYRA (proven attribution)
 * - Confidence Index (ZYRA's learning progress)
 * 
 * Purpose: Make ZYRA's value visible and irreplaceable per product.
 * Merchants must FEEL ZYRA is protecting their revenue.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield, ShieldCheck, ShieldAlert, TrendingUp, TrendingDown, Minus, DollarSign, Brain, Image as ImageIcon, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@shared/schema";
import { useStoreCurrency } from "@/hooks/use-store-currency";
import { formatCurrency } from "@/lib/utils";

interface ProductIntelligence {
  productId: string;
  revenueHealthScore: number;
  protectionStatus: 'protecting' | 'monitoring' | 'not_active';
  revenueAdded: number;
  confidenceIndex: number;
  autonomyLevel: 'manual' | 'low_risk_auto' | 'full_autonomy';
  lastActionAt: string | null;
  actionsCount: number;
  healthCategory: 'healthy' | 'at_risk' | 'revenue_leak';
  confidenceTrend: 'up' | 'down' | 'stable';
}

interface ProductIntelligenceCardProps {
  product: Product;
  onClick?: () => void;
}

function HealthScoreBadge({ score, category }: { score: number; category: string }) {
  const colorClass = 
    category === 'healthy' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
    category === 'at_risk' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
    'bg-red-500/20 text-red-400 border-red-500/30';
  
  const label = 
    category === 'healthy' ? 'Healthy' :
    category === 'at_risk' ? 'At Risk' :
    'Revenue Leak';
  
  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge 
          variant="outline" 
          className={`${colorClass} font-semibold text-xs px-2 py-0.5`}
          data-testid="badge-health-score"
        >
          {score}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[200px]">
        <p className="font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">
          Revenue Health Score based on conversion, SEO, cart abandonment, and ZYRA success.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function ProtectionStatusBadge({ status }: { status: 'protecting' | 'monitoring' | 'not_active' }) {
  const config = {
    protecting: {
      icon: ShieldCheck,
      label: 'ZYRA Protecting',
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/10',
      tooltip: 'ZYRA is actively optimizing and protecting revenue for this product.'
    },
    monitoring: {
      icon: Shield,
      label: 'ZYRA Monitoring',
      colorClass: 'text-amber-400',
      bgClass: 'bg-amber-500/10',
      tooltip: 'ZYRA is analyzing this product and preparing optimizations.'
    },
    not_active: {
      icon: ShieldAlert,
      label: 'ZYRA Not Active',
      colorClass: 'text-slate-400',
      bgClass: 'bg-slate-500/10',
      tooltip: 'Without ZYRA, this product will stop auto-optimizing and revenue monitoring.'
    }
  };
  
  const { icon: Icon, label, colorClass, bgClass, tooltip } = config[status];
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${bgClass}`}
          data-testid="badge-protection-status"
        >
          <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
          <span className={`text-xs font-medium ${colorClass}`}>{label}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px]">
        <p className="text-xs">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function ConfidenceIndicator({ confidence, trend }: { confidence: number; trend: 'up' | 'down' | 'stable' }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400';
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className="flex items-center gap-1.5"
          data-testid="indicator-confidence"
        >
          <Brain className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs font-medium text-slate-300">{confidence}%</span>
          <TrendIcon className={`w-3 h-3 ${trendColor}`} />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[200px]">
        <p className="font-semibold">ZYRA Confidence: {confidence}%</p>
        <p className="text-xs text-muted-foreground">
          How confident ZYRA is in future decisions for this product based on learning history.
          {trend === 'up' && ' Confidence is increasing.'}
          {trend === 'down' && ' Confidence resets if ZYRA is removed.'}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

export function ProductIntelligenceCard({ product, onClick }: ProductIntelligenceCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const { currency } = useStoreCurrency();
  
  const { data: intelligence, isLoading: intelligenceLoading } = useQuery<ProductIntelligence>({
    queryKey: ['/api/products/intelligence', product.id],
    enabled: !!product.id,
  });
  
  const revenueAdded = intelligence?.revenueAdded || 0;
  const healthScore = intelligence?.revenueHealthScore || 0;
  const healthCategory = intelligence?.healthCategory || 'at_risk';
  const protectionStatus = intelligence?.protectionStatus || 'not_active';
  const confidenceIndex = intelligence?.confidenceIndex || 0;
  const confidenceTrend = intelligence?.confidenceTrend || 'stable';
  
  return (
    <Card 
      className="group relative overflow-visible gradient-card rounded-xl shadow-lg border border-slate-700/50 hover:border-primary/30 transition-all duration-300 cursor-pointer hover-elevate"
      onClick={onClick}
      data-testid={`card-product-intelligence-${product.id}`}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {product.image && !imageError ? (
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
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
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white text-sm truncate" data-testid={`text-product-name-${product.id}`}>
                  {product.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{product.category}</span>
                  <span className="text-xs text-primary font-medium">
                    {formatCurrency(parseFloat(product.price), currency)}
                  </span>
                </div>
              </div>
            </div>
            
            {intelligenceLoading ? (
              <Skeleton className="w-10 h-6 rounded-full" />
            ) : (
              <HealthScoreBadge score={healthScore} category={healthCategory} />
            )}
          </div>
          
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {intelligenceLoading ? (
              <>
                <Skeleton className="w-28 h-6 rounded-full" />
                <Skeleton className="w-20 h-5" />
              </>
            ) : (
              <>
                <ProtectionStatusBadge status={protectionStatus} />
                <ConfidenceIndicator confidence={confidenceIndex} trend={confidenceTrend} />
              </>
            )}
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="flex items-center gap-1.5"
                  data-testid="text-revenue-added"
                >
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-400">
                    +{formatCurrency(revenueAdded, currency)}
                  </span>
                  <span className="text-xs text-muted-foreground">by ZYRA</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[200px]">
                <p className="font-semibold">Revenue Added by ZYRA</p>
                <p className="text-xs text-muted-foreground">
                  Proven revenue attributed to ZYRA optimizations on this product.
                </p>
              </TooltipContent>
            </Tooltip>
            
            <div className="flex items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors">
              <span className="text-xs">View details</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductIntelligenceCardSkeleton() {
  return (
    <Card className="gradient-card rounded-xl shadow-lg border border-slate-700/50">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <Skeleton className="w-12 h-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="w-10 h-6 rounded-full" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="w-28 h-6 rounded-full" />
            <Skeleton className="w-20 h-5" />
          </div>
          <Skeleton className="h-8 w-full mt-2" />
        </div>
      </CardContent>
    </Card>
  );
}
