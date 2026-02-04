/**
 * ZYRA MASTER ACTION REGISTRY
 * 
 * Step 4 of the Master Loop: DEFINE ACTIONS WITH SUB-ACTIONS (STATIC)
 * 
 * All actions are defined here with their sub-actions.
 * This is the SINGLE SOURCE OF TRUTH for what ZYRA can do.
 * 
 * Categories:
 *   🧱 FOUNDATION ACTIONS - Trust, clarity, basic optimization
 *   🚀 GROWTH ACTIONS - Conversion, recovery, revenue
 *   🛡️ GUARD ACTIONS - Learning, protection, rollback
 */

import type { ActionCategory, PermissionLevel } from './plan-permission-mapper';
import type { StoreSituation } from './store-situation-detector';

export type ActionId = 
  // FOUNDATION
  | 'trust_signal_enhancement'
  | 'friction_copy_removal'
  | 'product_description_clarity'
  | 'value_proposition_alignment'
  | 'above_fold_optimization'
  | 'product_title_optimization'
  | 'meta_optimization'
  | 'search_intent_alignment'
  | 'image_alt_text_optimization'
  | 'stale_seo_refresh'
  // GROWTH
  | 'checkout_dropoff_mitigation'
  | 'abandoned_cart_recovery'
  | 'post_purchase_upsell'
  // GUARD
  | 'conversion_pattern_learning'
  | 'performance_baseline_update'
  | 'underperforming_rollback'
  | 'risky_optimization_freeze';

export type RiskLevel = 'low' | 'medium' | 'high';

export type ExecutionPriority = 
  | 'trust_legitimacy'      // 1. Trust & Legitimacy
  | 'clarity_intent'        // 2. Clarity & Intent
  | 'conversion_optimization' // 3. Conversion Optimization
  | 'revenue_expansion'     // 4. Revenue Expansion
  | 'seo_maintenance'       // 5. SEO Maintenance
  | 'learning_protection';  // 6. Learning & Protection

export interface SubAction {
  id: string;
  name: string;
  description: string;
  riskLevel: RiskLevel;
  estimatedImpact: 'low' | 'medium' | 'high';
  creditsRequired: number;
}

export interface MasterAction {
  id: ActionId;
  name: string;
  description: string;
  category: ActionCategory;
  priority: ExecutionPriority;
  priorityOrder: number; // 1-6, determines execution sequence
  riskLevel: RiskLevel;
  subActions: SubAction[];
  requiredDataPoints: string[];
  safeForSituation: StoreSituation[];
  estimatedExecutionTime: number; // in milliseconds
  creditsRequired: number;
}

// ============================================================================
// 🧱 FOUNDATION ACTIONS
// ============================================================================

