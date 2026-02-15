import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Sparkles, Zap, Loader2, CheckCircle2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";

type PerformanceMode = 'fast' | 'balanced' | 'quality';

export default function AIPreferencesPage() {
  const { toast } = useToast();
  
  const [brandVoice, setBrandVoice] = useState("professional");
  const [contentStyle, setContentStyle] = useState("seo");
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>('balanced');

  const { data: preferences, isLoading } = useQuery<any>({
    queryKey: ['/api/settings/preferences'],
  });

  useEffect(() => {
    if (preferences?.aiSettings) {
      const ai = preferences.aiSettings;
      setBrandVoice(ai.defaultBrandVoice || 'professional');
      setContentStyle(ai.contentStyle || 'seo');
      setPerformanceMode(ai.performanceMode || 'balanced');
    }
  }, [preferences]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('PUT', '/api/settings/preferences', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/preferences'] });
      toast({
        title: "Settings Saved",
        description: "Your AI preferences have been updated",
        duration: 3000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save preferences",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      aiSettings: {
        defaultBrandVoice: brandVoice,
        contentStyle,
        autoSaveOutputs: true,
        brandMemory: true,
        scheduledUpdates: true,
        creativityLevel: 70,
        performanceMode,
      }
    });
  };

  const inputStyle = {
    background: '#0F152B',
    border: '1px solid rgba(255,255,255,0.06)',
    color: '#E6F7FF',
  };

  const sectionStyle = {
    background: '#121833',
    boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
  };

  const performanceModes = [
    { mode: 'fast' as PerformanceMode, icon: Zap, title: 'Fast', desc: 'Quick results, good quality', detail: 'Uses GPT-4o-mini for faster generation' },
    { mode: 'balanced' as PerformanceMode, icon: Sparkles, title: 'Balanced', desc: 'Best quality-speed ratio', detail: 'Optimized prompts for best balance' },
    { mode: 'quality' as PerformanceMode, icon: Brain, title: 'Quality', desc: 'Highest quality, slower', detail: 'Uses GPT-4o for premium results' },
  ];

  if (isLoading) {
    return (
      <PageShell
        title="AI Preferences"
        subtitle="Set how ZYRA writes and optimizes for your store"
        maxWidth="xl"
        spacing="normal"
        useHistoryBack={true}
      >
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00F0FF' }} />
          <span className="ml-3" style={{ color: '#A9B4E5' }}>Loading...</span>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="AI Preferences"
      subtitle="Set how ZYRA writes and optimizes for your store"
      maxWidth="xl"
      spacing="normal"
      useHistoryBack={true}
    >
      <div className="space-y-6">
        <Card className="border-0" style={sectionStyle} data-testid="card-brand-voice">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl" style={{ background: 'rgba(0,240,255,0.1)' }}>
                <Sparkles className="w-6 h-6" style={{ color: '#00F0FF' }} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold" style={{ color: '#E6F7FF' }}>
                  Brand Voice
                </h2>
                <p className="text-xs sm:text-sm" style={{ color: '#A9B4E5' }}>
                  Controls the tone and style of all AI-generated content
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="brand-voice" className="text-sm" style={{ color: '#A9B4E5' }}>
                  Writing Tone
                </Label>
                <Select value={brandVoice} onValueChange={setBrandVoice}>
                  <SelectTrigger
                    id="brand-voice"
                    style={inputStyle}
                    className="focus:ring-1 focus:ring-[#00F0FF]/35 focus:border-[#00F0FF]"
                    data-testid="select-brand-voice"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: '#0F152B', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <SelectItem value="professional" data-testid="option-professional">Professional & Authoritative</SelectItem>
                    <SelectItem value="casual" data-testid="option-casual">Casual & Friendly</SelectItem>
                    <SelectItem value="luxury" data-testid="option-luxury">Luxury & Sophisticated</SelectItem>
                    <SelectItem value="genz" data-testid="option-genz">Gen Z & Trendy</SelectItem>
                    <SelectItem value="technical" data-testid="option-technical">Technical & Detailed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content-style" className="text-sm" style={{ color: '#A9B4E5' }}>
                  Content Focus
                </Label>
                <Select value={contentStyle} onValueChange={setContentStyle}>
                  <SelectTrigger
                    id="content-style"
                    style={inputStyle}
                    className="focus:ring-1 focus:ring-[#00F0FF]/35 focus:border-[#00F0FF]"
                    data-testid="select-content-style"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: '#0F152B', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <SelectItem value="seo" data-testid="option-seo">SEO-Optimized</SelectItem>
                    <SelectItem value="sales" data-testid="option-sales">Sales-Driven</SelectItem>
                    <SelectItem value="educational" data-testid="option-educational">Educational & Informative</SelectItem>
                    <SelectItem value="storytelling" data-testid="option-storytelling">Storytelling & Emotional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0" style={sectionStyle} data-testid="card-performance">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl" style={{ background: 'rgba(167,139,250,0.1)' }}>
                <Brain className="w-6 h-6" style={{ color: '#A78BFA' }} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold" style={{ color: '#E6F7FF' }}>
                  AI Speed & Quality
                </h2>
                <p className="text-xs sm:text-sm" style={{ color: '#A9B4E5' }}>
                  Choose between faster results or higher quality output
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {performanceModes.map(({ mode, icon: ModeIcon, title, desc, detail }) => {
                const isSelected = performanceMode === mode;
                return (
                  <Button
                    key={mode}
                    variant="outline"
                    onClick={() => setPerformanceMode(mode)}
                    className={`h-auto rounded-xl flex flex-col items-start p-4 transition-all duration-200 toggle-elevate ${isSelected ? 'toggle-elevated' : ''}`}
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, #0E3B44, #122B3A)'
                        : '#0F152B',
                      boxShadow: isSelected
                        ? '0 0 0 1px rgba(0,240,255,0.35), 0 4px 16px rgba(0,0,0,0.4)'
                        : '0 4px 16px rgba(0,0,0,0.3)',
                      borderColor: isSelected ? 'rgba(0,240,255,0.35)' : 'rgba(255,255,255,0.06)',
                    }}
                    data-testid={`button-mode-${mode}`}
                  >
                    <div className="flex items-center gap-2 w-full mb-2">
                      <ModeIcon
                        className="w-5 h-5"
                        style={{ color: isSelected ? '#00F0FF' : '#7C86B8' }}
                      />
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 ml-auto" style={{ color: '#00F0FF' }} />
                      )}
                    </div>
                    <div className="font-semibold text-sm" style={{ color: '#E6F7FF' }}>
                      {title}
                    </div>
                    <div className="text-xs mt-1" style={{ color: '#A9B4E5' }}>
                      {desc}
                    </div>
                  </Button>
                );
              })}
            </div>
            <p className="text-xs mt-3" style={{ color: '#7C86B8' }}>
              {performanceModes.find(m => m.mode === performanceMode)?.detail}
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="border-0 font-semibold"
            style={{
              background: 'linear-gradient(135deg, #00F0FF, #00FFE5)',
              color: '#04141C',
              boxShadow: '0 6px 20px rgba(0,240,255,0.45)',
            }}
            data-testid="button-save-preferences"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
