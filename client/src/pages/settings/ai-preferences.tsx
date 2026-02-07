import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/ui/page-shell";
import { Brain, Sparkles, Zap, Clock } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

type PerformanceMode = 'fast' | 'balanced' | 'quality';

const SECTION_ACCENTS: Record<string, string> = {
  'brand-voice': '#00F0FF',
  'automation': '#A78BFA',
  'performance': '#22C55E',
};

export default function AIPreferencesPage() {
  const { toast } = useToast();
  
  const [brandVoice, setBrandVoice] = useState("professional");
  const [contentStyle, setContentStyle] = useState("seo");
  const [autoSave, setAutoSave] = useState(true);
  const [scheduledUpdates, setScheduledUpdates] = useState(true);
  const [brandMemory, setBrandMemory] = useState(true);
  const [creativity, setCreativity] = useState([70]);
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>('balanced');

  const { data: preferences, isLoading } = useQuery<any>({
    queryKey: ['/api/settings/preferences'],
  });

  useEffect(() => {
    if (preferences?.aiSettings) {
      const ai = preferences.aiSettings;
      setBrandVoice(ai.defaultBrandVoice || 'professional');
      setContentStyle(ai.contentStyle || 'seo');
      setAutoSave(ai.autoSaveOutputs !== false);
      setBrandMemory(ai.brandMemory !== false);
      setScheduledUpdates(ai.scheduledUpdates !== false);
      setCreativity([ai.creativityLevel || 70]);
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
        title: "AI Preferences Saved",
        description: "Your AI settings have been updated successfully",
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
        autoSaveOutputs: autoSave,
        brandMemory,
        scheduledUpdates,
        creativityLevel: creativity[0],
        performanceMode,
      }
    });
  };

  const sectionStyle = {
    background: '#121833',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
  };

  const inputStyle = {
    background: '#0F152B',
    border: '1px solid rgba(255,255,255,0.06)',
    color: '#E6F7FF',
  };

  return (
    <PageShell
      title="AI Preferences"
      subtitle="Customize AI behavior and automation settings"
      maxWidth="xl"
      spacing="normal"
      useHistoryBack={true}
    >
      <div
        className="relative overflow-hidden p-4 sm:p-5 md:p-6"
        style={sectionStyle}
        data-testid="card-brand-voice"
      >
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-sm"
          style={{ backgroundColor: SECTION_ACCENTS['brand-voice'] }}
        />
        <div className="pl-3 sm:pl-4">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold" style={{ color: '#E6F7FF' }}>
                Brand Voice & Tone
              </h2>
              <p className="text-xs sm:text-sm" style={{ color: '#A9B4E5' }}>
                Select the default voice that best matches your brand personality
              </p>
            </div>
            <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: SECTION_ACCENTS['brand-voice'] }} />
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="brand-voice" style={{ color: '#E6F7FF' }}>Default Brand Voice</Label>
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

            <div className="space-y-3">
              <Label htmlFor="content-style" style={{ color: '#E6F7FF' }}>Content Writing Style</Label>
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

            <div className="space-y-3 pt-2">
              <Label style={{ color: '#E6F7FF' }}>AI Creativity Level</Label>
              <div className="flex items-center space-x-4">
                <span className="text-sm" style={{ color: '#7C86B8' }}>Conservative</span>
                <Slider
                  value={creativity}
                  onValueChange={setCreativity}
                  max={100}
                  step={10}
                  className="flex-1"
                  data-testid="slider-creativity"
                />
                <span className="text-sm" style={{ color: '#7C86B8' }}>Creative</span>
              </div>
              <p className="text-xs" style={{ color: '#7C86B8' }}>Current: {creativity[0]}%</p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="relative overflow-hidden p-4 sm:p-5 md:p-6"
        style={sectionStyle}
        data-testid="card-automation"
      >
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-sm"
          style={{ backgroundColor: SECTION_ACCENTS['automation'] }}
        />
        <div className="pl-3 sm:pl-4">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold" style={{ color: '#E6F7FF' }}>
                Automation Settings
              </h2>
              <p className="text-xs sm:text-sm" style={{ color: '#A9B4E5' }}>
                Configure automatic content generation and optimization features
              </p>
            </div>
            <Zap className="w-5 h-5 flex-shrink-0" style={{ color: SECTION_ACCENTS['automation'] }} />
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label className="font-medium" style={{ color: '#E6F7FF' }}>Auto-Save AI Outputs</Label>
                <p className="text-sm" style={{ color: '#A9B4E5' }}>Automatically save generated content to your library</p>
              </div>
              <Switch
                checked={autoSave}
                onCheckedChange={setAutoSave}
                className="data-[state=checked]:bg-[#00F0FF]"
                data-testid="switch-auto-save"
              />
            </div>

            <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label className="font-medium" style={{ color: '#E6F7FF' }}>Brand Voice Memory</Label>
                <p className="text-sm" style={{ color: '#A9B4E5' }}>AI learns and remembers your preferred writing style</p>
              </div>
              <Switch
                checked={brandMemory}
                onCheckedChange={setBrandMemory}
                className="data-[state=checked]:bg-[#00F0FF]"
                data-testid="switch-brand-memory"
              />
            </div>

            <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label className="font-medium" style={{ color: '#E6F7FF' }}>Scheduled Content Updates</Label>
                <p className="text-sm" style={{ color: '#A9B4E5' }}>Refresh product descriptions every 3-6 months</p>
              </div>
              <Switch
                checked={scheduledUpdates}
                onCheckedChange={setScheduledUpdates}
                className="data-[state=checked]:bg-[#00F0FF]"
                data-testid="switch-scheduled-updates"
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className="relative overflow-hidden p-4 sm:p-5 md:p-6"
        style={sectionStyle}
        data-testid="card-performance"
      >
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-sm"
          style={{ backgroundColor: SECTION_ACCENTS['performance'] }}
        />
        <div className="pl-3 sm:pl-4">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold" style={{ color: '#E6F7FF' }}>
                Performance Settings
              </h2>
              <p className="text-xs sm:text-sm" style={{ color: '#A9B4E5' }}>
                Choose between speed and quality for AI generation
              </p>
            </div>
            <Clock className="w-5 h-5 flex-shrink-0" style={{ color: SECTION_ACCENTS['performance'] }} />
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" style={{ background: 'rgba(15,21,43,0.5)' }} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {([
                  { mode: 'fast' as PerformanceMode, icon: Zap, title: 'Fast Mode', desc: 'Quick results, good quality' },
                  { mode: 'balanced' as PerformanceMode, icon: Sparkles, title: 'Balanced', desc: 'Best quality-speed ratio' },
                  { mode: 'quality' as PerformanceMode, icon: Brain, title: 'Quality Mode', desc: 'Highest quality, slower' },
                ]).map(({ mode, icon: ModeIcon, title, desc }) => {
                  const isSelected = performanceMode === mode;
                  return (
                    <Button
                      key={mode}
                      variant="outline"
                      onClick={() => setPerformanceMode(mode)}
                      className={`h-auto rounded-xl sm:rounded-2xl flex flex-col items-start transition-all duration-300 toggle-elevate ${isSelected ? 'toggle-elevated' : ''}`}
                      style={{
                        background: isSelected
                          ? 'linear-gradient(135deg, #0E3B44, #122B3A)'
                          : '#161C36',
                        boxShadow: isSelected
                          ? '0 0 0 1px rgba(0,240,255,0.35), 0 6px 24px rgba(0,0,0,0.45)'
                          : '0 6px 24px rgba(0,0,0,0.45)',
                        borderColor: isSelected ? 'rgba(0,240,255,0.35)' : 'rgba(255,255,255,0.06)',
                      }}
                      data-testid={`button-mode-${mode}`}
                    >
                      <ModeIcon
                        className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mb-2"
                        style={{ color: isSelected ? '#00F0FF' : '#7C86B8' }}
                      />
                      <div className="font-semibold text-base sm:text-lg md:text-xl" style={{ color: '#E6F7FF' }}>
                        {title}
                      </div>
                      <div className="text-[10px] sm:text-xs md:text-sm mt-1" style={{ color: '#B6C2FF' }}>
                        {desc}
                      </div>
                    </Button>
                  );
                })}
              </div>
              <div className="text-xs pt-2" style={{ color: '#7C86B8' }}>
                {performanceMode === 'fast' && 'Uses GPT-4o-mini for faster generation with good quality'}
                {performanceMode === 'balanced' && 'Uses GPT-4o-mini with optimized prompts for best balance'}
                {performanceMode === 'quality' && 'Uses GPT-4o for highest quality results (PRO plan)'}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          onClick={handleSave}
          className="border-0 font-semibold"
          style={{
            background: 'linear-gradient(135deg, #00F0FF, #00FFE5)',
            color: '#04141C',
            boxShadow: '0 6px 20px rgba(0,240,255,0.45)',
          }}
          data-testid="button-save-preferences"
        >
          Save Changes
        </Button>
      </div>
    </PageShell>
  );
}
