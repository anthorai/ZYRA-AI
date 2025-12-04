import { Zap, Search, TrendingUp, ShoppingCart, Mail, BarChart3, Bot, Target, Rocket, Shield, Clock, Users, DollarSign, CheckCircle } from "lucide-react";

export const heroContent = {
  badge: "AI-Powered Shopify Optimization",
  headline: "Transform Your Shopify Store with AI-Powered Optimization",
  subheadline: "Zyra AI is the all-in-one Shopify automation tool that helps ecommerce merchants optimize products, recover abandoned carts, and scale revenue — all powered by artificial intelligence.",
  cta: {
    primary: "Start Your Free 14-Day Trial",
    secondary: "Schedule a Demo"
  },
  stats: [
    { value: "10,000+", label: "Merchants Trust Us" },
    { value: "47%", label: "Avg. Conversion Boost" },
    { value: "35%", label: "Cart Recovery Rate" },
    { value: "$2.8M+", label: "Revenue Generated" }
  ]
};

export const trustBadges = [
  "Shopify Partner",
  "SOC 2 Certified",
  "GDPR Compliant",
  "4.9/5 Rating"
];

export const featureSections = [
  {
    id: "seo",
    icon: Search,
    title: "Automated Product SEO Optimization",
    subtitle: "Stop spending hours on manual SEO",
    description: "Zyra AI automatically optimizes your product titles, descriptions, and meta tags for Google search. Our Shopify SEO tool uses advanced natural language processing to create keyword-rich content that ranks.",
    benefits: [
      "AI-generated product descriptions that convert",
      "Automatic meta tag optimization",
      "Image alt text generation for SEO",
      "Schema markup implementation",
      "Competitor keyword analysis"
    ],
    stat: { value: "156%", label: "Avg. organic traffic increase" }
  },
  {
    id: "cart-recovery",
    icon: ShoppingCart,
    title: "Smart Abandoned Cart Recovery",
    subtitle: "Recover up to 35% of lost sales",
    description: "AI-powered cart abandonment automation that sends personalized recovery emails and SMS at the perfect time, using machine learning to predict when customers are most likely to complete their purchase.",
    benefits: [
      "Behavior-triggered email sequences",
      "Smart timing optimization",
      "Personalized discount offers",
      "Multi-channel recovery (email, SMS, push)",
      "Real-time analytics dashboard"
    ],
    stat: { value: "$47K", label: "Avg. quarterly cart recovery" }
  },
  {
    id: "upsell",
    icon: TrendingUp,
    title: "Intelligent Upsell & Cross-Sell Automation",
    subtitle: "Increase average order value by 23%",
    description: "AI-powered product recommendations that analyze purchase patterns to suggest relevant upsells and cross-sells that customers actually want.",
    benefits: [
      "One-click upsell funnels",
      "Post-purchase offers",
      "In-cart recommendations",
      "Bundle suggestions",
      "A/B tested offer optimization"
    ],
    stat: { value: "23%", label: "Avg. AOV increase" }
  },
  {
    id: "ab-testing",
    icon: Target,
    title: "AI-Powered A/B Testing",
    subtitle: "Make data-driven decisions automatically",
    description: "Automated A/B testing that continuously tests product pages, pricing, and copy variations to find what converts best — then implements winners automatically.",
    benefits: [
      "Automated test creation",
      "Statistical significance tracking",
      "Multi-variant testing",
      "Conversion rate analysis",
      "Revenue impact reporting"
    ],
    stat: { value: "34%", label: "Avg. conversion improvement" }
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Ecommerce ROI Analytics",
    subtitle: "Understand exactly how AI impacts your bottom line",
    description: "Comprehensive analytics dashboard showing real revenue attribution, customer lifetime value, and ROI metrics that matter.",
    benefits: [
      "Revenue attribution tracking",
      "Customer journey analysis",
      "LTV predictions",
      "Campaign performance metrics",
      "Actionable insights"
    ],
    stat: { value: "4,200%", label: "Avg. ROI on Zyra" }
  }
];