const FOUNDATION_ACTIONS: MasterAction[] = [
  {
    id: 'trust_signal_enhancement',
    name: 'Trust Signal Enhancement',
    description: 'Build buyer confidence through trust badges, policy clarity, and legitimacy signals',
    category: 'FOUNDATION',
    priority: 'trust_legitimacy',
    priorityOrder: 1,
    riskLevel: 'low',
    subActions: [
      {
        id: 'add_trust_badges',
        name: 'Add Trust Badges',
        description: 'Add security seals, payment badges, and social proof indicators',
        riskLevel: 'low',
        estimatedImpact: 'medium',
        creditsRequired: 12,
      },
      {
        id: 'improve_return_policy',
        name: 'Improve Return & Refund Policy Clarity',
        description: 'Make return and refund policies clearer and more prominent',
        riskLevel: 'low',
        estimatedImpact: 'medium',
        creditsRequired: 11,
      },
      {
        id: 'strengthen_legitimacy',
        name: 'Strengthen Business Legitimacy Signals',
        description: 'Add business credentials, certifications, and authenticity markers',
        riskLevel: 'low',
        estimatedImpact: 'high',
        creditsRequired: 12,
      },
    ],
    requiredDataPoints: ['product_pages', 'checkout_flow'],
    safeForSituation: ['NEW_FRESH', 'MEDIUM_GROWING', 'ENTERPRISE_SCALE'],
    estimatedExecutionTime: 30000,
    creditsRequired: 35, // Fast Mode: 35 credits per pricing doc
  },
  {
    id: 'friction_copy_removal',
    name: 'Friction Copy Removal',
    description: 'Remove confusing, risky, or misleading language that causes buyer hesitation',
    category: 'FOUNDATION',
    priority: 'trust_legitimacy',
    priorityOrder: 1,
    riskLevel: 'low',
    subActions: [
      {
        id: 'remove_confusing_language',
        name: 'Remove Confusing Language',
        description: 'Identify and rewrite unclear or jargon-heavy copy',
        riskLevel: 'low',
        estimatedImpact: 'medium',
        creditsRequired: 1,
      },
      {
        id: 'eliminate_risky_claims',
        name: 'Eliminate Risky or Misleading Claims',
        description: 'Remove exaggerated claims that could trigger skepticism',
        riskLevel: 'low',
        estimatedImpact: 'high',
        creditsRequired: 1,
      },
      {
        id: 'simplify_legal_text',
        name: 'Simplify Legal & Guarantee Text',
        description: 'Make guarantees and legal terms easy to understand',
        riskLevel: 'low',
        estimatedImpact: 'medium',
        creditsRequired: 1,
      },
    ],
    requiredDataPoints: ['product_descriptions', 'legal_pages'],
    safeForSituation: ['NEW_FRESH', 'MEDIUM_GROWING', 'ENTERPRISE_SCALE'],
    estimatedExecutionTime: 25000,
    creditsRequired: 30, // Fast Mode: 30 credits per pricing doc
  },
  {
    id: 'product_description_clarity',
    name: 'Product Description Clarity Upgrade',
    description: 'Enhance product descriptions for maximum clarity and conversion',
    category: 'FOUNDATION',
    priority: 'clarity_intent',
    priorityOrder: 2,
    riskLevel: 'low',
    subActions: [
      {
        id: 'rewrite_description',
        name: 'Rewrite Product Description for Clarity',
        description: 'Restructure descriptions with clear value propositions',
        riskLevel: 'low',
        estimatedImpact: 'high',
        creditsRequired: 20,
      },
      {
        id: 'clarify_usage',
        name: 'Clarify Product Usage Instructions',
        description: 'Add or improve how-to-use sections',
        riskLevel: 'low',
        estimatedImpact: 'medium',
        creditsRequired: 12,
      },
      {
        id: 'highlight_benefits',
        name: 'Highlight Core Product Benefits',
        description: 'Make key benefits scannable and prominent',
        riskLevel: 'low',
        estimatedImpact: 'high',
        creditsRequired: 13,
      },
    ],
    requiredDataPoints: ['product_descriptions', 'conversion_data'],
    safeForSituation: ['NEW_FRESH', 'MEDIUM_GROWING', 'ENTERPRISE_SCALE'],
    estimatedExecutionTime: 40000,
    creditsRequired: 45, // Fast Mode: 45 credits per pricing doc
  },
  {
    id: 'value_proposition_alignment',
    name: 'Value Proposition Alignment Fix',
    description: 'Align messaging with actual product value and customer expectations',
    category: 'FOUNDATION',
    priority: 'clarity_intent',
    priorityOrder: 2,
    riskLevel: 'medium',
    subActions: [
      {
        id: 'align_headline',
        name: 'Align Headline with Core Promise',
        description: 'Ensure headlines match what the product delivers',
        riskLevel: 'low',
        estimatedImpact: 'high',
        creditsRequired: 1,
      },
      {
        id: 'remove_exaggeration',
        name: 'Remove Exaggerated Marketing Claims',
        description: 'Tone down hype that damages trust',
        riskLevel: 'medium',
        estimatedImpact: 'medium',
        creditsRequired: 1,
      },
      {
        id: 'clarify_use_case',
        name: 'Clarify Ideal Customer Use Case',
        description: 'Define who the product is for and why',
        riskLevel: 'low',
        estimatedImpact: 'high',
        creditsRequired: 1,
      },
    ],
    requiredDataPoints: ['product_headlines', 'customer_segments'],
    safeForSituation: ['MEDIUM_GROWING', 'ENTERPRISE_SCALE'],
    estimatedExecutionTime: 35000,
    creditsRequired: 35, // Fast Mode: 35 credits per pricing doc
  },
  {
    id: 'above_fold_optimization',
    name: 'Above-the-Fold Content Optimization',
    description: 'Optimize the first content users see for immediate engagement',
    category: 'FOUNDATION',
    priority: 'conversion_optimization',
    priorityOrder: 3,
    riskLevel: 'medium',
    subActions: [
      {
        id: 'optimize_hero_headline',
        name: 'Optimize Hero Headline Messaging',
        description: 'Craft compelling above-fold headlines',
        riskLevel: 'medium',
        estimatedImpact: 'high',
        creditsRequired: 20,
      },
      {
        id: 'improve_cta',
        name: 'Improve Primary CTA Wording',
        description: 'Make call-to-action buttons more compelling',
        riskLevel: 'low',
        estimatedImpact: 'high',
        creditsRequired: 15,
      },
      {
        id: 'reduce_clutter',
        name: 'Reduce Visual & Content Clutter',
        description: 'Remove distractions from the hero area',
        riskLevel: 'low',
        estimatedImpact: 'medium',
        creditsRequired: 15,
      },
    ],
    requiredDataPoints: ['page_layouts', 'bounce_data'],
    safeForSituation: ['MEDIUM_GROWING', 'ENTERPRISE_SCALE'],
    estimatedExecutionTime: 30000,
    creditsRequired: 50, // Fast Mode: 50 credits per pricing doc
  },
  {
    id: 'product_title_optimization',
    name: 'Product Title Optimization',
    description: 'Optimize product titles for readability and search',
    category: 'FOUNDATION',
    priority: 'seo_maintenance',
    priorityOrder: 5,
    riskLevel: 'low',
    subActions: [
      {
        id: 'normalize_readability',
        name: 'Normalize Product Title Readability',
        description: 'Make titles human-friendly and scannable',
        riskLevel: 'low',
        estimatedImpact: 'medium',
        creditsRequired: 7,
      },
      {
        id: 'optimize_search_intent',
        name: 'Optimize Title for Search Intent',
        description: 'Include terms customers actually search for',
        riskLevel: 'low',
        estimatedImpact: 'high',
        creditsRequired: 7,
      },
      {
        id: 'remove_keyword_stuffing',
        name: 'Remove Keyword Stuffing from Titles',
        description: 'Clean up over-optimized titles',
        riskLevel: 'low',
        estimatedImpact: 'medium',
        creditsRequired: 6,
      },
    ],
    requiredDataPoints: ['product_titles', 'search_data'],
    safeForSituation: ['NEW_FRESH', 'MEDIUM_GROWING', 'ENTERPRISE_SCALE'],
    estimatedExecutionTime: 20000,
    creditsRequired: 20, // Fast Mode: 20 credits per pricing doc
  },
  {
    id: 'meta_optimization',
    name: 'Meta Title, Description & Tag Optimization',
    description: 'Optimize meta tags for better search visibility and clicks',
    category: 'FOUNDATION',
    priority: 'seo_maintenance',
    priorityOrder: 5,
    riskLevel: 'low',
    subActions: [
      {
        id: 'optimize_meta_title',
        name: 'Optimize Meta Title for Click-Through',
        description: 'Write compelling meta titles that get clicks',
        riskLevel: 'low',
        estimatedImpact: 'high',
        creditsRequired: 1,
      },
      {
        id: 'improve_meta_description',
        name: 'Improve Meta Description Relevance',
        description: 'Write descriptions that match search intent',
        riskLevel: 'low',
        estimatedImpact: 'medium',
        creditsRequired: 1,
      },
      {
        id: 'align_tags',
        name: 'Align Tags with Page Content',
        description: 'Ensure consistency between tags and content',
        riskLevel: 'low',
        estimatedImpact: 'medium',
        creditsRequired: 1,
      },
    ],
    requiredDataPoints: ['seo_meta', 'search_rankings'],
    safeForSituation: ['NEW_FRESH', 'MEDIUM_GROWING', 'ENTERPRISE_SCALE'],
    estimatedExecutionTime: 25000,
    creditsRequired: 25, // Fast Mode: 25 credits per pricing doc
  },
  {
    id: 'search_intent_alignment',
    name: 'Search Intent Alignment Fix',
    description: 'Match page content with user search intent',
    category: 'FOUNDATION',
    priority: 'clarity_intent',
    priorityOrder: 2,
    riskLevel: 'medium',
    subActions: [
      {
        id: 'match_intent',
        name: 'Match Page Content to Traffic Intent',
        description: 'Align what page says with what user searched for',
        riskLevel: 'medium',
        estimatedImpact: 'high',
        creditsRequired: 25,
      },
      {
        id: 'resolve_mismatch',
        name: 'Resolve Ad-to-Landing Page Mismatch',
        description: 'Fix disconnects between ads and landing pages',
        riskLevel: 'medium',
        estimatedImpact: 'high',
        creditsRequired: 15,
      },
      {
        id: 'reduce_bounce',
        name: 'Reduce Intent-Driven Bounce Rate',
        description: 'Keep users engaged by meeting their expectations',
        riskLevel: 'low',
        estimatedImpact: 'medium',
        creditsRequired: 15,
      },
    ],
    requiredDataPoints: ['traffic_sources', 'bounce_data', 'search_queries'],
    safeForSituation: ['MEDIUM_GROWING', 'ENTERPRISE_SCALE'],
    estimatedExecutionTime: 35000,
    creditsRequired: 55, // Fast Mode: 55 credits per pricing doc
  },
  {
    id: 'image_alt_text_optimization',
    name: 'Image Alt-Text Optimization',
    description: 'Optimize image alt text for SEO and accessibility',
    category: 'FOUNDATION',
    priority: 'seo_maintenance',
    priorityOrder: 5,
    riskLevel: 'low',
    subActions: [
      {
        id: 'add_descriptive_alt',
        name: 'Add Descriptive Image Alt Text',
        description: 'Write helpful alt text for all product images',
        riskLevel: 'low',
        estimatedImpact: 'medium',
        creditsRequired: 5,
      },
      {
        id: 'improve_seo_signals',
        name: 'Improve Image SEO Signals',
        description: 'Optimize image attributes for search engines',
        riskLevel: 'low',
        estimatedImpact: 'medium',
        creditsRequired: 5,
      },
      {
        id: 'enhance_accessibility',
        name: 'Enhance Accessibility Compliance',
        description: 'Ensure images meet accessibility standards',
        riskLevel: 'low',
        estimatedImpact: 'low',
        creditsRequired: 5,
      },
    ],
    requiredDataPoints: ['product_images'],
    safeForSituation: ['NEW_FRESH', 'MEDIUM_GROWING', 'ENTERPRISE_SCALE'],
    estimatedExecutionTime: 20000,
    creditsRequired: 15, // Fast Mode: 15 credits per pricing doc
  },
  {
    id: 'stale_seo_refresh',
    name: 'Stale SEO Content Refresh',
    description: 'Update outdated content to maintain search performance',
    category: 'FOUNDATION',
    priority: 'seo_maintenance',
    priorityOrder: 5,
    riskLevel: 'low',
    subActions: [
      {
        id: 'update_outdated',
        name: 'Update Outdated Page Copy',
        description: 'Refresh old content with current information',
        riskLevel: 'low',
        estimatedImpact: 'medium',
        creditsRequired: 20,
      },
      {
        id: 'remove_thin_content',
        name: 'Remove Thin or Duplicate Content',
        description: 'Eliminate low-value pages hurting SEO',
        riskLevel: 'medium',
        estimatedImpact: 'high',
        creditsRequired: 20,
      },
      {
        id: 'improve_freshness',
        name: 'Improve Content Freshness Signals',
        description: 'Update timestamps and add recent information',
        riskLevel: 'low',
        estimatedImpact: 'medium',
        creditsRequired: 20,
      },
    ],
    requiredDataPoints: ['content_age', 'seo_scores'],
    safeForSituation: ['MEDIUM_GROWING', 'ENTERPRISE_SCALE'],
    estimatedExecutionTime: 30000,
    creditsRequired: 60, // Fast Mode: 60 credits per pricing doc
  },
];

