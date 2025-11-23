/**
 * Wave 1: Marketing Framework Template Selector
 * 
 * Displays AI-powered framework recommendations based on product attributes
 * Shows primary recommendation with confidence score and alternative options
 */

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Target, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface FrameworkRecommendation {
  id: string;
  name: string;
  description: string;
  bestFor: string;
  confidence: number;
  reason: string;
}

interface TemplateRecommendation {
  primary: FrameworkRecommendation;
  alternatives: FrameworkRecommendation[];
}

interface TemplateSelectorProps {
  productName: string;
  productDescription?: string;
  category?: string;
  price?: number;
  tags?: string[];
  targetAudience?: string;
  onSelect?: (frameworkId: string) => void;
}

export function TemplateSelector({
  productName,
  productDescription,
  category,
  price,
  tags,
  targetAudience,
  onSelect,
}: TemplateSelectorProps) {
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch framework recommendations
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/templates/recommend', { productName, category, price }],
    enabled: !!productName,
  });

  const recommendation = data?.recommendation as TemplateRecommendation | undefined;

  const handleSelectFramework = (frameworkId: string) => {
    setSelectedFramework(frameworkId);
    onSelect?.(frameworkId);
    
    toast({
      title: "Framework Selected",
      description: `Using ${recommendation?.primary.id === frameworkId ? recommendation.primary.name : 'alternative framework'} template`,
    });
  };

  if (!productName) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Enter product details to see framework recommendations
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Analyzing product and recommending best framework...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !recommendation) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-destructive">
          Failed to load recommendations. Please try again.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Primary Recommendation */}
      <Card className={selectedFramework === recommendation.primary.id ? 'border-primary' : ''}>
        <CardHeader className="gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <CardTitle>Recommended: {recommendation.primary.name}</CardTitle>
            </div>
            <Badge variant="default" data-testid={`badge-confidence-${recommendation.primary.id}`}>
              {Math.round(recommendation.primary.confidence)}% Match
            </Badge>
          </div>
          <CardDescription>{recommendation.primary.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            <p className="font-medium mb-1">Best for:</p>
            <p className="text-muted-foreground">{recommendation.primary.bestFor}</p>
          </div>
          
          <div className="text-sm">
            <p className="font-medium mb-1">Why this framework:</p>
            <p className="text-muted-foreground">{recommendation.primary.reason}</p>
          </div>

          <Button
            onClick={() => handleSelectFramework(recommendation.primary.id)}
            className="w-full"
            variant={selectedFramework === recommendation.primary.id ? "default" : "outline"}
            data-testid={`button-select-framework-${recommendation.primary.id}`}
          >
            {selectedFramework === recommendation.primary.id ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Selected
              </>
            ) : (
              'Use This Framework'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Alternative Frameworks */}
      {recommendation.alternatives.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Alternative Frameworks
          </h3>
          
          {recommendation.alternatives.map((alt) => (
            <Card 
              key={alt.id}
              className={selectedFramework === alt.id ? 'border-primary' : ''}
            >
              <CardHeader className="gap-1 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{alt.name}</CardTitle>
                  <Badge variant="secondary" data-testid={`badge-confidence-${alt.id}`}>
                    {Math.round(alt.confidence)}%
                  </Badge>
                </div>
                <CardDescription className="text-sm">{alt.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{alt.reason}</p>
                <Button
                  onClick={() => handleSelectFramework(alt.id)}
                  size="sm"
                  variant={selectedFramework === alt.id ? "default" : "ghost"}
                  className="w-full"
                  data-testid={`button-select-framework-${alt.id}`}
                >
                  {selectedFramework === alt.id ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-2" />
                      Selected
                    </>
                  ) : (
                    'Use This Instead'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
