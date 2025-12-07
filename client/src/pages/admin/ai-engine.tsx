import { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Brain,
  Zap,
  Clock,
  AlertTriangle,
  Power,
  Settings2,
  Pencil,
  CheckCircle,
  XCircle,
  Activity,
  TrendingUp,
  Shield,
} from "lucide-react";

interface AIModel {
  id: string;
  name: string;
  provider: string;
  enabled: boolean;
  isPrimary: boolean;
  description: string;
}

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  template: string;
}

interface RateLimits {
  requestsPerMinutePerUser: number;
  requestsPerHourPerUser: number;
  globalRateLimit: number;
}

interface AIStats {
  tokensToday: number;
  tokensThisMonth: number;
  avgResponseTime: number;
  errorRate: number;
}

const initialModels: AIModel[] = [
  {
    id: "gpt-4",
    name: "GPT-4",
    provider: "OpenAI",
    enabled: true,
    isPrimary: true,
    description: "Most capable model for complex reasoning and analysis",
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
    enabled: true,
    isPrimary: false,
    description: "Fast and cost-effective fallback model",
  },
  {
    id: "claude-3-sonnet",
    name: "Claude 3 Sonnet",
    provider: "Anthropic",
    enabled: false,
    isPrimary: false,
    description: "Alternative model for diverse AI capabilities",
  },
];

const initialPromptTemplates: PromptTemplate[] = [
  {
    id: "product-optimization",
    name: "Product Optimization",
    description: "Optimize product titles, descriptions, and features",
    preview: "Analyze the product and generate optimized content...",
    template: "You are an expert e-commerce copywriter. Analyze the following product and generate SEO-optimized content:\n\n{{product}}\n\nFocus on:\n1. Clear, compelling title\n2. Benefit-driven description\n3. Key features and specifications",
  },
  {
    id: "seo-generation",
    name: "SEO Generation",
    description: "Generate SEO meta titles, descriptions, and keywords",
    preview: "Generate SEO-optimized meta content for the product...",
    template: "Generate SEO-optimized metadata for the following product:\n\n{{product}}\n\nProvide:\n1. Meta title (60 chars max)\n2. Meta description (160 chars max)\n3. Primary keywords (5-7)\n4. Secondary keywords (3-5)",
  },
  {
    id: "brand-voice",
    name: "Brand Voice Matching",
    description: "Adapt content to match brand voice and style",
    preview: "Rewrite the content to match the brand voice...",
    template: "Rewrite the following content to match the brand voice:\n\nBrand Voice: {{brandVoice}}\n\nOriginal Content:\n{{content}}\n\nMaintain the key information while adapting to the brand's tone and style.",
  },
  {
    id: "upsell-suggestions",
    name: "Upsell Suggestions",
    description: "Generate AI-powered product recommendations",
    preview: "Based on the customer's purchase, suggest related products...",
    template: "Based on the customer's purchase of {{product}}, suggest related products for upselling:\n\nConsider:\n1. Complementary products\n2. Upgrades or premium versions\n3. Frequently bought together items",
  },
  {
    id: "alt-text-generation",
    name: "Image Alt Text",
    description: "Generate accessible alt text for product images",
    preview: "Generate descriptive alt text for the product image...",
    template: "Generate accessible, SEO-friendly alt text for a product image:\n\nProduct: {{product}}\nImage context: {{imageContext}}\n\nCreate concise, descriptive alt text that:\n1. Describes the image accurately\n2. Includes relevant keywords\n3. Is 125 characters or less",
  },
];

const initialRateLimits: RateLimits = {
  requestsPerMinutePerUser: 10,
  requestsPerHourPerUser: 100,
  globalRateLimit: 1000,
};

const initialStats: AIStats = {
  tokensToday: 156789,
  tokensThisMonth: 4523456,
  avgResponseTime: 1.2,
  errorRate: 0.8,
};