// ============================================================================
// 🚀 GROWTH ACTIONS
// ============================================================================

const GROWTH_ACTIONS: MasterAction[] = [
  {
    id: 'checkout_dropoff_mitigation',
    name: 'Checkout Drop-Off Mitigation',
    description: 'Reduce cart abandonment at the checkout stage',
    category: 'GROWTH',
    priority: 'conversion_optimization',
    priorityOrder: 3,
    riskLevel: 'medium',
    subActions: [
      {
        id: 'reduce_hesitation',
        name: 'Reduce Checkout Hesitation Copy',
        description: 'Remove or rewrite copy that causes second-guessing',
        riskLevel: 'low',
        estimatedImpact: 'high',
        creditsRequired: 70,
      },
      {
        id: 'improve_reassurance',
        name: 'Improve Checkout Reassurance Messaging',
        description: 'Add confidence-building elements at checkout',
        riskLevel: 'low',
        estimatedImpact: 'high',
        creditsRequired: 60,
      },
      {
        id: 'simplify_flow',
        name: 'Simplify Checkout Text Flow',
        description: 'Make checkout steps clearer and faster',
        riskLevel: 'medium',
        estimatedImpact: 'medium',
        creditsRequired: 50,
      },
    ],
    requiredDataPoints: ['checkout_data', 'cart_abandonment'],
    safeForSituation: ['MEDIUM_GROWING', 'ENTERPRISE_SCALE'],
    estimatedExecutionTime: 40000,
    creditsRequired: 180, // Fast Mode: 180 credits per pricing doc
  },
  {
    id: 'abandoned_cart_recovery',
    name: 'Abandoned Cart Recovery Activation',
    description: 'Recover lost sales from abandoned carts',
    category: 'GROWTH',
    priority: 'revenue_expansion',
    priorityOrder: 4,
    riskLevel: 'medium',
    subActions: [
      {
        id: 'trigger_reminder',
        name: 'Trigger Abandoned Cart Reminder',
        description: 'Send timely reminders to cart abandoners',
        riskLevel: 'medium',
        estimatedImpact: 'high',
        creditsRequired: 100,
      },
      {
        id: 'optimize_timing',
        name: 'Optimize Cart Recovery Timing',
        description: 'Find the best times to send recovery messages',
        riskLevel: 'low',
        estimatedImpact: 'medium',
        creditsRequired: 60,
      },
      {
        id: 'control_frequency',
        name: 'Control Recovery Message Frequency',
        description: 'Prevent over-messaging that annoys customers',
        riskLevel: 'low',
        estimatedImpact: 'medium',
        creditsRequired: 60,
      },
    ],
    requiredDataPoints: ['abandoned_carts', 'customer_emails', 'email_settings'],
    safeForSituation: ['MEDIUM_GROWING', 'ENTERPRISE_SCALE'],
    estimatedExecutionTime: 30000,
    creditsRequired: 220, // Fast Mode: 220 credits per pricing doc
  },
  {
    id: 'post_purchase_upsell',
    name: 'Post-Purchase Upsell Enablement',
    description: 'Increase average order value through smart upsells',
    category: 'GROWTH',
    priority: 'revenue_expansion',
    priorityOrder: 4,
    riskLevel: 'medium',
    subActions: [
      {
        id: 'suggest_addons',
        name: 'Suggest Relevant Add-On Products',
        description: 'Recommend products that complement the purchase',
        riskLevel: 'low',
        estimatedImpact: 'high',
        creditsRequired: 70,
      },
      {
        id: 'increase_aov',
        name: 'Increase Average Order Value Safely',
        description: 'Boost AOV without feeling pushy',
        riskLevel: 'medium',
        estimatedImpact: 'high',
        creditsRequired: 50,
      },
      {
        id: 'prevent_aggressive',
        name: 'Prevent Aggressive Upsell Behavior',
        description: 'Keep upsells helpful, not annoying',
        riskLevel: 'low',
        estimatedImpact: 'medium',
        creditsRequired: 40,
      },
    ],
    requiredDataPoints: ['purchase_history', 'product_relationships', 'customer_preferences'],
    safeForSituation: ['MEDIUM_GROWING', 'ENTERPRISE_SCALE'],
    estimatedExecutionTime: 35000,
    creditsRequired: 160, // Fast Mode: 160 credits per pricing doc
  },
];

