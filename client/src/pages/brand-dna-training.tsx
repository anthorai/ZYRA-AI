/**
 * Brand DNA Training Page
 * 
 * Allows users to train Zyra AI to match their unique brand voice
 * by uploading sample product descriptions, emails, or marketing content
 */

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  Plus, 
  X, 
  CheckCircle2, 
  Brain,
  FileText,
  TrendingUp 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface BrandDNAProfile {
  writingStyle: string;
  toneDensity: string;
  avgSentenceLength: number;
  formalityScore: number;
  emojiFrequency: string;
  ctaStyle: string;
  brandPersonality?: string;
  confidenceScore: number;
}

export default function BrandDNATraining() {
  const { toast } = useToast();
  const [sampleTexts, setSampleTexts] = useState<string[]>(['']);
  
  // Fetch existing brand DNA profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/brand-dna/profile'],
  });
  
  const hasBrandDNA = profileData?.hasBrandDNA;
  const brandDNA = profileData?.brandDNA as BrandDNAProfile | undefined;

  // Train brand DNA mutation
  const trainMutation = useMutation({
    mutationFn: async (texts: string[]) => {
      const filteredTexts = texts.filter(t => t.trim().length > 50);
      
      if (filteredTexts.length === 0) {
        throw new Error('At least one sample text (50+ characters) is required');
      }
      
      return apiRequest('/api/brand-dna/train', {
        method: 'POST',
        body: JSON.stringify({ sampleTexts: filteredTexts }),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Brand DNA Trained Successfully!",
        description: `Confidence: ${data.brandDNA.confidenceScore}% - Your SEO content will now match your brand voice.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/brand-dna/profile'] });
      setSampleTexts(['']); // Reset form
    },
    onError: (error: any) => {
      toast({
        title: "Training Failed",
        description: error.message || "Failed to train brand DNA",
        variant: "destructive",
      });
    },
  });

  const addSampleField = () => {
    if (sampleTexts.length < 10) {
      setSampleTexts([...sampleTexts, '']);
    } else {
      toast({
        title: "Maximum Reached",
        description: "You can add up to 10 sample texts per training session",
        variant: "destructive",
      });
    }
  };

  const removeSampleField = (index: number) => {
    if (sampleTexts.length > 1) {
      setSampleTexts(sampleTexts.filter((_, i) => i !== index));
    }
  };

  const updateSampleText = (index: number, value: string) => {
    const updated = [...sampleTexts];
    updated[index] = value;
    setSampleTexts(updated);
  };

  const handleTrain = () => {
    trainMutation.mutate(sampleTexts);
  };

  const validSamples = sampleTexts.filter(t => t.trim().length > 50).length;
  const canTrain = validSamples > 0 && !trainMutation.isPending;

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Brain className="w-8 h-8 text-primary" />
          Brand DNA Training
        </h1>
        <p className="text-muted-foreground">
          Teach Zyra AI to write in your unique brand voice by providing sample content.
        </p>
      </div>

      {/* Current Profile Status */}
      {!profileLoading && (
        <Card>
          <CardHeader className="gap-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg">Current Brand DNA Status</CardTitle>
              {hasBrandDNA && (
                <Badge variant="default" data-testid="badge-brand-dna-status">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Trained
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {hasBrandDNA && brandDNA ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Writing Style</p>
                  <p className="font-medium capitalize">{brandDNA.writingStyle}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tone Density</p>
                  <p className="font-medium capitalize">{brandDNA.toneDensity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Formality</p>
                  <p className="font-medium">{brandDNA.formalityScore}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Sentence Length</p>
                  <p className="font-medium">{brandDNA.avgSentenceLength} words</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CTA Style</p>
                  <p className="font-medium capitalize">{brandDNA.ctaStyle}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confidence</p>
                  <div className="flex items-center gap-2">
                    <Progress value={brandDNA.confidenceScore} className="h-2 flex-1" />
                    <span className="text-sm font-medium">{brandDNA.confidenceScore}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">
                No brand DNA trained yet. Add sample texts below to get started.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Training Form */}
      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Add Sample Content
          </CardTitle>
          <CardDescription>
            Provide 1-10 examples of your best product descriptions, emails, or marketing copy.
            Each sample should be at least 50 characters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sampleTexts.map((text, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium">
                  Sample {index + 1}
                  {text.trim().length > 50 && (
                    <Badge variant="secondary" className="ml-2">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Valid
                    </Badge>
                  )}
                </label>
                {sampleTexts.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeSampleField(index)}
                    data-testid={`button-remove-sample-${index}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <Textarea
                placeholder="Paste a sample of your brand's writing here (product description, email, ad copy, etc.)"
                value={text}
                onChange={(e) => updateSampleText(index, e.target.value)}
                rows={4}
                className="resize-none"
                data-testid={`textarea-sample-${index}`}
              />
              <p className="text-xs text-muted-foreground">
                {text.trim().length} / 50 characters minimum
              </p>
            </div>
          ))}

          {sampleTexts.length < 10 && (
            <Button
              variant="outline"
              onClick={addSampleField}
              className="w-full"
              data-testid="button-add-sample"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Sample
            </Button>
          )}

          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Valid Samples:</span>
              <span className="font-medium">
                {validSamples} / {sampleTexts.length}
              </span>
            </div>

            <Button
              onClick={handleTrain}
              disabled={!canTrain}
              className="w-full"
              size="lg"
              data-testid="button-train-brand-dna"
            >
              {trainMutation.isPending ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                  Analyzing Brand Voice...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Train Brand DNA
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How Brand DNA Training Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-3">
            <div className="font-bold text-primary">1.</div>
            <div>
              <p className="font-medium text-foreground">Upload Your Best Content</p>
              <p>Provide 1-10 examples of product descriptions, emails, or marketing copy that represent your brand voice.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="font-bold text-primary">2.</div>
            <div>
              <p className="font-medium text-foreground">AI Analyzes Patterns</p>
              <p>Zyra analyzes 30+ attributes including tone, sentence structure, formality, emoji usage, and CTA style.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="font-bold text-primary">3.</div>
            <div>
              <p className="font-medium text-foreground">Automatic Application</p>
              <p>All future SEO content generated by Zyra will automatically match your unique brand voice.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="font-bold text-primary">4.</div>
            <div>
              <p className="font-medium text-foreground">Continuous Learning</p>
              <p>The system learns from your edits and improves over time to better match your preferences.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
