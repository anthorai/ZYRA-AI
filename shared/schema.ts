import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean, numeric, pgEnum, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for data integrity
export const supportTicketCategoryEnum = pgEnum('support_ticket_category', ['bug', 'feature', 'billing', 'general']);
export const supportTicketPriorityEnum = pgEnum('support_ticket_priority', ['low', 'medium', 'high', 'urgent']);
export const supportTicketStatusEnum = pgEnum('support_ticket_status', ['open', 'in_progress', 'resolved', 'closed']);
export const integrationTypeEnum = pgEnum('integration_type', ['email', 'sms', 'analytics', 'automation']);
export const paymentGatewayEnum = pgEnum('payment_gateway', ['razorpay', 'paypal']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded', 'cancelled']);
export const paymentMethodTypeEnum = pgEnum('payment_method_type', ['card', 'upi', 'netbanking', 'wallet', 'bank_transfer']);
export const cartRecoveryStatusEnum = pgEnum('cart_recovery_status', ['abandoned', 'contacted', 'recovered', 'expired']);
export const recoveryChannelEnum = pgEnum('recovery_channel', ['email', 'sms', 'both']);
export const marketingTriggerTypeEnum = pgEnum('marketing_trigger_type', ['cart_abandoned', 'inactive_customer', 'purchase_anniversary', 'product_view', 'low_stock', 'price_drop', 'new_arrival', 'custom']);
export const customerSegmentEnum = pgEnum('customer_segment', ['hot', 'warm', 'cold', 'inactive']);
export const cartRecoveryStageEnum = pgEnum('cart_recovery_stage', ['initial_reminder', 'first_discount', 'second_discount', 'final_offer']);
export const bulkOptimizationJobStatusEnum = pgEnum('bulk_optimization_job_status', ['pending', 'processing', 'completed', 'failed', 'cancelled']);
export const bulkOptimizationItemStatusEnum = pgEnum('bulk_optimization_item_status', ['pending', 'processing', 'optimized', 'failed', 'retrying', 'skipped']);
export const imageOptimizationStatusEnum = pgEnum('image_optimization_status', ['pending', 'processing', 'completed', 'failed', 'missing_image']);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password"), // Optional for Supabase-only users
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("user"),
  plan: text("plan").notNull().default("trial"),
  trialEndDate: timestamp("trial_end_date").default(sql`NOW() + INTERVAL '7 days'`),
  lastTrialWelcomeAt: timestamp("last_trial_welcome_at"), // Track when daily trial welcome was last shown
  imageUrl: text("image_url"),
  preferredLanguage: text("preferred_language").default("en"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  shopifyId: text("shopify_id"),
  sku: text("sku"), // Product SKU for matching with competitors
  name: text("name").notNull(),
  description: text("description"),
  originalDescription: text("original_description"),
  originalCopy: jsonb("original_copy"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  stock: integer("stock").notNull().default(0),
  image: text("image"),
  features: text("features"),
  tags: text("tags"),
  optimizedCopy: jsonb("optimized_copy"),
  isOptimized: boolean("is_optimized").default(false),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('products_user_id_idx').on(table.userId),
  index('products_is_optimized_idx').on(table.isOptimized),
  index('products_created_at_idx').on(table.createdAt),
  uniqueIndex('products_user_shopify_unique').on(table.userId, table.shopifyId),
]);

export const seoMeta = pgTable("seo_meta", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id).notNull(),
  seoTitle: text("seo_title"),
  metaDescription: text("meta_description"),
  keywords: text("keywords"),
  optimizedTitle: text("optimized_title"),
  optimizedMeta: text("optimized_meta"),
  seoScore: integer("seo_score"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('seo_meta_product_id_idx').on(table.productId),
]);

// Product SEO History - Version control for SEO optimizations
export const productSeoHistory = pgTable("product_seo_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  productId: varchar("product_id").references(() => products.id), // Optional - can generate without existing product
  productName: text("product_name").notNull(),
  seoTitle: text("seo_title").notNull(),
  seoDescription: text("seo_description").notNull(),
  metaTitle: text("meta_title").notNull(),
  metaDescription: text("meta_description").notNull(),
  keywords: jsonb("keywords").notNull(), // Array of keywords
  seoScore: integer("seo_score"), // Predicted SEO score
  searchIntent: text("search_intent"), // Primary search intent
  suggestedKeywords: jsonb("suggested_keywords"), // AI-suggested keywords
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('product_seo_history_user_id_idx').on(table.userId),
  index('product_seo_history_product_id_idx').on(table.productId),
  index('product_seo_history_created_at_idx').on(table.createdAt),
]);

export type ProductSeoHistory = typeof productSeoHistory.$inferSelect;
export type InsertProductSeoHistory = typeof productSeoHistory.$inferInsert;

// Helper transform to coerce nullable arrays into safe string arrays
const stringArrayFromNullable = z
  .array(z.string())
  .or(z.null())
  .or(z.undefined())
  .transform((val) => (Array.isArray(val) ? val : []));

export const insertProductSeoHistorySchema = createInsertSchema(productSeoHistory)
  .omit({ id: true, createdAt: true })
  .extend({
    productId: z.string().nullish(),
    keywords: stringArrayFromNullable,
    seoScore: z.coerce.number().nullish(),  // Coerce string to number (handles "92" -> 92)
    searchIntent: z.string().nullish(),
    suggestedKeywords: stringArrayFromNullable,
  });

// Autonomous system tables
export const autonomousActions = pgTable("autonomous_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  actionType: text("action_type").notNull(), // 'optimize_seo' | 'fix_product' | 'send_cart_recovery' | 'run_ab_test'
  entityType: text("entity_type"), // 'product' | 'campaign' | 'customer'
  entityId: varchar("entity_id"), // ID of the affected entity
  status: text("status").notNull().default("pending"), // 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back' | 'dry_run'
  decisionReason: text("decision_reason"), // Why Zyra decided to take this action
  ruleId: varchar("rule_id"), // Which rule triggered this
  payload: jsonb("payload"), // Action-specific data
  result: jsonb("result"), // Results after execution
  estimatedImpact: jsonb("estimated_impact"), // Before: predicted changes
  actualImpact: jsonb("actual_impact"), // After: measured changes
  executedBy: text("executed_by").default("agent"), // 'agent' | 'user' | 'scheduler'
  dryRun: boolean("dry_run").default(false),
  publishedToShopify: boolean("published_to_shopify").default(false),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  completedAt: timestamp("completed_at"),
  rolledBackAt: timestamp("rolled_back_at"),
}, (table) => [
  index('autonomous_actions_user_id_idx').on(table.userId),
  index('autonomous_actions_status_idx').on(table.status),
  index('autonomous_actions_action_type_idx').on(table.actionType),
  index('autonomous_actions_entity_id_idx').on(table.entityId),
  index('autonomous_actions_created_at_idx').on(table.createdAt),
]);

export const autonomousRules = pgTable("autonomous_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // null for global rules
  name: text("name").notNull(),
  description: text("description"),
  ruleJson: jsonb("rule_json").notNull(), // JSON rule definition
  enabled: boolean("enabled").default(true),
  priority: integer("priority").default(50), // Higher = runs first
  cooldownSeconds: integer("cooldown_seconds").default(86400), // 24h default
  isGlobal: boolean("is_global").default(false), // System-wide rules
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('autonomous_rules_user_id_idx').on(table.userId),
  index('autonomous_rules_enabled_idx').on(table.enabled),
  index('autonomous_rules_priority_idx').on(table.priority),
]);

export const automationSettings = pgTable("automation_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  // MASTER AUTOMATION CONTROL - Global ON/OFF switch
  globalAutopilotEnabled: boolean("global_autopilot_enabled").default(true), // Master toggle: true = Autonomous, false = Manual (requires approval)
  autopilotEnabled: boolean("autopilot_enabled").default(false),
  autopilotMode: text("autopilot_mode").default("safe"), // 'safe' | 'balanced' | 'aggressive'
  dryRunMode: boolean("dry_run_mode").default(false), // Preview mode - creates actions but doesn't execute
  autoPublishEnabled: boolean("auto_publish_enabled").default(false),
  maxDailyActions: integer("max_daily_actions").default(10),
  maxCatalogChangePercent: integer("max_catalog_change_percent").default(5), // Max % of products to change per day
  autonomousCreditLimit: integer("autonomous_credit_limit").default(100), // Max credits autonomous mode can use per day
  enabledActionTypes: jsonb("enabled_action_types").default(sql`'["optimize_seo"]'::jsonb`), // Which actions are allowed
  notificationPreferences: jsonb("notification_preferences").default(sql`'{"email_daily_summary": true}'::jsonb`),
  // Cart Recovery Settings
  cartRecoveryEnabled: boolean("cart_recovery_enabled").default(false),
  minCartValue: numeric("min_cart_value", { precision: 10, scale: 2 }).default("10.00"), // Minimum cart value to recover
  recoveryIntervals: jsonb("recovery_intervals").default(sql`'[1, 4, 24]'::jsonb`), // Hours after abandonment to send recovery [1hr, 4hr, 24hr]
  recoveryChannel: recoveryChannelEnum("recovery_channel").default("email").notNull(), // Enum for data integrity
  maxRecoveryAttempts: integer("max_recovery_attempts").default(3), // Max times to contact per cart
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('automation_settings_user_id_idx').on(table.userId),
  index('automation_settings_autopilot_enabled_idx').on(table.autopilotEnabled),
  index('automation_settings_global_autopilot_idx').on(table.globalAutopilotEnabled),
]);

export const pendingApprovals = pgTable("pending_approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  actionType: text("action_type").notNull(), // 'optimize_seo' | 'send_campaign' | 'send_cart_recovery' | 'adjust_price'
  entityId: varchar("entity_id"), // Product ID, Campaign ID, etc
  entityType: text("entity_type"), // 'product' | 'campaign' | 'cart' | 'competitor'
  recommendedAction: jsonb("recommended_action").notNull(), // Full action payload to execute if approved
  aiReasoning: text("ai_reasoning").notNull(), // Why AI recommends this action
  status: text("status").default("pending").notNull(), // 'pending' | 'approved' | 'rejected'
  priority: text("priority").default("medium"), // 'low' | 'medium' | 'high' | 'urgent'
  estimatedImpact: jsonb("estimated_impact"), // Predicted ROI, traffic increase, conversion lift
  // RACE CONDITION PREVENTION: Normalized recipient data for unique constraints
  recipientEmail: text("recipient_email"), // Extracted from recommendedAction for marketing/cart recovery
  recipientPhone: text("recipient_phone"), // Extracted from recommendedAction for SMS marketing
  channel: text("channel"), // 'email' | 'sms' - extracted for deduplication
  createdAt: timestamp("created_at").default(sql`NOW()`),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id), // Who approved/rejected
  executedActionId: varchar("executed_action_id").references(() => autonomousActions.id), // Link to executed action if approved
}, (table) => [
  index('pending_approvals_user_id_idx').on(table.userId),
  index('pending_approvals_status_idx').on(table.status),
  index('pending_approvals_action_type_idx').on(table.actionType),
  index('pending_approvals_created_at_idx').on(table.createdAt),
  index('pending_approvals_priority_idx').on(table.priority),
  // CRITICAL: Unique partial indexes to prevent duplicate approvals for same customer
  // These indexes prevent race conditions when approving multiple marketing/cart recovery actions
  uniqueIndex('pending_approvals_email_dedup_idx').on(
    table.userId,
    table.actionType,
    table.recipientEmail,
    table.channel,
    table.status
  ).where(sql`status = 'pending' AND action_type IN ('send_campaign', 'send_cart_recovery') AND recipient_email IS NOT NULL`),
  uniqueIndex('pending_approvals_sms_dedup_idx').on(
    table.userId,
    table.actionType,
    table.recipientPhone,
    table.channel,
    table.status
  ).where(sql`status = 'pending' AND action_type IN ('send_campaign', 'send_cart_recovery') AND recipient_phone IS NOT NULL`),
]);

export const productSnapshots = pgTable("product_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id).notNull(),
  actionId: varchar("action_id").references(() => autonomousActions.id), // Which action created this snapshot
  snapshotData: jsonb("snapshot_data").notNull(), // Full product state before change
  reason: text("reason"), // 'before_optimization' | 'before_publish' | 'manual'
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('product_snapshots_product_id_idx').on(table.productId),
  index('product_snapshots_action_id_idx').on(table.actionId),
  index('product_snapshots_created_at_idx').on(table.createdAt),
]);

// Dynamic Pricing System Tables
export const competitorProducts = pgTable("competitor_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  productId: varchar("product_id").references(() => products.id), // Our product (if mapped)
  competitorName: text("competitor_name").notNull(), // Competitor store name
  competitorUrl: text("competitor_url").notNull(), // Product URL on competitor site
  competitorSku: text("competitor_sku"), // Competitor's SKU
  productTitle: text("product_title").notNull(), // Product name on competitor site
  currentPrice: numeric("current_price", { precision: 10, scale: 2 }), // Latest scraped price
  previousPrice: numeric("previous_price", { precision: 10, scale: 2 }), // Previous price
  currency: text("currency").default("USD"),
  inStock: boolean("in_stock").default(true), // Availability
  lastScrapedAt: timestamp("last_scraped_at"), // When we last checked
  scrapingEnabled: boolean("scraping_enabled").default(true),
  matchConfidence: integer("match_confidence"), // 0-100, how confident we are this matches our product
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('competitor_products_user_id_idx').on(table.userId),
  index('competitor_products_product_id_idx').on(table.productId),
  index('competitor_products_last_scraped_idx').on(table.lastScrapedAt),
  index('competitor_products_scraping_enabled_idx').on(table.scrapingEnabled),
]);

export const pricingRules = pgTable("pricing_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  strategy: text("strategy").notNull(), // 'match' | 'beat_by_percent' | 'beat_by_amount' | 'margin_based' | 'custom'
  strategyConfig: jsonb("strategy_config").notNull(), // Strategy-specific settings
  conditions: jsonb("conditions").notNull(), // When to apply this rule
  priority: integer("priority").default(50), // Higher = runs first
  enabled: boolean("enabled").default(true),
  minPrice: numeric("min_price", { precision: 10, scale: 2 }), // Floor price
  maxPrice: numeric("max_price", { precision: 10, scale: 2 }), // Ceiling price
  roundingStrategy: text("rounding_strategy").default("nearest_99"), // 'none' | 'nearest_99' | 'nearest_95' | 'nearest_whole'
  maxDailyChanges: integer("max_daily_changes").default(5), // Per product
  cooldownHours: integer("cooldown_hours").default(24), // How often to change price
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('pricing_rules_user_id_idx').on(table.userId),
  index('pricing_rules_enabled_idx').on(table.enabled),
  index('pricing_rules_priority_idx').on(table.priority),
]);

export const priceChanges = pgTable("price_changes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  ruleId: varchar("rule_id").references(() => pricingRules.id), // Which rule triggered this
  actionId: varchar("action_id").references(() => autonomousActions.id), // Related autonomous action
  oldPrice: numeric("old_price", { precision: 10, scale: 2 }).notNull(),
  newPrice: numeric("new_price", { precision: 10, scale: 2 }).notNull(),
  priceChange: numeric("price_change", { precision: 10, scale: 2 }).notNull(), // Amount changed
  priceChangePercent: numeric("price_change_percent", { precision: 5, scale: 2 }), // Percentage changed
  reason: text("reason"), // Why price was changed
  competitorPrice: numeric("competitor_price", { precision: 10, scale: 2 }), // Reference competitor price
  status: text("status").default("pending"), // 'pending' | 'applied' | 'rolled_back' | 'failed'
  publishedToShopify: boolean("published_to_shopify").default(false),
  revenueImpact: jsonb("revenue_impact"), // Before/after revenue metrics
  createdAt: timestamp("created_at").default(sql`NOW()`),
  appliedAt: timestamp("applied_at"),
  rolledBackAt: timestamp("rolled_back_at"),
}, (table) => [
  index('price_changes_user_id_idx').on(table.userId),
  index('price_changes_product_id_idx').on(table.productId),
  index('price_changes_status_idx').on(table.status),
  index('price_changes_created_at_idx').on(table.createdAt),
]);