export const testimonials = [
  {
    name: "Sarah M.",
    company: "Fashion Retailer",
    role: "Store Owner",
    quote: "Zyra AI increased our organic traffic by 156% in just 3 months. The automated SEO optimization saved us 20+ hours per week.",
    result: "+156% organic traffic",
    avatar: "SM",
    verified: true
  },
  {
    name: "David K.",
    company: "Electronics Store",
    role: "Founder",
    quote: "We recovered $47,000 in abandoned carts last quarter. Zyra AI pays for itself 50x over.",
    result: "$47K recovered",
    avatar: "DK",
    verified: true
  },
  {
    name: "Lisa T.",
    company: "Beauty Brand",
    role: "Marketing Director",
    quote: "The AI upsell recommendations increased our AOV from $68 to $94. Game-changing for our margins.",
    result: "+38% AOV increase",
    avatar: "LT",
    verified: true
  },
  {
    name: "Michael R.",
    company: "Home Goods",
    role: "CEO",
    quote: "Setup took 5 minutes. Results came within 48 hours. Best ROI on any tool we've ever used.",
    result: "5-minute setup",
    avatar: "MR",
    verified: true
  },
  {
    name: "Jennifer W.",
    company: "Pet Supplies",
    role: "Owner",
    quote: "As a solo founder, I can't afford a marketing team. Zyra AI gives me enterprise-level automation for $49/month.",
    result: "3X sales increase",
    avatar: "JW",
    verified: true
  }
];

export const faqContent = [
  {
    question: "What is Zyra AI?",
    answer: "Zyra AI is an AI-powered optimization and automation app for Shopify stores. It automatically handles product SEO, abandoned cart recovery, upsell automation, A/B testing, and analytics to help merchants increase sales and grow revenue without manual effort."
  },
  {
    question: "How does Zyra AI improve Shopify SEO?",
    answer: "Zyra AI improves Shopify SEO by automatically optimizing product titles, descriptions, meta tags, and image alt text using AI-powered analysis. The app identifies high-value keywords, analyzes competitor rankings, and generates SEO-optimized content that helps products rank higher on Google search results."
  },
  {
    question: "Does Zyra AI work with all Shopify plans?",
    answer: "Yes, Zyra AI is compatible with all Shopify plans including Basic, Shopify, Advanced, and Shopify Plus. The app integrates seamlessly with any Shopify store regardless of plan tier."
  },
  {
    question: "How much can Zyra AI increase my Shopify sales?",
    answer: "Merchants using Zyra AI typically see 20-50% increases in conversion rates, 25-35% recovery of abandoned carts, and 15-30% increases in average order value. Results vary based on store size, industry, and current optimization level."
  },
  {
    question: "Is Zyra AI difficult to set up?",
    answer: "No, Zyra AI installs in one click from the Shopify App Store. The AI automatically analyzes your store and begins optimization within minutes. No technical skills or coding knowledge required."
  },
  {
    question: "How does the abandoned cart recovery work?",
    answer: "Zyra AI's cart recovery uses machine learning to identify when customers abandon carts and sends personalized recovery messages via email, SMS, or push notifications at optimal times. The AI continuously learns from customer behavior to improve recovery rates."
  },
  {
    question: "Can Zyra AI help with product recommendations?",
    answer: "Yes, Zyra AI provides AI-powered product recommendations including upsells, cross-sells, and bundle suggestions. The recommendation engine analyzes purchase history and browsing behavior to suggest products customers are most likely to buy."
  },
  {
    question: "What makes Zyra AI different from other Shopify apps?",
    answer: "Zyra AI combines multiple optimization tools—SEO, cart recovery, upsells, A/B testing, and analytics—into one AI-powered platform. Instead of managing multiple apps, merchants get an all-in-one solution that learns and improves automatically."
  },
  {
    question: "Does Zyra AI offer a free trial?",
    answer: "Yes, Zyra AI offers a free 7-day trial with full access to all features. No credit card required to start. Merchants can cancel anytime during or after the trial period."
  },
  {
    question: "How does Zyra AI's A/B testing work?",
    answer: "Zyra AI automatically creates and runs A/B tests on product pages, pricing, copy, and images. The AI monitors statistical significance, identifies winning variations, and implements changes automatically to maximize conversions."
  },
  {
    question: "Is my store data safe with Zyra AI?",
    answer: "Absolutely. We use bank-level AES-256 encryption, we're SOC 2 Type II certified, and fully GDPR compliant. Your data is never sold or used to train AI models. Plus, you have one-click rollback if you ever want to restore your original data."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes! There are no lock-in contracts. Cancel with one click from your dashboard, keep your credits, no penalties, no hassle. We believe in earning your business every month."
  }
];

