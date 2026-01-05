import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { 
  type User, 
  type InsertUser, 
  type Product, 
  type InsertProduct,
  type SeoMeta,
  type InsertSeoMeta,
  type ProductSeoHistory,
  type InsertProductSeoHistory,
  type Campaign,
  type InsertCampaign,
  type CampaignTemplate,
  type InsertCampaignTemplate,
  type AbandonedCart,
  type InsertAbandonedCart,
  type Analytics,
  type InsertAnalytics,
  type Notification,
  type InsertNotification,
  type StoreConnection,
  type InsertStoreConnection,
  type UserPreferences,
  type InsertUserPreferences,
  type IntegrationSettings,
  type InsertIntegrationSettings,
  type SecuritySettings,
  type InsertSecuritySettings,
  type LoginLog,
  type InsertLoginLog,
  type SupportTicket,
  type InsertSupportTicket,
  type AiGenerationHistory,
  type InsertAiGenerationHistory,
  type PaymentTransaction,
  type InsertPaymentTransaction,
  type InsertActivityLog,
  type NotificationPreferences,
  type InsertNotificationPreferences,
  type NotificationRule,
  type InsertNotificationRule,
  type NotificationChannel,
  type InsertNotificationChannel,
  type NotificationAnalytics,
  type InsertNotificationAnalytics,
  type AbTest,
  type InsertAbTest,
  type ProductHistory,
  type InsertProductHistory,
  type Session,
  type InsertSession,
  type ContentPerformance,
  type InsertContentPerformance,
  type LearningPattern,
  type InsertLearningPattern,
  type ContentQualityScore,
  type InsertContentQualityScore,
  type BulkOptimizationJob,
  type InsertBulkOptimizationJob,
  type BulkOptimizationItem,
  type InsertBulkOptimizationItem,
  type BulkImageJob,
  type InsertBulkImageJob,
  type BulkImageJobItem,
  type InsertBulkImageJobItem,
  type ImageOptimizationHistory,
  type InsertImageOptimizationHistory,
  users, 
  products, 
  seoMeta, 
  campaigns,
  campaignTemplates,
  abandonedCarts,
  analytics,
  notifications,
  storeConnections,
  userPreferences,
  integrationSettings,
  securitySettings,
  loginLogs,
  supportTickets,
  aiGenerationHistory,
  paymentTransactions,
  activityLogs,
  notificationPreferences,
  notificationRules,
  notificationChannels,
  notificationAnalytics,
  abTests,
  productHistory,
  sessions,
  contentPerformance,
  learningPatterns,
  contentQualityScores,
  bulkOptimizationJobs,
  bulkOptimizationItems,
  bulkImageJobs,
  bulkImageJobItems,
  imageOptimizationHistory,
  productSeoHistory,
  syncHistory,
  type SyncHistory,
  type InsertSyncHistory
} from "@shared/schema";
import { randomUUID } from "crypto";
// Using Supabase for authentication - no local password handling needed

let db: any;