export const pricingSnapshots = pgTable("pricing_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id).notNull(),
  priceChangeId: varchar("price_change_id").references(() => priceChanges.id), // Which price change created this
  price: numeric("price", { precision: 10, scale: 2 }).notNull(), // Price before change
  snapshotData: jsonb("snapshot_data"), // Full pricing state (costs, margins, etc)
  reason: text("reason"), // 'before_price_change' | 'manual'
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('pricing_snapshots_product_id_idx').on(table.productId),
  index('pricing_snapshots_price_change_id_idx').on(table.priceChangeId),
  index('pricing_snapshots_created_at_idx').on(table.createdAt),
]);

export const pricingSettings = pgTable("pricing_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  pricingAutomationEnabled: boolean("pricing_automation_enabled").default(false),
  defaultStrategy: text("default_strategy").default("match"), // Default pricing strategy
  globalMinMargin: numeric("global_min_margin", { precision: 5, scale: 2 }).default("10.00"), // Minimum profit margin %
  globalMaxDiscount: numeric("global_max_discount", { precision: 5, scale: 2 }).default("30.00"), // Maximum discount %
  priceUpdateFrequency: text("price_update_frequency").default("daily"), // 'hourly' | 'daily' | 'weekly'
  requireApproval: boolean("require_approval").default(true), // Require manual approval for price changes
  approvalThreshold: numeric("approval_threshold", { precision: 5, scale: 2 }).default("10.00"), // Require approval if change > X%
  competitorScanEnabled: boolean("competitor_scan_enabled").default(true),
  maxCompetitorsPerProduct: integer("max_competitors_per_product").default(3),
  notifyOnPriceChanges: boolean("notify_on_price_changes").default(true),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('pricing_settings_user_id_idx').on(table.userId),
  index('pricing_settings_pricing_automation_enabled_idx').on(table.pricingAutomationEnabled),
]);

// Cart Recovery System Tables
export const abandonedCarts = pgTable("abandoned_carts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  shopifyCheckoutId: text("shopify_checkout_id"), // Shopify checkout/cart ID
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  customerName: text("customer_name"),
  cartValue: numeric("cart_value", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  cartItems: jsonb("cart_items").notNull(), // Array of cart items with product details
  checkoutUrl: text("checkout_url"), // Shopify recovery URL
  abandonedAt: timestamp("abandoned_at").notNull(),
  lastContactedAt: timestamp("last_contacted_at"), // When we last sent a recovery message
  recoveredAt: timestamp("recovered_at"), // When cart was converted
  recoveredValue: numeric("recovered_value", { precision: 10, scale: 2 }), // Actual purchase value
  recoveryAttempts: integer("recovery_attempts").default(0), // How many times we've tried
  status: cartRecoveryStatusEnum("status").default("abandoned").notNull(), // Enum for data integrity
  shopifyOrderId: text("shopify_order_id"), // If recovered, the order ID
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('abandoned_carts_user_id_idx').on(table.userId),
  index('abandoned_carts_status_idx').on(table.status),
  index('abandoned_carts_abandoned_at_idx').on(table.abandonedAt),
  index('abandoned_carts_shopify_checkout_idx').on(table.shopifyCheckoutId),
  uniqueIndex('abandoned_carts_user_checkout_unique').on(table.userId, table.shopifyCheckoutId).where(sql`${table.shopifyCheckoutId} IS NOT NULL`),
]);

export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'email' | 'sms'
  name: text("name").notNull(),
  subject: text("subject"),
  content: text("content").notNull(),
  templateId: varchar("template_id"),
  goalType: text("goal_type"), // 'acquisition' | 'retention' | 'conversion' | 'engagement' | 'custom'
  audience: text("audience"), // 'all' | 'abandoned_cart' | 'recent_customers' | 'inactive_customers'
  status: text("status").notNull().default("draft"), // draft, scheduled, sending, sent, failed
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  sentCount: integer("sent_count").default(0),
  openRate: integer("open_rate").default(0),
  clickRate: integer("click_rate").default(0),
  conversionRate: integer("conversion_rate").default(0),
  recipientList: jsonb("recipient_list"), // array of email addresses or phone numbers
  metadata: jsonb("metadata"), // additional campaign settings, tracking pixels, etc
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('campaigns_user_id_idx').on(table.userId),
  index('campaigns_status_idx').on(table.status),
  index('campaigns_goal_type_idx').on(table.goalType),
  index('campaigns_scheduled_for_idx').on(table.scheduledFor),
  index('campaigns_created_at_idx').on(table.createdAt),
]);

// Tracking tokens for secure email open/click tracking
export const trackingTokens = pgTable("tracking_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: text("token").notNull().unique(), // Secure random token
  campaignId: varchar("campaign_id").references(() => campaigns.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  recipientEmail: text("recipient_email").notNull(),
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('tracking_tokens_token_idx').on(table.token),
  index('tracking_tokens_campaign_id_idx').on(table.campaignId),
]);

export const campaignEvents = pgTable("campaign_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => campaigns.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  recipientEmail: text("recipient_email").notNull(),
  eventType: text("event_type").notNull(), // 'open' | 'click'
  eventUrl: text("event_url"), // For click events, store the clicked URL
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('campaign_events_campaign_id_idx').on(table.campaignId),
  index('campaign_events_recipient_email_idx').on(table.recipientEmail),
  index('campaign_events_event_type_idx').on(table.eventType),
  index('campaign_events_created_at_idx').on(table.createdAt),
  // Unique index to prevent duplicate events (race condition protection)
  uniqueIndex('campaign_events_unique_idx').on(table.campaignId, table.recipientEmail, table.eventType),
]);

// Revenue Attribution Tracking - Track where each dollar comes from
export const revenueAttribution = pgTable("revenue_attribution", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  source: text("source").notNull(), // 'cart_recovery' | 'email_campaign' | 'ai_optimization' | 'sms_campaign'
  sourceId: varchar("source_id"), // ID of cart, campaign, or product
  revenueAmount: numeric("revenue_amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  customerEmail: text("customer_email"),
  orderId: text("order_id"), // Shopify order ID if applicable
  metadata: jsonb("metadata"), // Additional context (product IDs, conversion details, etc)
  attributedAt: timestamp("attributed_at").default(sql`NOW()`),
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('revenue_attribution_user_id_idx').on(table.userId),
  index('revenue_attribution_source_idx').on(table.source),
  index('revenue_attribution_attributed_at_idx').on(table.attributedAt),
  index('revenue_attribution_source_id_idx').on(table.sourceId),
]);

// Email Template Status Enum
export const emailTemplateStatusEnum = pgEnum('email_template_status', ['draft', 'active', 'archived']);

// Email Template Builder - Enterprise-grade drag-and-drop email templates (EMAIL ONLY)
export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  subject: text("subject").notNull(),
  preheader: text("preheader"), // Email preheader text
  workflowType: text("workflow_type").notNull().default("custom"), // 'onboarding' | 'abandoned_cart' | 'order_confirmation' | 'upsell' | 're_engagement' | 'newsletter' | 'custom'
  status: emailTemplateStatusEnum("status").default("draft").notNull(),
  
  // Email blocks as JSON array for drag-and-drop builder
  blocks: jsonb("blocks").notNull().default(sql`'[]'::jsonb`), // Array of email blocks
  
  // Brand/Design settings
  brandSettings: jsonb("brand_settings").default(sql`'{
    "logoUrl": "",
    "primaryColor": "#00F0FF",
    "secondaryColor": "#8B5CF6",
    "backgroundColor": "#ffffff",
    "textColor": "#1f2937",
    "fontFamily": "Arial, sans-serif",
    "footerText": "",
    "socialLinks": {}
  }'::jsonb`),
  
  // Rendered HTML with inline CSS (email-safe)
  htmlContent: text("html_content"),
  plainTextContent: text("plain_text_content"),
  
  // Variables used in template
  variables: jsonb("variables").default(sql`'[]'::jsonb`),
  
  // Compliance
  unsubscribeLink: text("unsubscribe_link"),
  physicalAddress: text("physical_address"), // CAN-SPAM required
  
  // Metadata
  usageCount: integer("usage_count").default(0),
  lastUsedAt: timestamp("last_used_at"),
  version: integer("version").default(1),
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('email_templates_user_id_idx').on(table.userId),
  index('email_templates_workflow_type_idx').on(table.workflowType),
  index('email_templates_status_idx').on(table.status),
  index('email_templates_created_at_idx').on(table.createdAt),
]);

// Email Template Version History - Track all changes for rollback
export const emailTemplateVersions = pgTable("email_template_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").references(() => emailTemplates.id, { onDelete: 'cascade' }).notNull(),
  version: integer("version").notNull(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  preheader: text("preheader"),
  blocks: jsonb("blocks").notNull(),
  brandSettings: jsonb("brand_settings"),
  htmlContent: text("html_content"),
  plainTextContent: text("plain_text_content"),
  variables: jsonb("variables"),
  changedBy: varchar("changed_by").references(() => users.id),
  changeNote: text("change_note"), // Description of what changed
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('email_template_versions_template_id_idx').on(table.templateId),
  index('email_template_versions_version_idx').on(table.version),
  index('email_template_versions_created_at_idx').on(table.createdAt),
]);

// Legacy campaign templates table - keeping for backward compatibility
export const campaignTemplates = pgTable("campaign_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'email' | 'sms'
  presetType: text("preset_type"), // 'cart_recovery' | 'welcome' | 'winback' | 'product_launch' | 'promo' | 'custom'
  subject: text("subject"),
  content: text("content").notNull(),
  description: text("description"), // Template description for easier selection
  variables: jsonb("variables"), // template variable placeholders
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('campaign_templates_user_id_idx').on(table.userId),
  index('campaign_templates_preset_type_idx').on(table.presetType),
  index('campaign_templates_created_at_idx').on(table.createdAt),
]);

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  planId: varchar("plan_id").references(() => subscriptionPlans.id).notNull(),
  status: text("status").notNull().default("active"), // active, canceled, past_due, incomplete, trialing
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  startDate: timestamp("start_date").default(sql`NOW()`),
  endDate: timestamp("end_date"),
  shopifySubscriptionId: text("shopify_subscription_id"), // Shopify App Subscription ID
  billingPeriod: text("billing_period").default("monthly"), // 'monthly' or 'annual'
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('subscriptions_user_id_idx').on(table.userId),
  index('subscriptions_status_idx').on(table.status),
  index('subscriptions_current_period_end_idx').on(table.currentPeriodEnd),
  index('subscriptions_shopify_id_idx').on(table.shopifySubscriptionId),
]);

export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planName: text("plan_name").notNull().unique(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  interval: text("interval").notNull().default("month"), // 'month' or 'year'
  features: jsonb("features").notNull(),
  limits: jsonb("limits").notNull(), // product limits, email limits, SMS limits etc
  isActive: boolean("is_active").notNull().default(true),
  currency: text("currency").notNull().default("USD"),
  description: text("description"),
  shopifyPlanHandle: text("shopify_plan_handle"), // Shopify Managed Pricing plan handle (e.g., 'starter', 'growth', 'pro')
  createdAt: timestamp("created_at").default(sql`NOW()`),
});

export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  name: text("name"),
  bio: text("bio"),
  profileImage: text("profile_image"),
  preferences: jsonb("preferences"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull().unique(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  refreshTokenId: text("refresh_token_id"), // Maps to Supabase refresh token for revocation
  userAgent: text("user_agent"), // Full user agent string
  deviceType: text("device_type"), // 'desktop', 'mobile', 'tablet'
  browser: text("browser"), // 'Chrome', 'Firefox', 'Safari', etc.
  os: text("os"), // 'Windows', 'macOS', 'iOS', 'Android', etc.
  ipAddress: text("ip_address"), // Hashed IP address for privacy
  location: text("location"), // Coarse geolocation (city, country)
  lastSeenAt: timestamp("last_seen_at").default(sql`NOW()`),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('sessions_user_id_idx').on(table.userId),
  index('sessions_expires_at_idx').on(table.expiresAt),
  index('sessions_last_seen_idx').on(table.lastSeenAt),
]);

export const usageStats = pgTable("usage_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  creditsUsed: integer("credits_used").default(0),
  creditsRemaining: integer("credits_remaining").default(0),
  totalRevenue: integer("total_revenue").default(0),
  totalOrders: integer("total_orders").default(0),
  conversionRate: integer("conversion_rate").default(0), // stored as percentage * 100
  cartRecoveryRate: integer("cart_recovery_rate").default(0), // stored as percentage * 100
  productsCount: integer("products_count").default(0),
  productsOptimized: integer("products_optimized").default(0),
  emailsSent: integer("emails_sent").default(0),
  emailsRemaining: integer("emails_remaining").default(0),
  smsSent: integer("sms_sent").default(0),
  smsRemaining: integer("sms_remaining").default(0),
  aiGenerationsUsed: integer("ai_generations_used").default(0),
  seoOptimizationsUsed: integer("seo_optimizations_used").default(0),
  lastUpdated: timestamp("last_updated").default(sql`NOW()`),
  lastResetDate: timestamp("last_reset_date").default(sql`NOW()`),
}, (table) => [
  index('usage_stats_user_id_idx').on(table.userId),
]);

export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(), // 'generated_product', 'optimized_seo', 'sent_campaign', etc
  description: text("description").notNull(),
  metadata: jsonb("metadata"), // store additional data like product name, campaign id, etc
  toolUsed: text("tool_used"), // 'ai-generator', 'seo-tools', 'campaigns', etc
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('activity_logs_user_date_idx').on(table.userId, table.createdAt),
]);

export const toolsAccess = pgTable("tools_access", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  toolName: text("tool_name").notNull(), // 'ai-generator', 'seo-tools', 'analytics', etc
  accessCount: integer("access_count").default(1),
  lastAccessed: timestamp("last_accessed").default(sql`NOW()`),
  firstAccessed: timestamp("first_accessed").default(sql`NOW()`),
}, (table) => [
  index('tools_access_user_id_idx').on(table.userId),
  index('tools_access_last_accessed_idx').on(table.lastAccessed),
]);

export const realtimeMetrics = pgTable("realtime_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  metricName: text("metric_name").notNull(), // 'revenue_change', 'orders_change', etc
  value: text("value").notNull(),
  changePercent: text("change_percent"),
  isPositive: boolean("is_positive").default(true),
  timestamp: timestamp("timestamp").default(sql`NOW()`),
}, (table) => [
  index('realtime_metrics_user_id_idx').on(table.userId),
  index('realtime_metrics_timestamp_idx').on(table.timestamp),
]);

