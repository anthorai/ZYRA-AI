import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc, and, sql } from "drizzle-orm";
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
  productSeoHistory
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
    throw new Error("Billing data not available in DatabaseStorage - use MemStorage");
  }

  async getUserUsageStats(userId: string): Promise<any> {
    throw new Error("Usage stats not available in DatabaseStorage - use MemStorage");
  }

  async getUserInvoices(userId: string): Promise<any[]> {
    throw new Error("Invoice data not available in DatabaseStorage - use MemStorage");
  }

  async getUserPaymentMethods(userId: string): Promise<any[]> {
    throw new Error("Payment method data not available in DatabaseStorage - use MemStorage");
  }

  // Dashboard methods - stub implementations since we're using MemStorage for dashboard
  async getDashboardData(userId: string): Promise<any> {
    throw new Error("Dashboard data not available in DatabaseStorage - use MemStorage");
  }

  async initializeUserRealtimeData(userId: string): Promise<void> {
    throw new Error("Dashboard data not available in DatabaseStorage - use MemStorage");
  }

  async trackToolAccess(userId: string, toolName: string): Promise<any> {
    throw new Error("Dashboard data not available in DatabaseStorage - use MemStorage");
  }

  async createActivityLog(userId: string, logData: any): Promise<any> {
    throw new Error("Dashboard data not available in DatabaseStorage - use MemStorage");
  }

  async updateUsageStats(userId: string, statField: string, increment: number): Promise<void> {
    throw new Error("Dashboard data not available in DatabaseStorage - use MemStorage");
  }

  async generateSampleMetrics(userId: string): Promise<void> {
    throw new Error("Dashboard data not available in DatabaseStorage - use MemStorage");
  }

  // Notification methods - stub implementations since we're using MemStorage
  async getNotifications(userId: string): Promise<Notification[]> {
    throw new Error("Notification data not available in DatabaseStorage - use MemStorage");
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    throw new Error("Notification data not available in DatabaseStorage - use MemStorage");
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    throw new Error("Notification data not available in DatabaseStorage - use MemStorage");
  }

  async markNotificationAsRead(userId: string, notificationId: string): Promise<Notification | null> {
    throw new Error("Notification data not available in DatabaseStorage - use MemStorage");
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    throw new Error("Notification data not available in DatabaseStorage - use MemStorage");
  }

  async deleteNotification(userId: string, notificationId: string): Promise<boolean> {
    throw new Error("Notification data not available in DatabaseStorage - use MemStorage");
  }

  async clearAllNotifications(userId: string): Promise<void> {
    throw new Error("Notification data not available in DatabaseStorage - use MemStorage");
  }

  // Settings methods - stub implementations since we're using MemStorage
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    throw new Error("Settings data not available in DatabaseStorage - use MemStorage");
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    throw new Error("Settings data not available in DatabaseStorage - use MemStorage");
  }

  async updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences> {
    throw new Error("Settings data not available in DatabaseStorage - use MemStorage");
  }

  async getIntegrationSettings(userId: string): Promise<IntegrationSettings[]> {
    throw new Error("Settings data not available in DatabaseStorage - use MemStorage");
  }

  async createIntegrationSettings(integration: InsertIntegrationSettings): Promise<IntegrationSettings> {
    throw new Error("Settings data not available in DatabaseStorage - use MemStorage");
  }

  async updateIntegrationSettings(id: string, updates: Partial<IntegrationSettings>): Promise<IntegrationSettings> {
    throw new Error("Settings data not available in DatabaseStorage - use MemStorage");
  }

  async deleteIntegrationSettings(id: string): Promise<void> {
    throw new Error("Settings data not available in DatabaseStorage - use MemStorage");
  }

  async getSecuritySettings(userId: string): Promise<SecuritySettings | undefined> {
    throw new Error("Settings data not available in DatabaseStorage - use MemStorage");
  }

  async createSecuritySettings(security: InsertSecuritySettings): Promise<SecuritySettings> {
    throw new Error("Settings data not available in DatabaseStorage - use MemStorage");
  }

  async updateSecuritySettings(userId: string, updates: Partial<SecuritySettings>): Promise<SecuritySettings> {
    throw new Error("Settings data not available in DatabaseStorage - use MemStorage");
  }

  async getLoginLogs(userId: string, limit?: number): Promise<LoginLog[]> {
    throw new Error("Settings data not available in DatabaseStorage - use MemStorage");
  }

  async createLoginLog(loginLog: InsertLoginLog): Promise<LoginLog> {
    throw new Error("Settings data not available in DatabaseStorage - use MemStorage");
  }

  async getSupportTickets(userId: string): Promise<SupportTicket[]> {
    throw new Error("Settings data not available in DatabaseStorage - use MemStorage");
  }

  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    throw new Error("Settings data not available in DatabaseStorage - use MemStorage");
  }

  async updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket> {
    throw new Error("Settings data not available in DatabaseStorage - use MemStorage");
  }

  async getAiGenerationHistory(userId: string, limit?: number): Promise<AiGenerationHistory[]> {
    throw new Error("Settings data not available in DatabaseStorage - use MemStorage");
  }

  async createAiGenerationHistory(history: InsertAiGenerationHistory): Promise<AiGenerationHistory> {
    throw new Error("Settings data not available in DatabaseStorage - use MemStorage");
  }

  // Performance tracking & self-learning stubs
  async getContentPerformance(userId: string, filters?: { productId?: string, aiGenerationId?: string }): Promise<ContentPerformance[]> {
    throw new Error("Performance tracking not available in DatabaseStorage - use MemStorage");
  }

  async createContentPerformance(performance: InsertContentPerformance): Promise<ContentPerformance> {
    throw new Error("Performance tracking not available in DatabaseStorage - use MemStorage");
  }

  async updateContentPerformance(id: string, updates: Partial<ContentPerformance>): Promise<ContentPerformance> {
    throw new Error("Performance tracking not available in DatabaseStorage - use MemStorage");
  }

  async getTopPerformingContent(userId: string, limit?: number): Promise<ContentPerformance[]> {
    throw new Error("Performance tracking not available in DatabaseStorage - use MemStorage");
  }

  async getLearningPatterns(userId: string, filters?: { category?: string, patternType?: string }): Promise<LearningPattern[]> {
    throw new Error("Learning patterns not available in DatabaseStorage - use MemStorage");
  }

  async createLearningPattern(pattern: InsertLearningPattern): Promise<LearningPattern> {
    throw new Error("Learning patterns not available in DatabaseStorage - use MemStorage");
  }

  async updateLearningPattern(id: string, updates: Partial<LearningPattern>): Promise<LearningPattern> {
    throw new Error("Learning patterns not available in DatabaseStorage - use MemStorage");
  }

  async getActivePatterns(userId: string): Promise<LearningPattern[]> {
    throw new Error("Learning patterns not available in DatabaseStorage - use MemStorage");
  }

  async getContentQualityScore(aiGenerationId: string): Promise<ContentQualityScore | undefined> {
    throw new Error("Quality scores not available in DatabaseStorage - use MemStorage");
  }

  async createContentQualityScore(score: InsertContentQualityScore): Promise<ContentQualityScore> {
    throw new Error("Quality scores not available in DatabaseStorage - use MemStorage");
  }

  async getQualityScoresByUser(userId: string, limit?: number): Promise<ContentQualityScore[]> {
    throw new Error("Quality scores not available in DatabaseStorage - use MemStorage");
  }

  // Payment transaction methods
  async createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(paymentTransactions).values(transaction).returning();
    return result[0];
  }

  async getPaymentTransaction(transactionId: string): Promise<PaymentTransaction | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(paymentTransactions).where(eq(paymentTransactions.id, transactionId));
    return result[0];
  }

  async getPaymentTransactions(userId: string, filters?: any): Promise<PaymentTransaction[]> {
    if (!db) throw new Error("Database not configured");
    let query = db.select().from(paymentTransactions).where(eq(paymentTransactions.userId, userId));
    
    if (filters?.status) {
      query = query.where(and(eq(paymentTransactions.userId, userId), eq(paymentTransactions.status, filters.status)));
    }
    if (filters?.gateway) {
      query = query.where(and(eq(paymentTransactions.userId, userId), eq(paymentTransactions.gateway, filters.gateway)));
    }
    
    const result = await query.orderBy(desc(paymentTransactions.createdAt)).limit(filters?.limit || 50);
    return result;
  }

  async getAllPaymentTransactions(filters?: any): Promise<PaymentTransaction[]> {
    if (!db) throw new Error("Database not configured");
    let query = db.select().from(paymentTransactions);
    
    if (filters?.userId) {
      query = query.where(eq(paymentTransactions.userId, filters.userId));
    }
    if (filters?.status) {
      query = query.where(eq(paymentTransactions.status, filters.status));
    }
    if (filters?.gateway) {
      query = query.where(eq(paymentTransactions.gateway, filters.gateway));
    }
    
    const result = await query.orderBy(desc(paymentTransactions.createdAt)).limit(filters?.limit || 100);
    return result;
  }

  async updatePaymentTransaction(transactionId: string, updates: Partial<PaymentTransaction>): Promise<PaymentTransaction> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(paymentTransactions)
      .set(updates)
      .where(eq(paymentTransactions.id, transactionId))
      .returning();
    return result[0];
  }

  // Advanced Notification Preference methods
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
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(notificationPreferences.userId, userId))
      .returning();
    return result[0];
  }

  async applyPresetMode(userId: string, preset: string): Promise<NotificationPreferences> {
    if (!db) throw new Error("Database not configured");
    
    const presetConfigs = {
      work: {
        activePreset: 'work',
        enableDigests: true,
        defaultFrequency: 'hourly_digest',
        minPriority: 'medium',
        enableQuietHours: true,
        quietHoursStart: '18:00',
        quietHoursEnd: '09:00',
        allowUrgentInQuietHours: true
      },
      focus: {
        activePreset: 'focus',
        enableDigests: true,
        defaultFrequency: 'daily_digest',
        minPriority: 'urgent',
        enableQuietHours: true,
        quietHoursStart: '00:00',
        quietHoursEnd: '23:59',
        allowUrgentInQuietHours: true
      },
      full_alerts: {
        activePreset: 'full_alerts',
        enableDigests: false,
        defaultFrequency: 'instant',
        minPriority: 'low',
        enableQuietHours: false,
        allowUrgentInQuietHours: true
      }
    };

    const config = presetConfigs[preset as keyof typeof presetConfigs] || presetConfigs.full_alerts;
    return this.updateNotificationPreferences(userId, config);
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
      .set({ ...updates, updatedAt: new Date() })
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
      .set({ ...updates, updatedAt: new Date() })
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
    let conditions = [eq(notificationAnalytics.userId, userId)];
    
    if (filters?.category) {
      conditions.push(eq(notificationAnalytics.category, filters.category));
    }
    
    return await db.select().from(notificationAnalytics)
      .where(and(...conditions))
      .orderBy(desc(notificationAnalytics.createdAt))
      .limit(filters?.limit || 100);
  }

  async createNotificationAnalytics(analytics: InsertNotificationAnalytics): Promise<NotificationAnalytics> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(notificationAnalytics).values(analytics).returning();
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

  // Session management methods
  async getUserSessions(userId: string): Promise<Session[]> {
    if (!db) throw new Error("Database not configured");
    console.log("[DB] Starting operation: getUserSessions");
    const result = await db.select().from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(desc(sessions.lastSeenAt));
    console.log("[DB] Operation completed successfully: getUserSessions");
    return result;
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(sessions)
      .where(eq(sessions.sessionId, sessionId));
    return result[0];
  }

  async createSession(data: InsertSession): Promise<Session> {
    if (!db) throw new Error("Database not configured");
    console.log("[DB] Starting operation: createSession");
    const result = await db.insert(sessions).values(data).returning();
    console.log("[DB] Operation completed successfully: createSession");
    return result[0];
  }

  async updateSession(sessionId: string, updates: Partial<Session>): Promise<Session> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(sessions)
      .set({ ...updates, lastSeenAt: new Date() })
      .where(eq(sessions.sessionId, sessionId))
      .returning();
    return result[0];
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (!db) throw new Error("Database not configured");
    console.log("[DB] Starting operation: deleteSession", sessionId);
    await db.delete(sessions).where(eq(sessions.sessionId, sessionId));
    console.log("[DB] Operation completed successfully: deleteSession");
  }

  async deleteUserSessions(userId: string, excludeSessionId?: string): Promise<void> {
    if (!db) throw new Error("Database not configured");
    console.log("[DB] Starting operation: deleteUserSessions");
    if (excludeSessionId) {
      // Delete all user sessions EXCEPT the excluded one
      await db.delete(sessions).where(
        and(
          eq(sessions.userId, userId),
          sql`${sessions.sessionId} != ${excludeSessionId}`
        )
      );
    } else {
      await db.delete(sessions).where(eq(sessions.userId, userId));
    }
    console.log("[DB] Operation completed successfully: deleteUserSessions");
  }

  async cleanupExpiredSessions(): Promise<void> {
    if (!db) throw new Error("Database not configured");
    console.log("[DB] Starting operation: cleanupExpiredSessions");
    // Delete sessions where expiresAt is in the past
    await db.delete(sessions).where(
      sql`${sessions.expiresAt} < NOW()`
    );
    console.log("[DB] Operation completed successfully: cleanupExpiredSessions");
  }

  // Bulk Optimization Job methods
  async getBulkOptimizationJobs(userId: string): Promise<BulkOptimizationJob[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(bulkOptimizationJobs)
      .where(eq(bulkOptimizationJobs.userId, userId))
      .orderBy(desc(bulkOptimizationJobs.createdAt));
  }

  async getBulkOptimizationJob(jobId: string): Promise<BulkOptimizationJob | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(bulkOptimizationJobs)
      .where(eq(bulkOptimizationJobs.id, jobId));
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

  // Bulk Optimization Item methods
  async getBulkOptimizationItems(jobId: string): Promise<BulkOptimizationItem[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(bulkOptimizationItems)
      .where(eq(bulkOptimizationItems.jobId, jobId))
      .orderBy(bulkOptimizationItems.createdAt);
  }

  async getBulkOptimizationItem(itemId: string): Promise<BulkOptimizationItem | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(bulkOptimizationItems)
      .where(eq(bulkOptimizationItems.id, itemId));
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

  // Bulk Image Optimization Job methods
  async getBulkImageJobs(userId: string): Promise<BulkImageJob[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(bulkImageJobs)
      .where(eq(bulkImageJobs.userId, userId))
      .orderBy(desc(bulkImageJobs.createdAt));
  }

  async getBulkImageJob(jobId: string): Promise<BulkImageJob | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(bulkImageJobs)
      .where(eq(bulkImageJobs.id, jobId));
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

  // Bulk Image Job Item methods
  async getBulkImageJobItems(jobId: string): Promise<BulkImageJobItem[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(bulkImageJobItems)
      .where(eq(bulkImageJobItems.jobId, jobId))
      .orderBy(bulkImageJobItems.createdAt);
  }

  async getBulkImageJobItem(itemId: string): Promise<BulkImageJobItem | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(bulkImageJobItems)
      .where(eq(bulkImageJobItems.id, itemId));
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

  // Image Optimization History methods
  async getImageOptimizationHistory(userId: string, filters?: { productId?: string, jobId?: string }): Promise<ImageOptimizationHistory[]> {
    if (!db) throw new Error("Database not configured");
    const conditions = [eq(imageOptimizationHistory.userId, userId)];
    
    if (filters?.productId) {
      conditions.push(eq(imageOptimizationHistory.productId, filters.productId));
    }
    if (filters?.jobId) {
      conditions.push(eq(imageOptimizationHistory.jobId, filters.jobId));
    }
    
    return await db.select().from(imageOptimizationHistory)
      .where(and(...conditions))
      .orderBy(desc(imageOptimizationHistory.createdAt));
  }

  async getImageOptimizationHistoryByIds(ids: string[]): Promise<ImageOptimizationHistory[]> {
    if (!db) throw new Error("Database not configured");
    if (ids.length === 0) return [];
    
    return await db.select().from(imageOptimizationHistory)
      .where(sql`${imageOptimizationHistory.id} = ANY(${ids})`);
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
}

