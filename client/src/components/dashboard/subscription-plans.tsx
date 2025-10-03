import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Gift, Zap, Crown, Award } from "lucide-react";

const plans = [
  {
    name: "7-Day Free Trial",
    price: "$0",
    period: "7 days",
    icon: <Gift className="w-8 h-8" />,
    description: "Try ZYRA for 7 Days",
    features: [
      "Test all core features (SEO, product optimization, content tools)",
      "Limited credits",
      "No hidden charges",
      "Cancel anytime before trial ends"
    ],
    popular: false
  },
  {
    name: "Starter",
    price: "$49",
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
    popular: false
  },
  {
    name: "Growth",
    price: "$299",
    period: "per month",
    icon: <Award className="w-8 h-8" />,
    description: "For Growing Merchants",
    features: [
      "10,000 credits / month",
      "Everything in Starter, plus:",
      "A/B testing for products, copy & campaigns",
      "Smart upsell suggestions, abandoned cart recovery",
      "Advanced customer segmentation & targeting",
      "Multi-channel content repurposing (email, SMS, ads)"
    ],
    popular: true
  },
  {
    name: "Pro",
    price: "$999",
    period: "per month",
    icon: <Crown className="w-8 h-8" />,
    description: "For High-Revenue Brands",
    features: [
      "Unlimited credits",
      "Everything in Growth, plus:",
      "Advanced ROI tracking & revenue attribution",
      "Multimodal AI (text + image + insights)",
      "Full brand voice memory for consistent messaging",
      "Enterprise-level dashboards & reporting",
      "Priority support & integrations"
    ],
    popular: false
  }
];

interface SubscriptionPlansProps {
  currentPlan?: string;
}

export default function SubscriptionPlans({ currentPlan }: SubscriptionPlansProps) {
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
                  {plan.price}
                  <span className="text-sm sm:text-base font-normal text-muted-foreground">
                    /{plan.period}
                  </span>
                </div>
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
                  currentPlan === plan.name.toLowerCase().replace(/\s+/g, '-')
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : plan.popular 
                      ? 'gradient-button' 
                      : 'border border-border hover:bg-muted'
                }`}
                variant={plan.popular ? "default" : "outline"}
                disabled={currentPlan === plan.name.toLowerCase().replace(/\s+/g, '-')}
                data-testid={`button-plan-${index}`}
              >
                {currentPlan === plan.name.toLowerCase().replace(/\s+/g, '-')
                  ? 'Current Plan'
                  : index === 0 
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