export const analytics = pgTable("analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  metricType: text("metric_type").notNull(),
  value: integer("value").notNull(),
  date: timestamp("date").default(sql`NOW()`),
  metadata: jsonb("metadata"),
}, (table) => [
  index('analytics_user_metric_date_idx').on(table.userId, table.metricType, table.date),
]);

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"), // 'info', 'success', 'warning', 'error'
  isRead: boolean("is_read").default(false),
  actionUrl: text("action_url"), // Optional URL for "View Details" button
  actionLabel: text("action_label"), // Optional label for action button
  createdAt: timestamp("created_at").default(sql`NOW()`),
  readAt: timestamp("read_at"),
}, (table) => [
  index('notifications_user_id_idx').on(table.userId),
  index('notifications_is_read_idx').on(table.isRead),
  index('notifications_created_at_idx').on(table.createdAt),
]);

export const storeConnections = pgTable("store_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  platform: text("platform").notNull(), // 'shopify' | 'woocommerce'
  storeName: text("store_name").notNull(),
  storeUrl: text("store_url"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  currency: text("currency").default("USD"), // Store's currency code (USD, INR, EUR, GBP, etc.)
  status: text("status").notNull().default("active"), // 'active' | 'inactive' | 'error'
  installedViaShopify: boolean("installed_via_shopify").default(false), // True if installed from Shopify App Store
  isConnected: boolean("is_connected").default(true), // Connection status for dashboard auto-attach
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('store_connections_user_id_idx').on(table.userId),
  index('store_connections_status_idx').on(table.status),
]);

export const oauthStates = pgTable("oauth_states", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  state: text("state").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  shopDomain: text("shop_domain").notNull(),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  expiresAt: timestamp("expires_at").notNull(),
}, (table) => [
  index('oauth_states_state_idx').on(table.state),
  index('oauth_states_expires_at_idx').on(table.expiresAt),
]);

export const syncHistory = pgTable("sync_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  storeConnectionId: varchar("store_connection_id").references(() => storeConnections.id),
  syncType: text("sync_type").notNull(), // 'manual' | 'auto' | 'webhook'
  status: text("status").notNull(), // 'started' | 'completed' | 'failed'
  productsAdded: integer("products_added").default(0),
  productsUpdated: integer("products_updated").default(0),
  productsDeleted: integer("products_deleted").default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").default(sql`NOW()`),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata"), // Additional sync details
}, (table) => [
  index('sync_history_user_id_idx').on(table.userId),
  index('sync_history_status_idx').on(table.status),
  index('sync_history_started_at_idx').on(table.startedAt),
  index('sync_history_store_connection_id_idx').on(table.storeConnectionId),
]);

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  fullName: true,
}).extend({
  id: z.string().optional(), // Allow passing Supabase user ID
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  price: z.string().min(1, "Price is required"),
  stock: z.number().min(0, "Stock must be 0 or greater"),
  category: z.string().min(1, "Category is required"),
});

export const insertSeoMetaSchema = createInsertSchema(seoMeta).omit({
  id: true,
  createdAt: true,
});

export const insertAutonomousActionSchema = createInsertSchema(autonomousActions).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  rolledBackAt: true,
});

export const insertAutonomousRuleSchema = createInsertSchema(autonomousRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAutomationSettingsSchema = createInsertSchema(automationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPendingApprovalSchema = createInsertSchema(pendingApprovals).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
  executedActionId: true,
});

// Update schema for automation settings with validation
export const updateAutomationSettingsSchema = z.object({
  globalAutopilotEnabled: z.boolean().optional(), // MASTER TOGGLE
  autopilotEnabled: z.boolean().optional(),
  autopilotMode: z.enum(['safe', 'balanced', 'aggressive']).optional(),
  dryRunMode: z.boolean().optional(),
  autoPublishEnabled: z.boolean().optional(),
  maxDailyActions: z.number().int().min(1).max(100).optional(),
  maxCatalogChangePercent: z.number().int().min(1).max(100).optional(),
  autonomousCreditLimit: z.number().int().min(1).max(1000).optional(), // Max credits for autonomous mode per day
  enabledActionTypes: z.array(z.string()).optional(),
  notificationPreferences: z.record(z.boolean()).optional(),
  // Cart Recovery Settings
  cartRecoveryEnabled: z.boolean().optional(),
  minCartValue: z.union([z.string(), z.number()]).optional().transform((val) => 
    typeof val === 'number' ? val.toString() : val
  ),
  recoveryIntervals: z.array(z.number().int().positive()).optional(), // [1, 4, 24] hours
  recoveryChannel: z.enum(['email', 'sms', 'both']).optional(),
  maxRecoveryAttempts: z.number().int().min(1).max(10).optional(),
});

export const insertProductSnapshotSchema = createInsertSchema(productSnapshots).omit({
  id: true,
  createdAt: true,
});

