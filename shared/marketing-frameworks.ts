/**
 * Marketing Frameworks Library
 * 
 * Professional, proven marketing templates that replace generic AI tone presets
 * Each framework is based on real-world brand strategies
 */

export interface MarketingFramework {
  id: string;
  name: string;
  description: string;
  targetUse: string;
  tone: string;
  writingStyle: string;
  keyCharacteristics: string[];
  exampleBrands: string[];
  bestFor: string[];
  avoidFor: string[];
  psychologicalTriggers: string[];
  structureGuidelines: {
    titleFormat: string;
    descriptionStructure: string[];
    ctaStyle: string;
  };
  sampleOutput?: {
    title: string;
    description: string;
  };
}

/**
 * All available marketing frameworks
 */
export const MARKETING_FRAMEWORKS: MarketingFramework[] = [
  {
    id: 'luxury-premium',
    name: 'Luxury/High-end',
    description: 'Sophisticated, exclusive tone inspired by luxury brands like Hermès and Apple',
    targetUse: 'Premium products, luxury goods, high-end services',
    tone: 'Refined, exclusive, understated elegance',
    writingStyle: 'Minimalist yet powerful, every word carefully chosen',
    keyCharacteristics: [
      'Understated sophistication',
      'Quality over quantity',
      'Exclusivity messaging',
      'Timeless language',
      'Premium materials focus',
      'Craftsmanship emphasis'
    ],
    exampleBrands: ['Hermès', 'Apple', 'Rolex', 'Tesla', 'Bang & Olufsen'],
    bestFor: [
      'Premium products ($500+)',
      'Luxury fashion',
      'High-end electronics',
      'Designer furniture',
      'Fine jewelry'
    ],
    avoidFor: [
      'Budget products',
      'Fast fashion',
      'Discount items',
      'Mass-market goods'
    ],
    psychologicalTriggers: [
      'Exclusivity',
      'Status',
      'Heritage',
      'Craftsmanship',
      'Timelessness',
      'Scarcity'
    ],
    structureGuidelines: {
      titleFormat: 'Minimal, elegant. Focus on material/craft. E.g., "Handcrafted Italian Leather Wallet"',
      descriptionStructure: [
        'Brief, powerful opening about heritage or craftsmanship',
        'Premium materials and construction',
        'Understated benefits (not flashy claims)',
        'Timeless appeal',
        'Subtle, refined CTA'
      ],
      ctaStyle: 'Understated invitations: "Discover", "Explore", "Experience"'
    },
    sampleOutput: {
      title: 'Handcrafted Italian Leather Weekender',
      description: 'Born from a century-old tradition of Italian leatherworking. Each piece is meticulously crafted from full-grain vegetable-tanned leather, developing a rich patina that tells your story. Timeless design meets modern functionality. Lifetime craftsmanship guarantee.'
    }
  },
  {
    id: 'gen-z-viral',
    name: 'Gen Z Viral',
    description: 'TikTok energy - casual, authentic, meme-aware, scroll-stopping',
    targetUse: 'Trendy products, social media marketing, youth-oriented brands',
    tone: 'Conversational, playful, authentic, no-cap energy',
    writingStyle: 'Short sentences. Lots of energy. Internet-native language.',
    keyCharacteristics: [
      'Internet slang (used naturally)',
      'Self-aware humor',
      'Authenticity over polish',
      'Relatable situations',
      'Anti-corporate vibe',
      'Value consciousness'
    ],
    exampleBrands: ['Duolingo (TikTok)', 'Liquid Death', 'Glossier', 'Starface'],
    bestFor: [
      'Fashion/beauty for teens-20s',
      'Tech accessories',
      'Lifestyle products',
      'Social-first brands',
      'Affordable luxury'
    ],
    avoidFor: [
      'B2B products',
      'Medical/legal services',
      'Luxury goods',
      'Professional equipment'
    ],
    psychologicalTriggers: [
      'FOMO',
      'Belonging',
      'Authenticity',
      'Self-expression',
      'Value for money',
      'Trend participation'
    ],
    structureGuidelines: {
      titleFormat: 'Casual, punchy. Can include slang. E.g., "The Hoodie That Ate TikTok"',
      descriptionStructure: [
        'Hook with relatable problem or meme reference',
        'Real talk about the product (no BS)',
        'Social proof or viral moment',
        'Value proposition (but make it casual)',
        'Fun, pressure-free CTA'
      ],
      ctaStyle: 'Casual invites: "Cop it", "Vibe check", "Get yours", "Shop the drop"'
    },
    sampleOutput: {
      title: 'Cloud Slides Everyone\'s Obsessed With',
      description: 'POV: Your feet have been hurting all day and you finally get home. These cloud slides hit different. 4M+ pairs sold, 50K 5-star reviews. They\'re literally like walking on actual clouds (not sponsored, just facts). Your feet deserve this. Free shipping + 30-day returns because we\'re not evil.'
    }
  },
  {
    id: 'eco-friendly',
    name: 'Eco-Friendly Green',
    description: 'Sustainability-focused, environmentally conscious, ethical branding',
    targetUse: 'Sustainable products, eco-brands, ethical fashion, green tech',
    tone: 'Earnest, informative, hopeful, mission-driven',
    writingStyle: 'Clear, honest, educational without being preachy',
    keyCharacteristics: [
      'Environmental impact focus',
      'Transparency about materials',
      'Mission-driven messaging',
      'Long-term thinking',
      'Community emphasis',
      'Hope over guilt'
    ],
    exampleBrands: ['Patagonia', 'Allbirds', 'Grove Collaborative', 'Pela Case'],
    bestFor: [
      'Sustainable fashion',
      'Eco-friendly home goods',
      'Organic products',
      'Green technology',
      'Ethical brands'
    ],
    avoidFor: [
      'Fast fashion',
      'Disposable products',
      'High-waste items',
      'Non-sustainable goods'
    ],
    psychologicalTriggers: [
      'Purpose',
      'Impact',
      'Future generations',
      'Community',
      'Transparency',
      'Guilt reduction'
    ],
    structureGuidelines: {
      titleFormat: 'Clear + sustainable attribute. E.g., "100% Recycled Ocean Plastic Phone Case"',
      descriptionStructure: [
        'Environmental benefit upfront',
        'Sustainable materials and process',
        'Impact metrics (trees saved, plastic diverted, etc.)',
        'Quality and longevity',
        'Mission statement',
        'Purpose-driven CTA'
      ],
      ctaStyle: 'Impact-focused: "Make a difference", "Choose sustainability", "Join the movement"'
    },
    sampleOutput: {
      title: 'Carbon-Negative Sneakers from Sugarcane',
      description: 'Every pair removes 5kg of CO2 from the atmosphere. Made from Brazilian sugarcane and recycled plastic bottles. Zero petroleum. Certified carbon negative by Climate Neutral. Designed to last, backed by our lifetime repair program. Join 500,000+ people choosing sustainable footwear.'
    }
  },
  {
    id: 'minimalist-premium',
    name: 'Minimalist Premium',
    description: 'IKEA + MUJI style - functional, clean, accessible quality',
    targetUse: 'Design-forward products, home goods, lifestyle brands',
    tone: 'Clean, functional, quietly confident',
    writingStyle: 'Simple sentences. Clear benefits. No fluff.',
    keyCharacteristics: [
      'Function-first language',
      'Clean, spare descriptions',
      'Quality at fair prices',
      'Design democracy',
      'Practical benefits',
      'Honest simplicity'
    ],
    exampleBrands: ['IKEA', 'MUJI', 'Everlane', 'Uniqlo', 'Koala'],
    bestFor: [
      'Home furnishings',
      'Basic apparel',
      'Everyday essentials',
      'Organizational products',
      'Simple tech'
    ],
    avoidFor: [
      'Luxury goods',
      'Highly decorated items',
      'Ornate products',
      'Status symbols'
    ],
    psychologicalTriggers: [
      'Simplicity',
      'Value',
      'Functionality',
      'Order',
      'Accessibility',
      'Honest quality'
    ],
    structureGuidelines: {
      titleFormat: 'Descriptive + functional. E.g., "Stackable Storage Bins, Set of 3"',
      descriptionStructure: [
        'Primary function stated clearly',
        'Key dimensions/specifications',
        'Material quality',
        'Versatile usage scenarios',
        'Value proposition',
        'Simple, direct CTA'
      ],
      ctaStyle: 'Direct actions: "Add to cart", "Select size", "Choose color"'
    },
    sampleOutput: {
      title: 'Adjustable Desk Organizer - Bamboo',
      description: 'Keep your workspace clear. Sustainable bamboo construction. Adjustable compartments fit your needs. Holds pens, phones, chargers, and small items. Easy to clean. Dimensions: 12" x 6" x 4". Simple design that works anywhere.'
    }
  },
  {
    id: 'aggressive-sales',
    name: 'Aggressive Sales',
    description: 'Urgency + scarcity - direct response marketing style',
    targetUse: 'Limited offers, flash sales, conversion-focused campaigns',
    tone: 'Urgent, bold, benefit-heavy, action-oriented',
    writingStyle: 'Power words, urgency, clear benefits, immediate action',
    keyCharacteristics: [
      'Time-sensitive language',
      'Scarcity messaging',
      'Bold benefit claims',
      'Risk reversal',
      'Social proof',
      'Multiple CTAs'
    ],
    exampleBrands: ['Infomercial style', 'Flash sale sites', 'Direct response'],
    bestFor: [
      'Limited-time offers',
      'Clearance sales',
      'Product launches',
      'High-conversion needs',
      'Promotional campaigns'
    ],
    avoidFor: [
      'Luxury brands',
      'Professional services',
      'Long-term brand building',
      'Minimalist brands'
    ],
    psychologicalTriggers: [
      'Urgency',
      'Scarcity',
      'FOMO',
      'Social proof',
      'Loss aversion',
      'Immediate gratification'
    ],
    structureGuidelines: {
      titleFormat: 'Benefit + urgency. E.g., "Save 70% - Last Chance Premium Headphones"',
      descriptionStructure: [
        'Urgent opening with deadline',
        'Massive benefit or discount',
        'Social proof (reviews, sold count)',
        'Risk reversal guarantee',
        'Scarcity reminder',
        'Strong, immediate CTA'
      ],
      ctaStyle: 'Action commands: "Claim your discount NOW", "Don\'t miss out", "Grab yours before they\'re gone"'
    },
    sampleOutput: {
      title: '70% OFF Flash Sale - Premium Wireless Earbuds',
      description: '⚡ ENDS TONIGHT AT MIDNIGHT! Was $199, now just $59.99. Over 50,000 sold in 48 hours. 4.8★ from 12,000+ reviews. Studio-quality sound. 30-hour battery. Instant pairing. FREE shipping + 60-day money-back guarantee. Only 847 left in stock. Order now or regret it later!'
    }
  },
  {
    id: 'technical-professional',
    name: 'Technical Professional',
    description: 'Engineering-heavy, spec-focused, detail-oriented',
    targetUse: 'B2B products, technical tools, professional equipment',
    tone: 'Authoritative, precise, specification-rich',
    writingStyle: 'Detailed, accurate, jargon-appropriate for audience',
    keyCharacteristics: [
      'Specification-heavy',
      'Technical accuracy',
      'Performance metrics',
      'Compatibility details',
      'Professional applications',
      'Certification mentions'
    ],
    exampleBrands: ['Bosch', 'Leica', 'Sony Professional', 'ThinkPad'],
    bestFor: [
      'Professional tools',
      'B2B equipment',
      'Technical products',
      'Medical devices',
      'Industrial supplies'
    ],
    avoidFor: [
      'Consumer lifestyle products',
      'Fashion',
      'Casual home goods',
      'Impulse purchases'
    ],
    psychologicalTriggers: [
      'Precision',
      'Reliability',
      'Performance',
      'Professional credibility',
      'ROI',
      'Specifications'
    ],
    structureGuidelines: {
      titleFormat: 'Model number + key specs. E.g., "XPS-9000 Workstation - 32GB RAM, RTX 4080"',
      descriptionStructure: [
        'Professional application',
        'Detailed specifications',
        'Performance benchmarks',
        'Compatibility information',
        'Certifications and standards',
        'Professional-grade CTA'
      ],
      ctaStyle: 'Professional language: "Request quote", "Contact sales", "View specifications"'
    },
    sampleOutput: {
      title: 'Industrial Laser Engraver - 50W CO2, 500x300mm',
      description: 'Professional-grade CO2 laser system for production environments. 50W sealed laser tube, 500x300mm working area, ±0.01mm precision. Compatible with metals, wood, acrylic, glass. Integrated cooling system, auto-focus, RDWorks software included. CE/FDA certified. 2-year warranty, lifetime technical support.'
    }
  },
  {
    id: 'emotional-transformation',
    name: 'Emotional Transformation',
    description: 'Storytelling-focused, before/after, life-changing narrative',
    targetUse: 'Wellness, self-improvement, lifestyle transformation products',
    tone: 'Empathetic, inspiring, transformation-focused',
    writingStyle: 'Story-driven, emotional connection, relatable struggles',
    keyCharacteristics: [
      'Before/after framing',
      'Emotional pain points',
      'Transformation promise',
      'Empathy and understanding',
      'Aspirational outcomes',
      'Personal stories'
    ],
    exampleBrands: ['Peloton', 'Headspace', 'Weight Watchers', 'Noom'],
    bestFor: [
      'Wellness products',
      'Fitness equipment',
      'Self-improvement tools',
      'Life coaching',
      'Transformation programs'
    ],
    avoidFor: [
      'Technical products',
      'B2B services',
      'Commodity items',
      'Pure utility products'
    ],
    psychologicalTriggers: [
      'Aspiration',
      'Identity',
      'Transformation',
      'Empathy',
      'Hope',
      'Belonging'
    ],
    structureGuidelines: {
      titleFormat: 'Transformation-focused. E.g., "The Yoga Mat That Changed Everything"',
      descriptionStructure: [
        'Relatable pain point or struggle',
        'Emotional connection',
        'Introduction of solution',
        'Transformation story',
        'Aspirational outcome',
        'Inspirational CTA'
      ],
      ctaStyle: 'Transformation language: "Start your journey", "Transform today", "Become the best version"'
    },
    sampleOutput: {
      title: 'The Morning Journal That Transformed 100,000 Lives',
      description: 'Remember when mornings felt chaotic? Racing against time, feeling scattered before the day even began? This simple 5-minute practice changed everything. Science-backed prompts guide you to clarity, gratitude, and intention. Join over 100,000 people who transformed their mornings - and their lives. Start tomorrow differently.'
    }
  }
];

