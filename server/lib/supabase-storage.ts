import { supabase } from './supabase';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { 
  type User, 
  type InsertUser, 
  type Product, 
  type InsertProduct,
  type SeoMeta,
  type InsertSeoMeta,
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
  type Profile,
  type InsertProfile,
  type Session,
  type InsertSession,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type Subscription,
  type UsageStats,
  type InsertUsageStats,
  type ActivityLog,
  type InsertActivityLog,
  type ToolsAccess,
  type InsertToolsAccess,
  type RealtimeMetrics,
  type InsertRealtimeMetrics
} from "@shared/schema";

export interface ISupabaseStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  updateUserProfile(userId: string, fullName: string, email: string): Promise<User>;
  updateUserImage(userId: string, imageUrl: string): Promise<User>;
  changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<User>;
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

  // SEO methods
  getSeoMeta(productId: string): Promise<SeoMeta | undefined>;
  createSeoMeta(seoMeta: InsertSeoMeta): Promise<SeoMeta>;
  updateSeoMeta(id: string, updates: Partial<SeoMeta>): Promise<SeoMeta>;

  // Campaign methods
  getCampaigns(userId: string): Promise<Campaign[]>;
  getAllCampaigns(): Promise<Campaign[]>;
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
  trackActivity(activity: InsertActivityLog): Promise<ActivityLog>;

  // Analytics methods
  getAnalytics(userId: string): Promise<Analytics[]>;
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;

  // Notification methods
  getNotifications(userId: string): Promise<Notification[]>;
  getUnreadNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;

  // User preferences methods
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences>;

  // Integration settings methods
  getIntegrationSettings(userId: string): Promise<IntegrationSettings[]>;
  createIntegrationSettings(settings: InsertIntegrationSettings): Promise<IntegrationSettings>;
  updateIntegrationSettings(id: string, updates: Partial<IntegrationSettings>): Promise<IntegrationSettings>;

  // Security settings methods
  getSecuritySettings(userId: string): Promise<SecuritySettings | undefined>;
  createSecuritySettings(settings: InsertSecuritySettings): Promise<SecuritySettings>;
  updateSecuritySettings(userId: string, updates: Partial<SecuritySettings>): Promise<SecuritySettings>;

  // Login log methods
  createLoginLog(log: InsertLoginLog): Promise<LoginLog>;
  getLoginLogs(userId: string, limit?: number): Promise<LoginLog[]>;

  // Support ticket methods
  getSupportTickets(userId: string): Promise<SupportTicket[]>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket>;

  // AI generation history methods
  getAiGenerationHistory(userId: string, limit?: number): Promise<AiGenerationHistory[]>;
  createAiGenerationHistory(history: InsertAiGenerationHistory): Promise<AiGenerationHistory>;

  // Profile methods
  getUserProfile(userId: string): Promise<Profile | undefined>;
  createUserProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile>;

  // Session methods (for custom auth if needed)
  saveSession(session: InsertSession): Promise<Session>;
  getSession(sessionId: string): Promise<Session | undefined>;
  deleteSession(sessionId: string): Promise<void>;
  cleanupExpiredSessions(): Promise<void>;

  // Subscription methods
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  getUserSubscription(userId: string): Promise<Subscription | undefined>;
  updateUserSubscription(userId: string, updates: Partial<Subscription>): Promise<Subscription>;

  // Usage stats methods
  getUserUsageStats(userId: string): Promise<UsageStats | undefined>;
  createOrUpdateUsageStats(userId: string, stats: Partial<UsageStats>): Promise<UsageStats>;
  incrementUsageStat(userId: string, stat: keyof UsageStats, amount?: number): Promise<void>;

  // Activity log methods
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getUserActivityLogs(userId: string, limit?: number): Promise<ActivityLog[]>;

  // Tools access methods
  trackToolAccess(access: InsertToolsAccess): Promise<ToolsAccess>;
  getUserToolsAccess(userId: string): Promise<ToolsAccess[]>;

  // Realtime metrics methods
  updateRealtimeMetric(userId: string, metric: InsertRealtimeMetrics): Promise<RealtimeMetrics>;
  getUserRealtimeMetrics(userId: string): Promise<RealtimeMetrics | undefined>;
  getUserDashboardData(userId: string): Promise<any>;
  initializeUserRealtimeData(userId: string): Promise<void>;
}