// Pricing system schemas
export const insertCompetitorProductSchema = createInsertSchema(competitorProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPricingRuleSchema = createInsertSchema(pricingRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPriceChangeSchema = createInsertSchema(priceChanges).omit({
  id: true,
  createdAt: true,
});

export const insertPricingSnapshotSchema = createInsertSchema(pricingSnapshots).omit({
  id: true,
  createdAt: true,
});

export const insertPricingSettingsSchema = createInsertSchema(pricingSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Update schema for pricing settings with validation
export const updatePricingSettingsSchema = z.object({
  pricingAutomationEnabled: z.boolean().optional(),
  defaultStrategy: z.enum(['match', 'beat_by_percent', 'beat_by_amount', 'margin_based', 'custom']).optional(),
  globalMinMargin: z.union([z.string(), z.number()]).optional().transform((val) => 
    typeof val === 'number' ? val.toString() : val
  ),
  globalMaxDiscount: z.union([z.string(), z.number()]).optional().transform((val) => 
    typeof val === 'number' ? val.toString() : val
  ),
  priceUpdateFrequency: z.enum(['hourly', 'daily', 'weekly']).optional(),
  requireApproval: z.boolean().optional(),
  approvalThreshold: z.union([z.string(), z.number()]).optional().transform((val) => 
    typeof val === 'number' ? val.toString() : val
  ),
  competitorScanEnabled: z.boolean().optional(),
  maxCompetitorsPerProduct: z.number().int().min(1).max(10).optional(),
  notifyOnPriceChanges: z.boolean().optional(),
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  goalType: z.string().optional(),
  audience: z.string().optional(),
  scheduledFor: z.union([z.string(), z.date()]).optional().transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ),
});

export const insertCampaignEventSchema = createInsertSchema(campaignEvents).omit({
  id: true,
  createdAt: true,
});

export const insertTrackingTokenSchema = createInsertSchema(trackingTokens).omit({
  id: true,
  createdAt: true,
});

export const insertRevenueAttributionSchema = createInsertSchema(revenueAttribution).omit({
  id: true,
  createdAt: true,
  attributedAt: true,
});

export const insertCampaignTemplateSchema = createInsertSchema(campaignTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  presetType: z.string().optional(),
  description: z.string().optional(),
});

// Email Template Builder schemas (EMAIL ONLY)
export const emailBlockSchema = z.object({
  id: z.string(),
  type: z.enum(['heading', 'text', 'image', 'button', 'divider', 'spacer', 'columns', 'logo']),
  content: z.record(z.any()).optional(),
  styles: z.object({
    padding: z.string().optional(),
    margin: z.string().optional(),
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
    fontSize: z.string().optional(),
    fontFamily: z.string().optional(),
    textAlign: z.enum(['left', 'center', 'right']).optional(),
    borderRadius: z.string().optional(),
    width: z.string().optional(),
    height: z.string().optional(),
  }).optional(),
});

export const brandSettingsSchema = z.object({
  logoUrl: z.string().optional(),
  primaryColor: z.string().default('#00F0FF'),
  secondaryColor: z.string().default('#8B5CF6'),
  backgroundColor: z.string().default('#ffffff'),
  textColor: z.string().default('#1f2937'),
  fontFamily: z.string().default('Arial, sans-serif'),
  footerText: z.string().optional(),
  socialLinks: z.record(z.string()).optional(),
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
  lastUsedAt: true,
  version: true,
}).extend({
  blocks: z.array(emailBlockSchema).default([]),
  brandSettings: brandSettingsSchema.optional(),
  variables: z.array(z.string()).optional(),
  workflowType: z.enum(['onboarding', 'abandoned_cart', 'order_confirmation', 'upsell', 're_engagement', 'newsletter', 'custom']).default('custom'),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
});

export const insertEmailTemplateVersionSchema = createInsertSchema(emailTemplateVersions).omit({
  id: true,
  createdAt: true,
}).extend({
  blocks: z.array(emailBlockSchema),
  brandSettings: brandSettingsSchema.optional(),
  variables: z.array(z.string()).optional(),
});

export const insertAbandonedCartSchema = createInsertSchema(abandonedCarts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

export const insertUsageStatsSchema = createInsertSchema(usageStats).omit({
  id: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertToolsAccessSchema = createInsertSchema(toolsAccess).omit({
  id: true,
  firstAccessed: true,
});

export const insertRealtimeMetricsSchema = createInsertSchema(realtimeMetrics).omit({
  id: true,
  timestamp: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

export const insertStoreConnectionSchema = createInsertSchema(storeConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOauthStateSchema = createInsertSchema(oauthStates).omit({
  id: true,
  createdAt: true,
});

export const insertSyncHistorySchema = createInsertSchema(syncHistory).omit({
  id: true,
  startedAt: true,
});

// New Settings Tables
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  aiSettings: jsonb("ai_settings"), // brand voice, content style, auto-save settings
  notificationSettings: jsonb("notification_settings"), // email, push, in-app preferences
  uiPreferences: jsonb("ui_preferences"), // theme, language, display settings
  privacySettings: jsonb("privacy_settings"), // data sharing, analytics opt-out
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

export const integrationSettings = pgTable("integration_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  integrationType: text("integration_type").notNull(), // 'email', 'sms', 'analytics', 'automation'
  provider: text("provider").notNull(), // 'gmail', 'outlook', 'twilio', 'zapier', etc.
  settings: jsonb("settings").notNull(), // provider-specific settings
  credentials: jsonb("credentials"), // encrypted API keys, tokens - ensure app-level encryption
  isActive: boolean("is_active").default(true),
  lastSync: timestamp("last_sync"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  uniqueIndex('integration_settings_unique_user_integration_idx').on(table.userId, table.integrationType, table.provider),
  index('integration_settings_user_id_idx').on(table.userId),
]);

export const securitySettings = pgTable("security_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: text("two_factor_secret"), // encrypted TOTP secret - ensure app-level encryption
  backupCodes: jsonb("backup_codes"), // hashed backup codes array - ensure app-level hashing
  loginNotifications: boolean("login_notifications").default(true),
  sessionTimeout: integer("session_timeout").default(3600), // seconds
  lastPasswordChange: timestamp("last_password_change").default(sql`NOW()`),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

export const loginLogs = pgTable("login_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  location: text("location"), // city, country from IP
  success: boolean("success").notNull(),
  failureReason: text("failure_reason"), // if failed
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('login_logs_user_date_idx').on(table.userId, table.createdAt),
]);

export const supportTickets = pgTable("support_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  category: text("category").notNull(), // 'bug', 'feature', 'billing', 'general'
  priority: text("priority").notNull().default("medium"), // 'low', 'medium', 'high', 'urgent'
  status: text("status").notNull().default("open"), // 'open', 'in_progress', 'resolved', 'closed'
  metadata: jsonb("metadata"), // attachments, user info, etc.
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('support_tickets_user_id_idx').on(table.userId),
]);

export const aiGenerationHistory = pgTable("ai_generation_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  generationType: text("generation_type").notNull(), // 'product_description', 'seo_title', 'email_content'
  inputData: jsonb("input_data").notNull(), // original input/prompt
  outputData: jsonb("output_data").notNull(), // AI generated content
  brandVoice: text("brand_voice"), // which voice style was used
  tokensUsed: integer("tokens_used"),
  model: text("model").default("gpt-4o-mini"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('ai_generation_history_user_date_idx').on(table.userId, table.createdAt),
]);

// Performance tracking for AI-generated content (self-learning system)
export const contentPerformance = pgTable("content_performance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  aiGenerationId: varchar("ai_generation_id").references(() => aiGenerationHistory.id),
  productId: varchar("product_id").references(() => products.id),
  userId: varchar("user_id").references(() => users.id).notNull(),
  contentType: text("content_type").notNull(), // 'title', 'description', 'seo_meta', 'copy'
  
  // Performance metrics
  views: integer("views").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  revenue: numeric("revenue", { precision: 10, scale: 2 }).default("0"),
  ctr: numeric("ctr", { precision: 5, scale: 2 }).default("0"), // click-through rate percentage
  conversionRate: numeric("conversion_rate", { precision: 5, scale: 2 }).default("0"),
  
  // Quality metrics (calculated from performance)
  performanceScore: integer("performance_score").default(0), // 0-100 score
  engagementScore: integer("engagement_score").default(0), // 0-100 score
  
  // Content analysis
  wordCount: integer("word_count"),
  readabilityScore: integer("readability_score"), // Flesch reading ease
  emotionalTone: text("emotional_tone"), // 'positive', 'neutral', 'urgent', 'persuasive'
  keywordDensity: numeric("keyword_density", { precision: 5, scale: 2 }),
  
  // Comparison data
  performanceDelta: numeric("performance_delta", { precision: 5, scale: 2 }), // vs previous version
  baselineScore: integer("baseline_score"), // original non-AI content score
  
  // Tracking
  firstRecordedAt: timestamp("first_recorded_at").default(sql`NOW()`),
  lastUpdatedAt: timestamp("last_updated_at").default(sql`NOW()`),
  measurementPeriodDays: integer("measurement_period_days").default(7), // how long we've been tracking
}, (table) => [
  index('content_performance_ai_gen_idx').on(table.aiGenerationId),
  index('content_performance_product_idx').on(table.productId),
  index('content_performance_user_idx').on(table.userId),
  index('content_performance_score_idx').on(table.performanceScore),
  index('content_performance_type_idx').on(table.contentType),
]);

// Learning patterns - what works (winning formulas extracted from high-performing content)
export const learningPatterns = pgTable("learning_patterns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  patternType: text("pattern_type").notNull(), // 'word_choice', 'structure', 'emotional_trigger', 'framework'
  category: text("category"), // product category this pattern works for
  
  // Pattern details
  patternName: text("pattern_name").notNull(),
  patternData: jsonb("pattern_data").notNull(), // the actual pattern (words, phrases, structure)
  
  // Performance data
  successRate: numeric("success_rate", { precision: 5, scale: 2 }).notNull(), // percentage
  sampleSize: integer("sample_size").notNull(), // how many times tested
  averagePerformanceScore: numeric("avg_performance_score", { precision: 5, scale: 2 }),
  averageConversionRate: numeric("avg_conversion_rate", { precision: 5, scale: 2 }),
  
  // Conditions where this pattern works
  targetAudience: text("target_audience"),
  priceRange: text("price_range"), // 'budget', 'mid-range', 'premium'
  framework: text("framework"), // AIDA, PAS, BAB, etc.
  
  // Learning metadata
  confidence: numeric("confidence", { precision: 3, scale: 2 }).default("0"), // 0-1 confidence score
  lastValidated: timestamp("last_validated").default(sql`NOW()`),
  timesApplied: integer("times_applied").default(0),
  timesSucceeded: integer("times_succeeded").default(0),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('learning_patterns_user_idx').on(table.userId),
  index('learning_patterns_type_idx').on(table.patternType),
  index('learning_patterns_success_idx').on(table.successRate),
  index('learning_patterns_active_idx').on(table.isActive),
]);

// Pre-validation quality scores (before content is returned to user)
export const contentQualityScores = pgTable("content_quality_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  aiGenerationId: varchar("ai_generation_id").references(() => aiGenerationHistory.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // SEO scores
  seoScore: integer("seo_score").default(0), // 0-100
  keywordOptimization: integer("keyword_optimization").default(0), // 0-100
  metaQuality: integer("meta_quality").default(0), // 0-100
  
  // Readability scores
  readabilityScore: integer("readability_score").default(0), // Flesch reading ease
  gradeLevel: numeric("grade_level", { precision: 3, scale: 1 }), // reading grade level
  sentenceComplexity: integer("sentence_complexity").default(0), // 0-100
  
  // Emotional & persuasion scores
  emotionalScore: integer("emotional_score").default(0), // 0-100 emotional resonance
  persuasionScore: integer("persuasion_score").default(0), // 0-100 persuasiveness
  urgencyScore: integer("urgency_score").default(0), // 0-100 sense of urgency
  
  // Brand consistency
  brandConsistencyScore: integer("brand_consistency_score").default(0), // 0-100
  toneMatch: integer("tone_match").default(0), // 0-100 match to brand voice
  
  // Overall quality
  overallScore: integer("overall_score").default(0), // 0-100 weighted average
  passedValidation: boolean("passed_validation").default(true),
  validationIssues: jsonb("validation_issues"), // array of issues found
  
  // Comparison scores
  competitorScore: integer("competitor_score"), // 0-100 vs competitor content
  industryBenchmark: integer("industry_benchmark"), // 0-100 vs industry average
  
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('quality_scores_ai_gen_idx').on(table.aiGenerationId),
  index('quality_scores_user_idx').on(table.userId),
  index('quality_scores_overall_idx').on(table.overallScore),
  index('quality_scores_passed_idx').on(table.passedValidation),
]);

export const abTests = pgTable("ab_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  testName: text("test_name").notNull(),
  status: text("status").notNull().default("draft"), // draft, running, completed, paused
  duration: integer("duration"), // days
  participants: integer("participants").default(0),
  variantAData: jsonb("variant_a_data"), // {name, visitors, conversions, conversionRate, revenue}
  variantBData: jsonb("variant_b_data"),
  winner: text("winner"), // 'A' | 'B' | null
  significance: numeric("significance", { precision: 5, scale: 2 }),
  improvement: numeric("improvement", { precision: 5, scale: 2 }),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('ab_tests_user_id_idx').on(table.userId),
  index('ab_tests_status_idx').on(table.status),
]);

// Product version history table for rollback functionality
export const productHistory = pgTable("product_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  productName: text("product_name").notNull(),
  changeDate: timestamp("change_date").default(sql`NOW()`),
  changeType: text("change_type").notNull(), // 'ai-optimization' | 'bulk-import' | 'shopify-sync' | 'manual-edit'
  changedBy: text("changed_by").notNull(), // 'Zyra AI' | 'System' | user name
  changes: jsonb("changes").notNull(), // array of {field, before, after}
  canRollback: boolean("can_rollback").default(true),
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('product_history_product_id_idx').on(table.productId),
  index('product_history_user_id_idx').on(table.userId),
  index('product_history_change_date_idx').on(table.changeDate),
]);

// Enhanced insert schemas for new tables
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIntegrationSettingsSchema = createInsertSchema(integrationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSecuritySettingsSchema = createInsertSchema(securitySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLoginLogSchema = createInsertSchema(loginLogs).omit({
  id: true,
  createdAt: true,
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiGenerationHistorySchema = createInsertSchema(aiGenerationHistory).omit({
  id: true,
  createdAt: true,
});

export const insertAbTestSchema = createInsertSchema(abTests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductHistorySchema = createInsertSchema(productHistory).omit({
  id: true,
  createdAt: true,
});

export const insertContentPerformanceSchema = createInsertSchema(contentPerformance).omit({
  id: true,
  firstRecordedAt: true,
  lastUpdatedAt: true,
});

export const insertLearningPatternSchema = createInsertSchema(learningPatterns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentQualityScoreSchema = createInsertSchema(contentQualityScores).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type SeoMeta = typeof seoMeta.$inferSelect;
export type InsertSeoMeta = z.infer<typeof insertSeoMetaSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type CampaignEvent = typeof campaignEvents.$inferSelect;
export type InsertCampaignEvent = z.infer<typeof insertCampaignEventSchema>;
export type RevenueAttribution = typeof revenueAttribution.$inferSelect;
export type InsertRevenueAttribution = z.infer<typeof insertRevenueAttributionSchema>;
export type CampaignTemplate = typeof campaignTemplates.$inferSelect;
export type InsertCampaignTemplate = z.infer<typeof insertCampaignTemplateSchema>;

// Email Template Builder Types (EMAIL ONLY)
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplateVersion = typeof emailTemplateVersions.$inferSelect;
export type InsertEmailTemplateVersion = z.infer<typeof insertEmailTemplateVersionSchema>;
export type EmailBlock = z.infer<typeof emailBlockSchema>;
export type BrandSettings = z.infer<typeof brandSettingsSchema>;

export type AbandonedCart = typeof abandonedCarts.$inferSelect;
export type InsertAbandonedCart = z.infer<typeof insertAbandonedCartSchema>;
export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type UsageStats = typeof usageStats.$inferSelect;
export type InsertUsageStats = z.infer<typeof insertUsageStatsSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ToolsAccess = typeof toolsAccess.$inferSelect;
export type InsertToolsAccess = z.infer<typeof insertToolsAccessSchema>;
export type RealtimeMetrics = typeof realtimeMetrics.$inferSelect;
export type InsertRealtimeMetrics = z.infer<typeof insertRealtimeMetricsSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type StoreConnection = typeof storeConnections.$inferSelect;
export type InsertStoreConnection = z.infer<typeof insertStoreConnectionSchema>;
export type OauthState = typeof oauthStates.$inferSelect;
export type InsertOauthState = z.infer<typeof insertOauthStateSchema>;
export type SyncHistory = typeof syncHistory.$inferSelect;
export type InsertSyncHistory = z.infer<typeof insertSyncHistorySchema>;

// Billing and invoice tables
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id),
  gatewayInvoiceId: text("gateway_invoice_id").unique(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull(), // paid, open, void, uncollectible
  invoiceNumber: text("invoice_number"),
  invoiceUrl: text("invoice_url"),
  pdfUrl: text("pdf_url"),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('invoices_user_id_idx').on(table.userId),
  index('invoices_status_idx').on(table.status),
  index('invoices_created_at_idx').on(table.createdAt),
]);

export const paymentMethods = pgTable("payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  gatewayPaymentMethodId: text("gateway_payment_method_id").notNull().unique(),
  type: text("type").notNull(), // card, bank_account, etc.
  cardBrand: text("card_brand"), // visa, mastercard, amex, etc.
  cardLast4: text("card_last4"),
  cardExpMonth: integer("card_exp_month"),
  cardExpYear: integer("card_exp_year"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('payment_methods_user_id_idx').on(table.userId),
]);

export const billingHistory = pgTable("billing_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id),
  invoiceId: varchar("invoice_id").references(() => invoices.id),
  action: text("action").notNull(), // subscription_created, payment_succeeded, payment_failed, etc.
  amount: numeric("amount", { precision: 10, scale: 2 }),
  currency: text("currency").default("USD"),
  status: text("status").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('billing_history_user_id_idx').on(table.userId),
  index('billing_history_created_at_idx').on(table.createdAt),
]);

// Payment gateway transactions table
export const paymentTransactions = pgTable("payment_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  gateway: text("gateway").notNull(), // 'razorpay', 'paypal'
  gatewayTransactionId: text("gateway_transaction_id").notNull(), // Payment ID from gateway
  gatewayOrderId: text("gateway_order_id"), // Order ID from gateway (if applicable)
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull(), // 'pending', 'processing', 'completed', 'failed', 'refunded', etc.
  paymentMethod: text("payment_method"), // 'card', 'upi', 'netbanking', 'wallet', 'paypal', etc.
  paymentDetails: jsonb("payment_details"), // Card last4, UPI ID, etc.
  description: text("description"),
  invoiceId: varchar("invoice_id").references(() => invoices.id),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id),
  signature: text("signature"), // Razorpay/gateway signature for verification
  webhookReceived: boolean("webhook_received").default(false),
  webhookData: jsonb("webhook_data"), // Store webhook payload
  refundAmount: numeric("refund_amount", { precision: 10, scale: 2 }), // If partially/fully refunded
  refundReason: text("refund_reason"),
  refundedAt: timestamp("refunded_at"),
  errorCode: text("error_code"), // If payment failed
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"), // Additional data
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('payment_transactions_user_id_idx').on(table.userId),
  index('payment_transactions_gateway_idx').on(table.gateway),
  index('payment_transactions_status_idx').on(table.status),
  index('payment_transactions_created_at_idx').on(table.createdAt),
]);

// Error logging table for production monitoring
export const errorLogs = pgTable("error_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  errorType: text("error_type").notNull(), // 'api_error', 'database_error', 'auth_error', 'payment_error', etc.
  message: text("message").notNull(),
  stack: text("stack"),
  endpoint: text("endpoint"), // API endpoint where error occurred
  method: text("method"), // HTTP method
  statusCode: integer("status_code"),
  requestBody: jsonb("request_body"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  metadata: jsonb("metadata"), // Additional context
  resolved: boolean("resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('error_logs_user_id_idx').on(table.userId),
  index('error_logs_error_type_idx').on(table.errorType),
  index('error_logs_created_at_idx').on(table.createdAt),
  index('error_logs_resolved_idx').on(table.resolved),
]);

export const insertErrorLogSchema = createInsertSchema(errorLogs).omit({
  id: true,
  createdAt: true,
});

export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertErrorLog = z.infer<typeof insertErrorLogSchema>;

// Billing table schemas
export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBillingHistorySchema = createInsertSchema(billingHistory).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Additional billing types
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type BillingHistory = typeof billingHistory.$inferSelect;
export type InsertBillingHistory = z.infer<typeof insertBillingHistorySchema>;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;

// Advanced Notification Preference System Enums
export const notificationPresetEnum = pgEnum('notification_preset', ['work', 'focus', 'full_alerts', 'custom']);
export const notificationChannelEnum = pgEnum('notification_channel', ['email', 'sms', 'in_app', 'push']);
export const notificationFrequencyEnum = pgEnum('notification_frequency', ['instant', 'hourly_digest', 'daily_digest', 'weekly_summary']);
export const notificationPriorityEnum = pgEnum('notification_priority', ['low', 'medium', 'high', 'urgent']);
export const notificationCategoryEnum = pgEnum('notification_category', ['campaigns', 'products', 'billing', 'security', 'ai_insights', 'system']);

// Advanced Notification Preferences - User-level defaults and preset modes
export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  activePreset: text("active_preset").notNull().default("full_alerts"), // work, focus, full_alerts, custom
  enableDigests: boolean("enable_digests").default(false),
  defaultFrequency: text("default_frequency").notNull().default("instant"), // instant, hourly_digest, daily_digest, weekly_summary
  digestTime: text("digest_time").default("09:00"), // HH:MM format for when to send digests
  minPriority: text("min_priority").notNull().default("low"), // low, medium, high, urgent
  enableQuietHours: boolean("enable_quiet_hours").default(false),
  quietHoursStart: text("quiet_hours_start").default("22:00"), // HH:MM format
  quietHoursEnd: text("quiet_hours_end").default("08:00"), // HH:MM format
  allowUrgentInQuietHours: boolean("allow_urgent_in_quiet_hours").default(true),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('notification_preferences_user_id_idx').on(table.userId),
]);

// Notification Rules - Category and channel-specific preferences
export const notificationRules = pgTable("notification_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  category: text("category").notNull(), // campaigns, products, billing, security, ai_insights, system
  enabled: boolean("enabled").default(true),
  channels: jsonb("channels").notNull(), // { email: true, sms: false, in_app: true, push: false }
  frequency: text("frequency").notNull().default("instant"), // instant, hourly_digest, daily_digest, weekly_summary
  minPriority: text("min_priority").notNull().default("low"), // only show notifications at or above this priority
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('notification_rules_user_category_idx').on(table.userId, table.category),
  uniqueIndex('notification_rules_user_category_unique').on(table.userId, table.category),
]);

// Notification Channels - Device and channel-specific settings
export const notificationChannels = pgTable("notification_channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  channelType: text("channel_type").notNull(), // email, sms, in_app, push
  channelValue: text("channel_value"), // email address, phone number, device token
  deviceInfo: jsonb("device_info"), // device name, OS, browser info
  enabled: boolean("enabled").default(true),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('notification_channels_user_id_idx').on(table.userId),
  index('notification_channels_type_idx').on(table.channelType),
]);

// Notification Analytics - Track engagement and delivery
export const notificationAnalytics = pgTable("notification_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  notificationId: varchar("notification_id").references(() => notifications.id),
  category: text("category").notNull(),
  channelType: text("channel_type").notNull(),
  delivered: boolean("delivered").default(false),
  deliveredAt: timestamp("delivered_at"),
  viewed: boolean("viewed").default(false),
  viewedAt: timestamp("viewed_at"),
  clicked: boolean("clicked").default(false),
  clickedAt: timestamp("clicked_at"),
  dismissed: boolean("dismissed").default(false),
  dismissedAt: timestamp("dismissed_at"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('notification_analytics_user_id_idx').on(table.userId),
  index('notification_analytics_category_idx').on(table.category),
]);

// ============================================================================
// AUTONOMOUS MARKETING AUTOMATION TABLES
// ============================================================================

// Marketing Automation Rules - Define when/how to auto-send campaigns
export const marketingAutomationRules = pgTable("marketing_automation_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // Nullable for global presets
  name: text("name").notNull(),
  triggerType: marketingTriggerTypeEnum("trigger_type").notNull(),
  conditions: jsonb("conditions").notNull(), // JSON with thresholds, time delays, customer segments
  campaignTemplateId: varchar("campaign_template_id").references(() => campaignTemplates.id),
  channels: text("channels").array().notNull(), // ['email', 'sms']
  cooldownSeconds: integer("cooldown_seconds").default(86400), // 24 hours default
  maxActionsPerDay: integer("max_actions_per_day").default(10),
  priority: integer("priority").default(5), // 1-10, higher = more important
  enabled: boolean("enabled").default(true),
  metadata: jsonb("metadata"), // Additional config like discount codes, template variables
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('marketing_rules_user_id_idx').on(table.userId),
  index('marketing_rules_enabled_idx').on(table.enabled),
  index('marketing_rules_trigger_idx').on(table.triggerType),
  index('marketing_rules_user_enabled_trigger_idx').on(table.userId, table.enabled, table.triggerType),
]);

// A/B Test Results - Track test variants and performance
export const abTestResults = pgTable("ab_test_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  controlCampaignId: varchar("control_campaign_id").references(() => campaigns.id).notNull(),
  variantAId: varchar("variant_a_id").references(() => campaigns.id).notNull(),
  variantBId: varchar("variant_b_id").references(() => campaigns.id).notNull(),
  splitPercentage: jsonb("split_percentage").default(sql`'{"control": 33, "variantA": 33, "variantB": 34}'`), // Supports >2 variants in future
  sampleSize: integer("sample_size").notNull(),
  startedAt: timestamp("started_at").default(sql`NOW()`),
  endedAt: timestamp("ended_at"),
  winnerId: varchar("winner_id").references(() => campaigns.id),
  winnerSelectedAt: timestamp("winner_selected_at"),
  decisionMethod: text("decision_method").default("open_rate"), // 'open_rate' | 'click_rate' | 'conversion_rate'
  statisticalSignificance: boolean("statistical_significance").default(false),
  metadata: jsonb("metadata"), // Test results, confidence intervals, etc.
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('campaign_ab_tests_user_id_idx').on(table.userId),
  index('campaign_ab_tests_control_campaign_idx').on(table.controlCampaignId),
  index('campaign_ab_tests_started_at_idx').on(table.startedAt),
]);