export class MemStorage {
  private users: Map<string, User> = new Map();
  private products: Map<string, Product> = new Map();
  private seoMetas: Map<string, SeoMeta> = new Map();
  private productSeoHistoryData: Map<string, ProductSeoHistory> = new Map();
  private campaigns: Map<string, Campaign> = new Map();
  private analyticsData: Map<string, Analytics> = new Map();
  private notificationsData: Map<string, Notification> = new Map();
  
  // Real-time dashboard data storage
  private usageStats: Map<string, any> = new Map();
  private activityLogs: Map<string, any[]> = new Map();
  private toolsAccess: Map<string, any[]> = new Map();
  private realtimeMetrics: Map<string, any[]> = new Map();
  
  // Settings data storage
  private userPreferencesData: Map<string, UserPreferences> = new Map();
  private integrationSettingsData: Map<string, IntegrationSettings> = new Map();
  private securitySettingsData: Map<string, SecuritySettings> = new Map();
  private loginLogsData: Map<string, LoginLog> = new Map();
  private supportTicketsData: Map<string, SupportTicket> = new Map();
  private aiGenerationHistoryData: Map<string, AiGenerationHistory> = new Map();

  // Advanced notification preference data storage
  private notificationPreferencesData: Map<string, NotificationPreferences> = new Map();
  private notificationRulesData: Map<string, NotificationRule> = new Map();
  private notificationChannelsData: Map<string, NotificationChannel> = new Map();
  private notificationAnalyticsData: Map<string, NotificationAnalytics> = new Map();