if (process.env.DATABASE_URL) {
  const sql = neon(process.env.DATABASE_URL);
  db = drizzle(sql);
}

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  updateUserProfile(userId: string, fullName: string, email: string): Promise<User>;
  updateUserImage(userId: string, imageUrl: string): Promise<User>;
  // changeUserPassword removed - handled by Supabase Auth
  updateUserLanguage(userId: string, language: string): Promise<User>;

  // Store connections methods
  getStoreConnections(userId: string): Promise<StoreConnection[]>;
  createStoreConnection(storeConnection: InsertStoreConnection): Promise<StoreConnection>;
  updateStoreConnection(id: string, updates: Partial<StoreConnection>): Promise<StoreConnection>;
  deleteStoreConnection(id: string): Promise<void>;

  // Sync history methods
  getSyncHistory(userId: string, limit?: number): Promise<SyncHistory[]>;
  getLatestSync(userId: string): Promise<SyncHistory | undefined>;
  createSyncHistory(sync: InsertSyncHistory): Promise<SyncHistory>;
  updateSyncHistory(id: string, updates: Partial<SyncHistory>): Promise<SyncHistory>;

  // Product methods
  getProducts(userId: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  // Product History methods
  getProductHistory(userId: string): Promise<ProductHistory[]>;
  createProductHistory(data: InsertProductHistory): Promise<ProductHistory>;
  rollbackProductChange(historyId: string): Promise<void>;

  // SEO methods
  getSeoMeta(productId: string): Promise<SeoMeta | undefined>;
  createSeoMeta(seoMeta: InsertSeoMeta): Promise<SeoMeta>;
  updateSeoMeta(productId: string, updates: Partial<SeoMeta>): Promise<SeoMeta>;
  saveProductSEOHistory(data: InsertProductSeoHistory): Promise<ProductSeoHistory>;
  getProductSEOHistory(userId: string): Promise<ProductSeoHistory[]>;

  // Campaign methods
  getCampaigns(userId: string): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign>;
  deleteCampaign(id: string): Promise<void>;

  // Campaign Template methods
  getCampaignTemplates(userId: string): Promise<CampaignTemplate[]>;
  getCampaignTemplate(id: string): Promise<CampaignTemplate | undefined>;
  createCampaignTemplate(template: InsertCampaignTemplate): Promise<CampaignTemplate>;
  updateCampaignTemplate(id: string, updates: Partial<CampaignTemplate>): Promise<CampaignTemplate>;
  deleteCampaignTemplate(id: string): Promise<void>;

  // Abandoned Cart methods
  getAbandonedCarts(userId: string): Promise<AbandonedCart[]>;
  getAbandonedCart(id: string): Promise<AbandonedCart | undefined>;
  createAbandonedCart(cart: InsertAbandonedCart): Promise<AbandonedCart>;
  updateAbandonedCart(id: string, updates: Partial<AbandonedCart>): Promise<AbandonedCart>;

  // Activity tracking
  trackActivity(activity: InsertActivityLog): Promise<void>;

  // Analytics methods
  getAnalytics(userId: string, metricType?: string): Promise<Analytics[]>;
  createAnalytic(analytic: InsertAnalytics): Promise<Analytics>;

  // Notification methods
  getNotifications(userId: string): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(userId: string, notificationId: string): Promise<Notification | null>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(userId: string, notificationId: string): Promise<boolean>;
  clearAllNotifications(userId: string): Promise<void>;

  // Real-time Dashboard methods
  getDashboardData(userId: string): Promise<{
    user: User | undefined;
    profile: any;
    usageStats: any;
    activityLogs: any[];
    toolsAccess: any[];
    realtimeMetrics: any[];
  }>;
  initializeUserRealtimeData(userId: string): Promise<void>;
  trackToolAccess(userId: string, toolName: string): Promise<any>;
  createActivityLog(userId: string, logData: any): Promise<any>;
  updateUsageStats(userId: string, statField: string, increment: number): Promise<void>;
  generateSampleMetrics(userId: string): Promise<void>;

  // Billing methods
  getUserSubscription(userId: string): Promise<any>;
  getUserUsageStats(userId: string): Promise<any>;
  getUserInvoices(userId: string): Promise<any[]>;
  getUserPaymentMethods(userId: string): Promise<any[]>;

  // Settings methods
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences>;
  
  getIntegrationSettings(userId: string): Promise<IntegrationSettings[]>;
  createIntegrationSettings(integration: InsertIntegrationSettings): Promise<IntegrationSettings>;
  updateIntegrationSettings(id: string, updates: Partial<IntegrationSettings>): Promise<IntegrationSettings>;
  deleteIntegrationSettings(id: string): Promise<void>;
  
  getSecuritySettings(userId: string): Promise<SecuritySettings | undefined>;
  createSecuritySettings(security: InsertSecuritySettings): Promise<SecuritySettings>;
  updateSecuritySettings(userId: string, updates: Partial<SecuritySettings>): Promise<SecuritySettings>;
  
  getLoginLogs(userId: string, limit?: number): Promise<LoginLog[]>;
  createLoginLog(loginLog: InsertLoginLog): Promise<LoginLog>;
  
  getSupportTickets(userId: string): Promise<SupportTicket[]>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket>;
  
  getAiGenerationHistory(userId: string, limit?: number): Promise<AiGenerationHistory[]>;
  createAiGenerationHistory(history: InsertAiGenerationHistory): Promise<AiGenerationHistory>;

  // Performance tracking & self-learning methods
  getContentPerformance(userId: string, filters?: { productId?: string, aiGenerationId?: string }): Promise<ContentPerformance[]>;
  createContentPerformance(performance: InsertContentPerformance): Promise<ContentPerformance>;
  updateContentPerformance(id: string, updates: Partial<ContentPerformance>): Promise<ContentPerformance>;
  getTopPerformingContent(userId: string, limit?: number): Promise<ContentPerformance[]>;
  
  getLearningPatterns(userId: string, filters?: { category?: string, patternType?: string }): Promise<LearningPattern[]>;
  createLearningPattern(pattern: InsertLearningPattern): Promise<LearningPattern>;
  updateLearningPattern(id: string, updates: Partial<LearningPattern>): Promise<LearningPattern>;
  getActivePatterns(userId: string): Promise<LearningPattern[]>;
  
  getContentQualityScore(aiGenerationId: string): Promise<ContentQualityScore | undefined>;
  createContentQualityScore(score: InsertContentQualityScore): Promise<ContentQualityScore>;
  getQualityScoresByUser(userId: string, limit?: number): Promise<ContentQualityScore[]>;

  // Payment transaction methods
  createPaymentTransaction(transaction: any): Promise<any>;
  getPaymentTransaction(transactionId: string): Promise<any>;
  getPaymentTransactions(userId: string, filters?: any): Promise<any[]>;
  getAllPaymentTransactions(filters?: any): Promise<any[]>;
  updatePaymentTransaction(transactionId: string, updates: any): Promise<any>;

  // Advanced Notification Preference methods
  getNotificationPreferences(userId: string): Promise<NotificationPreferences | undefined>;
  createNotificationPreferences(preferences: InsertNotificationPreferences): Promise<NotificationPreferences>;
  updateNotificationPreferences(userId: string, updates: Partial<NotificationPreferences>): Promise<NotificationPreferences>;
  applyPresetMode(userId: string, preset: string): Promise<NotificationPreferences>;
  
  getNotificationRules(userId: string): Promise<NotificationRule[]>;
  getNotificationRule(userId: string, category: string): Promise<NotificationRule | undefined>;
  createNotificationRule(rule: InsertNotificationRule): Promise<NotificationRule>;
  updateNotificationRule(id: string, updates: Partial<NotificationRule>): Promise<NotificationRule>;
  deleteNotificationRule(id: string): Promise<void>;
  
  getNotificationChannels(userId: string): Promise<NotificationChannel[]>;
  createNotificationChannel(channel: InsertNotificationChannel): Promise<NotificationChannel>;
  updateNotificationChannel(id: string, updates: Partial<NotificationChannel>): Promise<NotificationChannel>;
  deleteNotificationChannel(id: string): Promise<void>;
  
  getNotificationAnalytics(userId: string, filters?: any): Promise<NotificationAnalytics[]>;
  createNotificationAnalytics(analytics: InsertNotificationAnalytics): Promise<NotificationAnalytics>;
  updateNotificationAnalytics(id: string, updates: Partial<NotificationAnalytics>): Promise<NotificationAnalytics>;

  // AB Test methods
  getABTests(userId: string): Promise<AbTest[]>;
  getABTest(id: string): Promise<AbTest | undefined>;
  createABTest(data: InsertAbTest): Promise<AbTest>;
  updateABTest(id: string, updates: Partial<AbTest>): Promise<AbTest>;
  deleteABTest(id: string): Promise<void>;

  // Session management methods
  getUserSessions(userId: string): Promise<Session[]>;
  getSession(sessionId: string): Promise<Session | undefined>;
  createSession(data: InsertSession): Promise<Session>;
  updateSession(sessionId: string, updates: Partial<Session>): Promise<Session>;
  deleteSession(sessionId: string): Promise<void>;
  deleteUserSessions(userId: string, excludeSessionId?: string): Promise<void>;
  cleanupExpiredSessions(): Promise<void>;

  // Bulk Optimization methods
  getBulkOptimizationJobs(userId: string): Promise<BulkOptimizationJob[]>;
  getBulkOptimizationJob(jobId: string): Promise<BulkOptimizationJob | undefined>;
  createBulkOptimizationJob(data: InsertBulkOptimizationJob): Promise<BulkOptimizationJob>;
  updateBulkOptimizationJob(jobId: string, updates: Partial<BulkOptimizationJob>): Promise<BulkOptimizationJob>;
  deleteBulkOptimizationJob(jobId: string): Promise<void>;
  
  getBulkOptimizationItems(jobId: string): Promise<BulkOptimizationItem[]>;
  getBulkOptimizationItem(itemId: string): Promise<BulkOptimizationItem | undefined>;
  createBulkOptimizationItem(data: InsertBulkOptimizationItem): Promise<BulkOptimizationItem>;
  updateBulkOptimizationItem(itemId: string, updates: Partial<BulkOptimizationItem>): Promise<BulkOptimizationItem>;
  deleteBulkOptimizationItem(itemId: string): Promise<void>;

  // Bulk Image Optimization methods
  getBulkImageJobs(userId: string): Promise<BulkImageJob[]>;
  getBulkImageJob(jobId: string): Promise<BulkImageJob | undefined>;
  createBulkImageJob(data: InsertBulkImageJob): Promise<BulkImageJob>;
  updateBulkImageJob(jobId: string, updates: Partial<BulkImageJob>): Promise<BulkImageJob>;
  deleteBulkImageJob(jobId: string): Promise<void>;
  
  getBulkImageJobItems(jobId: string): Promise<BulkImageJobItem[]>;
  getBulkImageJobItem(itemId: string): Promise<BulkImageJobItem | undefined>;
  createBulkImageJobItem(data: InsertBulkImageJobItem): Promise<BulkImageJobItem>;
  updateBulkImageJobItem(itemId: string, updates: Partial<BulkImageJobItem>): Promise<BulkImageJobItem>;
  deleteBulkImageJobItem(itemId: string): Promise<void>;
  
  getImageOptimizationHistory(userId: string, filters?: { productId?: string, jobId?: string }): Promise<ImageOptimizationHistory[]>;
  getImageOptimizationHistoryByIds(ids: string[]): Promise<ImageOptimizationHistory[]>;
  createImageOptimizationHistory(data: InsertImageOptimizationHistory): Promise<ImageOptimizationHistory>;
  updateImageOptimizationHistory(id: string, updates: Partial<ImageOptimizationHistory>): Promise<ImageOptimizationHistory>;
}