// ============================================================================
// PRODUCT COPY A/B TESTING - Strategy-Based Automatic Testing
// ============================================================================

// Strategy enum for copy testing
export const copyTestStrategyEnum = pgEnum('copy_test_strategy', [
  'seo_clarity',           // SEO + clarity focused
  'benefit_first',         // Benefit-first conversion focused  
  'trust_reassurance',     // Trust & reassurance focused
  'urgency_light',         // Urgency-light CTA focused
  'control'                // Original copy (control)
]);

// Test status enum
export const copyTestStatusEnum = pgEnum('copy_test_status', [
  'pending',               // Not started
  'testing',               // Currently running
  'completed',             // Winner selected
  'paused',                // Manually paused
  'stopped'                // Auto-stopped due to poor performance
]);

// Product Copy A/B Tests - Strategy-based automatic testing
export const productCopyAbTests = pgTable("product_copy_ab_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  
  // Test Configuration
  status: text("status").notNull().default("pending"), // pending, testing, completed, paused, stopped
  trafficPercentage: integer("traffic_percentage").notNull().default(20), // Start with 20% traffic
  
  // Original Content (for rollback)
  originalTitle: text("original_title"),
  originalDescription: text("original_description"),
  originalMetaTitle: text("original_meta_title"),
  originalMetaDescription: text("original_meta_description"),
  
  // Winning Content (after test completes)
  winningVariantId: varchar("winning_variant_id"),
  winnerAppliedAt: timestamp("winner_applied_at"),
  
  // Rollback Integration
  rollbackHistoryId: varchar("rollback_history_id"), // Links to productHistory for rollback
  canRollback: boolean("can_rollback").default(true),
  
  // Smart Success Signals Configuration
  decisionMetrics: jsonb("decision_metrics").default(sql`'{"timeOnPage": 0.3, "scrollDepth": 0.2, "addToCart": 0.35, "bounce": 0.15}'::jsonb`),
  
  // Store-wide Learning
  learningApplied: boolean("learning_applied").default(false),
  learningInsights: jsonb("learning_insights"), // What patterns were learned
  
  // Timing
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  minTestDuration: integer("min_test_duration").default(72), // Minimum 72 hours
  maxTestDuration: integer("max_test_duration").default(168), // Maximum 7 days (168 hours)
  
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('product_copy_ab_tests_user_id_idx').on(table.userId),
  index('product_copy_ab_tests_product_id_idx').on(table.productId),
  index('product_copy_ab_tests_status_idx').on(table.status),
  uniqueIndex('product_copy_ab_tests_active_product_unique').on(table.userId, table.productId).where(sql`status IN ('pending', 'testing')`),
]);

// Product Copy A/B Test Variants - Individual strategy variants
export const productCopyAbVariants = pgTable("product_copy_ab_variants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testId: varchar("test_id").references(() => productCopyAbTests.id).notNull(),
  
  // Strategy Info
  strategy: text("strategy").notNull(), // seo_clarity, benefit_first, trust_reassurance, urgency_light, control
  strategyDescription: text("strategy_description"),
  
  // Generated Content
  title: text("title"),
  description: text("description"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  keywords: jsonb("keywords").default(sql`'[]'::jsonb`),
  
  // Smart Success Signals Metrics
  impressions: integer("impressions").default(0),
  timeOnPageTotal: numeric("time_on_page_total", { precision: 12, scale: 2 }).default("0"), // Total seconds
  avgTimeOnPage: numeric("avg_time_on_page", { precision: 8, scale: 2 }).default("0"), // Average seconds
  scrollDepthTotal: numeric("scroll_depth_total", { precision: 12, scale: 2 }).default("0"), // Total percentage
  avgScrollDepth: numeric("avg_scroll_depth", { precision: 5, scale: 2 }).default("0"), // Average percentage (0-100)
  addToCartCount: integer("add_to_cart_count").default(0),
  addToCartRate: numeric("add_to_cart_rate", { precision: 5, scale: 2 }).default("0"), // Percentage
  bounceCount: integer("bounce_count").default(0),
  bounceRate: numeric("bounce_rate", { precision: 5, scale: 2 }).default("0"), // Percentage
  clickCount: integer("click_count").default(0),
  conversionCount: integer("conversion_count").default(0),
  conversionRate: numeric("conversion_rate", { precision: 5, scale: 2 }).default("0"),
  
  // Composite Score (weighted combination of signals)
  compositeScore: numeric("composite_score", { precision: 5, scale: 2 }).default("0"), // 0-100
  confidence: numeric("confidence", { precision: 5, scale: 2 }).default("0"), // Statistical confidence 0-100
  
  // Status
  isWinner: boolean("is_winner").default(false),
  isStopped: boolean("is_stopped").default(false), // Auto-stopped due to poor performance
  stoppedReason: text("stopped_reason"),
  
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('product_copy_ab_variants_test_id_idx').on(table.testId),
  index('product_copy_ab_variants_strategy_idx').on(table.strategy),
  index('product_copy_ab_variants_is_winner_idx').on(table.isWinner),
]);

// Store-wide Copy Learning - Aggregated insights across all tests
export const copyLearningInsights = pgTable("copy_learning_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Pattern Recognition
  category: text("category"), // Product category this insight applies to
  strategy: text("strategy").notNull(), // Which strategy
  
  // Performance Stats
  testsCount: integer("tests_count").default(0),
  winsCount: integer("wins_count").default(0),
  winRate: numeric("win_rate", { precision: 5, scale: 2 }).default("0"), // Percentage
  avgCompositeScore: numeric("avg_composite_score", { precision: 5, scale: 2 }).default("0"),
  avgAddToCartLift: numeric("avg_add_to_cart_lift", { precision: 5, scale: 2 }).default("0"), // vs control
  avgConversionLift: numeric("avg_conversion_lift", { precision: 5, scale: 2 }).default("0"), // vs control
  
  // Learned Patterns
  effectivePatterns: jsonb("effective_patterns"), // What works: keywords, tone, structure
  ineffectivePatterns: jsonb("ineffective_patterns"), // What doesn't work
  
  // Recommendation
  recommendedForCategories: jsonb("recommended_for_categories").default(sql`'[]'::jsonb`),
  confidenceLevel: numeric("confidence_level", { precision: 5, scale: 2 }).default("0"), // How reliable is this insight
  
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('copy_learning_insights_user_id_idx').on(table.userId),
  index('copy_learning_insights_strategy_idx').on(table.strategy),
  index('copy_learning_insights_category_idx').on(table.category),
  uniqueIndex('copy_learning_user_category_strategy_unique').on(table.userId, table.category, table.strategy),
]);

// Customer Engagement History - Track engagement levels for segmentation
export const customerEngagementHistory = pgTable("customer_engagement_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  customerEmail: text("customer_email").notNull(),
  engagementScore: integer("engagement_score").notNull().default(50), // 0-100
  segment: customerSegmentEnum("segment").default("warm"),
  openCount: integer("open_count").default(0),
  clickCount: integer("click_count").default(0),
  purchaseCount: integer("purchase_count").default(0),
  lifetimeValue: numeric("lifetime_value", { precision: 10, scale: 2 }).default("0"),
  lastOpenDate: timestamp("last_open_date"),
  lastClickDate: timestamp("last_click_date"),
  lastPurchaseDate: timestamp("last_purchase_date"),
  lastActivityDate: timestamp("last_activity_date"),
  recalculatedAt: timestamp("recalculated_at").default(sql`NOW()`),
  metadata: jsonb("metadata"), // Trend deltas, behavioral insights
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('engagement_scores_user_id_idx').on(table.userId),
  index('engagement_scores_segment_idx').on(table.segment),
  index('engagement_scores_score_idx').on(table.engagementScore),
  uniqueIndex('engagement_scores_user_customer_unique').on(table.userId, table.customerEmail),
]);

// Send Time Preferences - Optimal send times per segment/customer
export const sendTimePreferences = pgTable("send_time_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  segmentSlug: text("segment_slug"), // e.g., 'hot_customers', 'weekend_browsers'
  customerEmail: text("customer_email"), // For individual-level optimization
  preferredDayOfWeek: integer("preferred_day_of_week"), // 0-6 (Sunday-Saturday)
  preferredHour: integer("preferred_hour"), // 0-23
  sampleSize: integer("sample_size").notNull().default(0),
  avgOpenRate: numeric("avg_open_rate", { precision: 5, scale: 2 }).default("0"), // Percentage
  confidenceLevel: numeric("confidence_level", { precision: 5, scale: 2 }).default("0"), // 0-100
  lastEvaluatedAt: timestamp("last_evaluated_at").default(sql`NOW()`),
  metadata: jsonb("metadata"), // Hourly/daily performance breakdown
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('send_time_user_id_idx').on(table.userId),
  index('send_time_segment_idx').on(table.segmentSlug),
  index('send_time_customer_idx').on(table.customerEmail),
  uniqueIndex('send_time_user_segment_unique').on(table.userId, table.segmentSlug).where(sql`${table.segmentSlug} IS NOT NULL`),
  uniqueIndex('send_time_user_customer_unique').on(table.userId, table.customerEmail).where(sql`${table.customerEmail} IS NOT NULL`),
]);

// Campaign Performance Metrics - Track campaign results and ROI
export const campaignPerformanceMetrics = pgTable("campaign_performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  campaignId: varchar("campaign_id").references(() => campaigns.id).notNull(),
  ruleId: varchar("rule_id").references(() => marketingAutomationRules.id),
  sentCount: integer("sent_count").default(0),
  deliveredCount: integer("delivered_count").default(0),
  openedCount: integer("opened_count").default(0),
  clickedCount: integer("clicked_count").default(0),
  convertedCount: integer("converted_count").default(0),
  bounceCount: integer("bounce_count").default(0),
  unsubscribeCount: integer("unsubscribe_count").default(0),
  revenue: numeric("revenue", { precision: 10, scale: 2 }).default("0"),
  cost: numeric("cost", { precision: 10, scale: 2 }).default("0"),
  roi: numeric("roi", { precision: 10, scale: 2 }).default("0"), // (revenue - cost) / cost * 100
  openRate: numeric("open_rate", { precision: 5, scale: 2 }).default("0"),
  clickRate: numeric("click_rate", { precision: 5, scale: 2 }).default("0"),
  conversionRate: numeric("conversion_rate", { precision: 5, scale: 2 }).default("0"),
  lastUpdatedAt: timestamp("last_updated_at").default(sql`NOW()`),
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('campaign_metrics_user_id_idx').on(table.userId),
  index('campaign_metrics_campaign_id_idx').on(table.campaignId),
  index('campaign_metrics_rule_id_idx').on(table.ruleId),
  uniqueIndex('campaign_metrics_campaign_unique').on(table.campaignId),
]);

// Cart Recovery Sequences - Progressive escalation for abandoned carts
export const cartRecoverySequences = pgTable("cart_recovery_sequences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  ruleId: varchar("rule_id").references(() => marketingAutomationRules.id),
  abandonedCartId: varchar("abandoned_cart_id").references(() => abandonedCarts.id).notNull(),
  stage: cartRecoveryStageEnum("stage").notNull(),
  delayHours: integer("delay_hours").notNull(), // e.g., 1, 6, 24, 72
  offerType: text("offer_type"), // 'none' | 'percentage' | 'fixed_amount' | 'free_shipping'
  offerValue: numeric("offer_value", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("pending"), // 'pending' | 'sent' | 'converted' | 'expired'
  sentAt: timestamp("sent_at"),
  convertedAt: timestamp("converted_at"),
  lastTriggeredAt: timestamp("last_triggered_at"),
  metadata: jsonb("metadata"), // Campaign details, tracking info
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('cart_sequences_user_id_idx').on(table.userId),
  index('cart_sequences_cart_id_idx').on(table.abandonedCartId),
  index('cart_sequences_status_idx').on(table.status),
  index('cart_sequences_stage_idx').on(table.stage),
]);

// Bulk Optimization Jobs - Track batch SEO optimization jobs
export const bulkOptimizationJobs = pgTable("bulk_optimization_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(), // User-friendly name for the batch
  status: bulkOptimizationJobStatusEnum("status").notNull().default("pending"),
  totalItems: integer("total_items").notNull().default(0),
  processedItems: integer("processed_items").notNull().default(0),
  optimizedItems: integer("optimized_items").notNull().default(0),
  failedItems: integer("failed_items").notNull().default(0),
  skippedItems: integer("skipped_items").notNull().default(0),
  progressPercentage: integer("progress_percentage").notNull().default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  estimatedCompletionTime: timestamp("estimated_completion_time"),
  aiModel: text("ai_model").default("gpt-4o-mini"), // Track which model was used
  totalTokensUsed: integer("total_tokens_used").default(0),
  estimatedCost: numeric("estimated_cost", { precision: 10, scale: 4 }).default("0"),
  metadata: jsonb("metadata"), // Additional job configuration
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('bulk_jobs_user_id_idx').on(table.userId),
  index('bulk_jobs_status_idx').on(table.status),
  index('bulk_jobs_created_at_idx').on(table.createdAt),
]);

// Bulk Optimization Items - Individual products within a batch job
export const bulkOptimizationItems = pgTable("bulk_optimization_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").references(() => bulkOptimizationJobs.id, { onDelete: 'cascade' }).notNull(),
  productId: varchar("product_id").references(() => products.id),
  productName: text("product_name").notNull(),
  category: text("category"),
  keyFeatures: text("key_features"),
  targetAudience: text("target_audience"),
  status: bulkOptimizationItemStatusEnum("status").notNull().default("pending"),
  retryCount: integer("retry_count").notNull().default(0),
  maxRetries: integer("max_retries").notNull().default(3),
  errorMessage: text("error_message"),
  
  // Generated SEO content
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  mainDescription: text("main_description"),
  keywords: jsonb("keywords"), // Array of keywords
  seoScore: integer("seo_score"),
  searchIntent: text("search_intent"),
  suggestedKeywords: jsonb("suggested_keywords"),
  
  // Tracking
  tokensUsed: integer("tokens_used").default(0),
  processingTimeMs: integer("processing_time_ms"),
  publishedToShopify: boolean("published_to_shopify").default(false),
  publishedAt: timestamp("published_at"),
  
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('bulk_items_job_id_idx').on(table.jobId),
  index('bulk_items_status_idx').on(table.status),
  index('bulk_items_product_id_idx').on(table.productId),
]);

// Bulk Image Optimization Jobs - Track batch image alt-text optimization jobs
export const bulkImageJobs = pgTable("bulk_image_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  status: bulkOptimizationJobStatusEnum("status").notNull().default("pending"),
  totalProducts: integer("total_products").notNull().default(0),
  totalImages: integer("total_images").notNull().default(0),
  processedImages: integer("processed_images").notNull().default(0),
  optimizedImages: integer("optimized_images").notNull().default(0),
  failedImages: integer("failed_images").notNull().default(0),
  missingImageProducts: integer("missing_image_products").notNull().default(0),
  progressPercentage: integer("progress_percentage").notNull().default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  estimatedCompletionTime: timestamp("estimated_completion_time"),
  aiModel: text("ai_model").default("gpt-4o-mini"),
  totalTokensUsed: integer("total_tokens_used").default(0),
  estimatedCost: numeric("estimated_cost", { precision: 10, scale: 4 }).default("0"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('bulk_image_jobs_user_id_idx').on(table.userId),
  index('bulk_image_jobs_status_idx').on(table.status),
  index('bulk_image_jobs_created_at_idx').on(table.createdAt),
]);

