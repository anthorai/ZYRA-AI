import { db } from "../db";
import { eq, and, or, sql, desc, asc, inArray, notInArray, gte, lte, gt } from "drizzle-orm";
import { 
  products, 
  upsellReceiptSettings, 
  upsellRecommendationRules,
  upsellReceiptAnalytics,
  upsellReceiptAbTests 
} from "@shared/schema";
import crypto from "crypto";

function getDb() {
  if (!db) throw new Error("Database connection not available");
  return db;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
}

export interface Order {
  id: string;
  customerEmail: string;
  totalAmount: number;
  items: OrderItem[];
  shopifyOrderId?: string;
}

export interface ProductRecommendation {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  image?: string;
  category: string;
  reason: string;
  trackingUrl: string;
}

export interface RecommendationResult {
  recommendations: ProductRecommendation[];
  ruleUsed?: string;
  abTestVariant?: string;
}

export class UpsellRecommendationEngine {
  
  async getSettings(userId: string) {
    const database = getDb();
    const settings = await database.query.upsellReceiptSettings.findFirst({
      where: eq(upsellReceiptSettings.userId, userId)
    });
    return settings;
  }

  async getOrCreateSettings(userId: string) {
    const database = getDb();
    let settings = await this.getSettings(userId);
    
    if (!settings) {
      const [newSettings] = await database.insert(upsellReceiptSettings)
        .values({ userId })
        .returning();
      settings = newSettings;
    }
    
    return settings;
  }

  async updateSettings(userId: string, data: Partial<typeof upsellReceiptSettings.$inferInsert>) {
    const database = getDb();
    const [updated] = await database.update(upsellReceiptSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(upsellReceiptSettings.userId, userId))
      .returning();
    return updated;
  }

  async getActiveRules(userId: string) {
    const database = getDb();
    const rules = await database.query.upsellRecommendationRules.findMany({
      where: and(
        eq(upsellRecommendationRules.userId, userId),
        eq(upsellRecommendationRules.isActive, true)
      ),
      orderBy: [desc(upsellRecommendationRules.priority)]
    });
    return rules;
  }

  async selectAbTestVariant(userId: string): Promise<{ variant: string; testId: string } | null> {
    const database = getDb();
    const activeTest = await database.query.upsellReceiptAbTests.findFirst({
      where: and(
        eq(upsellReceiptAbTests.userId, userId),
        eq(upsellReceiptAbTests.status, "active")
      )
    });

    if (!activeTest) return null;

    const random = Math.random() * 100;
    const controlThreshold = activeTest.controlTrafficPercent || 34;
    const variantAThreshold = controlThreshold + (activeTest.variantATrafficPercent || 33);

    let variant: string;
    if (random < controlThreshold) {
      variant = "control";
    } else if (random < variantAThreshold) {
      variant = "variantA";
    } else {
      variant = "variantB";
    }

    return { variant, testId: activeTest.id };
  }

