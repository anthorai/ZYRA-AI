import { db } from '../db';
import { autonomousRules, automationSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Default Autonomous Rules
 * These rules are created globally and can be enabled by users
 */

export const defaultRules = [
  {
    name: 'Auto-Optimize Low SEO Products',
    description: 'Automatically optimize products with SEO score below 70',
    ruleJson: {
      if: {
        type: 'metric_below',
        metric: 'seo_score',
        threshold: 70,
      },
      then: [
        {
          type: 'optimize_seo',
        },
      ],
      publish: 'auto',
      priority: 100,
    },
    enabled: true,
    priority: 100,
    cooldownSeconds: 86400 * 7, // Once per week per product
    isGlobal: true,
  },
  {
    name: 'Auto-Optimize New Products',
    description: 'Automatically optimize SEO for newly added products',
    ruleJson: {
      if: {
        type: 'metric_below',
        metric: 'seo_score',
        threshold: 1, // No SEO score yet
      },
      then: [
        {
          type: 'optimize_seo',
        },
      ],
      publish: 'auto',
      priority: 90,
    },
    enabled: true,
    priority: 90,
    cooldownSeconds: 86400, // Once per day
    isGlobal: true,
  },
];

/**
 * Seed default autonomous rules
 */
export async function seedDefaultAutonomousRules(): Promise<void> {
  console.log('🌱 [Init] Seeding default autonomous rules...');

  try {
    for (const rule of defaultRules) {
      // Check if rule already exists by name
      const existing = await db
        .select()
        .from(autonomousRules)
        .where(eq(autonomousRules.name, rule.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(autonomousRules).values({
          userId: null, // Global rule
          name: rule.name,
          description: rule.description,
          ruleJson: rule.ruleJson as any,
          enabled: rule.enabled,
          priority: rule.priority,
          cooldownSeconds: rule.cooldownSeconds,
          isGlobal: rule.isGlobal,
        });

        console.log(`✅ [Init] Created default rule: ${rule.name}`);
      } else {
        console.log(`⏭️  [Init] Rule already exists: ${rule.name}`);
      }
    }

    console.log('✅ [Init] Default autonomous rules seeded');
  } catch (error) {
    console.error('❌ [Init] Error seeding default rules:', error);
  }
}

/**
 * Initialize automation settings for a user
 */
export async function initializeUserAutomationSettings(userId: string): Promise<void> {
  console.log(`🌱 [Init] Initializing automation settings for user ${userId}...`);

  try {
    // Check if settings already exist
    const existing = await db
      .select()
      .from(automationSettings)
      .where(eq(automationSettings.userId, userId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(automationSettings).values({
        userId,
        autopilotEnabled: false, // Disabled by default
        autopilotMode: 'safe',
        autoPublishEnabled: false,
        maxDailyActions: 10,
        maxCatalogChangePercent: 5,
        enabledActionTypes: ['optimize_seo'] as any,
        notificationPreferences: {
          email_daily_summary: true,
          email_action_alerts: true,
        } as any,
      });

      console.log(`✅ [Init] Created automation settings for user ${userId}`);
    } else {
      console.log(`⏭️  [Init] Automation settings already exist for user ${userId}`);
    }
  } catch (error) {
    console.error(`❌ [Init] Error initializing automation settings for user ${userId}:`, error);
  }
}