// Bulk Image Job Items - Individual product image optimization within a job
export const bulkImageJobItems = pgTable("bulk_image_job_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").references(() => bulkImageJobs.id, { onDelete: 'cascade' }).notNull(),
  productId: varchar("product_id").references(() => products.id),
  productName: text("product_name").notNull(),
  shopifyProductId: text("shopify_product_id"),
  imageCount: integer("image_count").notNull().default(0),
  imageList: jsonb("image_list"),
  status: imageOptimizationStatusEnum("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").notNull().default(0),
  maxRetries: integer("max_retries").notNull().default(3),
  tokensUsed: integer("tokens_used").default(0),
  processingTimeMs: integer("processing_time_ms"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('bulk_image_items_job_id_idx').on(table.jobId),
  index('bulk_image_items_status_idx').on(table.status),
  index('bulk_image_items_product_id_idx').on(table.productId),
]);

// Image Optimization History - Store all alt-text optimizations for audit trail
export const imageOptimizationHistory = pgTable("image_optimization_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  productId: varchar("product_id").references(() => products.id),
  productName: text("product_name").notNull(),
  shopifyProductId: text("shopify_product_id"),
  shopifyImageId: text("shopify_image_id"),
  imageUrl: text("image_url").notNull(),
  oldAltText: text("old_alt_text"),
  newAltText: text("new_alt_text").notNull(),
  aiAnalysis: jsonb("ai_analysis"),
  appliedToShopify: boolean("applied_to_shopify").default(false),
  appliedAt: timestamp("applied_at"),
  jobId: varchar("job_id").references(() => bulkImageJobs.id),
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('image_history_user_id_idx').on(table.userId),
  index('image_history_product_id_idx').on(table.productId),
  index('image_history_job_id_idx').on(table.jobId),
  index('image_history_created_at_idx').on(table.createdAt),
  index('image_history_user_job_idx').on(table.userId, table.jobId),
]);

// Brand DNA - Advanced Brand Voice Learning System
export const brandDnaProfiles = pgTable("brand_dna_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  
  // Writing Style Analysis
  writingStyle: text("writing_style").notNull().default('professional'), // 'formal' | 'casual' | 'professional' | 'playful' | 'luxury' | 'technical'
  avgSentenceLength: integer("avg_sentence_length").notNull().default(15),
  avgParagraphLength: integer("avg_paragraph_length").notNull().default(50),
  complexityLevel: text("complexity_level").notNull().default('moderate'), // 'simple' | 'moderate' | 'complex' | 'expert'
  
  // Tone & Voice
  toneDensity: text("tone_density").notNull().default('balanced'), // 'minimal' | 'balanced' | 'rich' | 'intense'
  personalityTraits: jsonb("personality_traits").default(sql`'[]'::jsonb`), // Array of strings
  emotionalRange: text("emotional_range").notNull().default('moderate'), // 'reserved' | 'moderate' | 'expressive' | 'intense'
  formalityScore: integer("formality_score").notNull().default(60), // 0-100
  
  // Language Patterns
  keyPhrases: jsonb("key_phrases").default(sql`'[]'::jsonb`), // Unique brand phrases
  powerWords: jsonb("power_words").default(sql`'[]'::jsonb`), // Impactful words used frequently
  avoidedWords: jsonb("avoided_words").default(sql`'[]'::jsonb`), // Words brand avoids
  vocabularyLevel: text("vocabulary_level").default('intermediate'),
  jargonFrequency: text("jargon_frequency").default('moderate'), // 'none' | 'rare' | 'moderate' | 'heavy'
  
  // Structural Patterns
  ctaStyle: text("cta_style").default('action-oriented'), // How brand asks for action
  ctaFrequency: text("cta_frequency").default('moderate'), // 'rare' | 'moderate' | 'frequent'
  headlineStyle: text("headline_style").default('statement-based'),
  listingStyle: text("listing_style").default('bullets'), // 'bullets' | 'numbers' | 'paragraphs' | 'mixed'
  
  // Visual & Formatting
  emojiFrequency: text("emoji_frequency").default('rare'), // 'never' | 'rare' | 'moderate' | 'frequent'
  punctuationStyle: text("punctuation_style").default('standard'), // 'minimal' | 'standard' | 'expressive'
  capitalizationStyle: text("capitalization_style").default('standard'), // 'standard' | 'title-case' | 'creative'
  
  // Content Strategy
  benefitFocusRatio: integer("benefit_focus_ratio").default(60), // 0-100 (features vs benefits)
  socialProofUsage: text("social_proof_usage").default('occasional'), // 'never' | 'occasional' | 'frequent'
  urgencyTactics: text("urgency_tactics").default('subtle'), // 'none' | 'subtle' | 'moderate' | 'aggressive'
  storytellingFrequency: text("storytelling_frequency").default('moderate'), // 'rare' | 'moderate' | 'frequent'
  
  // SEO Preferences
  keywordDensity: text("keyword_density").default('moderate'), // 'light' | 'moderate' | 'heavy'
  seoVsConversion: text("seo_vs_conversion").default('balanced'), // 'seo-focused' | 'balanced' | 'conversion-focused'
  
  // Brand Values & Messaging
  coreValues: jsonb("core_values").default(sql`'[]'::jsonb`), // Array of brand values
  brandPersonality: text("brand_personality"),
  uniqueSellingPoints: jsonb("unique_selling_points").default(sql`'[]'::jsonb`),
  targetAudienceInsights: jsonb("target_audience_insights").default(sql`'[]'::jsonb`),
  
  // Technical Preferences
  preferredModel: text("preferred_model").default('gpt-4o-mini'), // 'gpt-4o-mini' | 'gpt-4o'
  creativityLevel: integer("creativity_level").default(70), // 0-100
  
  // Learning Data
  sampleTexts: jsonb("sample_texts").default(sql`'[]'::jsonb`), // Training samples
  confidenceScore: integer("confidence_score").default(50), // How well we understand the brand (0-100)
  
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('brand_dna_user_id_idx').on(table.userId),
  index('brand_dna_confidence_idx').on(table.confidenceScore),
]);

// Brand DNA Edit Patterns - Learn from user edits
export const brandDnaEditPatterns = pgTable("brand_dna_edit_patterns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  brandDnaId: varchar("brand_dna_id").references(() => brandDnaProfiles.id),
  
  originalText: text("original_text").notNull(),
  editedText: text("edited_text").notNull(),
  editType: text("edit_type").notNull(), // 'tone' | 'length' | 'structure' | 'keywords' | 'cta' | 'other'
  learnedInsight: text("learned_insight"), // What was learned from this edit
  
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('edit_patterns_user_id_idx').on(table.userId),
  index('edit_patterns_brand_dna_id_idx').on(table.brandDnaId),
  index('edit_patterns_edit_type_idx').on(table.editType),
  index('edit_patterns_created_at_idx').on(table.createdAt),
]);

// Marketing Framework Usage - Track which frameworks users select
export const marketingFrameworkUsage = pgTable("marketing_framework_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  frameworkId: text("framework_id").notNull(), // ID from MARKETING_FRAMEWORKS
  frameworkName: text("framework_name").notNull(),
  
  // Product Context
  productName: text("product_name").notNull(),
  productCategory: text("product_category"),
  pricePoint: text("price_point"), // 'budget' | 'mid-range' | 'premium' | 'luxury'
  targetAudience: text("target_audience"),
  
  // Usage Data
  wasRecommended: boolean("was_recommended").default(false), // Was this the AI's recommendation?
  recommendationConfidence: integer("recommendation_confidence"), // 0-100
  wasEdited: boolean("was_edited").default(false), // Did user edit the output?
  editedFields: jsonb("edited_fields"), // Which fields were edited
  
  // Performance Tracking
  wasSuccessful: boolean("was_successful"), // Did user mark it as successful?
  performanceScore: integer("performance_score"), // 0-100 if available
  userRating: integer("user_rating"), // 1-5 if user rated it
  
  // Generated Content Metadata
  seoScore: integer("seo_score"),
  conversionScore: integer("conversion_score"),
  brandVoiceMatchScore: integer("brand_voice_match_score"),
  
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('framework_usage_user_id_idx').on(table.userId),
  index('framework_usage_framework_id_idx').on(table.frameworkId),
  index('framework_usage_product_category_idx').on(table.productCategory),
  index('framework_usage_created_at_idx').on(table.createdAt),
  index('framework_usage_user_framework_idx').on(table.userId, table.frameworkId),
]);

// Template Recommendations - Track AI recommendations vs user choices
export const templateRecommendations = pgTable("template_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Recommendation Data
  recommendedFrameworkId: text("recommended_framework_id").notNull(),
  recommendedReason: text("recommended_reason"),
  recommendationConfidence: integer("recommendation_confidence").notNull(), // 0-100
  alternativeFrameworks: jsonb("alternative_frameworks"), // Array of alternatives
  
  // User Decision
  selectedFrameworkId: text("selected_framework_id").notNull(),
  matchedRecommendation: boolean("matched_recommendation").notNull(), // Did user pick what was recommended?
  
  // Context
  productCategory: text("product_category"),
  pricePoint: text("price_point"),
  targetAudience: text("target_audience"),
  
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('template_recs_user_id_idx').on(table.userId),
  index('template_recs_matched_idx').on(table.matchedRecommendation),
  index('template_recs_created_at_idx').on(table.createdAt),
]);

// ===== UPSELL EMAIL RECEIPTS SYSTEM =====

// Upsell Receipt Settings - Template customization and branding
export const upsellReceiptSettings = pgTable("upsell_receipt_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  
  // Enable/Disable
  isEnabled: boolean("is_enabled").default(false),
  
  // Branding
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#6366f1"), // Indigo
  secondaryColor: text("secondary_color").default("#22c55e"), // Green for discounts
  backgroundColor: text("background_color").default("#1e293b"), // Slate dark
  textColor: text("text_color").default("#f8fafc"), // White
  
  // Template Content
  headerText: text("header_text").default("Thank you for your order!"),
  upsellSectionTitle: text("upsell_section_title").default("Complete Your Setup:"),
  footerText: text("footer_text"),
  showDiscountBadge: boolean("show_discount_badge").default(true),
  defaultDiscountPercent: integer("default_discount_percent").default(15),
  
  // Recommendation Settings
  maxRecommendations: integer("max_recommendations").default(3),
  recommendationStrategy: text("recommendation_strategy").default("category_match"), // category_match | price_range | frequently_bought | ai_personalized
  priceRangePercent: integer("price_range_percent").default(50), // Show products within X% of purchased price
  excludeCategories: jsonb("exclude_categories"), // Categories to never recommend
  
  // A/B Testing
  abTestEnabled: boolean("ab_test_enabled").default(false),
  currentAbTestId: varchar("current_ab_test_id"),
  
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('upsell_settings_user_id_idx').on(table.userId),
]);

// Upsell Recommendation Rules - Define which products to recommend based on purchase
export const upsellRecommendationRules = pgTable("upsell_recommendation_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Rule Definition
  ruleName: text("rule_name").notNull(),
  ruleType: text("rule_type").notNull(), // 'category_match' | 'price_range' | 'frequently_bought' | 'manual' | 'cross_sell'
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(1), // Higher = applied first
  
  // Trigger Conditions
  triggerCategory: text("trigger_category"), // When product from this category is purchased
  triggerProductIds: jsonb("trigger_product_ids"), // Specific product IDs that trigger this rule
  triggerMinPrice: numeric("trigger_min_price", { precision: 10, scale: 2 }),
  triggerMaxPrice: numeric("trigger_max_price", { precision: 10, scale: 2 }),
  
  // Recommendation Target
  recommendCategory: text("recommend_category"), // Recommend from this category
  recommendProductIds: jsonb("recommend_product_ids"), // Specific products to recommend
  recommendPriceRange: jsonb("recommend_price_range"), // { min: number, max: number } or { percentOfPurchase: number }
  
  // Discount Settings
  discountType: text("discount_type").default("percent"), // 'percent' | 'fixed' | 'none'
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).default("10"),
  
  // Metadata
  description: text("description"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('upsell_rules_user_id_idx').on(table.userId),
  index('upsell_rules_type_idx').on(table.ruleType),
  index('upsell_rules_category_idx').on(table.triggerCategory),
]);

// Upsell Receipt Analytics - Track clicks and conversions
export const upsellReceiptAnalytics = pgTable("upsell_receipt_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Receipt Context
  orderId: text("order_id").notNull(), // Shopify order ID
  customerEmail: text("customer_email"),
  originalOrderAmount: numeric("original_order_amount", { precision: 10, scale: 2 }),
  
  // Recommended Products
  recommendedProductIds: jsonb("recommended_product_ids").notNull(), // Array of product IDs shown
  recommendedProducts: jsonb("recommended_products"), // Full product details for analytics
  ruleIdUsed: varchar("rule_id_used").references(() => upsellRecommendationRules.id),
  
  // Tracking
  emailSentAt: timestamp("email_sent_at"),
  emailOpenedAt: timestamp("email_opened_at"),
  
  // Click Tracking
  clickedProductId: varchar("clicked_product_id"),
  clickedAt: timestamp("clicked_at"),
  clickTrackingToken: text("click_tracking_token").unique(),
  
  // Conversion Tracking
  converted: boolean("converted").default(false),
  conversionOrderId: text("conversion_order_id"),
  conversionAmount: numeric("conversion_amount", { precision: 10, scale: 2 }),
  convertedAt: timestamp("converted_at"),
  
  // A/B Test Variant
  abTestId: varchar("ab_test_id"),
  abTestVariant: text("ab_test_variant"), // 'control' | 'variantA' | 'variantB'
  
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('upsell_analytics_user_id_idx').on(table.userId),
  index('upsell_analytics_order_id_idx').on(table.orderId),
  index('upsell_analytics_customer_idx').on(table.customerEmail),
  index('upsell_analytics_token_idx').on(table.clickTrackingToken),
  index('upsell_analytics_converted_idx').on(table.converted),
  index('upsell_analytics_ab_test_idx').on(table.abTestId),
]);

// Upsell Receipt A/B Tests - Compare different recommendation strategies
export const upsellReceiptAbTests = pgTable("upsell_receipt_ab_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Test Configuration
  testName: text("test_name").notNull(),
  status: text("status").default("active"), // 'active' | 'paused' | 'completed'
  
  // Variants
  controlStrategy: text("control_strategy").notNull(), // e.g., 'category_match'
  controlRuleId: varchar("control_rule_id"),
  variantAStrategy: text("variant_a_strategy").notNull(),
  variantARuleId: varchar("variant_a_rule_id"),
  variantBStrategy: text("variant_b_strategy"),
  variantBRuleId: varchar("variant_b_rule_id"),
  
  // Traffic Split (percentages)
  controlTrafficPercent: integer("control_traffic_percent").default(34),
  variantATrafficPercent: integer("variant_a_traffic_percent").default(33),
  variantBTrafficPercent: integer("variant_b_traffic_percent").default(33),
  
  // Decision Criteria
  decisionMetric: text("decision_metric").default("conversion_rate"), // 'click_rate' | 'conversion_rate' | 'revenue'
  minSampleSize: integer("min_sample_size").default(100),
  
  // Results
  controlSent: integer("control_sent").default(0),
  controlClicks: integer("control_clicks").default(0),
  controlConversions: integer("control_conversions").default(0),
  controlRevenue: numeric("control_revenue", { precision: 10, scale: 2 }).default("0"),
  
  variantASent: integer("variant_a_sent").default(0),
  variantAClicks: integer("variant_a_clicks").default(0),
  variantAConversions: integer("variant_a_conversions").default(0),
  variantARevenue: numeric("variant_a_revenue", { precision: 10, scale: 2 }).default("0"),
  
  variantBSent: integer("variant_b_sent").default(0),
  variantBClicks: integer("variant_b_clicks").default(0),
  variantBConversions: integer("variant_b_conversions").default(0),
  variantBRevenue: numeric("variant_b_revenue", { precision: 10, scale: 2 }).default("0"),
  
  // Winner
  winnerId: text("winner_id"), // 'control' | 'variantA' | 'variantB'
  winnerConfidence: numeric("winner_confidence", { precision: 5, scale: 2 }),
  
  startedAt: timestamp("started_at").default(sql`NOW()`),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('upsell_ab_tests_user_id_idx').on(table.userId),
  index('upsell_ab_tests_status_idx').on(table.status),
]);

