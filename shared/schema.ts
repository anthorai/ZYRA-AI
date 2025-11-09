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

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password"), // Optional for Supabase-only users
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("user"),
  plan: text("plan").notNull().default("trial"),
  trialEndDate: timestamp("trial_end_date").default(sql`NOW() + INTERVAL '7 days'`),
  imageUrl: text("image_url"),
  preferredLanguage: text("preferred_language").default("en"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  shopifyId: text("shopify_id"),
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

export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'email' | 'sms'
  name: text("name").notNull(),
  subject: text("subject"),
  content: text("content").notNull(),
  templateId: varchar("template_id"),
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

export const campaignTemplates = pgTable("campaign_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'email' | 'sms'
  subject: text("subject"),
  content: text("content").notNull(),
  variables: jsonb("variables"), // template variable placeholders
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('campaign_templates_user_id_idx').on(table.userId),
  index('campaign_templates_created_at_idx').on(table.createdAt),
]);

export const abandonedCarts = pgTable("abandoned_carts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  cartItems: jsonb("cart_items").notNull(),
  cartValue: numeric("cart_value", { precision: 10, scale: 2 }).notNull(),
  recoveryCampaignSent: boolean("recovery_campaign_sent").default(false),
  recoveredAt: timestamp("recovered_at"),
  isRecovered: boolean("is_recovered").default(false),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('abandoned_carts_user_id_idx').on(table.userId),
  index('abandoned_carts_is_recovered_idx').on(table.isRecovered),
  index('abandoned_carts_recovery_campaign_sent_idx').on(table.recoveryCampaignSent),
  index('abandoned_carts_created_at_idx').on(table.createdAt),
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
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => [
  index('subscriptions_user_id_idx').on(table.userId),
  index('subscriptions_status_idx').on(table.status),
  index('subscriptions_current_period_end_idx').on(table.currentPeriodEnd),
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
  status: text("status").notNull().default("active"), // 'active' | 'inactive' | 'error'
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

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignEventSchema = createInsertSchema(campaignEvents).omit({
  id: true,
  createdAt: true,
});

export const insertTrackingTokenSchema = createInsertSchema(trackingTokens).omit({
  id: true,
  createdAt: true,
});

export const insertCampaignTemplateSchema = createInsertSchema(campaignTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
export type CampaignTemplate = typeof campaignTemplates.$inferSelect;
export type InsertCampaignTemplate = z.infer<typeof insertCampaignTemplateSchema>;
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
