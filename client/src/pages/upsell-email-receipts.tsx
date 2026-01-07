import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { useToast } from "@/hooks/use-toast";
import { useStoreCurrency } from "@/hooks/use-store-currency";
import { formatCurrency } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { 
  Mail,
  Settings,
  BarChart3,
  FlaskConical,
  ListFilter,
  Plus,
  Trash2,
  Save,
  Play,
  Pause,
  Trophy,
  TrendingUp,
  MousePointerClick,
  ShoppingCart,
  DollarSign,
  Eye,
  Palette,
  Image
} from "lucide-react";

interface UpsellSettings {
  id: string;
  userId: string;
  isEnabled: boolean;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  headerText: string;
  upsellSectionTitle: string;
  footerText: string | null;
  showDiscountBadge: boolean;
  defaultDiscountPercent: number;
  maxRecommendations: number;
  recommendationStrategy: string;
  priceRangePercent: number;
  excludeCategories: string[] | null;
  abTestEnabled: boolean;
  currentAbTestId: string | null;
}

interface RecommendationRule {
  id: string;
  userId: string;
  ruleName: string;
  ruleType: string;
  isActive: boolean;
  priority: number;
  triggerCategory: string | null;
  triggerProductIds: string[] | null;
  triggerMinPrice: string | null;
  triggerMaxPrice: string | null;
  recommendCategory: string | null;
  recommendProductIds: string[] | null;
  discountType: string;
  discountValue: string;
  description: string | null;
}

interface AbTest {
  id: string;
  testName: string;
  status: string;
  controlStrategy: string;
  variantAStrategy: string;
  variantBStrategy: string | null;
  controlTrafficPercent: number;
  variantATrafficPercent: number;
  variantBTrafficPercent: number;
  controlSent: number;
  controlClicks: number;
  controlConversions: number;
  controlRevenue: string;
  variantASent: number;
  variantAClicks: number;
  variantAConversions: number;
  variantARevenue: string;
  variantBSent: number;
  variantBClicks: number;
  variantBConversions: number;
  variantBRevenue: string;
  winnerId: string | null;
  winnerConfidence: string | null;
  startedAt: string;
  endedAt: string | null;
}

interface Analytics {
  summary: {
    total_sent: number;
    total_clicks: number;
    total_conversions: number;
    total_revenue: number;
    avg_order_value: number;
  };
  dailyStats: Array<{
    date: string;
    sent: number;
    clicks: number;
    conversions: number;
    revenue: number;
  }>;
}

const STRATEGY_OPTIONS = [
  { value: "category_match", label: "Same Category" },
  { value: "price_range", label: "Similar Price Range" },
  { value: "frequently_bought", label: "Frequently Bought Together" },
  { value: "ai_personalized", label: "AI Personalized" },
];

const RULE_TYPES = [
  { value: "category_match", label: "Category Match" },
  { value: "price_range", label: "Price Range" },
  { value: "frequently_bought", label: "Frequently Bought" },
  { value: "manual", label: "Manual Selection" },
  { value: "cross_sell", label: "Cross-Sell" },
];