export const pricingPlans = [
  {
    name: "Starter",
    price: 49,
    period: "month",
    description: "Best for new Shopify stores just getting started.",
    features: [
      "1,000 AI credits/month",
      "Product SEO optimization",
      "Basic cart recovery",
      "Email performance analytics",
      "One-click Shopify publish",
      "Rollback protection"
    ],
    cta: "Start Free Trial",
    popular: false
  },
  {
    name: "Growth",
    price: 299,
    period: "month",
    description: "Made for scaling merchants ready to grow.",
    features: [
      "5,000 AI credits/month",
      "Everything in Starter, plus:",
      "Advanced cart recovery + SMS",
      "AI upsell suggestions",
      "Dynamic segmentation",
      "Full A/B testing dashboard",
      "Revenue impact tracking",
      "Bulk optimization"
    ],
    cta: "Start Free Trial",
    popular: true
  },
  {
    name: "Pro",
    price: 999,
    period: "month",
    description: "Perfect for high-revenue brands & enterprises.",
    features: [
      "20,000 AI credits/month",
      "Everything in Growth, plus:",
      "Priority AI processing",
      "White-glove onboarding",
      "Dedicated account manager",
      "Custom integrations",
      "API access",
      "Enterprise SLA"
    ],
    cta: "Contact Sales",
    popular: false
  }
];

export const howItWorks = [
  {
    step: 1,
    title: "Connect Your Shopify Store",
    description: "Install Zyra AI from the Shopify App Store in one click. No coding required."
  },
  {
    step: 2,
    title: "AI Analyzes Your Store",
    description: "Our AI scans your products, traffic patterns, and conversion data to identify optimization opportunities."
  },
  {
    step: 3,
    title: "Automatic Optimization",
    description: "Zyra AI implements SEO improvements, sets up recovery automations, and configures upsell funnels — automatically."
  },
  {
    step: 4,
    title: "Watch Revenue Grow",
    description: "Track your results in real-time as Zyra AI continuously optimizes for maximum performance."
  }
];

export const blogTopics = [
  {
    slug: "complete-guide-shopify-seo-2025",
    title: "The Complete Guide to Shopify SEO in 2025: Rank Higher, Sell More",
    description: "Learn proven SEO strategies for Shopify stores. From product optimization to technical SEO, this comprehensive guide covers everything you need to rank on Google.",
    category: "SEO",
    readTime: "15 min read",
    keywords: ["Shopify SEO guide", "Shopify SEO 2025", "ecommerce SEO"]
  },
  {
    slug: "reduce-cart-abandonment-shopify",
    title: "15 Proven Ways to Reduce Cart Abandonment on Shopify",
    description: "Discover actionable strategies to recover abandoned carts and boost conversions. Learn why customers leave and how to bring them back.",
    category: "Conversion",
    readTime: "12 min read",
    keywords: ["cart abandonment", "reduce cart abandonment", "Shopify conversion"]
  },
  {
    slug: "ai-revolutionizing-ecommerce",
    title: "How AI is Revolutionizing Ecommerce: A Merchant's Guide",
    description: "Explore how artificial intelligence is transforming online retail. From product recommendations to automated marketing, discover AI opportunities for your store.",
    category: "AI",
    readTime: "10 min read",
    keywords: ["AI ecommerce", "artificial intelligence retail", "AI for Shopify"]
  },
  {
    slug: "product-description-seo-tips",
    title: "Product Description Writing: SEO Tips for Shopify Sellers",
    description: "Master the art of writing product descriptions that rank and convert. Learn keyword strategies, formatting tips, and AI-powered shortcuts.",
    category: "SEO",
    readTime: "8 min read",
    keywords: ["product description SEO", "Shopify product copy", "SEO copywriting"]
  },
  {
    slug: "ab-testing-shopify-guide",
    title: "A/B Testing for Shopify: What to Test and How to Win",
    description: "Learn how to run effective A/B tests on your Shopify store. From product pages to checkout, discover what to test for maximum impact.",
    category: "Conversion",
    readTime: "10 min read",
    keywords: ["A/B testing Shopify", "Shopify CRO", "conversion optimization"]
  }
];