function ModelCard({
  model,
  onToggle,
  onSetPrimary,
}: {
  model: AIModel;
  onToggle: (id: string, enabled: boolean) => void;
  onSetPrimary: (id: string) => void;
}) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/30"
      data-testid={`model-card-${model.id}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-medium">{model.name}</h4>
          <Badge variant="outline" className="text-xs">
            {model.provider}
          </Badge>
          {model.isPrimary && (
            <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30">
              Primary
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{model.description}</p>
      </div>
      <div className="flex items-center gap-4 self-end sm:self-center">
        {!model.isPrimary && model.enabled && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSetPrimary(model.id)}
            data-testid={`button-set-primary-${model.id}`}
          >
            Set as Primary
          </Button>
        )}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${model.enabled ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
            {model.enabled ? "Enabled" : "Disabled"}
          </span>
          <Switch
            checked={model.enabled}
            onCheckedChange={(checked) => onToggle(model.id, checked)}
            disabled={model.isPrimary && model.enabled}
            data-testid={`switch-model-${model.id}`}
            aria-label={`Toggle ${model.name}`}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendDirection,
  testId,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  testId: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-muted/30" data-testid={testId}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold" data-testid={`${testId}-value`}>{value}</span>
        {trend && (
          <span
            className={`text-xs ${
              trendDirection === "up"
                ? "text-green-500"
                : trendDirection === "down"
                ? "text-red-500"
                : "text-muted-foreground"
            }`}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function PromptTemplateRow({
  template,
  onEdit,
}: {
  template: PromptTemplate;
  onEdit: (template: PromptTemplate) => void;
}) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/30"
      data-testid={`template-row-${template.id}`}
    >
      <div className="flex-1 min-w-0">
        <h4 className="font-medium">{template.name}</h4>
        <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
        <p className="text-xs text-muted-foreground/70 mt-2 truncate max-w-md">
          {template.preview}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onEdit(template)}
        data-testid={`button-edit-template-${template.id}`}
      >
        <Pencil className="h-4 w-4 mr-1" />
        Edit
      </Button>
    </div>
  );
}

export default function AIEngineControls() {
  const { toast } = useToast();
  const [models, setModels] = useState<AIModel[]>(initialModels);
  const [rateLimits, setRateLimits] = useState<RateLimits>(initialRateLimits);
  const [stats] = useState<AIStats>(initialStats);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>(initialPromptTemplates);
  const [aiKillSwitch, setAiKillSwitch] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [editedTemplateContent, setEditedTemplateContent] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleModelToggle = (modelId: string, enabled: boolean) => {
    const model = models.find((m) => m.id === modelId);
    if (model?.isPrimary && !enabled) {
      toast({
        title: "Cannot disable primary model",
        description: "Please set another model as primary before disabling this one.",
        variant: "destructive",
      });
      return;
    }

    setModels((prev) =>
      prev.map((m) => (m.id === modelId ? { ...m, enabled } : m))
    );

    toast({
      title: enabled ? "Model Enabled" : "Model Disabled",
      description: `${model?.name} has been ${enabled ? "enabled" : "disabled"}. API integration coming soon.`,
    });
  };

  const handleSetPrimary = (modelId: string) => {
    setModels((prev) =>
      prev.map((m) => ({
        ...m,
        isPrimary: m.id === modelId,
      }))
    );

    const model = models.find((m) => m.id === modelId);
    toast({
      title: "Primary Model Changed",
      description: `${model?.name} is now the primary model. API integration coming soon.`,
    });
  };

  const handleRateLimitChange = (key: keyof RateLimits, value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) return;

    setRateLimits((prev) => ({
      ...prev,
      [key]: numValue,
    }));
  };

  const handleSaveRateLimits = () => {
    toast({
      title: "Rate Limits Updated",
      description: "Rate limit configuration saved. API integration coming soon.",
    });
  };

  const handleEditTemplate = (template: PromptTemplate) => {
    setEditingTemplate(template);
    setEditedTemplateContent(template.template);
    setDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;

    setPromptTemplates((prev) =>
      prev.map((t) =>
        t.id === editingTemplate.id ? { ...t, template: editedTemplateContent } : t
      )
    );

    toast({
      title: "Template Updated",
      description: `${editingTemplate.name} template has been updated. API integration coming soon.`,
    });

    setDialogOpen(false);
    setEditingTemplate(null);
    setEditedTemplateContent("");
  };

  const handleKillSwitch = (enabled: boolean) => {
    setAiKillSwitch(enabled);
    toast({
      title: enabled ? "AI Disabled" : "AI Enabled",
      description: enabled
        ? "All AI operations have been disabled. This is an emergency measure."
        : "AI operations have been restored.",
      variant: enabled ? "destructive" : "default",
    });
  };

  const handleFallbackMode = (enabled: boolean) => {
    setFallbackMode(enabled);
    toast({
      title: enabled ? "Fallback Mode Enabled" : "Fallback Mode Disabled",
      description: enabled
        ? "System will use fallback model for all requests."
        : "System returned to normal operation.",
    });
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const primaryModel = models.find((m) => m.isPrimary);
  const enabledModelsCount = models.filter((m) => m.enabled).length;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" data-testid="heading-ai-engine">
              AI Engine Controls
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage AI model settings, rate limits, and prompt templates
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="text-sm py-1 px-3" data-testid="badge-primary-model">
              <Brain className="h-3 w-3 mr-1" />
              Primary: {primaryModel?.name || "None"}
            </Badge>
            <Badge
              variant={aiKillSwitch ? "destructive" : "secondary"}
              className="text-sm py-1 px-3"
              data-testid="badge-ai-status"
            >
              {aiKillSwitch ? (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  AI Disabled
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  AI Active
                </>
              )}
            </Badge>
          </div>
        </div>

        <Card data-testid="section-emergency-controls">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              Emergency Controls
            </CardTitle>
            <CardDescription>
              Critical controls for emergency situations. Use with caution.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-destructive/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/20">
                  <Power className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h4 className="font-medium">AI Kill Switch</h4>
                  <p className="text-sm text-muted-foreground">
                    Immediately disable all AI operations across the platform
                  </p>
                </div>
              </div>
              <Button
                variant={aiKillSwitch ? "outline" : "destructive"}
                onClick={() => handleKillSwitch(!aiKillSwitch)}
                data-testid="button-kill-switch"
              >
                {aiKillSwitch ? "Restore AI" : "Disable All AI"}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="font-medium">Fallback Mode</h4>
                  <p className="text-sm text-muted-foreground">
                    Force all requests to use the fallback model (GPT-3.5)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className={`text-xs font-medium ${fallbackMode ? "text-primary" : "text-muted-foreground"}`}>
                  {fallbackMode ? "Active" : "Inactive"}
                </span>
                <Switch
                  checked={fallbackMode}
                  onCheckedChange={handleFallbackMode}
                  data-testid="switch-fallback-mode"
                  aria-label="Toggle fallback mode"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="section-ai-models">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Model Selection
            </CardTitle>
            <CardDescription>
              Configure which AI models are available and set the primary model for requests.
              <Badge variant="outline" className="ml-2">
                {enabledModelsCount}/{models.length} enabled
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {models.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                onToggle={handleModelToggle}
                onSetPrimary={handleSetPrimary}
              />
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="section-rate-limits">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Rate Limits
              </CardTitle>
              <CardDescription>
                Configure API rate limiting to prevent abuse and control costs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rpm-user">Requests per Minute (per user)</Label>
                <Input
                  id="rpm-user"
                  type="number"
                  value={rateLimits.requestsPerMinutePerUser}
                  onChange={(e) => handleRateLimitChange("requestsPerMinutePerUser", e.target.value)}
                  className="bg-background"
                  data-testid="input-rpm-user"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rph-user">Requests per Hour (per user)</Label>
                <Input
                  id="rph-user"
                  type="number"
                  value={rateLimits.requestsPerHourPerUser}
                  onChange={(e) => handleRateLimitChange("requestsPerHourPerUser", e.target.value)}
                  className="bg-background"
                  data-testid="input-rph-user"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="global-limit">Global Rate Limit (all users combined)</Label>
                <Input
                  id="global-limit"
                  type="number"
                  value={rateLimits.globalRateLimit}
                  onChange={(e) => handleRateLimitChange("globalRateLimit", e.target.value)}
                  className="bg-background"
                  data-testid="input-global-limit"
                />
              </div>
              <Button onClick={handleSaveRateLimits} data-testid="button-save-rate-limits">
                Save Rate Limits
              </Button>
            </CardContent>
          </Card>

          <Card data-testid="section-ai-stats">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                AI Usage Statistics
              </CardTitle>
              <CardDescription>
                Real-time metrics for AI usage and performance
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <StatCard
                title="Tokens Today"
                value={formatNumber(stats.tokensToday)}
                icon={Zap}
                trend="+12% vs yesterday"
                trendDirection="up"
                testId="stat-tokens-today"
              />
              <StatCard
                title="Tokens This Month"
                value={formatNumber(stats.tokensThisMonth)}
                icon={TrendingUp}
                trend="+8% vs last month"
                trendDirection="up"
                testId="stat-tokens-month"
              />
              <StatCard
                title="Avg Response Time"
                value={`${stats.avgResponseTime}s`}
                icon={Clock}
                trend="-0.2s improvement"
                trendDirection="down"
                testId="stat-response-time"
              />
              <StatCard
                title="Error Rate"
                value={`${stats.errorRate}%`}
                icon={AlertTriangle}
                trend="Within target"
                trendDirection="neutral"
                testId="stat-error-rate"
              />
            </CardContent>
          </Card>
        </div>

        <Card data-testid="section-prompt-templates">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Prompt Templates
            </CardTitle>
            <CardDescription>
              Manage AI prompt templates used across the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {promptTemplates.map((template) => (
              <PromptTemplateRow
                key={template.id}
                template={template}
                onEdit={handleEditTemplate}
              />
            ))}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl" data-testid="dialog-edit-template">
            <DialogHeader>
              <DialogTitle>Edit Prompt Template</DialogTitle>
              <DialogDescription>
                {editingTemplate?.name} - {editingTemplate?.description}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="template-content">Template Content</Label>
                <Textarea
                  id="template-content"
                  value={editedTemplateContent}
                  onChange={(e) => setEditedTemplateContent(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                  data-testid="textarea-template-content"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Use {"{{variable}}"} syntax for dynamic content. Available variables depend on the template type.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-edit">
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate} data-testid="button-save-template">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card data-testid="notice-api-pending">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Backend API integration is pending. All changes are currently stored in local state and will not persist across page reloads.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