export class SupabaseStorage implements ISupabaseStorage {
  
  // Helper methods for field mapping
  private camelToSnakeUser(user: Partial<User>): any {
    const mapped: any = { ...user };
    if (user.fullName !== undefined) {
      mapped.full_name = user.fullName;
      delete mapped.fullName;
    }
    if (user.imageUrl !== undefined) {
      mapped.image_url = user.imageUrl;
      delete mapped.imageUrl;
    }
    if (user.preferredLanguage !== undefined) {
      mapped.preferred_language = user.preferredLanguage;
      delete mapped.preferredLanguage;
    }
    if (user.trialEndDate !== undefined) {
      mapped.trial_end_date = user.trialEndDate;
      delete mapped.trialEndDate;
    }
    if (user.createdAt !== undefined) {
      mapped.created_at = user.createdAt;
      delete mapped.createdAt;
    }
    return mapped;
  }

  private snakeToCamelUser(data: any): User {
    return {
      ...data,
      fullName: data.full_name,
      imageUrl: data.image_url,
      preferredLanguage: data.preferred_language,
      trialEndDate: data.trial_end_date,
      createdAt: data.created_at
    };
  }
  
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // No rows returned
      throw new Error(`Failed to get user: ${error.message}`);
    }
    
    return data ? this.snakeToCamelUser(data) : data;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // No rows returned
      throw new Error(`Failed to get user by email: ${error.message}`);
    }
    
    return data ? this.snakeToCamelUser(data) : data;
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = user.password ? await bcrypt.hash(user.password, 10) : null;
    const userData = this.camelToSnakeUser({
      ...user,
      id: user.id || randomUUID(), // Accept provided id (for Supabase users) or generate new one
      password: hashedPassword,
      createdAt: new Date().toISOString() as any
    });

    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create user: ${error.message}`);
    return this.snakeToCamelUser(data);
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const snakeUpdates = this.camelToSnakeUser(updates);
    const { data, error } = await supabase
      .from('users')
      .update(snakeUpdates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update user: ${error.message}`);
    return this.snakeToCamelUser(data);
  }

  async updateUserProfile(userId: string, fullName: string, email: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ full_name: fullName, email })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update user profile: ${error.message}`);
    
    return this.snakeToCamelUser(data);
  }

  async updateUserImage(userId: string, imageUrl: string): Promise<User> {
    return this.updateUser(userId, { imageUrl: imageUrl });
  }

  async changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    if (!user.password) throw new Error('Password authentication not available for this user');
    
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) throw new Error('Current password is incorrect');
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return this.updateUser(userId, { password: hashedPassword });
  }

  async updateUserLanguage(userId: string, language: string): Promise<User> {
    return this.updateUser(userId, { preferredLanguage: language });
  }

  // Store connections methods
  async getStoreConnections(userId: string): Promise<StoreConnection[]> {
    const { data, error } = await supabase
      .from('store_connections')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw new Error(`Failed to get store connections: ${error.message}`);
    return data || [];
  }

  async createStoreConnection(storeConnection: InsertStoreConnection): Promise<StoreConnection> {
    const connectionData = {
      ...storeConnection,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('store_connections')
      .insert(connectionData)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create store connection: ${error.message}`);
    return data;
  }

  async updateStoreConnection(id: string, updates: Partial<StoreConnection>): Promise<StoreConnection> {
    const { data, error } = await supabase
      .from('store_connections')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update store connection: ${error.message}`);
    return data;
  }

  async deleteStoreConnection(id: string): Promise<void> {
    const { error } = await supabase
      .from('store_connections')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete store connection: ${error.message}`);
  }

  // Product methods
  async getProducts(userId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw new Error(`Failed to get products: ${error.message}`);
    return data || [];
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(`Failed to get product: ${error.message}`);
    }
    return data;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const productData = {
      ...product,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create product: ${error.message}`);
    return data;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update product: ${error.message}`);
    return data;
  }

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete product: ${error.message}`);
  }

  // SEO methods
  async getSeoMeta(productId: string): Promise<SeoMeta | undefined> {
    const { data, error } = await supabase
      .from('seo_meta')
      .select('*')
      .eq('productId', productId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(`Failed to get SEO meta: ${error.message}`);
    }
    return data;
  }

  async createSeoMeta(seoMeta: InsertSeoMeta): Promise<SeoMeta> {
    const seoData = {
      ...seoMeta,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('seo_meta')
      .insert(seoData)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create SEO meta: ${error.message}`);
    return data;
  }

  async updateSeoMeta(id: string, updates: Partial<SeoMeta>): Promise<SeoMeta> {
    const { data, error } = await supabase
      .from('seo_meta')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update SEO meta: ${error.message}`);
    return data;
  }

  // Campaign methods
  async getCampaigns(userId: string): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw new Error(`Failed to get campaigns: ${error.message}`);
    return data || [];
  }

  async getAllCampaigns(): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*');
    
    if (error) throw new Error(`Failed to get all campaigns: ${error.message}`);
    return data || [];
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(`Failed to get campaign: ${error.message}`);
    }
    return data;
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const campaignData = {
      ...campaign,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('campaigns')
      .insert(campaignData)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create campaign: ${error.message}`);
    return data;
  }

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update campaign: ${error.message}`);
    return data;
  }

  async deleteCampaign(id: string): Promise<void> {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete campaign: ${error.message}`);
  }

  // Campaign Template methods
  async getCampaignTemplates(userId: string): Promise<CampaignTemplate[]> {
    const { data, error } = await supabase
      .from('campaign_templates')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw new Error(`Failed to get campaign templates: ${error.message}`);
    return data || [];
  }

  async getCampaignTemplate(id: string): Promise<CampaignTemplate | undefined> {
    const { data, error } = await supabase
      .from('campaign_templates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(`Failed to get campaign template: ${error.message}`);
    }
    return data;
  }

  async createCampaignTemplate(template: InsertCampaignTemplate): Promise<CampaignTemplate> {
    const templateData = {
      ...template,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('campaign_templates')
      .insert(templateData)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create campaign template: ${error.message}`);
    return data;
  }

  async updateCampaignTemplate(id: string, updates: Partial<CampaignTemplate>): Promise<CampaignTemplate> {
    const { data, error } = await supabase
      .from('campaign_templates')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update campaign template: ${error.message}`);
    return data;
  }

  async deleteCampaignTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('campaign_templates')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete campaign template: ${error.message}`);
  }

  // Abandoned Cart methods
  async getAbandonedCarts(userId: string): Promise<AbandonedCart[]> {
    const { data, error } = await supabase
      .from('abandoned_carts')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw new Error(`Failed to get abandoned carts: ${error.message}`);
    return data || [];
  }

  async getAbandonedCart(id: string): Promise<AbandonedCart | undefined> {
    const { data, error } = await supabase
      .from('abandoned_carts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(`Failed to get abandoned cart: ${error.message}`);
    }
    return data;
  }

  async createAbandonedCart(cart: InsertAbandonedCart): Promise<AbandonedCart> {
    const cartData = {
      ...cart,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('abandoned_carts')
      .insert(cartData)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create abandoned cart: ${error.message}`);
    return data;
  }

  async updateAbandonedCart(id: string, updates: Partial<AbandonedCart>): Promise<AbandonedCart> {
    const { data, error } = await supabase
      .from('abandoned_carts')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update abandoned cart: ${error.message}`);
    return data;
  }

  // Activity tracking
  async trackActivity(activity: InsertActivityLog): Promise<ActivityLog> {
    const activityData = {
      ...activity,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('activity_logs')
      .insert(activityData)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to track activity: ${error.message}`);
    return data;
  }

  // Analytics methods
  async getAnalytics(userId: string): Promise<Analytics[]> {
    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw new Error(`Failed to get analytics: ${error.message}`);
    return data || [];
  }

  async createAnalytics(analytics: InsertAnalytics): Promise<Analytics> {
    const analyticsData = {
      ...analytics,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('analytics')
      .insert(analyticsData)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create analytics: ${error.message}`);
    return data;
  }

  // Notification methods
  async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to get notifications: ${error.message}`);
    return data || [];
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to get unread notifications: ${error.message}`);
    return data || [];
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const notificationData = {
      ...notification,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create notification: ${error.message}`);
    return data;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ isRead: true, updatedAt: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw new Error(`Failed to mark notification as read: ${error.message}`);
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ isRead: true, updatedAt: new Date().toISOString() })
      .eq('user_id', userId);
    
    if (error) throw new Error(`Failed to mark all notifications as read: ${error.message}`);
  }

  // Placeholder implementations for remaining methods
  // These would need to be implemented similar to the above pattern

  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(`Failed to get user preferences: ${error.message}`);
    }
    return data;
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const preferencesData = {
      ...preferences,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('user_preferences')
      .insert(preferencesData)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create user preferences: ${error.message}`);
    return data;
  }

  async updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences> {
    const { data, error } = await supabase
      .from('user_preferences')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update user preferences: ${error.message}`);
    return data;
  }

  // For brevity, I'll implement the key remaining methods. The pattern is consistent.
  
  async getIntegrationSettings(userId: string): Promise<IntegrationSettings[]> {
    const { data, error } = await supabase
      .from('integration_settings')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw new Error(`Failed to get integration settings: ${error.message}`);
    return data || [];
  }

  async createIntegrationSettings(settings: InsertIntegrationSettings): Promise<IntegrationSettings> {
    const settingsData = {
      ...settings,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('integration_settings')
      .insert(settingsData)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create integration settings: ${error.message}`);
    return data;
  }

  async updateIntegrationSettings(id: string, updates: Partial<IntegrationSettings>): Promise<IntegrationSettings> {
    const { data, error } = await supabase
      .from('integration_settings')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update integration settings: ${error.message}`);
    return data;
  }

  async getSecuritySettings(userId: string): Promise<SecuritySettings | undefined> {
    const { data, error } = await supabase
      .from('security_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(`Failed to get security settings: ${error.message}`);
    }
    return data;
  }

  async createSecuritySettings(settings: InsertSecuritySettings): Promise<SecuritySettings> {
    const settingsData = {
      ...settings,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('security_settings')
      .insert(settingsData)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create security settings: ${error.message}`);
    return data;
  }

  async updateSecuritySettings(userId: string, updates: Partial<SecuritySettings>): Promise<SecuritySettings> {
    const { data, error } = await supabase
      .from('security_settings')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update security settings: ${error.message}`);
    return data;
  }

  async createLoginLog(log: InsertLoginLog): Promise<LoginLog> {
    const logData = {
      ...log,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('login_logs')
      .insert(logData)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create login log: ${error.message}`);
    return data;
  }

  async getLoginLogs(userId: string, limit?: number): Promise<LoginLog[]> {
    let query = supabase
      .from('login_logs')
      .select('*')
      .eq('user_id', userId)
      .order('createdAt', { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) throw new Error(`Failed to get login logs: ${error.message}`);
    return data || [];
  }

  async getSupportTickets(userId: string): Promise<SupportTicket[]> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw new Error(`Failed to get support tickets: ${error.message}`);
    return data || [];
  }

  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    const ticketData = {
      ...ticket,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('support_tickets')
      .insert(ticketData)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create support ticket: ${error.message}`);
    return data;
  }

  async updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket> {
    const { data, error } = await supabase
      .from('support_tickets')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update support ticket: ${error.message}`);
    return data;
  }

  async getAiGenerationHistory(userId: string, limit?: number): Promise<AiGenerationHistory[]> {
    let query = supabase
      .from('ai_generation_history')
      .select('*')
      .eq('user_id', userId)
      .order('createdAt', { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) throw new Error(`Failed to get AI generation history: ${error.message}`);
    return data || [];
  }

  async createAiGenerationHistory(history: InsertAiGenerationHistory): Promise<AiGenerationHistory> {
    const historyData = {
      ...history,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('ai_generation_history')
      .insert(historyData)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create AI generation history: ${error.message}`);
    return data;
  }

  async getUserProfile(userId: string): Promise<Profile | undefined> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
    return data;
  }

  async createUserProfile(profile: InsertProfile): Promise<Profile> {
    const profileData = {
      ...profile,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create user profile: ${error.message}`);
    return data;
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update user profile: ${error.message}`);
    return data;
  }

  // Session methods for custom auth (if needed alongside Supabase Auth)
  async saveSession(session: InsertSession): Promise<Session> {
    const sessionData = {
      ...session,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('sessions')
      .insert(sessionData)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to save session: ${error.message}`);
    return data;
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(`Failed to get session: ${error.message}`);
    }
    return data;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);
    
    if (error) throw new Error(`Failed to delete session: ${error.message}`);
  }

  async cleanupExpiredSessions(): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .lt('expiresAt', new Date().toISOString());
    
    if (error) throw new Error(`Failed to cleanup expired sessions: ${error.message}`);
  }

  // Subscription methods
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*');
    
    if (error) throw new Error(`Failed to get subscription plans: ${error.message}`);
    return data || [];
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const planData = {
      ...plan,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('subscription_plans')
      .insert(planData)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create subscription plan: ${error.message}`);
    return data;
  }

  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(`Failed to get user subscription: ${error.message}`);
    }
    return data;
  }

  async updateUserSubscription(userId: string, updates: Partial<Subscription>): Promise<Subscription> {
    // Check if user has an active subscription
    const { data: existingSubscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    // Convert camelCase to snake_case for database columns
    const dbUpdates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    
    if (updates.planId) dbUpdates.plan_id = updates.planId;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.currentPeriodStart) dbUpdates.current_period_start = updates.currentPeriodStart;
    if (updates.currentPeriodEnd) dbUpdates.current_period_end = updates.currentPeriodEnd;
    if (updates.cancelAtPeriodEnd !== undefined) dbUpdates.cancel_at_period_end = updates.cancelAtPeriodEnd;
    if (updates.trialStart) dbUpdates.trial_start = updates.trialStart;
    if (updates.trialEnd) dbUpdates.trial_end = updates.trialEnd;
    if (updates.startDate) dbUpdates.start_date = updates.startDate;
    if (updates.endDate) dbUpdates.end_date = updates.endDate;

    // If subscription exists, update it
    if (existingSubscriptions && existingSubscriptions.length > 0) {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(dbUpdates)
        .eq('id', existingSubscriptions[0].id)
        .select()
        .single();
      
      if (error) throw new Error(`Failed to update user subscription: ${error.message}`);
      return data;
    } 
    
    // If no subscription exists, create a new one
    const newSubscription = {
      id: randomUUID(),
      user_id: userId,
      plan_id: updates.planId,
      status: updates.status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...dbUpdates
    };

    const { data, error } = await supabase
      .from('subscriptions')
      .insert(newSubscription)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create user subscription: ${error.message}`);
    return data;
  }

  // Usage stats methods
  async getUserUsageStats(userId: string): Promise<UsageStats | undefined> {
    const { data, error } = await supabase
      .from('usage_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(`Failed to get user usage stats: ${error.message}`);
    }
    return data;
  }

  async createOrUpdateUsageStats(userId: string, stats: Partial<UsageStats>): Promise<UsageStats> {
    const existingStats = await this.getUserUsageStats(userId);
    
    if (existingStats) {
      const { data, error } = await supabase
        .from('usage_stats')
        .update({ ...stats, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw new Error(`Failed to update usage stats: ${error.message}`);
      return data;
    } else {
      const statsData = {
        ...stats,
        id: randomUUID(),
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('usage_stats')
        .insert(statsData)
        .select()
        .single();
      
      if (error) throw new Error(`Failed to create usage stats: ${error.message}`);
      return data;
    }
  }

  async incrementUsageStat(userId: string, stat: keyof UsageStats, amount: number = 1): Promise<void> {
    const currentStats = await this.getUserUsageStats(userId);
    const currentValue = currentStats ? (currentStats[stat] as number || 0) : 0;
    await this.createOrUpdateUsageStats(userId, { [stat]: currentValue + amount });
  }

  // Activity log methods
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const logData = {
      ...log,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('activity_logs')
      .insert(logData)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create activity log: ${error.message}`);
    return data;
  }

  async getUserActivityLogs(userId: string, limit: number = 50): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('createdAt', { ascending: false })
      .limit(limit);
    
    if (error) throw new Error(`Failed to get user activity logs: ${error.message}`);
    return data || [];
  }

  // Tools access methods
  async trackToolAccess(access: InsertToolsAccess): Promise<ToolsAccess> {
    const accessData = {
      ...access,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('tools_access')
      .insert(accessData)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to track tool access: ${error.message}`);
    return data;
  }

  async getUserToolsAccess(userId: string): Promise<ToolsAccess[]> {
    const { data, error } = await supabase
      .from('tools_access')
      .select('*')
      .eq('user_id', userId)
      .order('createdAt', { ascending: false });
    
    if (error) throw new Error(`Failed to get user tools access: ${error.message}`);
    return data || [];
  }

  // Realtime metrics methods
  async updateRealtimeMetric(userId: string, metric: InsertRealtimeMetrics): Promise<RealtimeMetrics> {
    const existingMetric = await this.getUserRealtimeMetrics(userId);
    
    if (existingMetric) {
      const { data, error } = await supabase
        .from('realtime_metrics')
        .update({ ...metric, updatedAt: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw new Error(`Failed to update realtime metric: ${error.message}`);
      return data;
    } else {
      const metricData = {
        ...metric,
        id: randomUUID(),
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('realtime_metrics')
        .insert(metricData)
        .select()
        .single();
      
      if (error) throw new Error(`Failed to create realtime metric: ${error.message}`);
      return data;
    }
  }

  async getUserRealtimeMetrics(userId: string): Promise<RealtimeMetrics | undefined> {
    const { data, error } = await supabase
      .from('realtime_metrics')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(`Failed to get user realtime metrics: ${error.message}`);
    }
    return data;
  }

  async getUserDashboardData(userId: string): Promise<any> {
    // Fetch comprehensive dashboard data
    const [user, products, campaigns, analytics, notifications, usageStats] = await Promise.all([
      this.getUser(userId),
      this.getProducts(userId),
      this.getCampaigns(userId),
      this.getAnalytics(userId),
      this.getUnreadNotifications(userId),
      this.getUserUsageStats(userId)
    ]);

    return {
      user,
      products,
      campaigns,
      analytics,
      notifications,
      usageStats
    };
  }

  async initializeUserRealtimeData(userId: string): Promise<void> {
    // Initialize user with default realtime metrics
    await this.updateRealtimeMetric(userId, {
      userId: userId,
      value: "0",
      metricName: "initialization",
      changePercent: "0",
      isPositive: true
    });
  }
}

// Export a singleton instance
export const supabaseStorage = new SupabaseStorage();