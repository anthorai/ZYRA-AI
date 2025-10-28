CREATE TYPE "public"."integration_type" AS ENUM('email', 'sms', 'analytics', 'automation');--> statement-breakpoint
CREATE TYPE "public"."notification_category" AS ENUM('campaigns', 'products', 'billing', 'security', 'ai_insights', 'system');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('email', 'sms', 'in_app', 'push');--> statement-breakpoint
CREATE TYPE "public"."notification_frequency" AS ENUM('instant', 'hourly_digest', 'daily_digest', 'weekly_summary');--> statement-breakpoint
CREATE TYPE "public"."notification_preset" AS ENUM('work', 'focus', 'full_alerts', 'custom');--> statement-breakpoint
CREATE TYPE "public"."notification_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."payment_gateway" AS ENUM('razorpay', 'paypal');--> statement-breakpoint
CREATE TYPE "public"."payment_method_type" AS ENUM('card', 'upi', 'netbanking', 'wallet', 'bank_transfer');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."support_ticket_category" AS ENUM('bug', 'feature', 'billing', 'general');--> statement-breakpoint
CREATE TYPE "public"."support_ticket_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."support_ticket_status" AS ENUM('open', 'in_progress', 'resolved', 'closed');--> statement-breakpoint
CREATE TABLE "ab_tests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"test_name" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"duration" integer,
	"participants" integer DEFAULT 0,
	"variant_a_data" jsonb,
	"variant_b_data" jsonb,
	"winner" text,
	"significance" numeric(5, 2),
	"improvement" numeric(5, 2),
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "abandoned_carts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text,
	"cart_items" jsonb NOT NULL,
	"cart_value" numeric(10, 2) NOT NULL,
	"recovery_campaign_sent" boolean DEFAULT false,
	"recovered_at" timestamp,
	"is_recovered" boolean DEFAULT false,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"action" text NOT NULL,
	"description" text NOT NULL,
	"metadata" jsonb,
	"tool_used" text,
	"created_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "ai_generation_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"generation_type" text NOT NULL,
	"input_data" jsonb NOT NULL,
	"output_data" jsonb NOT NULL,
	"brand_voice" text,
	"tokens_used" integer,
	"model" text DEFAULT 'gpt-4o-mini',
	"created_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"metric_type" text NOT NULL,
	"value" integer NOT NULL,
	"date" timestamp DEFAULT NOW(),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "billing_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"subscription_id" varchar,
	"invoice_id" varchar,
	"action" text NOT NULL,
	"amount" numeric(10, 2),
	"currency" text DEFAULT 'USD',
	"status" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "campaign_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"recipient_email" text NOT NULL,
	"event_type" text NOT NULL,
	"event_url" text,
	"ip_address" text,
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "campaign_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"subject" text,
	"content" text NOT NULL,
	"variables" jsonb,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"subject" text,
	"content" text NOT NULL,
	"template_id" varchar,
	"status" text DEFAULT 'draft' NOT NULL,
	"scheduled_for" timestamp,
	"sent_at" timestamp,
	"sent_count" integer DEFAULT 0,
	"open_rate" integer DEFAULT 0,
	"click_rate" integer DEFAULT 0,
	"conversion_rate" integer DEFAULT 0,
	"recipient_list" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "error_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"error_type" text NOT NULL,
	"message" text NOT NULL,
	"stack" text,
	"endpoint" text,
	"method" text,
	"status_code" integer,
	"request_body" jsonb,
	"user_agent" text,
	"ip_address" text,
	"metadata" jsonb,
	"resolved" boolean DEFAULT false,
	"resolved_at" timestamp,
	"resolved_by" varchar,
	"created_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "integration_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"integration_type" text NOT NULL,
	"provider" text NOT NULL,
	"settings" jsonb NOT NULL,
	"credentials" jsonb,
	"is_active" boolean DEFAULT true,
	"last_sync" timestamp,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"subscription_id" varchar,
	"gateway_invoice_id" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" text NOT NULL,
	"invoice_number" text,
	"invoice_url" text,
	"pdf_url" text,
	"due_date" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT NOW(),
	CONSTRAINT "invoices_gateway_invoice_id_unique" UNIQUE("gateway_invoice_id")
);
--> statement-breakpoint
CREATE TABLE "login_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"ip_address" text NOT NULL,
	"user_agent" text,
	"location" text,
	"success" boolean NOT NULL,
	"failure_reason" text,
	"created_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "notification_analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"notification_id" varchar,
	"category" text NOT NULL,
	"channel_type" text NOT NULL,
	"delivered" boolean DEFAULT false,
	"delivered_at" timestamp,
	"viewed" boolean DEFAULT false,
	"viewed_at" timestamp,
	"clicked" boolean DEFAULT false,
	"clicked_at" timestamp,
	"dismissed" boolean DEFAULT false,
	"dismissed_at" timestamp,
	"created_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "notification_channels" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"channel_type" text NOT NULL,
	"channel_value" text,
	"device_info" jsonb,
	"enabled" boolean DEFAULT true,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"active_preset" text DEFAULT 'full_alerts' NOT NULL,
	"enable_digests" boolean DEFAULT false,
	"default_frequency" text DEFAULT 'instant' NOT NULL,
	"digest_time" text DEFAULT '09:00',
	"min_priority" text DEFAULT 'low' NOT NULL,
	"enable_quiet_hours" boolean DEFAULT false,
	"quiet_hours_start" text DEFAULT '22:00',
	"quiet_hours_end" text DEFAULT '08:00',
	"allow_urgent_in_quiet_hours" boolean DEFAULT true,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW(),
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "notification_rules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"category" text NOT NULL,
	"enabled" boolean DEFAULT true,
	"channels" jsonb NOT NULL,
	"frequency" text DEFAULT 'instant' NOT NULL,
	"min_priority" text DEFAULT 'low' NOT NULL,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text DEFAULT 'info' NOT NULL,
	"is_read" boolean DEFAULT false,
	"action_url" text,
	"action_label" text,
	"created_at" timestamp DEFAULT NOW(),
	"read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"gateway_payment_method_id" text NOT NULL,
	"type" text NOT NULL,
	"card_brand" text,
	"card_last4" text,
	"card_exp_month" integer,
	"card_exp_year" integer,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW(),
	CONSTRAINT "payment_methods_gateway_payment_method_id_unique" UNIQUE("gateway_payment_method_id")
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"gateway" text NOT NULL,
	"gateway_transaction_id" text NOT NULL,
	"gateway_order_id" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" text NOT NULL,
	"payment_method" text,
	"payment_details" jsonb,
	"description" text,
	"invoice_id" varchar,
	"subscription_id" varchar,
	"signature" text,
	"webhook_received" boolean DEFAULT false,
	"webhook_data" jsonb,
	"refund_amount" numeric(10, 2),
	"refund_reason" text,
	"refunded_at" timestamp,
	"error_code" text,
	"error_message" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "product_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"product_name" text NOT NULL,
	"change_date" timestamp DEFAULT NOW(),
	"change_type" text NOT NULL,
	"changed_by" text NOT NULL,
	"changes" jsonb NOT NULL,
	"can_rollback" boolean DEFAULT true,
	"created_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"shopify_id" text,
	"name" text NOT NULL,
	"description" text,
	"original_description" text,
	"original_copy" jsonb,
	"price" numeric(10, 2) NOT NULL,
	"category" text NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"image" text,
	"features" text,
	"tags" text,
	"optimized_copy" jsonb,
	"is_optimized" boolean DEFAULT false,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text,
	"bio" text,
	"profile_image" text,
	"preferences" jsonb,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW(),
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "realtime_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"metric_name" text NOT NULL,
	"value" text NOT NULL,
	"change_percent" text,
	"is_positive" boolean DEFAULT true,
	"timestamp" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "security_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"two_factor_enabled" boolean DEFAULT false,
	"two_factor_secret" text,
	"backup_codes" jsonb,
	"login_notifications" boolean DEFAULT true,
	"session_timeout" integer DEFAULT 3600,
	"last_password_change" timestamp DEFAULT NOW(),
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW(),
	CONSTRAINT "security_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "seo_meta" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar NOT NULL,
	"seo_title" text,
	"meta_description" text,
	"keywords" text,
	"optimized_title" text,
	"optimized_meta" text,
	"seo_score" integer,
	"created_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"user_id" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT NOW(),
	CONSTRAINT "sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "store_connections" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"platform" text NOT NULL,
	"store_name" text NOT NULL,
	"store_url" text,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"status" text DEFAULT 'active' NOT NULL,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_name" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"interval" text DEFAULT 'month' NOT NULL,
	"features" jsonb NOT NULL,
	"limits" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT NOW(),
	CONSTRAINT "subscription_plans_plan_name_unique" UNIQUE("plan_name")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"plan_id" varchar NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"start_date" timestamp DEFAULT NOW(),
	"end_date" timestamp,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"category" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "sync_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"store_connection_id" varchar,
	"sync_type" text NOT NULL,
	"status" text NOT NULL,
	"products_added" integer DEFAULT 0,
	"products_updated" integer DEFAULT 0,
	"products_deleted" integer DEFAULT 0,
	"error_message" text,
	"started_at" timestamp DEFAULT NOW(),
	"completed_at" timestamp,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "tools_access" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"tool_name" text NOT NULL,
	"access_count" integer DEFAULT 1,
	"last_accessed" timestamp DEFAULT NOW(),
	"first_accessed" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "tracking_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"campaign_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"recipient_email" text NOT NULL,
	"created_at" timestamp DEFAULT NOW(),
	CONSTRAINT "tracking_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "usage_stats" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"credits_used" integer DEFAULT 0,
	"credits_remaining" integer DEFAULT 0,
	"total_revenue" integer DEFAULT 0,
	"total_orders" integer DEFAULT 0,
	"conversion_rate" integer DEFAULT 0,
	"cart_recovery_rate" integer DEFAULT 0,
	"products_count" integer DEFAULT 0,
	"products_optimized" integer DEFAULT 0,
	"emails_sent" integer DEFAULT 0,
	"emails_remaining" integer DEFAULT 0,
	"sms_sent" integer DEFAULT 0,
	"sms_remaining" integer DEFAULT 0,
	"ai_generations_used" integer DEFAULT 0,
	"seo_optimizations_used" integer DEFAULT 0,
	"last_updated" timestamp DEFAULT NOW(),
	"last_reset_date" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"ai_settings" jsonb,
	"notification_settings" jsonb,
	"ui_preferences" jsonb,
	"privacy_settings" jsonb,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW(),
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text,
	"full_name" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"plan" text DEFAULT 'trial' NOT NULL,
	"trial_end_date" timestamp DEFAULT NOW() + INTERVAL '7 days',
	"image_url" text,
	"preferred_language" text DEFAULT 'en',
	"created_at" timestamp DEFAULT NOW(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ab_tests" ADD CONSTRAINT "ab_tests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "abandoned_carts" ADD CONSTRAINT "abandoned_carts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generation_history" ADD CONSTRAINT "ai_generation_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics" ADD CONSTRAINT "analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_history" ADD CONSTRAINT "billing_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_history" ADD CONSTRAINT "billing_history_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_history" ADD CONSTRAINT "billing_history_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_events" ADD CONSTRAINT "campaign_events_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_events" ADD CONSTRAINT "campaign_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_templates" ADD CONSTRAINT "campaign_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD CONSTRAINT "integration_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_logs" ADD CONSTRAINT "login_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_analytics" ADD CONSTRAINT "notification_analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_analytics" ADD CONSTRAINT "notification_analytics_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_channels" ADD CONSTRAINT "notification_channels_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_rules" ADD CONSTRAINT "notification_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_history" ADD CONSTRAINT "product_history_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_history" ADD CONSTRAINT "product_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "realtime_metrics" ADD CONSTRAINT "realtime_metrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_settings" ADD CONSTRAINT "security_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_meta" ADD CONSTRAINT "seo_meta_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_connections" ADD CONSTRAINT "store_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_history" ADD CONSTRAINT "sync_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_history" ADD CONSTRAINT "sync_history_store_connection_id_store_connections_id_fk" FOREIGN KEY ("store_connection_id") REFERENCES "public"."store_connections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tools_access" ADD CONSTRAINT "tools_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_tokens" ADD CONSTRAINT "tracking_tokens_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_tokens" ADD CONSTRAINT "tracking_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_stats" ADD CONSTRAINT "usage_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ab_tests_user_id_idx" ON "ab_tests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ab_tests_status_idx" ON "ab_tests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "abandoned_carts_user_id_idx" ON "abandoned_carts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "abandoned_carts_is_recovered_idx" ON "abandoned_carts" USING btree ("is_recovered");--> statement-breakpoint
CREATE INDEX "abandoned_carts_recovery_campaign_sent_idx" ON "abandoned_carts" USING btree ("recovery_campaign_sent");--> statement-breakpoint
CREATE INDEX "abandoned_carts_created_at_idx" ON "abandoned_carts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "activity_logs_user_date_idx" ON "activity_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_generation_history_user_date_idx" ON "ai_generation_history" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "analytics_user_metric_date_idx" ON "analytics" USING btree ("user_id","metric_type","date");--> statement-breakpoint
CREATE INDEX "billing_history_user_id_idx" ON "billing_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "billing_history_created_at_idx" ON "billing_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "campaign_events_campaign_id_idx" ON "campaign_events" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_events_recipient_email_idx" ON "campaign_events" USING btree ("recipient_email");--> statement-breakpoint
CREATE INDEX "campaign_events_event_type_idx" ON "campaign_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "campaign_events_created_at_idx" ON "campaign_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_events_unique_idx" ON "campaign_events" USING btree ("campaign_id","recipient_email","event_type");--> statement-breakpoint
CREATE INDEX "campaign_templates_user_id_idx" ON "campaign_templates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "campaign_templates_created_at_idx" ON "campaign_templates" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "campaigns_user_id_idx" ON "campaigns" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "campaigns_status_idx" ON "campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "campaigns_scheduled_for_idx" ON "campaigns" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "campaigns_created_at_idx" ON "campaigns" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "error_logs_user_id_idx" ON "error_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "error_logs_error_type_idx" ON "error_logs" USING btree ("error_type");--> statement-breakpoint
CREATE INDEX "error_logs_created_at_idx" ON "error_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "error_logs_resolved_idx" ON "error_logs" USING btree ("resolved");--> statement-breakpoint
CREATE UNIQUE INDEX "integration_settings_unique_user_integration_idx" ON "integration_settings" USING btree ("user_id","integration_type","provider");--> statement-breakpoint
CREATE INDEX "integration_settings_user_id_idx" ON "integration_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invoices_user_id_idx" ON "invoices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoices_created_at_idx" ON "invoices" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "login_logs_user_date_idx" ON "login_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "notification_analytics_user_id_idx" ON "notification_analytics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_analytics_category_idx" ON "notification_analytics" USING btree ("category");--> statement-breakpoint
CREATE INDEX "notification_channels_user_id_idx" ON "notification_channels" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_channels_type_idx" ON "notification_channels" USING btree ("channel_type");--> statement-breakpoint
CREATE INDEX "notification_preferences_user_id_idx" ON "notification_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_rules_user_category_idx" ON "notification_rules" USING btree ("user_id","category");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_rules_user_category_unique" ON "notification_rules" USING btree ("user_id","category");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_is_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "payment_methods_user_id_idx" ON "payment_methods" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payment_transactions_user_id_idx" ON "payment_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payment_transactions_gateway_idx" ON "payment_transactions" USING btree ("gateway");--> statement-breakpoint
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payment_transactions_created_at_idx" ON "payment_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "product_history_product_id_idx" ON "product_history" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_history_user_id_idx" ON "product_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "product_history_change_date_idx" ON "product_history" USING btree ("change_date");--> statement-breakpoint
CREATE INDEX "products_user_id_idx" ON "products" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "products_is_optimized_idx" ON "products" USING btree ("is_optimized");--> statement-breakpoint
CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "realtime_metrics_user_id_idx" ON "realtime_metrics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "realtime_metrics_timestamp_idx" ON "realtime_metrics" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "store_connections_user_id_idx" ON "store_connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "store_connections_status_idx" ON "store_connections" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscriptions_current_period_end_idx" ON "subscriptions" USING btree ("current_period_end");--> statement-breakpoint
CREATE INDEX "support_tickets_user_id_idx" ON "support_tickets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sync_history_user_id_idx" ON "sync_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sync_history_status_idx" ON "sync_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sync_history_started_at_idx" ON "sync_history" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "sync_history_store_connection_id_idx" ON "sync_history" USING btree ("store_connection_id");--> statement-breakpoint
CREATE INDEX "tools_access_user_id_idx" ON "tools_access" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tools_access_last_accessed_idx" ON "tools_access" USING btree ("last_accessed");--> statement-breakpoint
CREATE INDEX "tracking_tokens_token_idx" ON "tracking_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "tracking_tokens_campaign_id_idx" ON "tracking_tokens" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "usage_stats_user_id_idx" ON "usage_stats" USING btree ("user_id");