// =============================================
// BEHAVIORAL TRIGGERS SYSTEM
// =============================================

// Enums for behavioral triggers
export const behavioralTriggerEventEnum = pgEnum('behavioral_trigger_event', [
  'product_view',
  'cart_add',
  'cart_abandon',
  'checkout_start',
  'order_placed',
  'order_fulfilled',
  'page_visit',
  'time_on_site',
  'return_visit',
  'first_purchase',
  'repeat_purchase',
  'high_value_cart',
  'browse_without_buy',
  'wishlist_add',
  'search_query'
]);

export const behavioralTriggerConditionEnum = pgEnum('behavioral_trigger_condition', [
  'count_gte',        // Greater than or equal (e.g., 3+ views)
  'count_lte',        // Less than or equal
  'value_gte',        // Value >= threshold (e.g., cart > $200)
  'value_lte',        // Value <= threshold
  'time_elapsed',     // Time since event (e.g., 2 hours after)
  'time_on_site_gte', // Time on site >= X minutes
  'is_first',         // First occurrence (e.g., first purchase)
  'is_return',        // Return customer
  'no_action',        // No follow-up action taken (e.g., viewed but didn't buy)
  'segment_match'     // Customer segment matches
]);

export const behavioralTriggerActionEnum = pgEnum('behavioral_trigger_action', [
  'send_email',
  'send_sms',
  'show_popup',
  'offer_discount',
  'assign_tag',
  'add_to_segment',
  'send_push',
  'trigger_webhook'
]);

export const behavioralTriggerStatusEnum = pgEnum('behavioral_trigger_status', [
  'active',
  'paused',
  'draft',
  'archived'
]);

// Main behavioral triggers table
export const behavioralTriggers = pgTable("behavioral_triggers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  name: text("name").notNull(),
  description: text("description"),
  
  // Trigger configuration
  eventType: behavioralTriggerEventEnum("event_type").notNull(),
  conditionType: behavioralTriggerConditionEnum("condition_type").notNull(),
  conditionValue: text("condition_value"), // Threshold value (e.g., "3", "200", "2h")
  
  // Action configuration
  actionType: behavioralTriggerActionEnum("action_type").notNull(),
  actionConfig: jsonb("action_config"), // Email template ID, discount code, etc.
  
  // AI-related fields
  isAiRecommended: boolean("is_ai_recommended").default(false),
  aiConfidenceScore: numeric("ai_confidence_score", { precision: 5, scale: 2 }),
  aiReasoning: text("ai_reasoning"),
  
  // Status and priority
  status: behavioralTriggerStatusEnum("status").default("draft"),
  priority: integer("priority").default(0), // Higher = processes first
  
  // Cooldown settings (prevent spamming same customer)
  cooldownHours: integer("cooldown_hours").default(24),
  maxTriggersPerCustomer: integer("max_triggers_per_customer").default(3),
  
  // Timestamps
  lastFiredAt: timestamp("last_fired_at"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('behavioral_triggers_user_id_idx').on(table.userId),
  index('behavioral_triggers_status_idx').on(table.status),
  index('behavioral_triggers_event_type_idx').on(table.eventType),
]);

// Customer behavior events tracked from Shopify
export const behaviorEvents = pgTable("behavior_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Customer identification
  customerId: text("customer_id"), // Shopify customer ID
  customerEmail: text("customer_email"),
  sessionId: text("session_id"), // For anonymous tracking
  
  // Event details
  eventType: behavioralTriggerEventEnum("event_type").notNull(),
  eventData: jsonb("event_data"), // Product ID, cart value, page URL, etc.
  
  // Shopify context
  shopifyShopId: text("shopify_shop_id"),
  productId: text("product_id"),
  orderId: text("order_id"),
  cartToken: text("cart_token"),
  
  // Value tracking
  eventValue: numeric("event_value", { precision: 10, scale: 2 }),
  
  // Processing status
  processed: boolean("processed").default(false),
  triggersMatched: jsonb("triggers_matched"), // Array of trigger IDs that matched
  
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('behavior_events_user_id_idx').on(table.userId),
  index('behavior_events_customer_id_idx').on(table.customerId),
  index('behavior_events_event_type_idx').on(table.eventType),
  index('behavior_events_processed_idx').on(table.processed),
  index('behavior_events_created_at_idx').on(table.createdAt),
]);

// Trigger execution log
export const triggerExecutions = pgTable("trigger_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  triggerId: varchar("trigger_id").references(() => behavioralTriggers.id).notNull(),
  behaviorEventId: varchar("behavior_event_id").references(() => behaviorEvents.id),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Customer targeted
  customerId: text("customer_id"),
  customerEmail: text("customer_email"),
  
  // Execution details
  actionType: behavioralTriggerActionEnum("action_type").notNull(),
  actionPayload: jsonb("action_payload"), // Email content, discount details, etc.
  
  // Status tracking
  status: text("status").notNull().default("pending"), // pending, sent, delivered, clicked, converted, failed
  errorMessage: text("error_message"),
  
  // Conversion tracking
  clicked: boolean("clicked").default(false),
  clickedAt: timestamp("clicked_at"),
  converted: boolean("converted").default(false),
  convertedAt: timestamp("converted_at"),
  conversionValue: numeric("conversion_value", { precision: 10, scale: 2 }),
  conversionOrderId: text("conversion_order_id"),
  
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('trigger_executions_trigger_id_idx').on(table.triggerId),
  index('trigger_executions_user_id_idx').on(table.userId),
  index('trigger_executions_customer_id_idx').on(table.customerId),
  index('trigger_executions_status_idx').on(table.status),
  index('trigger_executions_created_at_idx').on(table.createdAt),
]);

// Aggregated analytics for trigger performance
export const triggerAnalytics = pgTable("trigger_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  triggerId: varchar("trigger_id").references(() => behavioralTriggers.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Time period (for daily aggregation)
  periodDate: timestamp("period_date").notNull(),
  
  // Counts
  eventsFired: integer("events_fired").default(0),
  actionsSent: integer("actions_sent").default(0),
  actionsDelivered: integer("actions_delivered").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  
  // Revenue
  revenueGenerated: numeric("revenue_generated", { precision: 12, scale: 2 }).default("0"),
  
  // Rates
  clickRate: numeric("click_rate", { precision: 5, scale: 2 }),
  conversionRate: numeric("conversion_rate", { precision: 5, scale: 2 }),
  
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('trigger_analytics_trigger_id_idx').on(table.triggerId),
  index('trigger_analytics_user_id_idx').on(table.userId),
  index('trigger_analytics_period_date_idx').on(table.periodDate),
]);

// Insert schemas for behavioral triggers
export const insertBehavioralTriggerSchema = createInsertSchema(behavioralTriggers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastFiredAt: true,
});

export const insertBehaviorEventSchema = createInsertSchema(behaviorEvents).omit({
  id: true,
  createdAt: true,
});

export const insertTriggerExecutionSchema = createInsertSchema(triggerExecutions).omit({
  id: true,
  createdAt: true,
});