  async getRecommendations(
    userId: string,
    order: Order,
    baseUrl: string
  ): Promise<RecommendationResult> {
    const settings = await this.getSettings(userId);
    
    if (!settings || !settings.isEnabled) {
      return { recommendations: [] };
    }

    const abTestResult = await this.selectAbTestVariant(userId);
    const strategy = settings.recommendationStrategy || "category_match";
    const maxRecs = settings.maxRecommendations || 3;
    const discountPercent = settings.defaultDiscountPercent || 15;

    const orderCategories = [...new Set(order.items.map(item => item.category).filter(Boolean))];
    const orderProductIds = order.items.map(item => item.productId);
    const avgOrderPrice = order.totalAmount / order.items.length;

    let recommendedProducts: any[] = [];
    let ruleUsed: string | undefined;

    const rules = await this.getActiveRules(userId);
    
    for (const rule of rules) {
      if (recommendedProducts.length >= maxRecs) break;

      const matchesRule = this.checkRuleMatch(rule, order);
      if (!matchesRule) continue;

      const ruleProducts = await this.getProductsForRule(userId, rule, orderProductIds, maxRecs - recommendedProducts.length);
      recommendedProducts.push(...ruleProducts);
      ruleUsed = rule.id;
    }

    if (recommendedProducts.length < maxRecs) {
      const fallbackProducts = await this.getFallbackRecommendations(
        userId, 
        orderCategories as string[], 
        avgOrderPrice, 
        orderProductIds,
        settings.priceRangePercent || 50,
        maxRecs - recommendedProducts.length
      );
      recommendedProducts.push(...fallbackProducts);
    }

    const excludeCategories = (settings.excludeCategories as string[] | null) || [];
    recommendedProducts = recommendedProducts.filter(
      p => !excludeCategories.includes(p.category)
    );

    const trackingToken = crypto.randomBytes(16).toString("hex");
    const database = getDb();
    
    await database.insert(upsellReceiptAnalytics).values({
      userId,
      orderId: order.shopifyOrderId || order.id,
      customerEmail: order.customerEmail,
      originalOrderAmount: String(order.totalAmount),
      recommendedProductIds: recommendedProducts.map(p => p.id),
      recommendedProducts: recommendedProducts,
      ruleIdUsed: ruleUsed,
      emailSentAt: new Date(),
      clickTrackingToken: trackingToken,
      abTestId: abTestResult?.testId,
      abTestVariant: abTestResult?.variant,
    });

    if (abTestResult) {
      await this.incrementAbTestMetric(abTestResult.testId, abTestResult.variant, "sent");
    }

    const recommendations: ProductRecommendation[] = recommendedProducts.slice(0, maxRecs).map((product, index) => ({
      id: product.id,
      name: product.name,
      price: Number(product.price) * (1 - discountPercent / 100),
      originalPrice: Number(product.price),
      discountPercent,
      image: product.image,
      category: product.category,
      reason: this.getRecommendationReason(product, orderCategories as string[]),
      trackingUrl: `${baseUrl}/api/upsell/click/${trackingToken}?product=${product.id}&index=${index}`,
    }));

    return {
      recommendations,
      ruleUsed,
      abTestVariant: abTestResult?.variant,
    };
  }

  private async incrementAbTestMetric(
    testId: string, 
    variant: string, 
    metric: "sent" | "clicks" | "conversions",
    amount: number = 1
  ): Promise<void> {
    const database = getDb();
    const allowedVariants = ["control", "variantA", "variantB"];
    const allowedMetrics = ["sent", "clicks", "conversions"];
    
    if (!allowedVariants.includes(variant) || !allowedMetrics.includes(metric)) {
      console.error(`Invalid A/B test update: variant=${variant}, metric=${metric}`);
      return;
    }

    if (variant === "control") {
      if (metric === "sent") {
        await database.update(upsellReceiptAbTests)
          .set({ controlSent: sql`${upsellReceiptAbTests.controlSent} + ${amount}` })
          .where(eq(upsellReceiptAbTests.id, testId));
      } else if (metric === "clicks") {
        await database.update(upsellReceiptAbTests)
          .set({ controlClicks: sql`${upsellReceiptAbTests.controlClicks} + ${amount}` })
          .where(eq(upsellReceiptAbTests.id, testId));
      } else if (metric === "conversions") {
        await database.update(upsellReceiptAbTests)
          .set({ controlConversions: sql`${upsellReceiptAbTests.controlConversions} + ${amount}` })
          .where(eq(upsellReceiptAbTests.id, testId));
      }
    } else if (variant === "variantA") {
      if (metric === "sent") {
        await database.update(upsellReceiptAbTests)
          .set({ variantASent: sql`${upsellReceiptAbTests.variantASent} + ${amount}` })
          .where(eq(upsellReceiptAbTests.id, testId));
      } else if (metric === "clicks") {
        await database.update(upsellReceiptAbTests)
          .set({ variantAClicks: sql`${upsellReceiptAbTests.variantAClicks} + ${amount}` })
          .where(eq(upsellReceiptAbTests.id, testId));
      } else if (metric === "conversions") {
        await database.update(upsellReceiptAbTests)
          .set({ variantAConversions: sql`${upsellReceiptAbTests.variantAConversions} + ${amount}` })
          .where(eq(upsellReceiptAbTests.id, testId));
      }
    } else if (variant === "variantB") {
      if (metric === "sent") {
        await database.update(upsellReceiptAbTests)
          .set({ variantBSent: sql`${upsellReceiptAbTests.variantBSent} + ${amount}` })
          .where(eq(upsellReceiptAbTests.id, testId));
      } else if (metric === "clicks") {
        await database.update(upsellReceiptAbTests)
          .set({ variantBClicks: sql`${upsellReceiptAbTests.variantBClicks} + ${amount}` })
          .where(eq(upsellReceiptAbTests.id, testId));
      } else if (metric === "conversions") {
        await database.update(upsellReceiptAbTests)
          .set({ variantBConversions: sql`${upsellReceiptAbTests.variantBConversions} + ${amount}` })
          .where(eq(upsellReceiptAbTests.id, testId));
      }
    }
  }