export default function UpsellEmailReceiptsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currency } = useStoreCurrency();
  
  const [activeTab, setActiveTab] = useState("settings");
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleType, setNewRuleType] = useState("category_match");

  const { data: settings, isLoading: settingsLoading } = useQuery<UpsellSettings>({
    queryKey: ["/api/upsell/settings"],
  });

  const { data: rules = [], isLoading: rulesLoading } = useQuery<RecommendationRule[]>({
    queryKey: ["/api/upsell/rules"],
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics>({
    queryKey: ["/api/upsell/analytics"],
  });

  const { data: abTests = [], isLoading: abTestsLoading } = useQuery<AbTest[]>({
    queryKey: ["/api/upsell/ab-tests"],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<UpsellSettings>) => {
      return await apiRequest("PATCH", "/api/upsell/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/upsell/settings"] });
      toast({ title: "Settings updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update settings", variant: "destructive" });
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: async (data: Partial<RecommendationRule>) => {
      return await apiRequest("POST", "/api/upsell/rules", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/upsell/rules"] });
      setNewRuleName("");
      toast({ title: "Rule created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create rule", variant: "destructive" });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      return await apiRequest("DELETE", `/api/upsell/rules/${ruleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/upsell/rules"] });
      toast({ title: "Rule deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete rule", variant: "destructive" });
    },
  });

  const createAbTestMutation = useMutation({
    mutationFn: async (data: Partial<AbTest>) => {
      return await apiRequest("POST", "/api/upsell/ab-tests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/upsell/ab-tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/upsell/settings"] });
      toast({ title: "A/B test started" });
    },
    onError: () => {
      toast({ title: "Failed to create A/B test", variant: "destructive" });
    },
  });

  const endAbTestMutation = useMutation({
    mutationFn: async ({ testId, winnerId }: { testId: string; winnerId?: string }) => {
      return await apiRequest("POST", `/api/upsell/ab-tests/${testId}/end`, { winnerId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/upsell/ab-tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/upsell/settings"] });
      toast({ title: "A/B test ended" });
    },
    onError: () => {
      toast({ title: "Failed to end A/B test", variant: "destructive" });
    },
  });

  const handleToggle = (enabled: boolean) => {
    updateSettingsMutation.mutate({ isEnabled: enabled });
  };

  const handleSettingsChange = (field: keyof UpsellSettings, value: any) => {
    updateSettingsMutation.mutate({ [field]: value });
  };

  const handleCreateRule = () => {
    if (!newRuleName.trim()) {
      toast({ title: "Please enter a rule name", variant: "destructive" });
      return;
    }
    createRuleMutation.mutate({
      ruleName: newRuleName,
      ruleType: newRuleType,
      isActive: true,
      priority: 1,
    });
  };

  const handleStartAbTest = () => {
    createAbTestMutation.mutate({
      testName: `A/B Test ${new Date().toLocaleDateString()}`,
      controlStrategy: "category_match",
      variantAStrategy: "price_range",
    });
  };

  const totalSent = analytics?.summary?.total_sent || 0;
  const totalClicks = analytics?.summary?.total_clicks || 0;
  const totalConversions = analytics?.summary?.total_conversions || 0;
  
  const clickRate = totalSent > 0 
    ? ((totalClicks / totalSent) * 100).toFixed(1)
    : "0";
  
  const conversionRate = totalClicks > 0
    ? ((totalConversions / totalClicks) * 100).toFixed(1)
    : "0";

  const activeTest = abTests?.find(t => t.status === "active");

  return (
    <PageShell
      title="Upsell Email Receipts"
      subtitle="Add AI-powered product recommendations to order confirmation emails"
      backTo="/dashboard?tab=campaigns"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Switch 
            checked={settings?.isEnabled || false} 
            onCheckedChange={handleToggle}
            disabled={updateSettingsMutation.isPending}
            data-testid="switch-enable-upsell"
          />
          <Label className="text-lg font-medium">
            {settings?.isEnabled ? "Upsell Receipts Active" : "Enable Upsell Receipts"}
          </Label>
          {settings?.isEnabled && (
            <Badge variant="default" className="bg-green-600">Live</Badge>
          )}
        </div>
        {settings?.abTestEnabled && (
          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
            <FlaskConical className="w-3 h-3 mr-1" />
            A/B Test Running
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Emails Sent</span>
            </div>
            <div className="text-2xl font-bold mt-2" data-testid="text-emails-sent">
              {analytics?.summary.total_sent || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <MousePointerClick className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click Rate</span>
            </div>
            <div className="text-2xl font-bold mt-2" data-testid="text-click-rate">
              {clickRate}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Conversions</span>
            </div>
            <div className="text-2xl font-bold mt-2" data-testid="text-conversions">
              {analytics?.summary.total_conversions || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Revenue</span>
            </div>
            <div className="text-2xl font-bold mt-2" data-testid="text-revenue">
              {formatCurrency(Number(analytics?.summary.total_revenue || 0), currency)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="settings" className="flex items-center gap-2" data-testid="tab-settings">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2" data-testid="tab-rules">
            <ListFilter className="w-4 h-4" />
            Rules
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2" data-testid="tab-analytics">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="ab-testing" className="flex items-center gap-2" data-testid="tab-ab-testing">
            <FlaskConical className="w-4 h-4" />
            A/B Testing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Template Branding
                </CardTitle>
                <CardDescription>Customize the look of your upsell emails</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings?.primaryColor || "#6366f1"}
                        onChange={(e) => handleSettingsChange("primaryColor", e.target.value)}
                        className="w-12 h-9 p-1 cursor-pointer"
                        data-testid="input-primary-color"
                      />
                      <Input
                        value={settings?.primaryColor || "#6366f1"}
                        onChange={(e) => handleSettingsChange("primaryColor", e.target.value)}
                        className="flex-1 bg-background"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Discount Badge Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings?.secondaryColor || "#22c55e"}
                        onChange={(e) => handleSettingsChange("secondaryColor", e.target.value)}
                        className="w-12 h-9 p-1 cursor-pointer"
                        data-testid="input-secondary-color"
                      />
                      <Input
                        value={settings?.secondaryColor || "#22c55e"}
                        onChange={(e) => handleSettingsChange("secondaryColor", e.target.value)}
                        className="flex-1 bg-background"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings?.backgroundColor || "#1e293b"}
                        onChange={(e) => handleSettingsChange("backgroundColor", e.target.value)}
                        className="w-12 h-9 p-1 cursor-pointer"
                        data-testid="input-bg-color"
                      />
                      <Input
                        value={settings?.backgroundColor || "#1e293b"}
                        onChange={(e) => handleSettingsChange("backgroundColor", e.target.value)}
                        className="flex-1 bg-background"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings?.textColor || "#f8fafc"}
                        onChange={(e) => handleSettingsChange("textColor", e.target.value)}
                        className="w-12 h-9 p-1 cursor-pointer"
                        data-testid="input-text-color"
                      />
                      <Input
                        value={settings?.textColor || "#f8fafc"}
                        onChange={(e) => handleSettingsChange("textColor", e.target.value)}
                        className="flex-1 bg-background"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Logo URL</Label>
                  <Input
                    placeholder="https://your-store.com/logo.png"
                    value={settings?.logoUrl || ""}
                    onChange={(e) => handleSettingsChange("logoUrl", e.target.value)}
                    className="bg-background"
                    data-testid="input-logo-url"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Content
                </CardTitle>
                <CardDescription>Customize the text in your emails</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Header Text</Label>
                  <Input
                    value={settings?.headerText || "Thank you for your order!"}
                    onChange={(e) => handleSettingsChange("headerText", e.target.value)}
                    className="bg-background"
                    data-testid="input-header-text"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Upsell Section Title</Label>
                  <Input
                    value={settings?.upsellSectionTitle || "Complete Your Setup:"}
                    onChange={(e) => handleSettingsChange("upsellSectionTitle", e.target.value)}
                    className="bg-background"
                    data-testid="input-upsell-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Footer Text (optional)</Label>
                  <Textarea
                    placeholder="Add a custom footer message..."
                    value={settings?.footerText || ""}
                    onChange={(e) => handleSettingsChange("footerText", e.target.value)}
                    rows={3}
                    className="bg-background"
                    data-testid="input-footer-text"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Show Discount Badge</Label>
                  <Switch
                    checked={settings?.showDiscountBadge ?? true}
                    onCheckedChange={(checked) => handleSettingsChange("showDiscountBadge", checked)}
                    data-testid="switch-discount-badge"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListFilter className="w-5 h-5" />
                  Recommendation Settings
                </CardTitle>
                <CardDescription>Control how products are recommended</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Recommendation Strategy</Label>
                    <Select
                      value={settings?.recommendationStrategy || "category_match"}
                      onValueChange={(value) => handleSettingsChange("recommendationStrategy", value)}
                    >
                      <SelectTrigger data-testid="select-strategy">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STRATEGY_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Max Recommendations: {settings?.maxRecommendations || 3}</Label>
                    <Slider
                      value={[settings?.maxRecommendations || 3]}
                      onValueChange={([value]) => handleSettingsChange("maxRecommendations", value)}
                      min={1}
                      max={6}
                      step={1}
                      data-testid="slider-max-recs"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Default Discount: {settings?.defaultDiscountPercent || 15}%</Label>
                    <Slider
                      value={[settings?.defaultDiscountPercent || 15]}
                      onValueChange={([value]) => handleSettingsChange("defaultDiscountPercent", value)}
                      min={0}
                      max={50}
                      step={5}
                      data-testid="slider-discount"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Live Preview
                </CardTitle>
                <CardDescription>See how your upsell email will look</CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="p-6 rounded-lg border"
                  style={{ 
                    backgroundColor: settings?.backgroundColor || "#1e293b",
                    color: settings?.textColor || "#f8fafc"
                  }}
                >
                  {settings?.logoUrl && (
                    <img 
                      src={settings.logoUrl} 
                      alt="Logo" 
                      className="h-10 mb-4"
                      onError={(e) => e.currentTarget.style.display = 'none'}
                    />
                  )}
                  <div className="font-bold text-lg mb-2">Order Confirmation #12345</div>
                  <div className="mb-4">{settings?.headerText || "Thank you for your order!"}</div>
                  
                  <div className="border-t border-white/20 pt-4 mt-4">
                    <div 
                      className="font-bold text-lg mb-3"
                      style={{ color: settings?.primaryColor || "#6366f1" }}
                    >
                      {settings?.upsellSectionTitle || "Complete Your Setup:"}
                    </div>
                    
                    <div className="space-y-3">
                      {[1, 2, 3].slice(0, settings?.maxRecommendations || 3).map(i => (
                        <div key={i} className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">Sample Product {i}</div>
                            <div className="text-sm opacity-70">Perfect for your setup</div>
                          </div>
                          <div className="text-right">
                            <div style={{ color: settings?.primaryColor || "#6366f1" }} className="font-bold">
                              $24.99
                            </div>
                            {settings?.showDiscountBadge && (
                              <Badge 
                                style={{ backgroundColor: settings?.secondaryColor || "#22c55e" }}
                                className="text-white"
                              >
                                {settings?.defaultDiscountPercent || 15}% off
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {settings?.footerText && (
                    <div className="border-t border-white/20 pt-4 mt-4 text-sm opacity-70">
                      {settings.footerText}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Recommendation Rules</CardTitle>
              <CardDescription>
                Define custom rules for when to recommend specific products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <Input
                  placeholder="Rule name..."
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="max-w-xs bg-background"
                  data-testid="input-new-rule-name"
                />
                <Select value={newRuleType} onValueChange={setNewRuleType}>
                  <SelectTrigger className="w-48" data-testid="select-rule-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RULE_TYPES.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleCreateRule} 
                  disabled={createRuleMutation.isPending}
                  data-testid="button-create-rule"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Rule
                </Button>
              </div>

              {rulesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading rules...</div>
              ) : rules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No rules created yet. Add a rule to customize product recommendations.
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map(rule => (
                    <div 
                      key={rule.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`rule-item-${rule.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <Badge variant={rule.isActive ? "default" : "secondary"}>
                          {rule.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <div>
                          <div className="font-medium">{rule.ruleName}</div>
                          <div className="text-sm text-muted-foreground">
                            Type: {RULE_TYPES.find(t => t.value === rule.ruleType)?.label || rule.ruleType}
                            {rule.triggerCategory && ` | Category: ${rule.triggerCategory}`}
                            {rule.discountValue && ` | Discount: ${rule.discountValue}%`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Priority: {rule.priority}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRuleMutation.mutate(rule.id)}
                          data-testid={`button-delete-rule-${rule.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Click Rate</span>
                      <span className="font-medium">{clickRate}%</span>
                    </div>
                    <Progress value={Number(clickRate)} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Conversion Rate</span>
                      <span className="font-medium">{conversionRate}%</span>
                    </div>
                    <Progress value={Number(conversionRate)} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Avg. Order Value</span>
                      <span className="font-medium">
                        {formatCurrency(Number(analytics?.summary.avg_order_value || 0), currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Daily Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>
                ) : !analytics?.dailyStats?.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No data yet. Start sending upsell emails to see analytics.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {analytics.dailyStats.slice(0, 7).map((day, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm">{new Date(day.date).toLocaleDateString()}</span>
                        <div className="flex gap-4 text-sm">
                          <span>{day.sent} sent</span>
                          <span>{day.clicks} clicks</span>
                          <span className="text-green-600">{formatCurrency(day.revenue, currency)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ab-testing">
          <div className="grid grid-cols-1 gap-6">
            {activeTest ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="w-5 h-5" />
                      {activeTest.testName}
                    </div>
                    <Badge variant="default" className="bg-yellow-600">Running</Badge>
                  </CardTitle>
                  <CardDescription>
                    Started {new Date(activeTest.startedAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground mb-1">Control</div>
                        <div className="font-medium">{activeTest.controlStrategy}</div>
                        <div className="mt-2 space-y-1 text-sm">
                          <div>Sent: {activeTest.controlSent}</div>
                          <div>Clicks: {activeTest.controlClicks}</div>
                          <div>Conversions: {activeTest.controlConversions}</div>
                          <div className="text-green-600">Revenue: {formatCurrency(Number(activeTest.controlRevenue) || 0, currency)}</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground mb-1">Variant A</div>
                        <div className="font-medium">{activeTest.variantAStrategy}</div>
                        <div className="mt-2 space-y-1 text-sm">
                          <div>Sent: {activeTest.variantASent}</div>
                          <div>Clicks: {activeTest.variantAClicks}</div>
                          <div>Conversions: {activeTest.variantAConversions}</div>
                          <div className="text-green-600">Revenue: {formatCurrency(Number(activeTest.variantARevenue) || 0, currency)}</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground mb-1">Variant B</div>
                        <div className="font-medium">{activeTest.variantBStrategy || "N/A"}</div>
                        <div className="mt-2 space-y-1 text-sm">
                          <div>Sent: {activeTest.variantBSent}</div>
                          <div>Clicks: {activeTest.variantBClicks}</div>
                          <div>Conversions: {activeTest.variantBConversions}</div>
                          <div className="text-green-600">Revenue: {formatCurrency(Number(activeTest.variantBRevenue) || 0, currency)}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <Button 
                    onClick={() => endAbTestMutation.mutate({ testId: activeTest.id })}
                    variant="destructive"
                    data-testid="button-end-test"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    End Test & Declare Winner
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FlaskConical className="w-5 h-5" />
                    Start New A/B Test
                  </CardTitle>
                  <CardDescription>
                    Test different recommendation strategies to find what works best
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <p className="text-muted-foreground mb-4">
                      A/B testing will split your traffic between different recommendation strategies 
                      and track which performs better based on click rates and conversions.
                    </p>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="p-4 border rounded-lg">
                        <div className="font-medium mb-1">Control</div>
                        <div className="text-sm text-muted-foreground">Same Category (34%)</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="font-medium mb-1">Variant A</div>
                        <div className="text-sm text-muted-foreground">Similar Price (33%)</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="font-medium mb-1">Variant B</div>
                        <div className="text-sm text-muted-foreground">AI Personalized (33%)</div>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={handleStartAbTest}
                    disabled={createAbTestMutation.isPending}
                    data-testid="button-start-test"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start A/B Test
                  </Button>
                </CardContent>
              </Card>
            )}

            {abTests.filter(t => t.status === "completed").length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Past Tests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {abTests.filter(t => t.status === "completed").map(test => (
                      <div key={test.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">{test.testName}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(test.startedAt).toLocaleDateString()} - {test.endedAt ? new Date(test.endedAt).toLocaleDateString() : "N/A"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {test.winnerId && (
                            <Badge variant="default" className="bg-green-600">
                              <Trophy className="w-3 h-3 mr-1" />
                              Winner: {test.winnerId}
                            </Badge>
                          )}
                          {test.winnerConfidence && (
                            <Badge variant="outline">
                              {Number(test.winnerConfidence).toFixed(0)}% confidence
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