export const comparisonPageContent = {
  seoTools: {
    title: "Best Shopify SEO Tools 2025: Complete Comparison Guide",
    subtitle: "Find the Right SEO App for Your Store",
    intro: "Choosing the right SEO tool can make the difference between page 1 rankings and invisibility. We've analyzed the top Shopify SEO apps to help you make an informed decision.",
    tools: [
      {
        name: "Zyra AI",
        rating: 4.9,
        reviews: 2847,
        price: "From $49/mo",
        highlight: "Best Overall",
        pros: [
          "AI-powered automation",
          "All-in-one platform",
          "Real-time optimization",
          "Cart recovery included",
          "A/B testing built-in"
        ],
        cons: [
          "Premium pricing",
          "Learning curve for advanced features"
        ]
      },
      {
        name: "SEO Manager",
        rating: 4.5,
        reviews: 1523,
        price: "From $20/mo",
        highlight: "Budget Friendly",
        pros: [
          "Affordable pricing",
          "Easy to use",
          "Meta tag management"
        ],
        cons: [
          "Limited automation",
          "No AI features",
          "Manual optimization only"
        ]
      },
      {
        name: "Plug in SEO",
        rating: 4.4,
        reviews: 3211,
        price: "Free / $29.99/mo",
        highlight: "Free Option",
        pros: [
          "Free tier available",
          "SEO health checks",
          "Issue detection"
        ],
        cons: [
          "No content generation",
          "Limited features in free tier",
          "No cart recovery"
        ]
      },
      {
        name: "Smart SEO",
        rating: 4.6,
        reviews: 1876,
        price: "From $7/mo",
        highlight: "Starter Friendly",
        pros: [
          "Very affordable",
          "Meta tags automation",
          "Alt text generation"
        ],
        cons: [
          "Basic features only",
          "No analytics",
          "Limited support"
        ]
      }
    ],
    conclusion: "For merchants serious about SEO and growth, Zyra AI offers the most comprehensive solution with AI-powered automation, cart recovery, and continuous optimization. Budget-conscious stores can start with free options and upgrade as they grow."
  },
  aiApps: {
    title: "Shopify AI Apps: The Complete Guide to Artificial Intelligence for Ecommerce",
    subtitle: "Transform Your Store with AI-Powered Automation",
    intro: "AI is no longer a luxury—it's a necessity for competitive ecommerce. Discover which AI apps can help automate your store and boost revenue.",
    categories: [
      {
        name: "All-in-One AI Platforms",
        description: "Comprehensive AI solutions covering multiple aspects of store optimization",
        topPick: "Zyra AI"
      },
      {
        name: "AI Product Description Writers",
        description: "Tools focused on generating product copy and content",
        topPick: "Zyra AI"
      },
      {
        name: "AI Recommendation Engines",
        description: "Personalization tools for product recommendations",
        topPick: "Various"
      },
      {
        name: "AI Customer Service",
        description: "Chatbots and automated support solutions",
        topPick: "Various"
      }
    ],
    conclusion: "The most successful Shopify stores use AI comprehensively. Zyra AI stands out as the only platform combining SEO, cart recovery, upsells, and analytics in one AI-powered solution."
  },
  cartRecovery: {
    title: "Shopify Abandoned Cart Solutions: Compare Recovery Apps & Strategies 2025",
    subtitle: "Recover Lost Sales and Reduce Cart Abandonment",
    intro: "With average cart abandonment rates of 70%, recovery solutions are essential for any serious ecommerce business. Compare the top options.",
    stats: [
      { value: "70%", label: "Average cart abandonment rate" },
      { value: "$4.6T", label: "Lost to cart abandonment globally" },
      { value: "35%", label: "Average recovery rate with AI" }
    ],
    solutions: [
      {
        name: "Zyra AI",
        type: "AI-Powered",
        price: "From $49/mo",
        recoveryRate: "35%",
        features: [
          "AI timing optimization",
          "Email + SMS + Push",
          "Personalized messaging",
          "Behavioral triggers",
          "Analytics dashboard"
        ],
        highlight: "Best Recovery Rate"
      },
      {
        name: "Klaviyo",
        type: "Email Marketing",
        price: "From $45/mo",
        recoveryRate: "25%",
        features: [
          "Email sequences",
          "Segmentation",
          "Templates",
          "Analytics"
        ],
        highlight: "Email Focused"
      },
      {
        name: "Omnisend",
        type: "Multi-Channel",
        price: "From $16/mo",
        recoveryRate: "22%",
        features: [
          "Email + SMS",
          "Automation workflows",
          "Push notifications"
        ],
        highlight: "Budget Option"
      }
    ],
    conclusion: "AI-powered solutions like Zyra AI deliver significantly higher recovery rates by optimizing timing and personalization automatically. For maximum cart recovery, choose a solution that combines multiple channels with intelligent automation."
  }
};

export const ctaContent = {
  primary: {
    headline: "Ready to Transform Your Shopify Store?",
    subheadline: "Join 10,000+ merchants using Zyra AI to automate growth.",
    buttonText: "Start Your Free Trial",
    note: "No credit card required. Cancel anytime."
  },
  secondary: {
    headline: "See Zyra AI in Action",
    subheadline: "Get a personalized demo for your store.",
    buttonText: "Schedule a Demo"
  }
};

export const internalLinks = {
  features: "/features",
  seoOptimization: "/features/seo-optimization",
  cartRecovery: "/features/cart-recovery",
  upsellAutomation: "/features/upsell-automation",
  pricing: "/pricing",
  caseStudies: "/case-studies",
  blog: "/blog",
  compareSeoTools: "/compare/shopify-seo-tools",
  compareAiApps: "/compare/shopify-ai-apps",
  compareCartRecovery: "/compare/cart-recovery-apps",
  about: "/about",
  contact: "/contact",
  auth: "/auth"
};
