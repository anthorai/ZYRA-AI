import { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  Search,
  TrendingUp,
  BarChart3,
  Link2,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type PlanType = "free" | "starter" | "growth" | "pro";

interface FeatureDefinition {
  id: string;
  name: string;
  description: string;
  plans: PlanType[];
}

interface FeatureCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  features: FeatureDefinition[];
}

const featureCategories: FeatureCategory[] = [
  {
    id: "core-ai",
    name: "Core AI Features",
    icon: Sparkles,
    description: "Essential AI-powered product optimization tools",
    features: [
      {
        id: "OPTIMIZE_PRODUCT",
        name: "Product Optimization",
        description: "AI-powered product listing optimization for better conversions",
        plans: ["free", "starter", "growth", "pro"],
      },
      {
        id: "AI_GROWTH_INTELLIGENCE",
        name: "AI Growth Intelligence",
        description: "Intelligent insights and recommendations for store growth",
        plans: ["free", "starter", "growth", "pro"],
      },
      {
        id: "AB_TESTING",
        name: "A/B Testing",
        description: "Test different content variations to find best performers",
        plans: ["free", "starter", "growth", "pro"],
      },
      {
        id: "SMART_PRODUCT_DESCRIPTION",
        name: "Smart Product Description",
        description: "AI-generated product descriptions tailored to your brand",
        plans: ["free", "starter", "growth", "pro"],
      },
      {
        id: "DYNAMIC_TEMPLATES",
        name: "Dynamic Templates",
        description: "Smart templates that adapt to product context",
        plans: ["free", "starter", "growth", "pro"],
      },
      {
        id: "BRAND_VOICE_MEMORY",
        name: "Brand Voice Memory",
        description: "AI remembers and applies your unique brand voice",
        plans: ["starter", "growth", "pro"],
      },
      {
        id: "CUSTOM_TEMPLATES",
        name: "Custom Templates",
        description: "Create and save your own optimization templates",
        plans: ["growth", "pro"],
      },
      {
        id: "MULTIMODAL_AI",
        name: "Multimodal AI",
        description: "Process text, images, and data together for richer insights",
        plans: ["growth", "pro"],
      },
    ],
  },
  {
    id: "seo-tools",
    name: "SEO Tools",
    icon: Search,
    description: "Search engine optimization features",
    features: [
      {
        id: "SEO_KEYWORD_DENSITY",
        name: "SEO Keyword Density",
        description: "Analyze and optimize keyword usage in product content",
        plans: ["free", "starter", "growth", "pro"],
      },
      {
        id: "AI_IMAGE_ALT_TEXT",
        name: "AI Image Alt Text",
        description: "Auto-generate SEO-friendly alt text for product images",
        plans: ["starter", "growth", "pro"],
      },
      {
        id: "SEO_TITLES_META_TAGS",
        name: "SEO Titles & Meta Tags",
        description: "Generate optimized meta titles and descriptions",
        plans: ["starter", "growth", "pro"],
      },
      {
        id: "SEO_RANKING_TRACKER",
        name: "SEO Ranking Tracker",
        description: "Monitor your product rankings in search results",
        plans: ["growth", "pro"],
      },
      {
        id: "BULK_OPTIMIZATION",
        name: "Bulk Optimization",
        description: "Optimize multiple products at once for efficiency",
        plans: ["growth", "pro"],
      },
      {
        id: "SCHEDULED_REFRESH",
        name: "Scheduled Refresh",
        description: "Automatically refresh product content on a schedule",
        plans: ["growth", "pro"],
      },
    ],
  },
  {
    id: "marketing-automation",
    name: "Marketing & Automation",
    icon: TrendingUp,
    description: "Automated marketing and customer engagement tools",
    features: [
      {
        id: "UPSELL_EMAIL_RECEIPTS",
        name: "Upsell Email Receipts",
        description: "Add smart upsell recommendations to order confirmations",
        plans: ["starter", "growth", "pro"],
      },
      {
        id: "ABANDONED_CART_SMS",
        name: "Abandoned Cart SMS",
        description: "Send SMS reminders for abandoned shopping carts",
        plans: ["starter", "growth", "pro"],
      },
      {
        id: "AI_UPSELL_SUGGESTIONS",
        name: "AI Upsell Suggestions",
        description: "AI-powered product recommendations for upselling",
        plans: ["growth", "pro"],
      },
      {
        id: "DYNAMIC_SEGMENTATION",
        name: "Dynamic Segmentation",
        description: "Auto-segment customers based on behavior and attributes",
        plans: ["growth", "pro"],
      },
      {
        id: "BEHAVIORAL_TARGETING",
        name: "Behavioral Targeting",
        description: "Target customers based on browsing and purchase behavior",
        plans: ["growth", "pro"],
      },
      {
        id: "MULTI_CHANNEL_REPURPOSING",
        name: "Multi-Channel Repurposing",
        description: "Adapt content for different marketing channels",
        plans: ["growth", "pro"],
      },
    ],
  },
  {
    id: "analytics",
    name: "Analytics",
    icon: BarChart3,
    description: "Performance tracking and reporting features",
    features: [
      {
        id: "EMAIL_SMS_ANALYTICS",
        name: "Email/SMS Analytics",
        description: "Track performance of email and SMS campaigns",
        plans: ["free", "starter", "growth", "pro"],
      },
      {
        id: "CONTENT_ROI_TRACKING",
        name: "Content ROI Tracking",
        description: "Measure the revenue impact of content changes",
        plans: ["growth", "pro"],
      },
      {
        id: "REVENUE_ATTRIBUTION",
        name: "Revenue Attribution",
        description: "Attribute sales to specific optimization actions",
        plans: ["growth", "pro"],
      },
    ],
  },
  {
    id: "integrations",
    name: "Integrations",
    icon: Link2,
    description: "Platform connections and data management",
    features: [
      {
        id: "CSV_IMPORT_EXPORT",
        name: "CSV Import/Export",
        description: "Bulk import and export products via CSV files",
        plans: ["starter", "growth", "pro"],
      },
      {
        id: "SHOPIFY_PUBLISH",
        name: "Shopify Publish",
        description: "Publish optimized content directly to Shopify",
        plans: ["free", "starter", "growth", "pro"],
      },
      {
        id: "ROLLBACK_BUTTON",
        name: "Rollback Button",
        description: "Instantly revert to previous product versions",
        plans: ["free", "starter", "growth", "pro"],
      },
    ],
  },
];

