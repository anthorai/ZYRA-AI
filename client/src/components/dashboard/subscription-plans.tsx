import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Gift, Zap, Crown, Award } from "lucide-react";

const plans = [
  {
    name: "Free to Install",
    planId: "18f8da29-94cf-417b-83f8-07191b22f254",
    monthlyPrice: 0,
    period: "forever",
    icon: <Gift className="w-8 h-8" />,
    description: "Perfect for new and growing Shopify stores",
    features: [
      "ZYRA detects all opportunities",
      "Manual approval mode",
      "One-click rollback protection",
      "Email support"
    ],
    popular: false,
    isTrial: false,
    isFree: true
  },
  {
    name: "Starter",
    planId: "357abaf6-3035-4a25-b178-b5602c09fa8a",
    monthlyPrice: 49,
    period: "per month",
    icon: <Zap className="w-8 h-8" />,
    description: "For New Shopify Stores",
    features: [
      "1,000 credits / month",
      "AI product optimization & SEO tools",
      "Basic conversion boosting (emails, triggers)",
      "Ready-to-use templates for product descriptions",
      "Simple dashboards & bulk editing tools"
    ],
    popular: false,
    isTrial: false
  },
  {
    name: "Growth",
    planId: "aaca603f-f064-44a7-87a4-485f84f19517",
    monthlyPrice: 249,
    period: "per month",
    icon: <Award className="w-8 h-8" />,
    description: "For Growing Merchants",
    features: [
      "6,000 credits / month",
      "Everything in Starter, plus:",
      "A/B testing for products, copy & campaigns",
      "Smart upsell suggestions, abandoned cart recovery",
      "Advanced customer segmentation & targeting",
      "Multi-channel content repurposing (email, SMS, ads)"
    ],
    popular: true,
    isTrial: false
  },
  {
    name: "Pro",
    planId: "5a02d7c5-031f-48fe-bbbd-42847b1c39df",
    monthlyPrice: 499,
    period: "per month",
    icon: <Crown className="w-8 h-8" />,
    description: "For High-Revenue Brands",
    features: [
      "15,000 credits / month",
      "Everything in Growth, plus:",
      "Advanced ROI tracking & revenue attribution",
      "Multimodal AI (text + image + insights)",
      "Full brand voice memory for consistent messaging",
      "Enterprise-level dashboards & reporting",
      "Priority support & integrations"
    ],
    popular: false,
    isTrial: false
  }
];

interface SubscriptionPlansProps {
  currentPlan?: string;
}

export default function SubscriptionPlans({ currentPlan }: SubscriptionPlansProps) {
  const [isAnnual, setIsAnnual] = useState(false);

  const getPrice = (plan: typeof plans[0]) => {
    if (plan.isTrial || (plan as any).isFree) return "$0";
    if (isAnnual) {
      const annualPrice = Math.round(plan.monthlyPrice * 12 * 0.8);
      return `$${annualPrice}`;
    }
    return `$${plan.monthlyPrice}`;
  };

  const getPeriod = (plan: typeof plans[0]) => {
    if (plan.isTrial) return "7 days";
    if ((plan as any).isFree) return "forever";
    return isAnnual ? "per year" : "per month";
  };

  const getSavings = (plan: typeof plans[0]) => {
    if (plan.isTrial || (plan as any).isFree || !isAnnual) return null;
    const monthlyTotal = plan.monthlyPrice * 12;
    const annualTotal = Math.round(monthlyTotal * 0.8);
    return monthlyTotal - annualTotal;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-subscription-title">
          Subscription Plans
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Choose the perfect plan for your Shopify store
        </p>
      </div>

      <div className="flex items-center justify-center gap-3" data-testid="billing-toggle">
        <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
          Monthly
        </span>
        <Switch
          checked={isAnnual}
          onCheckedChange={setIsAnnual}
          data-testid="switch-billing-period"
        />
        <span className={`text-sm font-medium transition-colors ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
          Annual
        </span>
        <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
          Save 20%
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {plans.map((plan, index) => (
          <Card 
            key={index} 
            className={`gradient-card border-0 relative ${
              plan.popular ? 'ring-2 ring-primary' : ''
            }`}
            data-testid={`card-plan-${index}`}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                Most Popular
              </Badge>
            )}
            
            <CardHeader className="text-center">
              <div className="flex justify-center text-primary mb-2">{plan.icon}</div>
              <CardTitle className="text-lg sm:text-xl font-bold" data-testid={`text-plan-name-${index}`}>
                {plan.name}
              </CardTitle>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-bold" data-testid={`text-plan-price-${index}`}>
                  {getPrice(plan)}
                  <span className="text-sm sm:text-base font-normal text-muted-foreground">
                    /{getPeriod(plan)}
                  </span>
                </div>
                {getSavings(plan) && (
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium" data-testid={`text-plan-savings-${index}`}>
                    Save ${getSavings(plan)} per year
                  </p>
                )}
                <p className="text-xs sm:text-sm text-muted-foreground" data-testid={`text-plan-description-${index}`}>
                  {plan.description}
                </p>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <ul className="space-y-2 sm:space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-muted-foreground" data-testid={`text-plan-feature-${index}-${featureIndex}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className={`w-full text-sm sm:text-base ${
                  currentPlan === (plan as any).planId || currentPlan === plan.name
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : plan.popular 
                      ? 'gradient-button' 
                      : 'border border hover:bg-muted'
                }`}
                variant={plan.popular ? "default" : "outline"}
                disabled={currentPlan === (plan as any).planId || currentPlan === plan.name}
                data-testid={`button-plan-${index}`}
              >
                {currentPlan === (plan as any).planId || currentPlan === plan.name
                  ? 'Current Plan'
                  : (plan as any).isFree 
                    ? "Get Started Free"
                    : plan.isTrial
                      ? "Start Trial"
                      : "Choose Plan"
                }
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}