  private async incrementAbTestRevenue(
    testId: string, 
    variant: string, 
    amount: number
  ): Promise<void> {
    const database = getDb();
    const allowedVariants = ["control", "variantA", "variantB"];
    
    if (!allowedVariants.includes(variant)) {
      console.error(`Invalid A/B test variant for revenue: variant=${variant}`);
      return;
    }

    if (variant === "control") {
      await database.update(upsellReceiptAbTests)
        .set({ controlRevenue: sql`${upsellReceiptAbTests.controlRevenue}::numeric + ${amount}` })
        .where(eq(upsellReceiptAbTests.id, testId));
    } else if (variant === "variantA") {
      await database.update(upsellReceiptAbTests)
        .set({ variantARevenue: sql`${upsellReceiptAbTests.variantARevenue}::numeric + ${amount}` })
        .where(eq(upsellReceiptAbTests.id, testId));
    } else if (variant === "variantB") {
      await database.update(upsellReceiptAbTests)
        .set({ variantBRevenue: sql`${upsellReceiptAbTests.variantBRevenue}::numeric + ${amount}` })
        .where(eq(upsellReceiptAbTests.id, testId));
    }
  }

  private checkRuleMatch(rule: any, order: Order): boolean {
    const triggerCategory = rule.triggerCategory;
    const triggerProductIds = rule.triggerProductIds as string[] | null;
    const triggerMinPrice = rule.triggerMinPrice ? Number(rule.triggerMinPrice) : null;
    const triggerMaxPrice = rule.triggerMaxPrice ? Number(rule.triggerMaxPrice) : null;

    if (triggerCategory) {
      const hasMatchingCategory = order.items.some(item => item.category === triggerCategory);
      if (!hasMatchingCategory) return false;
    }

    if (triggerProductIds && triggerProductIds.length > 0) {
      const hasMatchingProduct = order.items.some(item => 
        triggerProductIds.includes(item.productId)
      );
      if (!hasMatchingProduct) return false;
    }

    if (triggerMinPrice !== null) {
      const hasProductAboveMin = order.items.some(item => item.price >= triggerMinPrice);
      if (!hasProductAboveMin) return false;
    }

    if (triggerMaxPrice !== null) {
      const hasProductBelowMax = order.items.some(item => item.price <= triggerMaxPrice);
      if (!hasProductBelowMax) return false;
    }

    return true;
  }

  private async getProductsForRule(
    userId: string, 
    rule: any, 
    excludeIds: string[],
    limit: number
  ): Promise<any[]> {
    const database = getDb();
    
    const conditions = [
      eq(products.userId, userId),
      gt(products.stock, 0)
    ];
    
    if (excludeIds.length > 0) {
      conditions.push(notInArray(products.id, excludeIds));
    }

    if (rule.recommendCategory) {
      conditions.push(eq(products.category, rule.recommendCategory));
    }

    const recommendProductIds = rule.recommendProductIds as string[] | null;
    if (recommendProductIds && recommendProductIds.length > 0) {
      conditions.push(inArray(products.id, recommendProductIds));
    }

    return await database.select()
      .from(products)
      .where(and(...conditions))
      .limit(limit);
  }