export const insertTriggerAnalyticsSchema = createInsertSchema(triggerAnalytics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for behavioral triggers
export type BehavioralTrigger = typeof behavioralTriggers.$inferSelect;
export type InsertBehavioralTrigger = z.infer<typeof insertBehavioralTriggerSchema>;
export type BehaviorEvent = typeof behaviorEvents.$inferSelect;
export type InsertBehaviorEvent = z.infer<typeof insertBehaviorEventSchema>;
export type TriggerExecution = typeof triggerExecutions.$inferSelect;
export type InsertTriggerExecution = z.infer<typeof insertTriggerExecutionSchema>;
export type TriggerAnalytics = typeof triggerAnalytics.$inferSelect;
export type InsertTriggerAnalytics = z.infer<typeof insertTriggerAnalyticsSchema>;

// Insert schemas for upsell receipt system
export const insertUpsellReceiptSettingsSchema = createInsertSchema(upsellReceiptSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUpsellRecommendationRuleSchema = createInsertSchema(upsellRecommendationRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUpsellReceiptAnalyticsSchema = createInsertSchema(upsellReceiptAnalytics).omit({
  id: true,
  createdAt: true,
});

export const insertUpsellReceiptAbTestSchema = createInsertSchema(upsellReceiptAbTests).omit({
  id: true,
  createdAt: true,
});

// Types for upsell receipt system
export type UpsellReceiptSettings = typeof upsellReceiptSettings.$inferSelect;
export type InsertUpsellReceiptSettings = z.infer<typeof insertUpsellReceiptSettingsSchema>;
export type UpsellRecommendationRule = typeof upsellRecommendationRules.$inferSelect;
export type InsertUpsellRecommendationRule = z.infer<typeof insertUpsellRecommendationRuleSchema>;
export type UpsellReceiptAnalytics = typeof upsellReceiptAnalytics.$inferSelect;
export type InsertUpsellReceiptAnalytics = z.infer<typeof insertUpsellReceiptAnalyticsSchema>;
export type UpsellReceiptAbTest = typeof upsellReceiptAbTests.$inferSelect;
export type InsertUpsellReceiptAbTest = z.infer<typeof insertUpsellReceiptAbTestSchema>;

// Insert schemas for advanced notification preferences
export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationRuleSchema = createInsertSchema(notificationRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationChannelSchema = createInsertSchema(notificationChannels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationAnalyticsSchema = createInsertSchema(notificationAnalytics).omit({
  id: true,
  createdAt: true,
});

// Insert schemas for autonomous marketing automation
export const insertMarketingAutomationRuleSchema = createInsertSchema(marketingAutomationRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAbTestResultSchema = createInsertSchema(abTestResults).omit({
  id: true,
  createdAt: true,
});

// Product Copy A/B Testing Insert Schemas
export const insertProductCopyAbTestSchema = createInsertSchema(productCopyAbTests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductCopyAbVariantSchema = createInsertSchema(productCopyAbVariants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCopyLearningInsightSchema = createInsertSchema(copyLearningInsights).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerEngagementHistorySchema = createInsertSchema(customerEngagementHistory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSendTimePreferencesSchema = createInsertSchema(sendTimePreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignPerformanceMetricsSchema = createInsertSchema(campaignPerformanceMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertCartRecoverySequenceSchema = createInsertSchema(cartRecoverySequences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBulkOptimizationJobSchema = createInsertSchema(bulkOptimizationJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBulkOptimizationItemSchema = createInsertSchema(bulkOptimizationItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBulkImageJobSchema = createInsertSchema(bulkImageJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBulkImageJobItemSchema = createInsertSchema(bulkImageJobItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertImageOptimizationHistorySchema = createInsertSchema(imageOptimizationHistory).omit({
  id: true,
  createdAt: true,
});

// Brand DNA & Template System Schemas
export const insertBrandDnaProfileSchema = createInsertSchema(brandDnaProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBrandDnaEditPatternSchema = createInsertSchema(brandDnaEditPatterns).omit({
  id: true,
  createdAt: true,
});

export const insertMarketingFrameworkUsageSchema = createInsertSchema(marketingFrameworkUsage).omit({
  id: true,
  createdAt: true,
});

export const insertTemplateRecommendationSchema = createInsertSchema(templateRecommendations).omit({
  id: true,
  createdAt: true,
});

// ============================================
// DYNAMIC CUSTOMER SEGMENTATION SYSTEM
// ============================================

// Segment types enum
export const segmentTypeEnum = pgEnum('segment_type', [
  'high_spenders',      // Customers who spend above threshold
  'first_timers',       // Customers with only one purchase
  'loyal_buyers',       // Customers with 3+ purchases
  'discount_seekers',   // Customers who frequently use discounts
  'dormant',            // Customers inactive for X days
  'cart_abandoners',    // Customers who abandon carts frequently
  'vip',                // Top spending customers
  'at_risk',            // Previously active, now declining
  'new_subscribers',    // Recently subscribed to marketing
  'custom'              // User-defined custom segment
]);

// Customer Segments - Define segment rules
export const customerSegments = pgTable("customer_segments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Segment Definition
  name: text("name").notNull(),
  description: text("description"),
  segmentType: segmentTypeEnum("segment_type").notNull(),
  color: text("color").default("#3b82f6"), // For UI display
  icon: text("icon").default("users"), // Lucide icon name
  
  // Segment Rules (JSON for flexibility)
  rules: jsonb("rules").notNull(), // { field: 'totalSpent', operator: 'gte', value: 500 }
  
  // AI-generated or manual
  isAiGenerated: boolean("is_ai_generated").default(false),
  aiConfidence: numeric("ai_confidence", { precision: 5, scale: 2 }), // 0-100
  
  // Status
  isActive: boolean("is_active").default(true),
  isSystem: boolean("is_system").default(false), // System segments can't be deleted
  
  // Stats (updated periodically)
  memberCount: integer("member_count").default(0),
  lastCalculatedAt: timestamp("last_calculated_at"),
  
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('segments_user_id_idx').on(table.userId),
  index('segments_type_idx').on(table.segmentType),
  index('segments_active_idx').on(table.isActive),
]);

// Customer Segment Members - Track which customers are in which segments
export const customerSegmentMembers = pgTable("customer_segment_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  segmentId: varchar("segment_id").references(() => customerSegments.id, { onDelete: 'cascade' }).notNull(),
  
  // Customer Info
  customerEmail: text("customer_email").notNull(),
  customerId: text("customer_id"), // Shopify customer ID
  customerName: text("customer_name"),
  
  // Customer Metrics (cached for quick access)
  totalOrders: integer("total_orders").default(0),
  totalSpent: numeric("total_spent", { precision: 12, scale: 2 }).default("0"),
  avgOrderValue: numeric("avg_order_value", { precision: 10, scale: 2 }).default("0"),
  lastOrderDate: timestamp("last_order_date"),
  firstOrderDate: timestamp("first_order_date"),
  discountUsageCount: integer("discount_usage_count").default(0),
  cartAbandonCount: integer("cart_abandon_count").default(0),
  daysInactive: integer("days_inactive").default(0),
  
  // Segment membership
  addedAt: timestamp("added_at").default(sql`NOW()`),
  addedBy: text("added_by").default("system"), // 'system', 'ai', 'manual'
  removedAt: timestamp("removed_at"),
  
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('segment_members_user_id_idx').on(table.userId),
  index('segment_members_segment_id_idx').on(table.segmentId),
  index('segment_members_email_idx').on(table.customerEmail),
  index('segment_members_customer_id_idx').on(table.customerId),
  uniqueIndex('segment_member_unique').on(table.segmentId, table.customerEmail),
]);

// Customer Profiles - Aggregated customer data for segmentation
export const customerProfiles = pgTable("customer_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Customer Identity
  customerEmail: text("customer_email").notNull(),
  customerId: text("customer_id"), // Shopify customer ID
  customerName: text("customer_name"),
  phone: text("phone"),
  
  // Purchase Metrics
  totalOrders: integer("total_orders").default(0),
  totalSpent: numeric("total_spent", { precision: 12, scale: 2 }).default("0"),
  avgOrderValue: numeric("avg_order_value", { precision: 10, scale: 2 }).default("0"),
  maxOrderValue: numeric("max_order_value", { precision: 10, scale: 2 }).default("0"),
  minOrderValue: numeric("min_order_value", { precision: 10, scale: 2 }).default("0"),
  
  // Time-based Metrics
  firstOrderDate: timestamp("first_order_date"),
  lastOrderDate: timestamp("last_order_date"),
  daysSinceLastOrder: integer("days_since_last_order").default(0),
  avgDaysBetweenOrders: integer("avg_days_between_orders"),
  
  // Behavior Metrics
  discountOrderCount: integer("discount_order_count").default(0),
  discountUsagePercent: numeric("discount_usage_percent", { precision: 5, scale: 2 }).default("0"),
  cartAbandonCount: integer("cart_abandon_count").default(0),
  cartAbandonRate: numeric("cart_abandon_rate", { precision: 5, scale: 2 }).default("0"),
  emailOpenRate: numeric("email_open_rate", { precision: 5, scale: 2 }).default("0"),
  emailClickRate: numeric("email_click_rate", { precision: 5, scale: 2 }).default("0"),
  
  // Product Preferences
  favoriteCategories: jsonb("favorite_categories"), // ['Electronics', 'Clothing']
  favoriteProducts: jsonb("favorite_products"), // Product IDs
  
  // Customer Lifecycle
  lifecycleStage: text("lifecycle_stage").default("new"), // new, active, at_risk, churned, vip
  churnRiskScore: numeric("churn_risk_score", { precision: 5, scale: 2 }).default("0"), // 0-100
  lifetimeValue: numeric("lifetime_value", { precision: 12, scale: 2 }).default("0"),
  predictedNextOrderDate: timestamp("predicted_next_order_date"),
  
  // AI Insights
  aiSegmentSuggestions: jsonb("ai_segment_suggestions"), // AI-recommended segments
  lastAiAnalysis: timestamp("last_ai_analysis"),
  
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('profiles_user_id_idx').on(table.userId),
  index('profiles_email_idx').on(table.customerEmail),
  index('profiles_customer_id_idx').on(table.customerId),
  index('profiles_lifecycle_idx').on(table.lifecycleStage),
  uniqueIndex('profile_unique').on(table.userId, table.customerEmail),
]);

// Segment Analytics - Track segment performance
export const segmentAnalytics = pgTable("segment_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  segmentId: varchar("segment_id").references(() => customerSegments.id, { onDelete: 'cascade' }).notNull(),
  
  // Time Period
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  periodType: text("period_type").notNull(), // 'daily', 'weekly', 'monthly'
  
  // Segment Size
  memberCount: integer("member_count").default(0),
  newMembers: integer("new_members").default(0),
  removedMembers: integer("removed_members").default(0),
  
  // Revenue Metrics
  totalRevenue: numeric("total_revenue", { precision: 12, scale: 2 }).default("0"),
  avgOrderValue: numeric("avg_order_value", { precision: 10, scale: 2 }).default("0"),
  orderCount: integer("order_count").default(0),
  
  // Engagement Metrics
  emailsSent: integer("emails_sent").default(0),
  emailOpens: integer("email_opens").default(0),
  emailClicks: integer("email_clicks").default(0),
  conversions: integer("conversions").default(0),
  
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => [
  index('segment_analytics_user_id_idx').on(table.userId),
  index('segment_analytics_segment_id_idx').on(table.segmentId),
  index('segment_analytics_period_idx').on(table.periodStart, table.periodEnd),
]);

// Insert schemas for Dynamic Segmentation
export const insertCustomerSegmentSchema = createInsertSchema(customerSegments).omit({
  id: true,
  memberCount: true,
  lastCalculatedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSegmentMemberSchema = createInsertSchema(customerSegmentMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerProfileSchema = createInsertSchema(customerProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSegmentAnalyticsSchema = createInsertSchema(segmentAnalytics).omit({
  id: true,
  createdAt: true,
});

// Types for advanced notification preferences
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;
export type NotificationRule = typeof notificationRules.$inferSelect;
export type InsertNotificationRule = z.infer<typeof insertNotificationRuleSchema>;
export type NotificationChannel = typeof notificationChannels.$inferSelect;
export type InsertNotificationChannel = z.infer<typeof insertNotificationChannelSchema>;
export type NotificationAnalytics = typeof notificationAnalytics.$inferSelect;
export type InsertNotificationAnalytics = z.infer<typeof insertNotificationAnalyticsSchema>;

// New Settings Types
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type IntegrationSettings = typeof integrationSettings.$inferSelect;
export type InsertIntegrationSettings = z.infer<typeof insertIntegrationSettingsSchema>;
export type SecuritySettings = typeof securitySettings.$inferSelect;
export type InsertSecuritySettings = z.infer<typeof insertSecuritySettingsSchema>;
export type LoginLog = typeof loginLogs.$inferSelect;
export type InsertLoginLog = z.infer<typeof insertLoginLogSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type AiGenerationHistory = typeof aiGenerationHistory.$inferSelect;
export type InsertAiGenerationHistory = z.infer<typeof insertAiGenerationHistorySchema>;
export type AbTest = typeof abTests.$inferSelect;
export type InsertAbTest = z.infer<typeof insertAbTestSchema>;
export type ProductHistory = typeof productHistory.$inferSelect;
export type InsertProductHistory = z.infer<typeof insertProductHistorySchema>;

// Performance Tracking & Self-Learning Types
export type ContentPerformance = typeof contentPerformance.$inferSelect;
export type InsertContentPerformance = z.infer<typeof insertContentPerformanceSchema>;
export type LearningPattern = typeof learningPatterns.$inferSelect;
export type InsertLearningPattern = z.infer<typeof insertLearningPatternSchema>;
export type ContentQualityScore = typeof contentQualityScores.$inferSelect;
export type InsertContentQualityScore = z.infer<typeof insertContentQualityScoreSchema>;

// Autonomous Marketing Automation Types
export type MarketingAutomationRule = typeof marketingAutomationRules.$inferSelect;
export type InsertMarketingAutomationRule = z.infer<typeof insertMarketingAutomationRuleSchema>;
export type AbTestResult = typeof abTestResults.$inferSelect;
export type InsertAbTestResult = z.infer<typeof insertAbTestResultSchema>;

// Product Copy A/B Testing Types
export type ProductCopyAbTest = typeof productCopyAbTests.$inferSelect;
export type InsertProductCopyAbTest = z.infer<typeof insertProductCopyAbTestSchema>;
export type ProductCopyAbVariant = typeof productCopyAbVariants.$inferSelect;
export type InsertProductCopyAbVariant = z.infer<typeof insertProductCopyAbVariantSchema>;
export type CopyLearningInsight = typeof copyLearningInsights.$inferSelect;
export type InsertCopyLearningInsight = z.infer<typeof insertCopyLearningInsightSchema>;

export type CustomerEngagementHistory = typeof customerEngagementHistory.$inferSelect;
export type InsertCustomerEngagementHistory = z.infer<typeof insertCustomerEngagementHistorySchema>;
export type SendTimePreferences = typeof sendTimePreferences.$inferSelect;
export type InsertSendTimePreferences = z.infer<typeof insertSendTimePreferencesSchema>;
export type CartRecoverySequence = typeof cartRecoverySequences.$inferSelect;
export type InsertCartRecoverySequence = z.infer<typeof insertCartRecoverySequenceSchema>;

// Bulk Optimization Types
export type BulkOptimizationJob = typeof bulkOptimizationJobs.$inferSelect;
export type InsertBulkOptimizationJob = z.infer<typeof insertBulkOptimizationJobSchema>;
export type BulkOptimizationItem = typeof bulkOptimizationItems.$inferSelect;
export type InsertBulkOptimizationItem = z.infer<typeof insertBulkOptimizationItemSchema>;

// Bulk Image Optimization Types
export type BulkImageJob = typeof bulkImageJobs.$inferSelect;
export type InsertBulkImageJob = z.infer<typeof insertBulkImageJobSchema>;
export type BulkImageJobItem = typeof bulkImageJobItems.$inferSelect;
export type InsertBulkImageJobItem = z.infer<typeof insertBulkImageJobItemSchema>;
export type ImageOptimizationHistory = typeof imageOptimizationHistory.$inferSelect;
export type InsertImageOptimizationHistory = z.infer<typeof insertImageOptimizationHistorySchema>;

// Brand DNA & Template System Types
export type BrandDnaProfile = typeof brandDnaProfiles.$inferSelect;
export type InsertBrandDnaProfile = z.infer<typeof insertBrandDnaProfileSchema>;
export type BrandDnaEditPattern = typeof brandDnaEditPatterns.$inferSelect;
export type InsertBrandDnaEditPattern = z.infer<typeof insertBrandDnaEditPatternSchema>;
export type MarketingFrameworkUsage = typeof marketingFrameworkUsage.$inferSelect;
export type InsertMarketingFrameworkUsage = z.infer<typeof insertMarketingFrameworkUsageSchema>;
export type TemplateRecommendation = typeof templateRecommendations.$inferSelect;
export type InsertTemplateRecommendation = z.infer<typeof insertTemplateRecommendationSchema>;

// Dynamic Customer Segmentation Types
export type CustomerSegment = typeof customerSegments.$inferSelect;
export type InsertCustomerSegment = z.infer<typeof insertCustomerSegmentSchema>;
export type CustomerSegmentMember = typeof customerSegmentMembers.$inferSelect;
export type InsertCustomerSegmentMember = z.infer<typeof insertCustomerSegmentMemberSchema>;
export type CustomerProfile = typeof customerProfiles.$inferSelect;
export type InsertCustomerProfile = z.infer<typeof insertCustomerProfileSchema>;
export type SegmentAnalytics = typeof segmentAnalytics.$inferSelect;
export type InsertSegmentAnalytics = z.infer<typeof insertSegmentAnalyticsSchema>;

// ============================================
// CMS / Admin Content Management Tables
// ============================================

// Landing page content for CMS
export const cmsLandingContent = pgTable("cms_landing_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  heroHeadline: text("hero_headline").notNull(),
  heroSubheadline: text("hero_subheadline").notNull(),
  ctaButtonText: text("cta_button_text").notNull(),
  featureHighlights: jsonb("feature_highlights").notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

// System announcements
export const cmsAnnouncements = pgTable("cms_announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"), // 'info' | 'warning' | 'success'
  targetAudience: text("target_audience").notNull().default("all"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('cms_announcements_active_idx').on(table.active),
  index('cms_announcements_dates_idx').on(table.startDate, table.endDate),
]);

// AI/Notification templates
export const cmsAiTemplates = pgTable("cms_ai_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  subject: text("subject"),
  body: text("body").notNull(),
  type: text("type").notNull().default("email"), // 'email' | 'sms' | 'push'
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

// Blog posts for content marketing
export const cmsBlogPosts = pgTable("cms_blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").unique(),
  excerpt: text("excerpt"),
  content: text("content"),
  status: text("status").notNull().default("draft"), // 'draft' | 'published'
  author: text("author"),
  featuredImage: text("featured_image"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
  publishedAt: timestamp("published_at"),
}, (table) => [
  index('cms_blog_posts_status_idx').on(table.status),
  index('cms_blog_posts_published_at_idx').on(table.publishedAt),
]);

// FAQ items
export const cmsFaqs = pgTable("cms_faqs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('cms_faqs_order_idx').on(table.order),
  index('cms_faqs_active_idx').on(table.active),
]);

// Legal pages (Terms, Privacy, etc.)
export const cmsLegalPages = pgTable("cms_legal_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  path: text("path").notNull(),
  content: text("content"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

// CMS Insert Schemas
export const insertCmsLandingContentSchema = createInsertSchema(cmsLandingContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCmsAnnouncementSchema = createInsertSchema(cmsAnnouncements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCmsAiTemplateSchema = createInsertSchema(cmsAiTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCmsBlogPostSchema = createInsertSchema(cmsBlogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCmsFaqSchema = createInsertSchema(cmsFaqs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCmsLegalPageSchema = createInsertSchema(cmsLegalPages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// CMS Types
export type CmsLandingContent = typeof cmsLandingContent.$inferSelect;
export type InsertCmsLandingContent = z.infer<typeof insertCmsLandingContentSchema>;
export type CmsAnnouncement = typeof cmsAnnouncements.$inferSelect;
export type InsertCmsAnnouncement = z.infer<typeof insertCmsAnnouncementSchema>;
export type CmsAiTemplate = typeof cmsAiTemplates.$inferSelect;
export type InsertCmsAiTemplate = z.infer<typeof insertCmsAiTemplateSchema>;
export type CmsBlogPost = typeof cmsBlogPosts.$inferSelect;
export type InsertCmsBlogPost = z.infer<typeof insertCmsBlogPostSchema>;
export type CmsFaq = typeof cmsFaqs.$inferSelect;
export type InsertCmsFaq = z.infer<typeof insertCmsFaqSchema>;
export type CmsLegalPage = typeof cmsLegalPages.$inferSelect;
export type InsertCmsLegalPage = z.infer<typeof insertCmsLegalPageSchema>;

// Brand Voice Transformation Status Enum
export const brandVoiceStatusEnum = pgEnum('brand_voice_status', ['pending', 'preview', 'approved', 'rejected', 'applied']);

// Brand Voice Transformations - Track product copy transformations with preview/approval flow
export const brandVoiceTransformations = pgTable("brand_voice_transformations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  
  // Brand Voice Selection
  brandVoice: text("brand_voice").notNull(), // 'luxury' | 'friendly' | 'bold' | 'minimal' | 'energetic' | 'professional'
  
  // Original Content
  originalDescription: text("original_description"),
  originalFeatures: jsonb("original_features").default(sql`'[]'::jsonb`),
  originalCta: text("original_cta"),
  originalMicrocopy: text("original_microcopy"),
  
  // Transformed Content (Preview)
  transformedDescription: text("transformed_description"),
  transformedFeatures: jsonb("transformed_features").default(sql`'[]'::jsonb`),
  transformedCta: text("transformed_cta"),
  transformedMicrocopy: text("transformed_microcopy"),
  
  // Status & Flow
  status: brandVoiceStatusEnum("status").notNull().default("pending"),
  appliedToShopify: boolean("applied_to_shopify").default(false),
  appliedAt: timestamp("applied_at"),
  
  // Metadata
  tokensUsed: integer("tokens_used").default(0),
  processingTimeMs: integer("processing_time_ms"),
  
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('brand_voice_transform_user_id_idx').on(table.userId),
  index('brand_voice_transform_product_id_idx').on(table.productId),
  index('brand_voice_transform_status_idx').on(table.status),
  index('brand_voice_transform_brand_voice_idx').on(table.brandVoice),
]);

export const insertBrandVoiceTransformationSchema = createInsertSchema(brandVoiceTransformations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type BrandVoiceTransformation = typeof brandVoiceTransformations.$inferSelect;
export type InsertBrandVoiceTransformation = z.infer<typeof insertBrandVoiceTransformationSchema>;

// Re-export chat models for AI integrations
export * from "./models/chat";
