import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/ui/page-shell";
import { Brain, Sparkles, Zap, Clock } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

type PerformanceMode = 'fast' | 'balanced' | 'quality';

export default function AIPreferencesPage() {
  const { toast } = useToast();
  
  const [brandVoice, setBrandVoice] = useState("professional");
  const [contentStyle, setContentStyle] = useState("seo");
  const [autoSave, setAutoSave] = useState(true);
  const [scheduledUpdates, setScheduledUpdates] = useState(true);
  const [brandMemory, setBrandMemory] = useState(true);
  const [creativity, setCreativity] = useState([70]);
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>('balanced');

  // Fetch user preferences
  const { data: preferences, isLoading } = useQuery<any>({
    queryKey: ['/api/settings/preferences'],
  });

  // Update local state when preferences are loaded
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

  // Save preferences mutation
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

  return (
    <PageShell
      title="AI Preferences"
      subtitle="Customize AI behavior and automation settings"
      maxWidth="xl"
      spacing="normal"
    >
      {/* Brand Voice Selection */}
      <DashboardCard
        title="Brand Voice & Tone"
        description="Select the default voice that best matches your brand personality"
        headerAction={<Sparkles className="w-5 h-5 text-primary" />}
        testId="card-brand-voice"
      >
        <div className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="brand-voice" className="text-white">Default Brand Voice</Label>
            <Select value={brandVoice} onValueChange={setBrandVoice}>
              <SelectTrigger 
                id="brand-voice"
                className="bg-slate-800/50 border-slate-600 text-white"
                data-testid="select-brand-voice"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="professional" data-testid="option-professional">Professional & Authoritative</SelectItem>
                <SelectItem value="casual" data-testid="option-casual">Casual & Friendly</SelectItem>
                <SelectItem value="luxury" data-testid="option-luxury">Luxury & Sophisticated</SelectItem>
                <SelectItem value="genz" data-testid="option-genz">Gen Z & Trendy</SelectItem>
                <SelectItem value="technical" data-testid="option-technical">Technical & Detailed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="content-style" className="text-white">Content Writing Style</Label>
            <Select value={contentStyle} onValueChange={setContentStyle}>
              <SelectTrigger 
                id="content-style"
                className="bg-slate-800/50 border-slate-600 text-white"
                data-testid="select-content-style"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="seo" data-testid="option-seo">SEO-Optimized</SelectItem>
                <SelectItem value="sales" data-testid="option-sales">Sales-Driven</SelectItem>
                <SelectItem value="educational" data-testid="option-educational">Educational & Informative</SelectItem>
                <SelectItem value="storytelling" data-testid="option-storytelling">Storytelling & Emotional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 pt-2">
            <Label className="text-white">AI Creativity Level</Label>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-400">Conservative</span>
              <Slider
                value={creativity}
                onValueChange={setCreativity}
                max={100}
                step={10}
                className="flex-1"
                data-testid="slider-creativity"
              />
              <span className="text-sm text-slate-400">Creative</span>
            </div>
            <p className="text-xs text-slate-500">Current: {creativity[0]}%</p>
          </div>
        </div>
      </DashboardCard>

      {/* Automation Settings */}
      <DashboardCard
        title="Automation Settings"
        description="Configure automatic content generation and optimization features"
        headerAction={<Zap className="w-5 h-5 text-primary" />}
        testId="card-automation"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-white font-medium">Auto-Save AI Outputs</Label>
              <p className="text-sm text-slate-400">Automatically save generated content to your library</p>
            </div>
            <Switch
              checked={autoSave}
              onCheckedChange={setAutoSave}
              className="data-[state=checked]:bg-primary"
              data-testid="switch-auto-save"
            />
          </div>

          <Separator className="bg-slate-700" />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-white font-medium">Brand Voice Memory</Label>
              <p className="text-sm text-slate-400">AI learns and remembers your preferred writing style</p>
            </div>
            <Switch
              checked={brandMemory}
              onCheckedChange={setBrandMemory}
              className="data-[state=checked]:bg-primary"
              data-testid="switch-brand-memory"
            />
          </div>

          <Separator className="bg-slate-700" />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-white font-medium">Scheduled Content Updates</Label>
              <p className="text-sm text-slate-400">Refresh product descriptions every 3-6 months</p>
            </div>
            <Switch
              checked={scheduledUpdates}
              onCheckedChange={setScheduledUpdates}
              className="data-[state=checked]:bg-primary"
              data-testid="switch-scheduled-updates"
            />
          </div>
        </div>
      </DashboardCard>

      {/* Model Performance */}
      <DashboardCard
        title="Performance Settings"
        description="Choose between speed and quality for AI generation"
        headerAction={<Clock className="w-5 h-5 text-primary" />}
        testId="card-performance"
      >
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full bg-slate-800/50" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              <Button
                variant="outline"
                onClick={() => setPerformanceMode('fast')}
                className={`shadow-lg border transition-all duration-300 rounded-xl sm:rounded-2xl h-auto p-3 sm:p-4 md:p-6 flex flex-col items-start ${
                  performanceMode === 'fast'
                    ? 'border-primary/50 bg-primary/10 hover:bg-primary/20 hover:shadow-xl hover:shadow-primary/10'
                    : 'border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10'
                }`}
                data-testid="button-mode-fast"
              >
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mb-2 text-primary flex-shrink-0" />
                <div className="font-semibold text-white text-base sm:text-lg md:text-xl truncate w-full">Fast Mode</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-slate-400 mt-1 truncate w-full">Quick results, good quality</div>
              </Button>
              <Button
                variant="outline"
                onClick={() => setPerformanceMode('balanced')}
                className={`shadow-lg border transition-all duration-300 rounded-xl sm:rounded-2xl h-auto p-3 sm:p-4 md:p-6 flex flex-col items-start ${
                  performanceMode === 'balanced'
                    ? 'border-primary/50 bg-primary/10 hover:bg-primary/20 hover:shadow-xl hover:shadow-primary/10'
                    : 'border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10'
                }`}
                data-testid="button-mode-balanced"
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mb-2 text-primary flex-shrink-0" />
                <div className="font-semibold text-white text-base sm:text-lg md:text-xl truncate w-full">Balanced</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-slate-400 mt-1 truncate w-full">Best quality-speed ratio</div>
              </Button>
              <Button
                variant="outline"
                onClick={() => setPerformanceMode('quality')}
                className={`shadow-lg border transition-all duration-300 rounded-xl sm:rounded-2xl h-auto p-3 sm:p-4 md:p-6 flex flex-col items-start ${
                  performanceMode === 'quality'
                    ? 'border-primary/50 bg-primary/10 hover:bg-primary/20 hover:shadow-xl hover:shadow-primary/10'
                    : 'border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10'
                }`}
                data-testid="button-mode-quality"
              >
                <Brain className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mb-2 text-primary flex-shrink-0" />
                <div className="font-semibold text-white text-base sm:text-lg md:text-xl truncate w-full">Quality Mode</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-slate-400 mt-1 truncate w-full">Highest quality, slower</div>
              </Button>
            </div>
            <div className="text-xs text-slate-400 pt-2">
              {performanceMode === 'fast' && '⚡ Uses GPT-4o-mini for faster generation with good quality'}
              {performanceMode === 'balanced' && '✨ Uses GPT-4o-mini with optimized prompts for best balance'}
              {performanceMode === 'quality' && '🧠 Uses GPT-4o for highest quality results (PRO plan)'}
            </div>
          </div>
        )}
      </DashboardCard>

      {/* Save Button */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button
          onClick={handleSave}
          className="gradient-button"
          data-testid="button-save-preferences"
        >
          Save Changes
        </Button>
      </div>
    </PageShell>
  );
}