  private async getFallbackRecommendations(
    userId: string,
    orderCategories: string[],
    avgPrice: number,
    excludeIds: string[],
    priceRangePercent: number,
    limit: number
  ): Promise<any[]> {
    const database = getDb();
    const minPrice = avgPrice * (1 - priceRangePercent / 100);
    const maxPrice = avgPrice * (1 + priceRangePercent / 100);

    let result: any[] = [];

    if (orderCategories.length > 0) {
      const conditions = [
        eq(products.userId, userId),
        inArray(products.category, orderCategories),
        gt(products.stock, 0)
      ];
      
      if (excludeIds.length > 0) {
        conditions.push(notInArray(products.id, excludeIds));
      }

      result = await database.select()
        .from(products)
        .where(and(...conditions))
        .limit(limit);
    }

    if (result.length < limit) {
      const allExcludeIds = [...excludeIds, ...result.map(r => r.id)];
      const priceConditions = [
        eq(products.userId, userId),
        gte(products.price, String(minPrice)),
        lte(products.price, String(maxPrice)),
        gt(products.stock, 0)
      ];
      
      if (allExcludeIds.length > 0) {
        priceConditions.push(notInArray(products.id, allExcludeIds));
      }
      
      const additionalProducts = await database.select()
        .from(products)
        .where(and(...priceConditions))
        .limit(limit - result.length);
      
      result.push(...additionalProducts);
    }

    return result;
  }

  private getRecommendationReason(product: any, orderCategories: string[]): string {
    if (orderCategories.includes(product.category)) {
      return `Completes your ${product.category} purchase`;
    }
    return "Customers who bought similar items also loved this";
  }

  async trackClick(trackingToken: string, productId: string): Promise<boolean> {
    const database = getDb();
    const [updated] = await database.update(upsellReceiptAnalytics)
      .set({
        clickedProductId: productId,
        clickedAt: new Date(),
      })
      .where(eq(upsellReceiptAnalytics.clickTrackingToken, trackingToken))
      .returning();

    if (updated && updated.abTestId && updated.abTestVariant) {
      await this.incrementAbTestMetric(updated.abTestId, updated.abTestVariant, "clicks");
    }

    return !!updated;
  }

  async trackConversion(
    customerEmail: string, 
    orderId: string, 
    amount: number,
    userId: string
  ): Promise<boolean> {
    const database = getDb();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    
    const recentAnalytics = await database.query.upsellReceiptAnalytics.findFirst({
      where: and(
        eq(upsellReceiptAnalytics.customerEmail, customerEmail),
        eq(upsellReceiptAnalytics.userId, userId),
        eq(upsellReceiptAnalytics.converted, false),
        gte(upsellReceiptAnalytics.emailSentAt, cutoffDate)
      ),
      orderBy: [desc(upsellReceiptAnalytics.emailSentAt)]
    });

    if (!recentAnalytics) return false;

    const [updated] = await database.update(upsellReceiptAnalytics)
      .set({
        converted: true,
        conversionOrderId: orderId,
        conversionAmount: String(amount),
        convertedAt: new Date(),
      })
      .where(eq(upsellReceiptAnalytics.id, recentAnalytics.id))
      .returning();

    if (updated && updated.abTestId && updated.abTestVariant) {
      await this.incrementAbTestMetric(updated.abTestId, updated.abTestVariant, "conversions");
      await this.incrementAbTestRevenue(updated.abTestId, updated.abTestVariant, amount);
    }

    return !!updated;
  }

  async getAnalytics(userId: string, days: number = 30) {
    const database = getDb();
    
    const validDays = Math.max(1, Math.min(365, Math.floor(Number(days) || 30)));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - validDays);
    
    const analytics = await database.execute(sql`
      SELECT 
        COUNT(*) as total_sent,
        COUNT(CASE WHEN clicked_at IS NOT NULL THEN 1 END) as total_clicks,
        COUNT(CASE WHEN converted = true THEN 1 END) as total_conversions,
        COALESCE(SUM(CASE WHEN converted = true THEN conversion_amount::numeric ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN converted = true THEN conversion_amount::numeric END), 0) as avg_order_value
      FROM upsell_receipt_analytics
      WHERE user_id = ${userId}
        AND created_at > ${cutoffDate}
    `);