// ============================================================================
// 🛡️ GUARD & INTELLIGENCE ACTIONS (Pro Only - Always Competitive Intelligence)
// ============================================================================

const GUARD_ACTIONS: MasterAction[] = [
  {
    id: 'conversion_pattern_learning',
    name: 'Store Conversion Pattern Learning',
    description: 'Learn what drives conversions for this specific store',
    category: 'GUARD',
    priority: 'learning_protection',
    priorityOrder: 6,
    riskLevel: 'low',
    subActions: [
      {
        id: 'identify_patterns',
        name: 'Identify High-Converting Layout Patterns',
        description: 'Find page layouts that convert well',
        riskLevel: 'low',
        estimatedImpact: 'medium',
        creditsRequired: 100,
      },
      {
        id: 'detect_trends',
        name: 'Detect Product-Level Conversion Trends',
        description: 'Understand which products convert best and why',
        riskLevel: 'low',
        estimatedImpact: 'high',
        creditsRequired: 100,
      },
      {
        id: 'segment_behavior',
        name: 'Segment User Behavior Signals',
        description: 'Group users by behavior to predict actions',
        riskLevel: 'low',
        estimatedImpact: 'medium',
        creditsRequired: 100,
      },
    ],
    requiredDataPoints: ['conversion_data', 'behavior_events', 'page_analytics'],
    safeForSituation: ['MEDIUM_GROWING', 'ENTERPRISE_SCALE'],
    estimatedExecutionTime: 60000,
    creditsRequired: 300, // Always Competitive Intelligence: 300 credits per pricing doc
  },
  {
    id: 'performance_baseline_update',
    name: 'Product Performance Baseline Update',
    description: 'Establish and update performance benchmarks',
    category: 'GUARD',
    priority: 'learning_protection',
    priorityOrder: 6,
    riskLevel: 'low',
    subActions: [
      {
        id: 'capture_baseline',
        name: 'Capture Pre-Change Performance Baseline',
        description: 'Record metrics before making changes',
        riskLevel: 'low',
        estimatedImpact: 'high',
        creditsRequired: 70,
      },
      {
        id: 'update_benchmarks',
        name: 'Update KPI Reference Benchmarks',
        description: 'Keep performance baselines current',
        riskLevel: 'low',
        estimatedImpact: 'medium',
        creditsRequired: 65,
      },
      {
        id: 'detect_anomalies',
        name: 'Detect Performance Anomalies',
        description: 'Identify unusual performance changes',
        riskLevel: 'low',
        estimatedImpact: 'high',
        creditsRequired: 65,
      },
    ],
    requiredDataPoints: ['performance_metrics', 'historical_data'],
    safeForSituation: ['NEW_FRESH', 'MEDIUM_GROWING', 'ENTERPRISE_SCALE'],
    estimatedExecutionTime: 20000,
    creditsRequired: 200, // Always Competitive Intelligence: 200 credits per pricing doc
  },
  {
    id: 'underperforming_rollback',
    name: 'Underperforming Change Rollback',
    description: 'Revert changes that hurt performance',
    category: 'GUARD',
    priority: 'learning_protection',
    priorityOrder: 6,
    riskLevel: 'low',
    subActions: [
      {
        id: 'revert_changes',
        name: 'Revert Recently Applied Changes',
        description: 'Undo changes that caused negative impact',
        riskLevel: 'low',
        estimatedImpact: 'high',
        creditsRequired: 50,
      },
      {
        id: 'restore_stable',
        name: 'Restore Last Stable Store State',
        description: 'Return to known-good configuration',
        riskLevel: 'low',
        estimatedImpact: 'high',
        creditsRequired: 50,
      },
      {
        id: 'log_rollback',
        name: 'Log Rollback Reason & Context',
        description: 'Record why rollback was needed for future learning',
        riskLevel: 'low',
        estimatedImpact: 'medium',
        creditsRequired: 50,
      },
    ],
    requiredDataPoints: ['product_snapshots', 'autonomous_actions'],
    safeForSituation: ['NEW_FRESH', 'MEDIUM_GROWING', 'ENTERPRISE_SCALE'],
    estimatedExecutionTime: 15000,
    creditsRequired: 150, // Always Competitive Intelligence: 150 credits per pricing doc
  },
  {
    id: 'risky_optimization_freeze',
    name: 'Risky Optimization Freeze',
    description: 'Pause optimizations when risk is detected',
    category: 'GUARD',
    priority: 'learning_protection',
    priorityOrder: 6,
    riskLevel: 'low',
    subActions: [
      {
        id: 'pause_actions',
        name: 'Pause New Optimization Actions',
        description: 'Stop new changes temporarily',
        riskLevel: 'low',
        estimatedImpact: 'high',
        creditsRequired: 35,
      },
      {
        id: 'prevent_high_risk',
        name: 'Prevent Further High-Risk Changes',
        description: 'Block risky actions until stable',
        riskLevel: 'low',
        estimatedImpact: 'high',
        creditsRequired: 35,
      },
      {
        id: 'wait_stabilization',
        name: 'Wait for Performance Stabilization',
        description: 'Resume only after metrics stabilize',
        riskLevel: 'low',
        estimatedImpact: 'medium',
        creditsRequired: 30,
      },
    ],
    requiredDataPoints: ['performance_metrics', 'action_history'],
    safeForSituation: ['NEW_FRESH', 'MEDIUM_GROWING', 'ENTERPRISE_SCALE'],
    estimatedExecutionTime: 5000,
    creditsRequired: 100, // Always Competitive Intelligence: 100 credits per pricing doc
  },
];