export class DatabaseStorage {
  async getUser(id: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error("Database not configured");
    // Supabase handles authentication - no password storage needed
    const { password, ...userDataWithoutPassword } = insertUser;
    const result = await db.insert(users).values({
      ...userDataWithoutPassword,
      password: null, // Always null for Supabase users
    }).returning();
    return result[0];
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async updateUserProfile(userId: string, fullName: string, email: string): Promise<User> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(users)
      .set({ fullName, email })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async updateUserImage(userId: string, imageUrl: string): Promise<User> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(users)
      .set({ imageUrl })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<User> {
    // Password changes are handled by Supabase Auth - this method is deprecated
    throw new Error("Password changes should be handled through Supabase Auth on the frontend");
  }

  async updateUserLanguage(userId: string, language: string): Promise<User> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(users)
      .set({ preferredLanguage: language })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async getStoreConnections(userId: string): Promise<StoreConnection[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(storeConnections)
      .where(eq(storeConnections.userId, userId))
      .orderBy(desc(storeConnections.createdAt));
  }

  async createStoreConnection(storeConnection: InsertStoreConnection): Promise<StoreConnection> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(storeConnections).values(storeConnection).returning();
    return result[0];
  }

  async updateStoreConnection(id: string, updates: Partial<StoreConnection>): Promise<StoreConnection> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(storeConnections)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(storeConnections.id, id))
      .returning();
    return result[0];
  }

  async deleteStoreConnection(id: string): Promise<void> {
    if (!db) throw new Error("Database not configured");
    await db.delete(storeConnections).where(eq(storeConnections.id, id));
  }

  async getProducts(userId: string): Promise<Product[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(products)
      .where(eq(products.userId, userId))
      .orderBy(desc(products.updatedAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(products).values(product).returning();
    return result[0];
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return result[0];
  }

  async deleteProduct(id: string): Promise<void> {
    if (!db) throw new Error("Database not configured");
    await db.delete(products).where(eq(products.id, id));
  }

  async getSeoMeta(productId: string): Promise<SeoMeta | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(seoMeta).where(eq(seoMeta.productId, productId));
    return result[0];
  }

  async createSeoMeta(seoMetaData: InsertSeoMeta): Promise<SeoMeta> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(seoMeta).values(seoMetaData).returning();
    return result[0];
  }

  async updateSeoMeta(productId: string, updates: Partial<SeoMeta>): Promise<SeoMeta> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(seoMeta)
      .set(updates)
      .where(eq(seoMeta.productId, productId))
      .returning();
    return result[0];
  }

  async getCampaigns(userId: string): Promise<Campaign[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(campaigns)
      .where(eq(campaigns.userId, userId))
      .orderBy(desc(campaigns.createdAt));
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(campaigns).values(campaign).returning();
    return result[0];
  }

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(campaigns)
      .set(updates)
      .where(eq(campaigns.id, id))
      .returning();
    return result[0];
  }

  async getAnalytics(userId: string, metricType?: string): Promise<Analytics[]> {
    if (!db) throw new Error("Database not configured");
    const conditions = [eq(analytics.userId, userId)];
    if (metricType) {
      conditions.push(eq(analytics.metricType, metricType));
    }
    return await db.select().from(analytics)
      .where(and(...conditions))
      .orderBy(desc(analytics.date));
  }

  async createAnalytic(analytic: InsertAnalytics): Promise<Analytics> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(analytics).values(analytic).returning();
    return result[0];
  }

  // Billing methods implementation for DatabaseStorage
  async getUserSubscription(userId: string): Promise<any> {
    const user = await this.getUser(userId);
    return {
      plan: user?.plan || 'trial',
      status: 'active',
      trialEndDate: user?.trialEndDate
    };
  }

  async getUserUsageStats(userId: string): Promise<any> {
    const data = await this.getDashboardData(userId);
    return data?.usageStats || {
      aiGenerations: 0,
      seoOptimizations: 0,
      campaignsCreated: 0,
      emailsSent: 0
    };
  }

  async getUserInvoices(userId: string): Promise<any[]> {
    return [];
  }

  async getUserPaymentMethods(userId: string): Promise<any[]> {
    return [];
  }

  // Dashboard methods - in-memory fallback for realtime data
  private realtimeData: Map<string, any> = new Map();

  async getDashboardData(userId: string): Promise<any> {
    const data = this.realtimeData.get(userId);
    if (!data) {
      // Return a minimal object immediately if initialization is in progress
      this.initializeUserRealtimeData(userId);
      return {
        usageStats: {
          aiGenerations: 0,
          seoOptimizations: 0,
          campaignsCreated: 0,
          emailsSent: 0
        },
        activityLogs: [],
        realtimeMetrics: []
      };
    }
    return data;
  }

  async initializeUserRealtimeData(userId: string): Promise<void> {
    // Avoid multiple concurrent initializations
    if (this.realtimeData.has(`${userId}_initializing`)) return;
    this.realtimeData.set(`${userId}_initializing`, true);

    try {
      const user = await this.getUser(userId);
      const usageStatsData = await db.select().from(usageStats).where(eq(usageStats.userId, userId)).limit(1);
      const currentStats = usageStatsData[0] || {
        aiGenerationsUsed: 0,
        productsOptimized: 0,
        emailsSent: 0
      };

      this.realtimeData.set(userId, {
        user,
        profile: {
          fullName: user?.fullName || 'User',
          email: user?.email || '',
          plan: user?.plan || 'trial',
          role: user?.role || 'user'
        },
        usageStats: {
          aiGenerations: currentStats.aiGenerationsUsed || 0,
          seoOptimizations: currentStats.productsOptimized || 0,
          campaignsCreated: 0,
          emailsSent: currentStats.emailsSent || 0
        },
        activityLogs: [],
        toolsAccess: [],
        realtimeMetrics: [
          { name: 'Active Users', value: 124, change: '+12%' },
          { name: 'Avg. Response Time', value: '1.2s', change: '-5%' },
          { name: 'Success Rate', value: '99.9%', change: '+0.1%' }
        ]
      });
    } catch (e) {
      console.error('initializeUserRealtimeData error:', e);
    } finally {
      this.realtimeData.delete(`${userId}_initializing`);
    }
  }

  async trackToolAccess(userId: string, toolName: string): Promise<any> {
    const data = await this.getDashboardData(userId);
    if (data) {
      if (!data.toolsAccess.includes(toolName)) {
        data.toolsAccess.push(toolName);
      }
      return data.toolsAccess;
    }
  }

  async createActivityLog(userId: string, logData: any): Promise<any> {
    const data = await this.getDashboardData(userId);
    if (data) {
      const log = { id: randomUUID(), timestamp: new Date(), ...logData };
      data.activityLogs.unshift(log);
      if (data.activityLogs.length > 50) data.activityLogs.pop();
      return log;
    }
  }

  async updateUsageStats(userId: string, statField: string, increment: number): Promise<void> {
    const data = await this.getDashboardData(userId);
    if (data && data.usageStats[statField] !== undefined) {
      data.usageStats[statField] += increment;
    }
  }

  async generateSampleMetrics(userId: string): Promise<void> {
    // Already handled in initializeUserRealtimeData
  }

  // Notification methods - stub implementations since we're using MemStorage
  async createSyncHistory(sync: InsertSyncHistory): Promise<SyncHistory> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(syncHistory).values(sync).returning();
    return result[0];
  }

  async updateSyncHistory(id: string, updates: Partial<SyncHistory>): Promise<SyncHistory> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(syncHistory)
      .set(updates)
      .where(eq(syncHistory.id, id))
      .returning();
    return result[0];
  }

  async getSyncHistory(userId: string, limit: number = 10): Promise<SyncHistory[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(syncHistory)
      .where(eq(syncHistory.userId, userId))
      .orderBy(desc(syncHistory.startedAt))
      .limit(limit);
  }

  async getLatestSync(userId: string): Promise<SyncHistory | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(syncHistory)
      .where(eq(syncHistory.userId, userId))
      .orderBy(desc(syncHistory.startedAt))
      .limit(1);
    return result[0];
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    if (!db) return [];
    try {
      // Optimized query: limited results and only necessary fields if possible
      return await db.select().from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(10); // Further limited to top 10 for dashboard speed
    } catch (e) {
      console.error('getNotifications error:', e);
      return [];
    }
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    if (!db) return 0;
    try {
      // Use a faster count query if supported by dialect or keep as is
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
      return Number(result[0]?.count) || 0;
    } catch (e) {
      return 0;
    }
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async markNotificationAsRead(userId: string, notificationId: string): Promise<Notification | null> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.userId, userId), eq(notifications.id, notificationId)))
      .returning();
    return result[0] || null;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    if (!db) throw new Error("Database not configured");
    await db.update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(userId: string, notificationId: string): Promise<boolean> {
    if (!db) throw new Error("Database not configured");
    const result = await db.delete(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.id, notificationId)))
      .returning();
    return result.length > 0;
  }

  async clearAllNotifications(userId: string): Promise<void> {
    if (!db) throw new Error("Database not configured");
    await db.delete(notifications).where(eq(notifications.userId, userId));
  }

  // UserPreferences implementation for DatabaseStorage
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return result[0];
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(userPreferences).values(preferences).returning();
    return result[0];
  }

  async updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(userPreferences)
      .set(updates)
      .where(eq(userPreferences.userId, userId))
      .returning();
    return result[0];
  }

  // IntegrationSettings implementation for DatabaseStorage
  async getIntegrationSettings(userId: string): Promise<IntegrationSettings[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(integrationSettings).where(eq(integrationSettings.userId, userId));
  }

  async createIntegrationSettings(integration: InsertIntegrationSettings): Promise<IntegrationSettings> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(integrationSettings).values(integration).returning();
    return result[0];
  }

  async updateIntegrationSettings(id: string, updates: Partial<IntegrationSettings>): Promise<IntegrationSettings> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(integrationSettings)
      .set(updates)
      .where(eq(integrationSettings.id, id))
      .returning();
    return result[0];
  }

  async deleteIntegrationSettings(id: string): Promise<void> {
    if (!db) throw new Error("Database not configured");
    await db.delete(integrationSettings).where(eq(integrationSettings.id, id));
  }

  // SecuritySettings implementation for DatabaseStorage
  async getSecuritySettings(userId: string): Promise<SecuritySettings | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(securitySettings).where(eq(securitySettings.userId, userId));
    return result[0];
  }

  async createSecuritySettings(security: InsertSecuritySettings): Promise<SecuritySettings> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(securitySettings).values(security).returning();
    return result[0];
  }

  async updateSecuritySettings(userId: string, updates: Partial<SecuritySettings>): Promise<SecuritySettings> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(securitySettings)
      .set(updates)
      .where(eq(securitySettings.userId, userId))
      .returning();
    return result[0];
  }

  // LoginLog implementation for DatabaseStorage
  async getLoginLogs(userId: string, limit: number = 10): Promise<LoginLog[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(loginLogs)
      .where(eq(loginLogs.userId, userId))
      .orderBy(desc(loginLogs.createdAt))
      .limit(limit);
  }

  async createLoginLog(loginLog: InsertLoginLog): Promise<LoginLog> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(loginLogs).values(loginLog).returning();
    return result[0];
  }

  // SupportTicket implementation for DatabaseStorage
  async getSupportTickets(userId: string): Promise<SupportTicket[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(supportTickets).where(eq(supportTickets.userId, userId));
  }

  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(supportTickets).values(ticket).returning();
    return result[0];
  }

  async updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(supportTickets)
      .set(updates)
      .where(eq(supportTickets.id, id))
      .returning();
    return result[0];
  }

  // AiGenerationHistory implementation for DatabaseStorage
  async getAiGenerationHistory(userId: string, limit: number = 10): Promise<AiGenerationHistory[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(aiGenerationHistory)
      .where(eq(aiGenerationHistory.userId, userId))
      .orderBy(desc(aiGenerationHistory.createdAt))
      .limit(limit);
  }

  async createAiGenerationHistory(history: InsertAiGenerationHistory): Promise<AiGenerationHistory> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(aiGenerationHistory).values(history).returning();
    return result[0];
  }

  // CampaignTemplate methods implementation for DatabaseStorage
  async getCampaignTemplates(userId: string): Promise<CampaignTemplate[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(campaignTemplates).where(eq(campaignTemplates.userId, userId));
  }

  async getCampaignTemplate(id: string): Promise<CampaignTemplate | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(campaignTemplates).where(eq(campaignTemplates.id, id));
    return result[0];
  }

  async createCampaignTemplate(template: InsertCampaignTemplate): Promise<CampaignTemplate> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(campaignTemplates).values(template).returning();
    return result[0];
  }

  async updateCampaignTemplate(id: string, updates: Partial<CampaignTemplate>): Promise<CampaignTemplate> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(campaignTemplates)
      .set(updates)
      .where(eq(campaignTemplates.id, id))
      .returning();
    return result[0];
  }

  async deleteCampaignTemplate(id: string): Promise<void> {
    if (!db) throw new Error("Database not configured");
    await db.delete(campaignTemplates).where(eq(campaignTemplates.id, id));
  }

  // AbandonedCart methods implementation for DatabaseStorage
  async getAbandonedCarts(userId: string): Promise<AbandonedCart[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(abandonedCarts).where(eq(abandonedCarts.userId, userId));
  }

  async getAbandonedCart(id: string): Promise<AbandonedCart | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(abandonedCarts).where(eq(abandonedCarts.id, id));
    return result[0];
  }

  async createAbandonedCart(cart: InsertAbandonedCart): Promise<AbandonedCart> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(abandonedCarts).values(cart).returning();
    return result[0];
  }

  async updateAbandonedCart(id: string, updates: Partial<AbandonedCart>): Promise<AbandonedCart> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(abandonedCarts)
      .set(updates)
      .where(eq(abandonedCarts.id, id))
      .returning();
    return result[0];
  }

  // Performance tracking & self-learning methods implementation
  async getContentPerformance(userId: string, filters?: { productId?: string, aiGenerationId?: string }): Promise<ContentPerformance[]> {
    if (!db) throw new Error("Database not configured");
    const conditions = [eq(contentPerformance.userId, userId)];
    if (filters?.productId) conditions.push(eq(contentPerformance.productId, filters.productId));
    if (filters?.aiGenerationId) conditions.push(eq(contentPerformance.aiGenerationId, filters.aiGenerationId));
    return await db.select().from(contentPerformance).where(and(...conditions));
  }

  async createContentPerformance(performance: InsertContentPerformance): Promise<ContentPerformance> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(contentPerformance).values(performance).returning();
    return result[0];
  }

  async updateContentPerformance(id: string, updates: Partial<ContentPerformance>): Promise<ContentPerformance> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(contentPerformance)
      .set(updates)
      .where(eq(contentPerformance.id, id))
      .returning();
    return result[0];
  }

  async getTopPerformingContent(userId: string, limit: number = 5): Promise<ContentPerformance[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(contentPerformance)
      .where(eq(contentPerformance.userId, userId))
      .orderBy(desc(contentPerformance.conversionRate))
      .limit(limit);
  }

  async getLearningPatterns(userId: string, filters?: { category?: string, patternType?: string }): Promise<LearningPattern[]> {
    if (!db) throw new Error("Database not configured");
    const conditions = [eq(learningPatterns.userId, userId)];
    if (filters?.category) conditions.push(eq(learningPatterns.category, filters.category));
    if (filters?.patternType) conditions.push(eq(learningPatterns.patternType, filters.patternType));
    return await db.select().from(learningPatterns).where(and(...conditions));
  }

  async createLearningPattern(pattern: InsertLearningPattern): Promise<LearningPattern> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(learningPatterns).values(pattern).returning();
    return result[0];
  }

  async updateLearningPattern(id: string, updates: Partial<LearningPattern>): Promise<LearningPattern> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(learningPatterns)
      .set(updates)
      .where(eq(learningPatterns.id, id))
      .returning();
    return result[0];
  }

  async getActivePatterns(userId: string): Promise<LearningPattern[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(learningPatterns)
      .where(and(eq(learningPatterns.userId, userId), eq(learningPatterns.isActive, true)));
  }

  async getContentQualityScore(aiGenerationId: string): Promise<ContentQualityScore | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(contentQualityScores).where(eq(contentQualityScores.aiGenerationId, aiGenerationId));
    return result[0];
  }

  async createContentQualityScore(score: InsertContentQualityScore): Promise<ContentQualityScore> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(contentQualityScores).values(score).returning();
    return result[0];
  }

  async getQualityScoresByUser(userId: string, limit: number = 10): Promise<ContentQualityScore[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(contentQualityScores)
      .where(eq(contentQualityScores.userId, userId))
      .orderBy(desc(contentQualityScores.createdAt))
      .limit(limit);
  }

  async trackActivity(activity: InsertActivityLog): Promise<void> {
    if (!db) return;
    try {
      // Fire and forget activity logging to avoid blocking the main thread
      db.insert(activityLogs).values(activity).catch(e => console.error('trackActivity background error:', e));
    } catch (e) {
      console.error('trackActivity error:', e);
    }
    // Also track in realtime fallback if active for immediate UI feedback
    const data = this.realtimeData.get(activity.userId);
    if (data) {
      const log = { id: randomUUID(), timestamp: new Date(), ...activity };
      data.activityLogs.unshift(log);
      if (data.activityLogs.length > 50) data.activityLogs.pop();
    }
  }

  // Payment transaction methods implementation
  async createPaymentTransaction(transaction: any): Promise<any> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(paymentTransactions).values(transaction).returning();
    return result[0];
  }

  async getPaymentTransaction(transactionId: string): Promise<any> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(paymentTransactions).where(eq(paymentTransactions.id, transactionId));
    return result[0];
  }

  async getPaymentTransactions(userId: string, filters?: any): Promise<any[]> {
    if (!db) throw new Error("Database not configured");
    const conditions = [eq(paymentTransactions.userId, userId)];
    if (filters?.status) conditions.push(eq(paymentTransactions.status, filters.status));
    return await db.select().from(paymentTransactions).where(and(...conditions)).orderBy(desc(paymentTransactions.createdAt));
  }

  async getAllPaymentTransactions(filters?: any): Promise<any[]> {
    if (!db) throw new Error("Database not configured");
    const conditions = [];
    if (filters?.status) conditions.push(eq(paymentTransactions.status, filters.status));
    if (conditions.length > 0) {
      return await db.select().from(paymentTransactions).where(and(...conditions)).orderBy(desc(paymentTransactions.createdAt));
    }
    return await db.select().from(paymentTransactions).orderBy(desc(paymentTransactions.createdAt));
  }

  async updatePaymentTransaction(transactionId: string, updates: any): Promise<any> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(paymentTransactions)
      .set(updates)
      .where(eq(paymentTransactions.id, transactionId))
      .returning();
    return result[0];
  }

  // Advanced Notification Preference methods implementation
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId));
    return result[0];
  }

  async createNotificationPreferences(preferences: InsertNotificationPreferences): Promise<NotificationPreferences> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(notificationPreferences).values(preferences).returning();
    return result[0];
  }

  async updateNotificationPreferences(userId: string, updates: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(notificationPreferences)
      .set(updates)
      .where(eq(notificationPreferences.userId, userId))
      .returning();
    return result[0];
  }

  async applyPresetMode(userId: string, preset: string): Promise<NotificationPreferences> {
    if (!db) throw new Error("Database not configured");
    // Implementation would define presets here
    const updates = { activePreset: preset };
    return this.updateNotificationPreferences(userId, updates);
  }

  async getNotificationRules(userId: string): Promise<NotificationRule[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(notificationRules).where(eq(notificationRules.userId, userId));
  }

  async getNotificationRule(userId: string, category: string): Promise<NotificationRule | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(notificationRules)
      .where(and(eq(notificationRules.userId, userId), eq(notificationRules.category, category)));
    return result[0];
  }

  async createNotificationRule(rule: InsertNotificationRule): Promise<NotificationRule> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(notificationRules).values(rule).returning();
    return result[0];
  }

  async updateNotificationRule(id: string, updates: Partial<NotificationRule>): Promise<NotificationRule> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(notificationRules)
      .set(updates)
      .where(eq(notificationRules.id, id))
      .returning();
    return result[0];
  }

  async deleteNotificationRule(id: string): Promise<void> {
    if (!db) throw new Error("Database not configured");
    await db.delete(notificationRules).where(eq(notificationRules.id, id));
  }

  async getNotificationChannels(userId: string): Promise<NotificationChannel[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(notificationChannels).where(eq(notificationChannels.userId, userId));
  }

  async createNotificationChannel(channel: InsertNotificationChannel): Promise<NotificationChannel> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(notificationChannels).values(channel).returning();
    return result[0];
  }

  async updateNotificationChannel(id: string, updates: Partial<NotificationChannel>): Promise<NotificationChannel> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(notificationChannels)
      .set(updates)
      .where(eq(notificationChannels.id, id))
      .returning();
    return result[0];
  }

  async deleteNotificationChannel(id: string): Promise<void> {
    if (!db) throw new Error("Database not configured");
    await db.delete(notificationChannels).where(eq(notificationChannels.id, id));
  }

  async getNotificationAnalytics(userId: string, filters?: any): Promise<NotificationAnalytics[]> {
    if (!db) throw new Error("Database not configured");
    const conditions = [eq(notificationAnalytics.userId, userId)];
    return await db.select().from(notificationAnalytics).where(and(...conditions));
  }

  async createNotificationAnalytics(analyticsData: InsertNotificationAnalytics): Promise<NotificationAnalytics> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(notificationAnalytics).values(analyticsData).returning();
    return result[0];
  }

  async updateNotificationAnalytics(id: string, updates: Partial<NotificationAnalytics>): Promise<NotificationAnalytics> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(notificationAnalytics)
      .set(updates)
      .where(eq(notificationAnalytics.id, id))
      .returning();
    return result[0];
  }

  // AB Test methods implementation
  async getABTests(userId: string): Promise<AbTest[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(abTests).where(eq(abTests.userId, userId));
  }

  async getABTest(id: string): Promise<AbTest | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(abTests).where(eq(abTests.id, id));
    return result[0];
  }

  async createABTest(data: InsertAbTest): Promise<AbTest> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(abTests).values(data).returning();
    return result[0];
  }

  async updateABTest(id: string, updates: Partial<AbTest>): Promise<AbTest> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(abTests)
      .set(updates)
      .where(eq(abTests.id, id))
      .returning();
    return result[0];
  }

  async deleteABTest(id: string): Promise<void> {
    if (!db) throw new Error("Database not configured");
    await db.delete(abTests).where(eq(abTests.id, id));
  }

  // Product History methods implementation
  async getProductHistory(userId: string): Promise<ProductHistory[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(productHistory)
      .where(eq(productHistory.userId, userId))
      .orderBy(desc(productHistory.createdAt));
  }

  async createProductHistory(data: InsertProductHistory): Promise<ProductHistory> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(productHistory).values(data).returning();
    return result[0];
  }

  async rollbackProductChange(historyId: string): Promise<void> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(productHistory).where(eq(productHistory.id, historyId));
    if (result.length > 0) {
      const history = result[0];
      await this.updateProduct(history.productId, history.previousData as Partial<Product>);
    }
  }

  // Session management methods implementation
  async getUserSessions(userId: string): Promise<Session[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(sessions).where(eq(sessions.userId, userId));
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    return result[0];
  }

  async createSession(data: InsertSession): Promise<Session> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(sessions).values(data).returning();
    return result[0];
  }

  async updateSession(sessionId: string, updates: Partial<Session>): Promise<Session> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(sessions)
      .set(updates)
      .where(eq(sessions.id, sessionId))
      .returning();
    return result[0];
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (!db) throw new Error("Database not configured");
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  async deleteUserSessions(userId: string, excludeSessionId?: string): Promise<void> {
    if (!db) throw new Error("Database not configured");
    const conditions = [eq(sessions.userId, userId)];
    if (excludeSessionId) {
      // Logic for exclude
    }
    await db.delete(sessions).where(and(...conditions));
  }

  async cleanupExpiredSessions(): Promise<void> {
    if (!db) throw new Error("Database not configured");
    await db.delete(sessions).where(sql`expires_at < NOW()`);
  }

  // Bulk Optimization methods implementation
  async getBulkOptimizationJobs(userId: string): Promise<BulkOptimizationJob[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(bulkOptimizationJobs).where(eq(bulkOptimizationJobs.userId, userId));
  }

  async getBulkOptimizationJob(jobId: string): Promise<BulkOptimizationJob | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(bulkOptimizationJobs).where(eq(bulkOptimizationJobs.id, jobId));
    return result[0];
  }

  async createBulkOptimizationJob(data: InsertBulkOptimizationJob): Promise<BulkOptimizationJob> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(bulkOptimizationJobs).values(data).returning();
    return result[0];
  }

  async updateBulkOptimizationJob(jobId: string, updates: Partial<BulkOptimizationJob>): Promise<BulkOptimizationJob> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(bulkOptimizationJobs)
      .set(updates)
      .where(eq(bulkOptimizationJobs.id, jobId))
      .returning();
    return result[0];
  }

  async deleteBulkOptimizationJob(jobId: string): Promise<void> {
    if (!db) throw new Error("Database not configured");
    await db.delete(bulkOptimizationJobs).where(eq(bulkOptimizationJobs.id, jobId));
  }

  async getBulkOptimizationItems(jobId: string): Promise<BulkOptimizationItem[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(bulkOptimizationItems).where(eq(bulkOptimizationItems.jobId, jobId));
  }

  async getBulkOptimizationItem(itemId: string): Promise<BulkOptimizationItem | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(bulkOptimizationItems).where(eq(bulkOptimizationItems.id, itemId));
    return result[0];
  }

  async createBulkOptimizationItem(data: InsertBulkOptimizationItem): Promise<BulkOptimizationItem> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(bulkOptimizationItems).values(data).returning();
    return result[0];
  }

  async updateBulkOptimizationItem(itemId: string, updates: Partial<BulkOptimizationItem>): Promise<BulkOptimizationItem> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(bulkOptimizationItems)
      .set(updates)
      .where(eq(bulkOptimizationItems.id, itemId))
      .returning();
    return result[0];
  }

  async deleteBulkOptimizationItem(itemId: string): Promise<void> {
    if (!db) throw new Error("Database not configured");
    await db.delete(bulkOptimizationItems).where(eq(bulkOptimizationItems.id, itemId));
  }

  // Bulk Image Optimization methods implementation
  async getBulkImageJobs(userId: string): Promise<BulkImageJob[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(bulkImageJobs).where(eq(bulkImageJobs.userId, userId));
  }

  async getBulkImageJob(jobId: string): Promise<BulkImageJob | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(bulkImageJobs).where(eq(bulkImageJobs.id, jobId));
    return result[0];
  }

  async createBulkImageJob(data: InsertBulkImageJob): Promise<BulkImageJob> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(bulkImageJobs).values(data).returning();
    return result[0];
  }

  async updateBulkImageJob(jobId: string, updates: Partial<BulkImageJob>): Promise<BulkImageJob> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(bulkImageJobs)
      .set(updates)
      .where(eq(bulkImageJobs.id, jobId))
      .returning();
    return result[0];
  }

  async deleteBulkImageJob(jobId: string): Promise<void> {
    if (!db) throw new Error("Database not configured");
    await db.delete(bulkImageJobs).where(eq(bulkImageJobs.id, jobId));
  }

  async getBulkImageJobItems(jobId: string): Promise<BulkImageJobItem[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(bulkImageJobItems).where(eq(bulkImageJobItems.jobId, jobId));
  }

  async getBulkImageJobItem(itemId: string): Promise<BulkImageJobItem | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(bulkImageJobItems).where(eq(bulkImageJobItems.id, itemId));
    return result[0];
  }

  async createBulkImageJobItem(data: InsertBulkImageJobItem): Promise<BulkImageJobItem> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(bulkImageJobItems).values(data).returning();
    return result[0];
  }

  async updateBulkImageJobItem(itemId: string, updates: Partial<BulkImageJobItem>): Promise<BulkImageJobItem> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(bulkImageJobItems)
      .set(updates)
      .where(eq(bulkImageJobItems.id, itemId))
      .returning();
    return result[0];
  }

  async deleteBulkImageJobItem(itemId: string): Promise<void> {
    if (!db) throw new Error("Database not configured");
    await db.delete(bulkImageJobItems).where(eq(bulkImageJobItems.id, itemId));
  }

  async getImageOptimizationHistory(userId: string, filters?: { productId?: string, jobId?: string }): Promise<ImageOptimizationHistory[]> {
    if (!db) throw new Error("Database not configured");
    const conditions = [eq(imageOptimizationHistory.userId, userId)];
    if (filters?.productId) conditions.push(eq(imageOptimizationHistory.productId, filters.productId));
    if (filters?.jobId) conditions.push(eq(imageOptimizationHistory.jobId, filters.jobId));
    return await db.select().from(imageOptimizationHistory).where(and(...conditions));
  }

  async getImageOptimizationHistoryByIds(ids: string[]): Promise<ImageOptimizationHistory[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(imageOptimizationHistory).where(inArray(imageOptimizationHistory.id, ids));
  }

  async createImageOptimizationHistory(data: InsertImageOptimizationHistory): Promise<ImageOptimizationHistory> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(imageOptimizationHistory).values(data).returning();
    return result[0];
  }

  async updateImageOptimizationHistory(id: string, updates: Partial<ImageOptimizationHistory>): Promise<ImageOptimizationHistory> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(imageOptimizationHistory)
      .set(updates)
      .where(eq(imageOptimizationHistory.id, id))
      .returning();
    return result[0];
  }

  // SEO history methods
  async saveProductSEOHistory(data: InsertProductSeoHistory): Promise<ProductSeoHistory> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(productSeoHistory).values(data).returning();
    return result[0];
  }

  async getProductSEOHistory(userId: string): Promise<ProductSeoHistory[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(productSeoHistory)
      .where(eq(productSeoHistory.userId, userId))
      .orderBy(desc(productSeoHistory.createdAt));
  }
}

export const storage = new DatabaseStorage();
export const dbStorage = storage;