    const dailyStats = await database.execute(sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as sent,
        COUNT(CASE WHEN clicked_at IS NOT NULL THEN 1 END) as clicks,
        COUNT(CASE WHEN converted = true THEN 1 END) as conversions,
        COALESCE(SUM(CASE WHEN converted = true THEN conversion_amount::numeric ELSE 0 END), 0) as revenue
      FROM upsell_receipt_analytics
      WHERE user_id = ${userId}
        AND created_at > ${cutoffDate}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    return {
      summary: (analytics.rows as any[])[0] || {
        total_sent: 0,
        total_clicks: 0,
        total_conversions: 0,
        total_revenue: 0,
        avg_order_value: 0,
      },
      dailyStats: dailyStats.rows,
    };
  }

  async getAbTestResults(userId: string, testId?: string) {
    const database = getDb();
    if (testId) {
      return await database.query.upsellReceiptAbTests.findFirst({
        where: and(
          eq(upsellReceiptAbTests.userId, userId),
          eq(upsellReceiptAbTests.id, testId)
        )
      });
    }

    return await database.query.upsellReceiptAbTests.findMany({
      where: eq(upsellReceiptAbTests.userId, userId),
      orderBy: [desc(upsellReceiptAbTests.createdAt)]
    });
  }

  async createAbTest(userId: string, data: Partial<typeof upsellReceiptAbTests.$inferInsert>) {
    const database = getDb();
    await database.update(upsellReceiptAbTests)
      .set({ status: "paused" })
      .where(and(
        eq(upsellReceiptAbTests.userId, userId),
        eq(upsellReceiptAbTests.status, "active")
      ));

    const [test] = await database.insert(upsellReceiptAbTests)
      .values({
        userId,
        testName: data.testName || "New A/B Test",
        controlStrategy: data.controlStrategy || "category_match",
        variantAStrategy: data.variantAStrategy || "price_range",
        variantBStrategy: data.variantBStrategy,
        controlTrafficPercent: data.controlTrafficPercent || 34,
        variantATrafficPercent: data.variantATrafficPercent || 33,
        variantBTrafficPercent: data.variantBTrafficPercent || 33,
        decisionMetric: data.decisionMetric || "conversion_rate",
        minSampleSize: data.minSampleSize || 100,
      })
      .returning();

    await this.updateSettings(userId, { 
      abTestEnabled: true, 
      currentAbTestId: test.id 
    });

    return test;
  }

  async endAbTest(userId: string, testId: string, winnerId?: string) {
    const database = getDb();
    const test = await database.query.upsellReceiptAbTests.findFirst({
      where: eq(upsellReceiptAbTests.id, testId)
    });

    if (!test) return null;

    let winner = winnerId;
    let confidence = 0;

    if (!winner) {
      const controlRate = test.controlSent ? ((test.controlConversions || 0) / test.controlSent) * 100 : 0;
      const variantARate = test.variantASent ? ((test.variantAConversions || 0) / test.variantASent) * 100 : 0;
      const variantBRate = test.variantBSent ? ((test.variantBConversions || 0) / test.variantBSent) * 100 : 0;

      const rates = [
        { id: "control", rate: controlRate },
        { id: "variantA", rate: variantARate },
        { id: "variantB", rate: variantBRate },
      ].filter(r => r.rate > 0);

      rates.sort((a, b) => b.rate - a.rate);
      
      if (rates.length > 0) {
        winner = rates[0].id;
        confidence = rates.length > 1 ? 
          Math.min(95, ((rates[0].rate - rates[1].rate) / rates[0].rate) * 100) : 
          95;
      }
    }

    const [updated] = await database.update(upsellReceiptAbTests)
      .set({
        status: "completed",
        winnerId: winner,
        winnerConfidence: String(confidence),
        endedAt: new Date(),
      })
      .where(eq(upsellReceiptAbTests.id, testId))
      .returning();

    await this.updateSettings(userId, { abTestEnabled: false });

    return updated;
  }
}

export const upsellRecommendationEngine = new UpsellRecommendationEngine();