/**
 * Get framework by ID
 */
export function getFrameworkById(id: string): MarketingFramework | undefined {
  return MARKETING_FRAMEWORKS.find(f => f.id === id);
}

/**
 * Get frameworks suitable for a category
 */
export function getFrameworksForCategory(category: string): MarketingFramework[] {
  const categoryLower = category.toLowerCase();
  
  return MARKETING_FRAMEWORKS.filter(framework => {
    return framework.bestFor.some(use => 
      use.toLowerCase().includes(categoryLower) ||
      categoryLower.includes(use.toLowerCase())
    );
  });
}

/**
 * Get framework recommendations based on product attributes
 */
export function recommendFramework(attributes: {
  category?: string;
  pricePoint?: 'budget' | 'mid-range' | 'premium' | 'luxury';
  targetAudience?: string;
}): MarketingFramework {
  const { category, pricePoint, targetAudience } = attributes;
  
  // Luxury products -> Luxury framework
  if (pricePoint === 'luxury' || pricePoint === 'premium') {
    return getFrameworkById('luxury-premium')!;
  }
  
  // Gen Z audience -> Gen Z framework
  if (targetAudience?.toLowerCase().includes('gen z') || 
      targetAudience?.toLowerCase().includes('teen') ||
      targetAudience?.toLowerCase().includes('youth')) {
    return getFrameworkById('gen-z-viral')!;
  }
  
  // Eco/sustainable -> Eco framework
  if (category?.toLowerCase().includes('eco') ||
      category?.toLowerCase().includes('sustainable') ||
      category?.toLowerCase().includes('organic')) {
    return getFrameworkById('eco-friendly')!;
  }
  
  // Technical/B2B -> Technical framework
  if (category?.toLowerCase().includes('professional') ||
      category?.toLowerCase().includes('b2b') ||
      category?.toLowerCase().includes('industrial')) {
    return getFrameworkById('technical-professional')!;
  }
  
  // Wellness/fitness -> Transformation framework
  if (category?.toLowerCase().includes('wellness') ||
      category?.toLowerCase().includes('fitness') ||
      category?.toLowerCase().includes('health')) {
    return getFrameworkById('emotional-transformation')!;
  }
  
  // Home/basics -> Minimalist framework
  if (category?.toLowerCase().includes('home') ||
      category?.toLowerCase().includes('furniture') ||
      category?.toLowerCase().includes('storage')) {
    return getFrameworkById('minimalist-premium')!;
  }
  
  // Default to minimalist for most products
  return getFrameworkById('minimalist-premium')!;
}