const planColors: Record<PlanType, { bg: string; text: string }> = {
  free: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300" },
  starter: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  growth: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300" },
  pro: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" },
};

function PlanBadge({ plan }: { plan: PlanType }) {
  const colors = planColors[plan];
  return (
    <Badge
      variant="outline"
      className={`${colors.bg} ${colors.text} border-transparent text-xs capitalize`}
    >
      {plan}
    </Badge>
  );
}

function FeatureRow({
  feature,
  enabled,
  onToggle,
}: {
  feature: FeatureDefinition;
  enabled: boolean;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/30"
      data-testid={`feature-row-${feature.id}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-medium text-sm">{feature.name}</h4>
          {enabled ? (
            <Tooltip>
              <TooltipTrigger>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </TooltipTrigger>
              <TooltipContent>Feature is enabled</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>Feature is disabled</TooltipContent>
            </Tooltip>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1">Plans:</span>
          {feature.plans.map((plan) => (
            <PlanBadge key={plan} plan={plan} />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 self-end sm:self-center">
        <span className={`text-xs font-medium ${enabled ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
          {enabled ? "Enabled" : "Disabled"}
        </span>
        <Switch
          checked={enabled}
          onCheckedChange={(checked) => onToggle(feature.id, checked)}
          data-testid={`toggle-${feature.id}`}
          aria-label={`Toggle ${feature.name}`}
        />
      </div>
    </div>
  );
}

function CategoryCard({
  category,
  featureStates,
  onToggle,
}: {
  category: FeatureCategory;
  featureStates: Record<string, boolean>;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  const Icon = category.icon;
  const enabledCount = category.features.filter((f) => featureStates[f.id]).length;

  return (
    <Card data-testid={`category-${category.id}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{category.name}</CardTitle>
            <CardDescription className="text-xs">{category.description}</CardDescription>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          {enabledCount}/{category.features.length} enabled
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {category.features.map((feature) => (
          <FeatureRow
            key={feature.id}
            feature={feature}
            enabled={featureStates[feature.id] ?? true}
            onToggle={onToggle}
          />
        ))}
      </CardContent>
    </Card>
  );
}

export default function FeatureToggles() {
  const { toast } = useToast();
  
  const [featureStates, setFeatureStates] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    featureCategories.forEach((category) => {
      category.features.forEach((feature) => {
        initialState[feature.id] = true;
      });
    });
    return initialState;
  });

  const handleToggle = (featureId: string, enabled: boolean) => {
    setFeatureStates((prev) => ({
      ...prev,
      [featureId]: enabled,
    }));
    
    toast({
      title: enabled ? "Feature Enabled" : "Feature Disabled",
      description: "Feature toggle API coming soon. Changes are stored locally for now.",
      duration: 3000,
    });
  };

  const totalFeatures = featureCategories.reduce((acc, cat) => acc + cat.features.length, 0);
  const enabledFeatures = Object.values(featureStates).filter(Boolean).length;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" data-testid="heading-feature-toggles">
              Feature Toggles
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Enable or disable features across the platform instantly
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm py-1 px-3">
              {enabledFeatures}/{totalFeatures} Features Active
            </Badge>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Toggle features on/off to control what users can access. Changes affect all users on applicable plans.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Feature toggle API is coming soon. Currently, changes are stored locally in your browser session and won't persist across page reloads.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {featureCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              featureStates={featureStates}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