  constructor() {
    // Create a test user for development
    this.initializeTestData();
  }

  private async initializeTestData() {
    try {
      const testUserId = randomUUID();
      const testUser: User = {
        id: testUserId,
        email: "test@example.com",
        password: null, // No password needed - using Supabase auth
        fullName: "Test User",
        role: "user",
        plan: "trial",
        trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        imageUrl: null,
        preferredLanguage: "en",
        createdAt: new Date(),
      };
      this.users.set(testUserId, testUser);
      console.log("✅ Test user created: test@example.com (Supabase auth)");
    } catch (error) {
      console.error("Failed to create test user:", error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = insertUser.id || randomUUID(); // Use provided ID or generate new one
    // No password hashing needed - Supabase handles authentication
    const user: User = {
      id,
      ...insertUser,
      password: insertUser.password || null, // Store null password for Supabase users
      role: "user",
      plan: "trial",
      trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      imageUrl: null,
      preferredLanguage: "en",
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    const updatedUser = { ...user, ...updates };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserProfile(userId: string, fullName: string, email: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    const updatedUser = { ...user, fullName, email };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserImage(userId: string, imageUrl: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    const updatedUser = { ...user, imageUrl };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<User> {
    // All password changes must be handled through Supabase auth
    throw new Error('Password changes must be handled through Supabase authentication. Use the Supabase dashboard or SDK for password management.');
  }

  async updateUserLanguage(userId: string, language: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    const updatedUser = { ...user, preferredLanguage: language };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  private storeConnections: Map<string, StoreConnection> = new Map();

  async getStoreConnections(userId: string): Promise<StoreConnection[]> {
    return Array.from(this.storeConnections.values()).filter(conn => conn.userId === userId);
  }

  async createStoreConnection(storeConnection: InsertStoreConnection): Promise<StoreConnection> {
    const id = randomUUID();
    const newConnection: StoreConnection = {
      id,
      ...storeConnection,
      status: storeConnection.status || "active",
      storeUrl: storeConnection.storeUrl || null,
      refreshToken: storeConnection.refreshToken || null,
      lastSyncAt: storeConnection.lastSyncAt || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.storeConnections.set(id, newConnection);
    return newConnection;
  }

  async updateStoreConnection(id: string, updates: Partial<StoreConnection>): Promise<StoreConnection> {
    const connection = this.storeConnections.get(id);
    if (!connection) throw new Error("Store connection not found");
    const updatedConnection = { ...connection, ...updates, updatedAt: new Date() };
    this.storeConnections.set(id, updatedConnection);
    return updatedConnection;
  }

  async deleteStoreConnection(id: string): Promise<void> {
    this.storeConnections.delete(id);
  }

  async getProducts(userId: string): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(product => product.userId === userId)
      .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(product: InsertProduct & { userId: string }): Promise<Product> {
    const id = randomUUID();
    const newProduct: Product = {
      id,
      ...product,
      description: product.description || null,
      originalDescription: product.originalDescription || null,
      originalCopy: product.originalCopy || null,
      category: product.category, // Required field, no fallback to null
      price: product.price, // Required field from new schema
      stock: product.stock || 0, // Default to 0 if not provided
      image: product.image || null, // Optional field
      features: product.features || null,
      tags: product.tags || null,
      optimizedCopy: product.optimizedCopy || null,
      shopifyId: product.shopifyId || null,
      isOptimized: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const product = this.products.get(id);
    if (!product) throw new Error("Product not found");
    const updatedProduct = { ...product, ...updates, updatedAt: new Date() };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    this.products.delete(id);
  }

  async getSeoMeta(productId: string): Promise<SeoMeta | undefined> {
    return Array.from(this.seoMetas.values()).find(seo => seo.productId === productId);
  }

  async createSeoMeta(seoMetaData: InsertSeoMeta): Promise<SeoMeta> {
    const id = randomUUID();
    const seo: SeoMeta = {
      id,
      ...seoMetaData,
      seoTitle: seoMetaData.seoTitle || null,
      metaDescription: seoMetaData.metaDescription || null,
      keywords: seoMetaData.keywords || null,
      optimizedTitle: seoMetaData.optimizedTitle || null,
      optimizedMeta: seoMetaData.optimizedMeta || null,
      seoScore: seoMetaData.seoScore || null,
      createdAt: new Date(),
    };
    this.seoMetas.set(id, seo);
    return seo;
  }

  async updateSeoMeta(productId: string, updates: Partial<SeoMeta>): Promise<SeoMeta> {
    const existing = await this.getSeoMeta(productId);
    if (!existing) throw new Error("SEO meta not found");
    const updated = { ...existing, ...updates };
    this.seoMetas.set(existing.id, updated);
    return updated;
  }

  async saveProductSEOHistory(data: InsertProductSeoHistory): Promise<ProductSeoHistory> {
    const id = randomUUID();
    const historyRecord: ProductSeoHistory = {
      id,
      userId: data.userId,
      productId: data.productId || null,
      productName: data.productName,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      keywords: JSON.parse(JSON.stringify(data.keywords)), // Deep clone array
      seoScore: data.seoScore || null,
      searchIntent: data.searchIntent || null,
      suggestedKeywords: data.suggestedKeywords ? JSON.parse(JSON.stringify(data.suggestedKeywords)) : null, // Deep clone array
      createdAt: new Date()
    };
    this.productSeoHistoryData.set(id, historyRecord);
    return JSON.parse(JSON.stringify(historyRecord)); // Return deep clone
  }

  async getProductSEOHistory(userId: string): Promise<ProductSeoHistory[]> {
    const history = Array.from(this.productSeoHistoryData.values())
      .filter(record => record.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    return JSON.parse(JSON.stringify(history)); // Return deep clone
  }

  async getCampaigns(userId: string): Promise<Campaign[]> {
    return Array.from(this.campaigns.values())
      .filter(campaign => campaign.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const id = randomUUID();
    const newCampaign: Campaign = {
      id,
      ...campaign,
      subject: campaign.subject || null,
      status: "draft",
      sentCount: 0,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      templateId: campaign.templateId || null,
      scheduledFor: campaign.scheduledFor || null,
      sentAt: campaign.sentAt || null,
      recipientList: campaign.recipientList || null,
      metadata: campaign.metadata || null,
      goalType: campaign.goalType || null,
      audience: campaign.audience || null,
    };
    this.campaigns.set(id, newCampaign);
    return newCampaign;
  }

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign> {
    const campaign = this.campaigns.get(id);
    if (!campaign) throw new Error("Campaign not found");
    const updated = { ...campaign, ...updates };
    this.campaigns.set(id, updated);
    return updated;
  }

  async getAnalytics(userId: string, metricType?: string): Promise<Analytics[]> {
    return Array.from(this.analyticsData.values())
      .filter(analytic => 
        analytic.userId === userId && 
        (!metricType || analytic.metricType === metricType)
      )
      .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
  }

  async createAnalytic(analytic: InsertAnalytics): Promise<Analytics> {
    const id = randomUUID();
    const newAnalytic: Analytics = {
      id,
      ...analytic,
      date: analytic.date || new Date(),
      metadata: analytic.metadata || null,
    };
    this.analyticsData.set(id, newAnalytic);
    return newAnalytic;
  }

  // Real-time Dashboard methods implementation
  async getDashboardData(userId: string): Promise<{
    user: User | undefined;
    profile: any;
    usageStats: any;
    activityLogs: any[];
    toolsAccess: any[];
    realtimeMetrics: any[];
  }> {
    const user = await this.getUser(userId);
    const usageStats = this.usageStats.get(userId) || null;
    const activityLogs = this.activityLogs.get(userId) || [];
    const toolsAccess = this.toolsAccess.get(userId) || [];
    const realtimeMetrics = this.realtimeMetrics.get(userId) || [];
    
    return {
      user,
      profile: user ? { 
        userId: user.id, 
        name: user.fullName, 
        email: user.email,
        plan: user.plan 
      } : null,
      usageStats,
      activityLogs: activityLogs.slice(0, 10), // Latest 10 activities
      toolsAccess,
      realtimeMetrics,
    };
  }

  async initializeUserRealtimeData(userId: string): Promise<void> {
    // Initialize usage stats with realistic sample data
    if (!this.usageStats.has(userId)) {
      this.usageStats.set(userId, {
        userId,
        totalRevenue: Math.floor(Math.random() * 50000) + 15000, // $150-$650
        totalOrders: Math.floor(Math.random() * 500) + 200, // 200-700 orders
        conversionRate: Math.floor(Math.random() * 300) + 250, // 2.5-5.5% conversion
        cartRecoveryRate: Math.floor(Math.random() * 2000) + 6000, // 60-80% recovery
        productsOptimized: 0,
        emailsSent: 0,
        smsSent: 0,
        aiGenerationsUsed: 0,
        seoOptimizationsUsed: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Initialize activity logs
    if (!this.activityLogs.has(userId)) {
      this.activityLogs.set(userId, [
        {
          id: randomUUID(),
          userId,
          action: "user_login",
          description: "User logged into dashboard",
          toolUsed: "dashboard",
          metadata: { timestamp: new Date().toISOString() },
          createdAt: new Date().toISOString(),
        }
      ]);
    }

    // Initialize tools access
    if (!this.toolsAccess.has(userId)) {
      this.toolsAccess.set(userId, []);
    }

    // Initialize real-time metrics
    if (!this.realtimeMetrics.has(userId)) {
      this.realtimeMetrics.set(userId, []);
    }
  }

  async trackToolAccess(userId: string, toolName: string): Promise<any> {
    const userTools = this.toolsAccess.get(userId) || [];
    const existingTool = userTools.find(tool => tool.toolName === toolName);
    
    if (existingTool) {
      existingTool.accessCount += 1;
      existingTool.lastAccessed = new Date().toISOString();
    } else {
      userTools.push({
        id: randomUUID(),
        userId,
        toolName,
        accessCount: 1,
        lastAccessed: new Date().toISOString(),
        firstAccessed: new Date().toISOString(),
      });
    }
    
    this.toolsAccess.set(userId, userTools);
    return existingTool || userTools[userTools.length - 1];
  }

  async createActivityLog(userId: string, logData: any): Promise<any> {
    const userActivities = this.activityLogs.get(userId) || [];
    const newActivity = {
      id: randomUUID(),
      userId,
      ...logData,
      createdAt: new Date().toISOString(),
    };
    
    userActivities.unshift(newActivity); // Add to beginning for latest first
    
    // Keep only latest 50 activities to prevent memory bloat
    if (userActivities.length > 50) {
      userActivities.splice(50);
    }
    
    this.activityLogs.set(userId, userActivities);
    return newActivity;
  }

  async updateUsageStats(userId: string, statField: string, increment: number): Promise<void> {
    const stats = this.usageStats.get(userId) || {};
    stats[statField] = (stats[statField] || 0) + increment;
    stats.lastUpdated = new Date().toISOString();
    this.usageStats.set(userId, stats);
  }

  async generateSampleMetrics(userId: string): Promise<void> {
    const userMetrics = this.realtimeMetrics.get(userId) || [];
    
    const newMetrics = [
      {
        id: randomUUID(),
        userId,
        metricName: "revenue_change",
        value: "$" + (Math.floor(Math.random() * 5000) + 1000),
        changePercent: "+" + (Math.random() * 20 + 5).toFixed(1) + "%",
        isPositive: true,
        timestamp: new Date().toISOString(),
      },
      {
        id: randomUUID(),
        userId,
        metricName: "orders_change", 
        value: (Math.floor(Math.random() * 100) + 50).toString(),
        changePercent: "+" + (Math.random() * 15 + 3).toFixed(1) + "%",
        isPositive: true,
        timestamp: new Date().toISOString(),
      },
      {
        id: randomUUID(),
        userId,
        metricName: "conversion_change",
        value: (Math.random() * 2 + 2).toFixed(1) + "%",
        changePercent: (Math.random() > 0.5 ? "+" : "-") + (Math.random() * 5 + 1).toFixed(1) + "%",
        isPositive: Math.random() > 0.3,
        timestamp: new Date().toISOString(),
      },
    ];

    // Add new metrics and keep only latest 20
    userMetrics.push(...newMetrics);
    if (userMetrics.length > 20) {
      userMetrics.splice(0, userMetrics.length - 20);
    }
    
    this.realtimeMetrics.set(userId, userMetrics);
  }

  // Notification methods implementation
  async getNotifications(userId: string): Promise<Notification[]> {
    return Array.from(this.notificationsData.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    return Array.from(this.notificationsData.values())
      .filter(notification => notification.userId === userId && !notification.isRead)
      .length;
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      id,
      ...notificationData,
      type: notificationData.type || "info", // Provide default value for required field
      actionUrl: notificationData.actionUrl || null, // Ensure not undefined
      actionLabel: notificationData.actionLabel || null, // Ensure not undefined
      isRead: false,
      createdAt: new Date(),
      readAt: null,
    };
    this.notificationsData.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(userId: string, notificationId: string): Promise<Notification | null> {
    const notification = this.notificationsData.get(notificationId);
    if (!notification || notification.userId !== userId) {
      return null; // Not found or doesn't belong to user
    }
    
    const updatedNotification = {
      ...notification,
      isRead: true,
      readAt: new Date(),
    };
    
    this.notificationsData.set(notificationId, updatedNotification);
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const userNotifications = Array.from(this.notificationsData.values())
      .filter(notification => notification.userId === userId && !notification.isRead);
    
    for (const notification of userNotifications) {
      const updatedNotification = {
        ...notification,
        isRead: true,
        readAt: new Date(),
      };
      this.notificationsData.set(notification.id, updatedNotification);
    }
  }

  async deleteNotification(userId: string, notificationId: string): Promise<boolean> {
    const notification = this.notificationsData.get(notificationId);
    if (!notification || notification.userId !== userId) {
      return false; // Not found or doesn't belong to user
    }
    
    this.notificationsData.delete(notificationId);
    return true; // Successfully deleted
  }

  async clearAllNotifications(userId: string): Promise<void> {
    const userNotifications = Array.from(this.notificationsData.values())
      .filter(notification => notification.userId === userId);
    
    for (const notification of userNotifications) {
      this.notificationsData.delete(notification.id);
    }
  }

  // Billing methods implementation
  async getUserSubscription(userId: string): Promise<any> {
    // Return mock subscription data for demo purposes
    return {
      id: `sub_${userId}`,
      planId: "plan_free",
      status: "active",
      currentPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false
    };
  }

  async getUserUsageStats(userId: string): Promise<any> {
    // Return mock usage stats for demo purposes
    return {
      productsCount: 3,
      emailsSent: 15,
      emailsRemaining: 485,
      smsSent: 5,
      smsRemaining: 195,
      aiGenerationsUsed: 25,
      seoOptimizationsUsed: 8
    };
  }

  async getUserInvoices(userId: string): Promise<any[]> {
    // Return mock invoice data for demo purposes
    const mockInvoices = [
      {
        id: `inv_${userId}_1`,
        amount: 39.00,
        currency: "USD",
        status: "paid",
        invoiceNumber: "INV-2024-001",
        invoiceUrl: "#",
        pdfUrl: "#",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        paidAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: `inv_${userId}_2`,
        amount: 39.00,
        currency: "USD",
        status: "paid",
        invoiceNumber: "INV-2024-002",
        invoiceUrl: "#",
        pdfUrl: "#",
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        paidAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    return mockInvoices;
  }

  async getUserPaymentMethods(userId: string): Promise<any[]> {
    // Return mock payment method data for demo purposes
    const mockPaymentMethods = [
      {
        id: `pm_${userId}_1`,
        type: "card",
        cardBrand: "visa",
        cardLast4: "4242",
        cardExpMonth: 12,
        cardExpYear: 2025,
        isDefault: true
      }
    ];
    return mockPaymentMethods;
  }

  // Settings methods implementation
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    return Array.from(this.userPreferencesData.values()).find(pref => pref.userId === userId);
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const id = randomUUID();
    const newPreferences: UserPreferences = {
      id,
      ...preferences,
      aiSettings: preferences.aiSettings || null,
      notificationSettings: preferences.notificationSettings || null,
      uiPreferences: preferences.uiPreferences || null,
      privacySettings: preferences.privacySettings || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.userPreferencesData.set(id, newPreferences);
    return newPreferences;
  }

  async updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences> {
    const existing = await this.getUserPreferences(userId);
    if (!existing) throw new Error("User preferences not found");
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.userPreferencesData.set(existing.id, updated);
    return updated;
  }

  async getIntegrationSettings(userId: string): Promise<IntegrationSettings[]> {
    return Array.from(this.integrationSettingsData.values())
      .filter(integration => integration.userId === userId)
      .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));
  }

  async createIntegrationSettings(integration: InsertIntegrationSettings): Promise<IntegrationSettings> {
    const id = randomUUID();
    const newIntegration: IntegrationSettings = {
      id,
      ...integration,
      credentials: integration.credentials || null,
      isActive: integration.isActive !== undefined ? integration.isActive : true,
      lastSync: integration.lastSync || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.integrationSettingsData.set(id, newIntegration);
    return newIntegration;
  }

  async updateIntegrationSettings(id: string, updates: Partial<IntegrationSettings>): Promise<IntegrationSettings> {
    const integration = this.integrationSettingsData.get(id);
    if (!integration) throw new Error("Integration settings not found");
    const updated = { ...integration, ...updates, updatedAt: new Date() };
    this.integrationSettingsData.set(id, updated);
    return updated;
  }

  async deleteIntegrationSettings(id: string): Promise<void> {
    this.integrationSettingsData.delete(id);
  }

  async getSecuritySettings(userId: string): Promise<SecuritySettings | undefined> {
    return Array.from(this.securitySettingsData.values()).find(security => security.userId === userId);
  }

  async createSecuritySettings(security: InsertSecuritySettings): Promise<SecuritySettings> {
    const id = randomUUID();
    const newSecurity: SecuritySettings = {
      id,
      ...security,
      twoFactorEnabled: security.twoFactorEnabled || false,
      twoFactorSecret: security.twoFactorSecret || null,
      backupCodes: security.backupCodes || null,
      loginNotifications: security.loginNotifications !== undefined ? security.loginNotifications : true,
      sessionTimeout: security.sessionTimeout || 3600,
      lastPasswordChange: security.lastPasswordChange || new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.securitySettingsData.set(id, newSecurity);
    return newSecurity;
  }

  async updateSecuritySettings(userId: string, updates: Partial<SecuritySettings>): Promise<SecuritySettings> {
    const existing = await this.getSecuritySettings(userId);
    if (!existing) throw new Error("Security settings not found");
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.securitySettingsData.set(existing.id, updated);
    return updated;
  }

  async getLoginLogs(userId: string, limit: number = 50): Promise<LoginLog[]> {
    return Array.from(this.loginLogsData.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  async createLoginLog(loginLog: InsertLoginLog): Promise<LoginLog> {
    const id = randomUUID();
    const newLog: LoginLog = {
      id,
      ...loginLog,
      userAgent: loginLog.userAgent || null,
      location: loginLog.location || null,
      failureReason: loginLog.failureReason || null,
      createdAt: new Date()
    };
    this.loginLogsData.set(id, newLog);
    return newLog;
  }

  async getSupportTickets(userId: string): Promise<SupportTicket[]> {
    return Array.from(this.supportTicketsData.values())
      .filter(ticket => ticket.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    const id = randomUUID();
    const newTicket: SupportTicket = {
      id,
      ...ticket,
      priority: ticket.priority || "medium",
      status: ticket.status || "open",
      metadata: ticket.metadata || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.supportTicketsData.set(id, newTicket);
    return newTicket;
  }

  async updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket> {
    const ticket = this.supportTicketsData.get(id);
    if (!ticket) throw new Error("Support ticket not found");
    const updated = { ...ticket, ...updates, updatedAt: new Date() };
    this.supportTicketsData.set(id, updated);
    return updated;
  }

  async getAiGenerationHistory(userId: string, limit: number = 100): Promise<AiGenerationHistory[]> {
    return Array.from(this.aiGenerationHistoryData.values())
      .filter(history => history.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  async createAiGenerationHistory(history: InsertAiGenerationHistory): Promise<AiGenerationHistory> {
    const id = randomUUID();
    const newHistory: AiGenerationHistory = {
      id,
      ...history,
      brandVoice: history.brandVoice || null,
      tokensUsed: history.tokensUsed || null,
      model: history.model || "gpt-4o-mini",
      createdAt: new Date()
    };
    this.aiGenerationHistoryData.set(id, newHistory);
    return newHistory;
  }

  // Performance tracking & self-learning methods
  private contentPerformanceData: Map<string, ContentPerformance> = new Map();
  private learningPatternsData: Map<string, LearningPattern> = new Map();
  private contentQualityScoresData: Map<string, ContentQualityScore> = new Map();

  async getContentPerformance(userId: string, filters?: { productId?: string, aiGenerationId?: string }): Promise<ContentPerformance[]> {
    let performances = Array.from(this.contentPerformanceData.values())
      .filter(p => p.userId === userId);
    
    if (filters?.productId) {
      performances = performances.filter(p => p.productId === filters.productId);
    }
    if (filters?.aiGenerationId) {
      performances = performances.filter(p => p.aiGenerationId === filters.aiGenerationId);
    }
    
    return performances;
  }

  async createContentPerformance(performance: InsertContentPerformance): Promise<ContentPerformance> {
    const id = randomUUID();
    const newPerformance: ContentPerformance = {
      id,
      ...performance,
      aiGenerationId: performance.aiGenerationId || null,
      productId: performance.productId || null,
      views: performance.views || 0,
      clicks: performance.clicks || 0,
      conversions: performance.conversions || 0,
      revenue: performance.revenue || "0",
      ctr: performance.ctr || "0",
      conversionRate: performance.conversionRate || "0",
      performanceScore: performance.performanceScore || 0,
      engagementScore: performance.engagementScore || 0,
      wordCount: performance.wordCount || null,
      readabilityScore: performance.readabilityScore || null,
      emotionalTone: performance.emotionalTone || null,
      keywordDensity: performance.keywordDensity || null,
      performanceDelta: performance.performanceDelta || null,
      baselineScore: performance.baselineScore || null,
      firstRecordedAt: new Date(),
      lastUpdatedAt: new Date(),
      measurementPeriodDays: performance.measurementPeriodDays || 7
    };
    this.contentPerformanceData.set(id, newPerformance);
    return newPerformance;
  }

  async updateContentPerformance(id: string, updates: Partial<ContentPerformance>): Promise<ContentPerformance> {
    const performance = this.contentPerformanceData.get(id);
    if (!performance) throw new Error("Content performance record not found");
    const updated = { ...performance, ...updates, lastUpdatedAt: new Date() };
    this.contentPerformanceData.set(id, updated);
    return updated;
  }

  async getTopPerformingContent(userId: string, limit: number = 10): Promise<ContentPerformance[]> {
    return Array.from(this.contentPerformanceData.values())
      .filter(p => p.userId === userId)
      .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0))
      .slice(0, limit);
  }

  async getLearningPatterns(userId: string, filters?: { category?: string, patternType?: string }): Promise<LearningPattern[]> {
    let patterns = Array.from(this.learningPatternsData.values())
      .filter(p => p.userId === userId);
    
    if (filters?.category) {
      patterns = patterns.filter(p => p.category === filters.category);
    }
    if (filters?.patternType) {
      patterns = patterns.filter(p => p.patternType === filters.patternType);
    }
    
    return patterns;
  }

  async createLearningPattern(pattern: InsertLearningPattern): Promise<LearningPattern> {
    const id = randomUUID();
    const newPattern: LearningPattern = {
      id,
      ...pattern,
      category: pattern.category || null,
      targetAudience: pattern.targetAudience || null,
      priceRange: pattern.priceRange || null,
      framework: pattern.framework || null,
      confidence: pattern.confidence || "0",
      lastValidated: new Date(),
      timesApplied: pattern.timesApplied || 0,
      timesSucceeded: pattern.timesSucceeded || 0,
      isActive: pattern.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
      averagePerformanceScore: pattern.averagePerformanceScore || null,
      averageConversionRate: pattern.averageConversionRate || null
    };
    this.learningPatternsData.set(id, newPattern);
    return newPattern;
  }

  async updateLearningPattern(id: string, updates: Partial<LearningPattern>): Promise<LearningPattern> {
    const pattern = this.learningPatternsData.get(id);
    if (!pattern) throw new Error("Learning pattern not found");
    const updated = { ...pattern, ...updates, updatedAt: new Date() };
    this.learningPatternsData.set(id, updated);
    return updated;
  }

  async getActivePatterns(userId: string): Promise<LearningPattern[]> {
    return Array.from(this.learningPatternsData.values())
      .filter(p => p.userId === userId && p.isActive)
      .sort((a, b) => parseFloat(b.successRate || "0") - parseFloat(a.successRate || "0"));
  }

  async getContentQualityScore(aiGenerationId: string): Promise<ContentQualityScore | undefined> {
    return Array.from(this.contentQualityScoresData.values())
      .find(score => score.aiGenerationId === aiGenerationId);
  }

  async createContentQualityScore(score: InsertContentQualityScore): Promise<ContentQualityScore> {
    const id = randomUUID();
    const newScore: ContentQualityScore = {
      id,
      ...score,
      seoScore: score.seoScore || 0,
      keywordOptimization: score.keywordOptimization || 0,
      metaQuality: score.metaQuality || 0,
      readabilityScore: score.readabilityScore || 0,
      gradeLevel: score.gradeLevel || null,
      sentenceComplexity: score.sentenceComplexity || 0,
      emotionalScore: score.emotionalScore || 0,
      persuasionScore: score.persuasionScore || 0,
      urgencyScore: score.urgencyScore || 0,
      brandConsistencyScore: score.brandConsistencyScore || 0,
      toneMatch: score.toneMatch || 0,
      overallScore: score.overallScore || 0,
      passedValidation: score.passedValidation ?? true,
      validationIssues: score.validationIssues || null,
      competitorScore: score.competitorScore || null,
      industryBenchmark: score.industryBenchmark || null,
      createdAt: new Date()
    };
    this.contentQualityScoresData.set(id, newScore);
    return newScore;
  }

  async getQualityScoresByUser(userId: string, limit: number = 50): Promise<ContentQualityScore[]> {
    return Array.from(this.contentQualityScoresData.values())
      .filter(score => score.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  // Bulk optimization data storage
  private bulkOptimizationJobsData: Map<string, BulkOptimizationJob> = new Map();
  private bulkOptimizationItemsData: Map<string, BulkOptimizationItem> = new Map();

  // Payment transaction methods (mock implementation)
  private paymentTransactionsData: Map<string, any> = new Map();

  async createPaymentTransaction(transaction: any): Promise<any> {
    const id = randomUUID();
    const newTransaction = {
      id,
      ...transaction,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.paymentTransactionsData.set(id, newTransaction);
    return newTransaction;
  }

  async getPaymentTransaction(transactionId: string): Promise<any> {
    return this.paymentTransactionsData.get(transactionId);
  }

  async getPaymentTransactions(userId: string, filters?: any): Promise<any[]> {
    const transactions = Array.from(this.paymentTransactionsData.values())
      .filter(t => t.userId === userId);
    
    let filtered = transactions;
    if (filters?.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }
    if (filters?.gateway) {
      filtered = filtered.filter(t => t.gateway === filters.gateway);
    }
    
    return filtered.slice(0, filters?.limit || 50);
  }

  async getAllPaymentTransactions(filters?: any): Promise<any[]> {
    let transactions = Array.from(this.paymentTransactionsData.values());
    
    if (filters?.userId) {
      transactions = transactions.filter(t => t.userId === filters.userId);
    }
    if (filters?.status) {
      transactions = transactions.filter(t => t.status === filters.status);
    }
    if (filters?.gateway) {
      transactions = transactions.filter(t => t.gateway === filters.gateway);
    }
    
    return transactions.slice(0, filters?.limit || 100);
  }

  async updatePaymentTransaction(transactionId: string, updates: any): Promise<any> {
    const transaction = this.paymentTransactionsData.get(transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }
    
    const updated = {
      ...transaction,
      ...updates,
      updatedAt: new Date()
    };
    this.paymentTransactionsData.set(transactionId, updated);
    return updated;
  }

  // Advanced Notification Preference methods
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | undefined> {
    return Array.from(this.notificationPreferencesData.values()).find(pref => pref.userId === userId);
  }

  async createNotificationPreferences(preferences: InsertNotificationPreferences): Promise<NotificationPreferences> {
    const id = randomUUID();
    const newPreferences: NotificationPreferences = {
      id,
      ...preferences,
      activePreset: preferences.activePreset || 'full_alerts',
      enableDigests: preferences.enableDigests !== undefined ? preferences.enableDigests : false,
      defaultFrequency: preferences.defaultFrequency || 'instant',
      digestTime: preferences.digestTime || '09:00',
      minPriority: preferences.minPriority || 'low',
      enableQuietHours: preferences.enableQuietHours !== undefined ? preferences.enableQuietHours : false,
      quietHoursStart: preferences.quietHoursStart || '22:00',
      quietHoursEnd: preferences.quietHoursEnd || '08:00',
      allowUrgentInQuietHours: preferences.allowUrgentInQuietHours !== undefined ? preferences.allowUrgentInQuietHours : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.notificationPreferencesData.set(id, newPreferences);
    return newPreferences;
  }

  async updateNotificationPreferences(userId: string, updates: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const existing = await this.getNotificationPreferences(userId);
    if (!existing) throw new Error("Notification preferences not found");
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.notificationPreferencesData.set(existing.id, updated);
    return updated;
  }

  async applyPresetMode(userId: string, preset: string): Promise<NotificationPreferences> {
    const presetConfigs = {
      work: {
        activePreset: 'work',
        enableDigests: true,
        defaultFrequency: 'hourly_digest',
        minPriority: 'medium',
        enableQuietHours: true,
        quietHoursStart: '18:00',
        quietHoursEnd: '09:00',
        allowUrgentInQuietHours: true
      },
      focus: {
        activePreset: 'focus',
        enableDigests: true,
        defaultFrequency: 'daily_digest',
        minPriority: 'urgent',
        enableQuietHours: true,
        quietHoursStart: '00:00',
        quietHoursEnd: '23:59',
        allowUrgentInQuietHours: true
      },
      full_alerts: {
        activePreset: 'full_alerts',
        enableDigests: false,
        defaultFrequency: 'instant',
        minPriority: 'low',
        enableQuietHours: false,
        allowUrgentInQuietHours: true
      }
    };

    const config = presetConfigs[preset as keyof typeof presetConfigs] || presetConfigs.full_alerts;
    return this.updateNotificationPreferences(userId, config);
  }

  async getNotificationRules(userId: string): Promise<NotificationRule[]> {
    return Array.from(this.notificationRulesData.values())
      .filter(rule => rule.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getNotificationRule(userId: string, category: string): Promise<NotificationRule | undefined> {
    return Array.from(this.notificationRulesData.values())
      .find(rule => rule.userId === userId && rule.category === category);
  }

  async createNotificationRule(rule: InsertNotificationRule): Promise<NotificationRule> {
    const id = randomUUID();
    const newRule: NotificationRule = {
      id,
      ...rule,
      enabled: rule.enabled !== undefined ? rule.enabled : true,
      frequency: rule.frequency || 'instant',
      minPriority: rule.minPriority || 'low',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.notificationRulesData.set(id, newRule);
    return newRule;
  }

  async updateNotificationRule(id: string, updates: Partial<NotificationRule>): Promise<NotificationRule> {
    const rule = this.notificationRulesData.get(id);
    if (!rule) throw new Error("Notification rule not found");
    const updated = { ...rule, ...updates, updatedAt: new Date() };
    this.notificationRulesData.set(id, updated);
    return updated;
  }

  async deleteNotificationRule(id: string): Promise<void> {
    this.notificationRulesData.delete(id);
  }

  async getNotificationChannels(userId: string): Promise<NotificationChannel[]> {
    return Array.from(this.notificationChannelsData.values())
      .filter(channel => channel.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createNotificationChannel(channel: InsertNotificationChannel): Promise<NotificationChannel> {
    const id = randomUUID();
    const newChannel: NotificationChannel = {
      id,
      ...channel,
      channelValue: channel.channelValue || null,
      deviceInfo: channel.deviceInfo || null,
      enabled: channel.enabled !== undefined ? channel.enabled : true,
      isPrimary: channel.isPrimary !== undefined ? channel.isPrimary : false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.notificationChannelsData.set(id, newChannel);
    return newChannel;
  }

  async updateNotificationChannel(id: string, updates: Partial<NotificationChannel>): Promise<NotificationChannel> {
    const channel = this.notificationChannelsData.get(id);
    if (!channel) throw new Error("Notification channel not found");
    const updated = { ...channel, ...updates, updatedAt: new Date() };
    this.notificationChannelsData.set(id, updated);
    return updated;
  }

  async deleteNotificationChannel(id: string): Promise<void> {
    this.notificationChannelsData.delete(id);
  }

  async getNotificationAnalytics(userId: string, filters?: any): Promise<NotificationAnalytics[]> {
    let analytics = Array.from(this.notificationAnalyticsData.values())
      .filter(item => item.userId === userId);
    
    if (filters?.category) {
      analytics = analytics.filter(item => item.category === filters.category);
    }
    
    return analytics
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, filters?.limit || 100);
  }

  async createNotificationAnalytics(analytics: InsertNotificationAnalytics): Promise<NotificationAnalytics> {
    const id = randomUUID();
    const newAnalytics: NotificationAnalytics = {
      id,
      ...analytics,
      notificationId: analytics.notificationId || null,
      delivered: analytics.delivered !== undefined ? analytics.delivered : false,
      deliveredAt: analytics.deliveredAt || null,
      viewed: analytics.viewed !== undefined ? analytics.viewed : false,
      viewedAt: analytics.viewedAt || null,
      clicked: analytics.clicked !== undefined ? analytics.clicked : false,
      clickedAt: analytics.clickedAt || null,
      dismissed: analytics.dismissed !== undefined ? analytics.dismissed : false,
      dismissedAt: analytics.dismissedAt || null,
      createdAt: new Date()
    };
    this.notificationAnalyticsData.set(id, newAnalytics);
    return newAnalytics;
  }

  async updateNotificationAnalytics(id: string, updates: Partial<NotificationAnalytics>): Promise<NotificationAnalytics> {
    const analytics = this.notificationAnalyticsData.get(id);
    if (!analytics) throw new Error("Notification analytics not found");
    const updated = { ...analytics, ...updates };
    this.notificationAnalyticsData.set(id, updated);
    return updated;
  }

  // Session management stub methods (not fully functional in memory storage)
  async getUserSessions(userId: string): Promise<Session[]> {
    return [];
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    return undefined;
  }

  async createSession(data: InsertSession): Promise<Session> {
    const id = randomUUID();
    const session: Session = {
      id,
      sessionId: data.sessionId,
      userId: data.userId,
      refreshTokenId: data.refreshTokenId || null,
      userAgent: data.userAgent || null,
      deviceType: data.deviceType || null,
      browser: data.browser || null,
      os: data.os || null,
      ipAddress: data.ipAddress || null,
      location: data.location || null,
      lastSeenAt: data.lastSeenAt || new Date(),
      expiresAt: data.expiresAt,
      createdAt: new Date()
    };
    return session;
  }

  async updateSession(sessionId: string, updates: Partial<Session>): Promise<Session> {
    throw new Error("Session update not implemented in memory storage");
  }

  async deleteSession(sessionId: string): Promise<void> {
    // No-op in memory storage
  }

  async deleteUserSessions(userId: string, excludeSessionId?: string): Promise<void> {
    // No-op in memory storage
  }

  async cleanupExpiredSessions(): Promise<void> {
    // No-op in memory storage
  }

  // Bulk Optimization methods
  async getBulkOptimizationJobs(userId: string): Promise<BulkOptimizationJob[]> {
    return Array.from(this.bulkOptimizationJobsData.values())
      .filter(job => job.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getBulkOptimizationJob(jobId: string): Promise<BulkOptimizationJob | undefined> {
    return this.bulkOptimizationJobsData.get(jobId);
  }

  async createBulkOptimizationJob(data: InsertBulkOptimizationJob): Promise<BulkOptimizationJob> {
    const id = randomUUID();
    const newJob: BulkOptimizationJob = {
      id,
      userId: data.userId,
      name: data.name,
      status: data.status || 'pending',
      totalItems: data.totalItems || 0,
      processedItems: data.processedItems || 0,
      optimizedItems: data.optimizedItems || 0,
      failedItems: data.failedItems || 0,
      skippedItems: data.skippedItems || 0,
      progressPercentage: data.progressPercentage || 0,
      errorMessage: data.errorMessage || null,
      startedAt: data.startedAt || null,
      completedAt: data.completedAt || null,
      estimatedCompletionTime: data.estimatedCompletionTime || null,
      aiModel: data.aiModel || 'gpt-4o-mini',
      totalTokensUsed: data.totalTokensUsed || 0,
      estimatedCost: data.estimatedCost || '0',
      metadata: data.metadata || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.bulkOptimizationJobsData.set(id, newJob);
    return newJob;
  }

  async updateBulkOptimizationJob(jobId: string, updates: Partial<BulkOptimizationJob>): Promise<BulkOptimizationJob> {
    const job = this.bulkOptimizationJobsData.get(jobId);
    if (!job) throw new Error("Bulk optimization job not found");
    const updatedJob = { ...job, ...updates, updatedAt: new Date() };
    this.bulkOptimizationJobsData.set(jobId, updatedJob);
    return updatedJob;
  }

  async deleteBulkOptimizationJob(jobId: string): Promise<void> {
    this.bulkOptimizationJobsData.delete(jobId);
    // Also delete all items for this job
    const itemsToDelete = Array.from(this.bulkOptimizationItemsData.entries())
      .filter(([_, item]) => item.jobId === jobId)
      .map(([itemId]) => itemId);
    itemsToDelete.forEach(itemId => this.bulkOptimizationItemsData.delete(itemId));
  }

  async getBulkOptimizationItems(jobId: string): Promise<BulkOptimizationItem[]> {
    return Array.from(this.bulkOptimizationItemsData.values())
      .filter(item => item.jobId === jobId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async getBulkOptimizationItem(itemId: string): Promise<BulkOptimizationItem | undefined> {
    return this.bulkOptimizationItemsData.get(itemId);
  }

  async createBulkOptimizationItem(data: InsertBulkOptimizationItem): Promise<BulkOptimizationItem> {
    const id = randomUUID();
    const newItem: BulkOptimizationItem = {
      id,
      jobId: data.jobId,
      productId: data.productId || null,
      productName: data.productName,
      category: data.category || null,
      keyFeatures: data.keyFeatures || null,
      targetAudience: data.targetAudience || null,
      status: data.status || 'pending',
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
      keywords: data.keywords || null,
      seoScore: data.seoScore || null,
      searchIntent: data.searchIntent || null,
      suggestedKeywords: data.suggestedKeywords || null,
      errorMessage: data.errorMessage || null,
      tokensUsed: data.tokensUsed || 0,
      processingTimeMs: data.processingTimeMs || null,
      retryCount: data.retryCount || 0,
      maxRetries: data.maxRetries || 3,
      publishedToShopify: data.publishedToShopify || false,
      publishedAt: data.publishedAt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.bulkOptimizationItemsData.set(id, newItem);
    return newItem;
  }

  async updateBulkOptimizationItem(itemId: string, updates: Partial<BulkOptimizationItem>): Promise<BulkOptimizationItem> {
    const item = this.bulkOptimizationItemsData.get(itemId);
    if (!item) throw new Error("Bulk optimization item not found");
    const updatedItem = { ...item, ...updates, updatedAt: new Date() };
    this.bulkOptimizationItemsData.set(itemId, updatedItem);
    return updatedItem;
  }

  async deleteBulkOptimizationItem(itemId: string): Promise<void> {
    this.bulkOptimizationItemsData.delete(itemId);
  }
}

export const storage = new MemStorage();

// Export DatabaseStorage for bulk optimization operations that need to persist to PostgreSQL
// This is essential because bulk optimization jobs should survive server restarts
export const dbStorage = process.env.DATABASE_URL ? new DatabaseStorage() : storage;