// ============================================================================
// REGISTRY EXPORT
// ============================================================================

export const ALL_ACTIONS: MasterAction[] = [
  ...FOUNDATION_ACTIONS,
  ...GROWTH_ACTIONS,
  ...GUARD_ACTIONS,
];

export const ACTION_MAP: Map<ActionId, MasterAction> = new Map(
  ALL_ACTIONS.map(action => [action.id, action])
);

export const ACTIONS_BY_CATEGORY: Record<ActionCategory, MasterAction[]> = {
  FOUNDATION: FOUNDATION_ACTIONS,
  GROWTH: GROWTH_ACTIONS,
  GUARD: GUARD_ACTIONS,
};

export const ACTIONS_BY_PRIORITY: Record<ExecutionPriority, MasterAction[]> = {
  trust_legitimacy: ALL_ACTIONS.filter(a => a.priority === 'trust_legitimacy'),
  clarity_intent: ALL_ACTIONS.filter(a => a.priority === 'clarity_intent'),
  conversion_optimization: ALL_ACTIONS.filter(a => a.priority === 'conversion_optimization'),
  revenue_expansion: ALL_ACTIONS.filter(a => a.priority === 'revenue_expansion'),
  seo_maintenance: ALL_ACTIONS.filter(a => a.priority === 'seo_maintenance'),
  learning_protection: ALL_ACTIONS.filter(a => a.priority === 'learning_protection'),
};

export class MasterActionRegistry {
  getAction(actionId: ActionId): MasterAction | undefined {
    return ACTION_MAP.get(actionId);
  }

  getActionsByCategory(category: ActionCategory): MasterAction[] {
    return ACTIONS_BY_CATEGORY[category] || [];
  }

  getActionsByPriority(priority: ExecutionPriority): MasterAction[] {
    return ACTIONS_BY_PRIORITY[priority] || [];
  }

  getAllActions(): MasterAction[] {
    return ALL_ACTIONS;
  }

  isSafeForSituation(actionId: ActionId, situation: StoreSituation): boolean {
    const action = this.getAction(actionId);
    return action?.safeForSituation.includes(situation) ?? false;
  }

  getTotalCredits(actionIds: ActionId[]): number {
    return actionIds.reduce((sum, id) => {
      const action = this.getAction(id);
      return sum + (action?.creditsRequired ?? 0);
    }, 0);
  }
}

export const masterActionRegistry = new MasterActionRegistry();
