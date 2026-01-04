import { supabase } from './supabase';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { encrypt, decrypt, encryptJSON, decryptJSON, isEncrypted } from './encryption';
import { db } from '../db';
import { products } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
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
  type InsertRealtimeMetrics,
  type SyncHistory,
  type InsertSyncHistory,
  type PaymentTransaction,
  type InsertPaymentTransaction,
  type AbTest,
  type InsertAbTest,
  type ProductHistory,
  type InsertProductHistory
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
  updateSeoMeta(id: string, updates: Partial<SeoMeta>): Promise<SeoMeta>;
  saveProductSEOHistory(data: InsertProductSeoHistory): Promise<ProductSeoHistory>;
  getProductSEOHistory(userId: string): Promise<ProductSeoHistory[]>;

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
  // Admin support ticket methods
  getAllSupportTickets(filters?: { status?: string; category?: string; priority?: string; search?: string; limit?: number; offset?: number }): Promise<any[]>;
  getSupportTicketById(id: string): Promise<any>;

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
  getUserSessions(userId: string): Promise<Session[]>;
  updateSession(sessionId: string, updates: Partial<Session>): Promise<Session>;
  deleteSession(sessionId: string): Promise<void>;
  cleanupExpiredSessions(): Promise<void>;

  // Subscription methods
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  getUserSubscription(userId: string): Promise<Subscription | undefined>;
  updateUserSubscription(userId: string, updates: Partial<Subscription>): Promise<Subscription>;

  // Payment transaction methods
  getPaymentTransactions(userId: string): Promise<PaymentTransaction[]>;
  createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction>;

  // Usage stats methods
  getUserUsageStats(userId: string): Promise<UsageStats | undefined>;
  createOrUpdateUsageStats(userId: string, stats: Partial<UsageStats>): Promise<UsageStats>;
  incrementUsageStat(userId: string, stat: keyof UsageStats, amount?: number): Promise<void>;

  // Activity log methods
  createActivityLog(userId: string, logData: any): Promise<any>;
  getUserActivityLogs(userId: string, limit?: number): Promise<ActivityLog[]>;

  // Tools access methods
  trackToolAccess(userId: string, toolName: string): Promise<any>;
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

  // Helper methods for store connection field mapping
  private snakeToCamelStoreConnection(data: any): StoreConnection {
    return {
      id: data.id,
      userId: data.user_id,
      platform: data.platform,
      storeName: data.store_name,
      storeUrl: data.store_url,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      status: data.status,
      currency: data.currency || null, // ISO 4217 currency code (USD, INR, EUR, etc.)
      lastSyncAt: data.last_sync_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  // Store connections methods
  async getStoreConnections(userId: string): Promise<StoreConnection[]> {
    const { data, error } = await supabase
      .from('store_connections')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw new Error(`Failed to get store connections: ${error.message}`);
    return (data || []).map(connection => this.snakeToCamelStoreConnection(connection));
  }

  async createStoreConnection(storeConnection: InsertStoreConnection): Promise<StoreConnection> {
    const connectionData = {
      id: randomUUID(),
      user_id: storeConnection.userId,
      platform: storeConnection.platform,
      store_name: storeConnection.storeName,
      store_url: storeConnection.storeUrl,
      access_token: storeConnection.accessToken,
      refresh_token: storeConnection.refreshToken,
      status: storeConnection.status || 'active',
      currency: storeConnection.currency || null, // Store's native currency (INR, USD, EUR, etc.)
      last_sync_at: storeConnection.lastSyncAt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('store_connections')
      .insert(connectionData)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create store connection: ${error.message}`);
    return this.snakeToCamelStoreConnection(data);
  }

  async updateStoreConnection(id: string, updates: Partial<StoreConnection>): Promise<StoreConnection> {
    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (updates.userId !== undefined) updateData.user_id = updates.userId;
    if (updates.platform !== undefined) updateData.platform = updates.platform;
    if (updates.storeName !== undefined) updateData.store_name = updates.storeName;
    if (updates.storeUrl !== undefined) updateData.store_url = updates.storeUrl;
    if (updates.accessToken !== undefined) updateData.access_token = updates.accessToken;
    if (updates.refreshToken !== undefined) updateData.refresh_token = updates.refreshToken;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.currency !== undefined) updateData.currency = updates.currency; // Store's native currency
    if (updates.lastSyncAt !== undefined) updateData.last_sync_at = updates.lastSyncAt;

    const { data, error } = await supabase
      .from('store_connections')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update store connection: ${error.message}`);
    return this.snakeToCamelStoreConnection(data);
  }

  async deleteStoreConnection(id: string): Promise<void> {
    const { error } = await supabase
      .from('store_connections')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete store connection: ${error.message}`);
  }

  // Sync history methods
  async getSyncHistory(userId: string, limit: number = 10): Promise<SyncHistory[]> {
    const { data, error } = await supabase
      .from('sync_history')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(limit);
    
    if (error) throw new Error(`Failed to get sync history: ${error.message}`);
    return data || [];
  }

  async getLatestSync(userId: string): Promise<SyncHistory | undefined> {
    const { data, error } = await supabase
      .from('sync_history')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(`Failed to get latest sync: ${error.message}`);
    }
    return data;
  }

  async createSyncHistory(sync: InsertSyncHistory): Promise<SyncHistory> {
    try {
      const syncData = {
        id: randomUUID(),
        user_id: sync.userId,
        store_connection_id: sync.storeConnectionId,
        sync_type: sync.syncType,
        status: sync.status,
        products_added: sync.productsAdded || 0,
        products_updated: sync.productsUpdated || 0,
        products_deleted: sync.productsDeleted || 0,
        error_message: sync.errorMessage,
        started_at: new Date().toISOString(),
        completed_at: sync.completedAt,
        metadata: sync.metadata
      };

      const { data, error } = await supabase
        .from('sync_history')
        .insert(syncData)
        .select()
        .single();
      
      if (error) {
        if (error.message.includes('schema cache')) {
          console.warn('⚠️ Supabase schema cache issue detected. Sync history not recorded, but proceeding with sync.');
          return { ...syncData, status: 'started' } as SyncHistory;
        }
        throw new Error(`Failed to create sync history: ${error.message}`);
      }
      return data;
    } catch (err) {
      console.error('Error in createSyncHistory:', err);
      // Return a mock object to prevent breaking the sync process
      return { id: randomUUID(), ...sync, startedAt: new Date() } as any;
    }
  }

  async updateSyncHistory(id: string, updates: Partial<SyncHistory>): Promise<SyncHistory> {
    try {
      const updateData: any = {};
      
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.productsAdded !== undefined) updateData.products_added = updates.productsAdded;
      if (updates.productsUpdated !== undefined) updateData.products_updated = updates.productsUpdated;
      if (updates.productsDeleted !== undefined) updateData.products_deleted = updates.productsDeleted;
      if (updates.errorMessage !== undefined) updateData.error_message = updates.errorMessage;
      if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt;
      if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

      const { data, error } = await supabase
        .from('sync_history')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        if (error.message.includes('schema cache')) {
          console.warn('⚠️ Supabase schema cache issue detected. Sync history update skipped.');
          return { id, ...updates } as SyncHistory;
        }
        throw new Error(`Failed to update sync history: ${error.message}`);
      }
      return data;
    } catch (err) {
      console.error('Error in updateSyncHistory:', err);
      return { id, ...updates } as any;
    }
  }

  // Product methods
  async getProducts(userId: string): Promise<Product[]> {
    try {
      if (!db) {
        throw new Error('Database connection not available');
      }
      const results = await db.query.products.findMany({
        where: eq(products.userId, userId),
        orderBy: [desc(products.createdAt)]
      });
      return results;
    } catch (error: any) {
      throw new Error(`Failed to get products: ${error.message}`);
    }
  }

  async getProduct(id: string): Promise<Product | undefined> {
    try {
      if (!db) {
        throw new Error('Database connection not available');
      }
      const result = await db.query.products.findFirst({
        where: eq(products.id, id)
      });
      return result;
    } catch (error: any) {
      throw new Error(`Failed to get product: ${error.message}`);
    }
  }

  async createProduct(product: InsertProduct & { userId: string }): Promise<Product> {
    const productData = {
      id: randomUUID(),
      user_id: product.userId,
      shopify_id: product.shopifyId,
      name: product.name,
      description: product.description,
      original_description: product.originalDescription,
      original_copy: product.originalCopy,
      price: product.price,
      category: product.category,
      stock: product.stock,
      image: product.image,
      features: product.features,
      tags: product.tags,
      optimized_copy: product.optimizedCopy,
      is_optimized: product.isOptimized,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
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
    try {
      const updateData: any = { updatedAt: new Date() };
      
      if (updates.userId !== undefined) updateData.userId = updates.userId;
      if (updates.shopifyId !== undefined) updateData.shopifyId = updates.shopifyId;
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.originalDescription !== undefined) updateData.originalDescription = updates.originalDescription;
      if (updates.originalCopy !== undefined) updateData.originalCopy = updates.originalCopy;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.stock !== undefined) updateData.stock = updates.stock;
      if (updates.image !== undefined) updateData.image = updates.image;
      if (updates.features !== undefined) updateData.features = updates.features;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.optimizedCopy !== undefined) updateData.optimizedCopy = updates.optimizedCopy;
      if (updates.isOptimized !== undefined) updateData.isOptimized = updates.isOptimized;

      if (!db) {
        throw new Error('Database connection not available');
      }
      
      const result = await db.update(products)
        .set(updateData)
        .where(eq(products.id, id))
        .returning();
      
      if (!result || result.length === 0) {
        throw new Error('Product not found');
      }
      
      return result[0];
    } catch (error: any) {
      throw new Error(`Failed to update product: ${error.message}`);
    }
  }

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete product: ${error.message}`);
  }

  // Product History methods
  async getProductHistory(userId: string): Promise<ProductHistory[]> {
    const { data, error } = await supabase
      .from('product_history')
      .select('*')
      .eq('user_id', userId)
      .order('change_date', { ascending: false });
    
    // Handle missing table gracefully - return empty array instead of throwing
    if (error) {
      if (error.message.includes('schema cache') || error.message.includes('does not exist')) {
        console.log('[ProductHistory] Table not found in schema cache, returning empty array');
        return [];
      }
      throw new Error(`Failed to get product history: ${error.message}`);
    }
    return data || [];
  }

  async createProductHistory(historyData: InsertProductHistory): Promise<ProductHistory> {
    const data = {
      id: randomUUID(),
      product_id: historyData.productId,
      user_id: historyData.userId,
      product_name: historyData.productName,
      change_date: historyData.changeDate || new Date().toISOString(),
      change_type: historyData.changeType,
      changed_by: historyData.changedBy,
      changes: historyData.changes,
      can_rollback: historyData.canRollback !== undefined ? historyData.canRollback : true,
      created_at: new Date().toISOString()
    };

    const { data: result, error } = await supabase
      .from('product_history')
      .insert(data)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create product history: ${error.message}`);
    return result;
  }

  async rollbackProductChange(historyId: string): Promise<void> {
    // Get the history entry
    const { data: history, error: historyError } = await supabase
      .from('product_history')
      .select('*')
      .eq('id', historyId)
      .single();
    
    if (historyError) throw new Error(`Failed to get product history: ${historyError.message}`);
    if (!history) throw new Error('Product history not found');
    if (!history.can_rollback) throw new Error('This change cannot be rolled back');

    // Get the product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', history.product_id)
      .single();
    
    if (productError) throw new Error(`Failed to get product: ${productError.message}`);
    if (!product) throw new Error('Product not found');

    // Build the update object from the changes
    const updates: any = {};
    for (const change of history.changes) {
      // Map field names to database column names
      const fieldMap: { [key: string]: string } = {
        'Title': 'name',
        'Description': 'description',
        'Tags': 'tags',
        'Price': 'price',
        'Stock': 'stock',
        'Category': 'category',
        'Features': 'features'
      };
      
      const dbField = fieldMap[change.field] || change.field.toLowerCase();
      updates[dbField] = change.before;
    }

    updates.updated_at = new Date().toISOString();

    // Update the product
    const { error: updateError } = await supabase
      .from('products')
      .update(updates)
      .eq('id', history.product_id);
    
    if (updateError) throw new Error(`Failed to rollback product: ${updateError.message}`);
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

  async saveProductSEOHistory(data: InsertProductSeoHistory): Promise<ProductSeoHistory> {
    const { data: result, error } = await supabase
      .from('product_seo_history')
      .insert({
        user_id: data.userId,
        product_id: data.productId || null,
        product_name: data.productName,
        seo_title: data.seoTitle,
        seo_description: data.seoDescription,
        meta_title: data.metaTitle,
        meta_description: data.metaDescription,
        keywords: data.keywords,
        seo_score: data.seoScore || null,
        search_intent: data.searchIntent || null,
        suggested_keywords: data.suggestedKeywords || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw new Error(`Failed to save product SEO history: ${error.message}`);
    return result;
  }

  async getProductSEOHistory(userId: string): Promise<ProductSeoHistory[]> {
    const { data, error } = await supabase
      .from('product_seo_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to get product SEO history: ${error.message}`);
    return data || [];
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
    const campaignId = randomUUID();
    
    // Use minimal fields to avoid Supabase schema cache issues
    // The database has default values for timestamp columns
    const campaignData: Record<string, any> = {
      id: campaignId,
      user_id: campaign.userId,
      type: campaign.type,
      name: campaign.name,
      subject: campaign.subject || null,
      content: campaign.content,
      status: campaign.status || 'draft',
      sent_count: campaign.sentCount || 0,
      open_rate: campaign.openRate || 0,
      click_rate: campaign.clickRate || 0,
      conversion_rate: campaign.conversionRate || 0
    };

    const { data, error } = await supabase
      .from('campaigns')
      .insert(campaignData)
      .select('id, user_id, type, name, subject, content, status, sent_count, open_rate, click_rate, conversion_rate')
      .single();
    
    if (error) throw new Error(`Failed to create campaign: ${error.message}`);
    
    // Map the response to expected format with all required Campaign fields
    const mappedCampaign: Campaign = {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      name: data.name,
      subject: data.subject,
      content: data.content,
      status: data.status,
      sentCount: data.sent_count,
      openRate: data.open_rate,
      clickRate: data.click_rate,
      conversionRate: data.conversion_rate,
      templateId: null,
      goalType: null,
      audience: null,
      scheduledFor: null,
      sentAt: null,
      recipientList: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return mappedCampaign;
  }

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign> {
    // Build update data without timestamp fields to avoid schema cache issues
    const updateData: any = {};
    
    // Only update columns that exist in the Supabase campaigns table
    if (updates.userId !== undefined) updateData.user_id = updates.userId;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.subject !== undefined) updateData.subject = updates.subject;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.sentCount !== undefined) updateData.sent_count = updates.sentCount;
    if (updates.openRate !== undefined) updateData.open_rate = updates.openRate;
    if (updates.clickRate !== undefined) updateData.click_rate = updates.clickRate;
    if (updates.conversionRate !== undefined) updateData.conversion_rate = updates.conversionRate;

    // Only include if there's something to update
    if (Object.keys(updateData).length === 0) {
      // Nothing to update, just return the current campaign
      const { data: existingCampaign, error: fetchError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) throw new Error(`Failed to get campaign: ${fetchError.message}`);
      return existingCampaign;
    }

    const { data, error } = await supabase
      .from('campaigns')
      .update(updateData)
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
      id: randomUUID(),
      user_id: cart.userId,
      customer_email: cart.customerEmail,
      customer_phone: cart.customerPhone,
      cart_items: cart.cartItems,
      cart_value: cart.cartValue,
      status: cart.status || 'abandoned',
      recovery_attempts: cart.recoveryAttempts || 0,
      recovered_at: cart.recoveredAt,
      abandoned_at: cart.abandonedAt || new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
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
    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (updates.userId !== undefined) updateData.user_id = updates.userId;
    if (updates.customerEmail !== undefined) updateData.customer_email = updates.customerEmail;
    if (updates.customerPhone !== undefined) updateData.customer_phone = updates.customerPhone;
    if (updates.cartItems !== undefined) updateData.cart_items = updates.cartItems;
    if (updates.cartValue !== undefined) updateData.cart_value = updates.cartValue;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.recoveryAttempts !== undefined) updateData.recovery_attempts = updates.recoveryAttempts;
    if (updates.recoveredAt !== undefined) updateData.recovered_at = updates.recoveredAt;
    if (updates.lastContactedAt !== undefined) updateData.last_contacted_at = updates.lastContactedAt;

    const { data, error } = await supabase
      .from('abandoned_carts')
      .update(updateData)
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
    // Transform camelCase to snake_case for database columns
    const notificationData = {
      id: randomUUID(),
      user_id: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'info',
      is_read: notification.isRead || false,
      action_url: notification.actionUrl || null,
      action_label: notification.actionLabel || null,
      created_at: new Date().toISOString(),
      read_at: null
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
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw new Error(`Failed to mark notification as read: ${error.message}`);
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
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
    // First check if preferences exist
    const existing = await this.getUserPreferences(userId);
    
    // Map incoming fields to the JSONB column structure
    // Database uses: ai_settings, notification_settings, ui_preferences, privacy_settings (all JSONB)
    const notificationFields = ['emailNotifications', 'smsNotifications', 'pushNotifications', 
      'inAppNotifications', 'weeklyDigest', 'marketingEmails', 'notificationFrequency'];
    const aiFields = ['brandVoice', 'contentStyle', 'creativityLevel', 'defaultGenerationMode', 'showAiSuggestions', 'autoSave'];
    const uiFields = ['darkMode', 'compactView', 'language', 'timezone', 'dateFormat', 'currency'];
    
    // Build the JSONB objects - use camelCase as defined in schema
    const notificationSettings: Record<string, any> = (existing?.notificationSettings as Record<string, any>) || {};
    const aiSettings: Record<string, any> = (existing?.aiSettings as Record<string, any>) || {};
    const uiPreferences: Record<string, any> = (existing?.uiPreferences as Record<string, any>) || {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined) continue;
      
      if (notificationFields.includes(key)) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        notificationSettings[snakeKey] = value;
      } else if (aiFields.includes(key)) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        aiSettings[snakeKey] = value;
      } else if (uiFields.includes(key)) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        uiPreferences[snakeKey] = value;
      }
    }
    
    const updatePayload = {
      notification_settings: notificationSettings,
      ai_settings: aiSettings,
      ui_preferences: uiPreferences,
      updated_at: new Date().toISOString()
    };
    
    if (existing) {
      // Update existing preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .update(updatePayload)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw new Error(`Failed to update user preferences: ${error.message}`);
      return data;
    } else {
      // Create new preferences with defaults
      const newPrefs = {
        id: randomUUID(),
        user_id: userId,
        notification_settings: {
          email_notifications: true,
          sms_notifications: false,
          push_notifications: true,
          in_app_notifications: true,
          weekly_digest: true,
          marketing_emails: false,
          notification_frequency: 'instant',
          ...notificationSettings
        },
        ai_settings: {
          brand_voice: 'professional',
          content_style: 'balanced',
          creativity_level: 70,
          default_generation_mode: 'fast',
          show_ai_suggestions: true,
          auto_save: true,
          ...aiSettings
        },
        ui_preferences: {
          dark_mode: true,
          compact_view: false,
          language: 'en',
          timezone: 'UTC',
          date_format: 'MM/DD/YYYY',
          currency: 'USD',
          ...uiPreferences
        },
        privacy_settings: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_preferences')
        .insert(newPrefs)
        .select()
        .single();
      
      if (error) throw new Error(`Failed to create user preferences: ${error.message}`);
      return data;
    }
  }

  // For brevity, I'll implement the key remaining methods. The pattern is consistent.
  
  async getIntegrationSettings(userId: string): Promise<IntegrationSettings[]> {
    const { data, error } = await supabase
      .from('integration_settings')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw new Error(`Failed to get integration settings: ${error.message}`);
    
    // Decrypt credentials for each integration
    const decryptedData = (data || []).map(setting => {
      if (setting.credentials && isEncrypted(setting.credentials)) {
        try {
          const decrypted = decrypt(setting.credentials.encrypted);
          // Try to parse as JSON, otherwise return as string
          try {
            setting.credentials = JSON.parse(decrypted);
          } catch {
            setting.credentials = decrypted;
          }
        } catch (err) {
          console.error(`Failed to decrypt credentials for integration ${setting.id}:`, err);
        }
      }
      return setting;
    });
    
    return decryptedData;
  }

  async createIntegrationSettings(settings: InsertIntegrationSettings): Promise<IntegrationSettings> {
    // Encrypt credentials - handle both string and object types
    let encryptedCredentials = null;
    if (settings.credentials) {
      if (typeof settings.credentials === 'object' && !Array.isArray(settings.credentials)) {
        // Object credentials - use encryptJSON
        encryptedCredentials = encryptJSON(settings.credentials);
      } else {
        // String/primitive credentials - convert to string and encrypt
        const credentialString = typeof settings.credentials === 'string' 
          ? settings.credentials 
          : JSON.stringify(settings.credentials);
        encryptedCredentials = { encrypted: encrypt(credentialString) };
      }
    }
    
    const settingsData = {
      ...settings,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      credentials: encryptedCredentials
    };

    const { data, error } = await supabase
      .from('integration_settings')
      .insert(settingsData)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create integration settings: ${error.message}`);
    
    // Decrypt credentials before returning
    if (data.credentials && isEncrypted(data.credentials)) {
      try {
        const decrypted = decrypt(data.credentials.encrypted);
        // Try to parse as JSON, otherwise return as string
        try {
          data.credentials = JSON.parse(decrypted);
        } catch {
          data.credentials = decrypted;
        }
      } catch (err) {
        console.error('Failed to decrypt credentials:', err);
      }
    }
    
    return data;
  }

  async updateIntegrationSettings(id: string, updates: Partial<IntegrationSettings>): Promise<IntegrationSettings> {
    // Encrypt credentials if being updated - handle both string and object types
    let encryptedCredentials: any = undefined;
    if (updates.credentials !== undefined) {
      if (updates.credentials === null) {
        encryptedCredentials = null;
      } else if (typeof updates.credentials === 'object' && !Array.isArray(updates.credentials)) {
        // Object credentials - use encryptJSON
        encryptedCredentials = encryptJSON(updates.credentials);
      } else {
        // String/primitive credentials - convert to string and encrypt
        const credentialString = typeof updates.credentials === 'string' 
          ? updates.credentials 
          : JSON.stringify(updates.credentials);
        encryptedCredentials = { encrypted: encrypt(credentialString) };
      }
    }
    
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
      ...(encryptedCredentials !== undefined ? { credentials: encryptedCredentials } : {})
    };
    
    const { data, error } = await supabase
      .from('integration_settings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update integration settings: ${error.message}`);
    
    // Decrypt credentials before returning
    if (data.credentials && isEncrypted(data.credentials)) {
      try {
        const decrypted = decrypt(data.credentials.encrypted);
        // Try to parse as JSON, otherwise return as string
        try {
          data.credentials = JSON.parse(decrypted);
        } catch {
          data.credentials = decrypted;
        }
      } catch (err) {
        console.error('Failed to decrypt credentials:', err);
      }
    }
    
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
    
    // Decrypt 2FA secret if encrypted
    if (data && data.twoFactorSecret && isEncrypted(data.twoFactorSecret)) {
      try {
        data.twoFactorSecret = decrypt(data.twoFactorSecret);
      } catch (err) {
        console.error(`Failed to decrypt 2FA secret for user ${userId}:`, err);
      }
    }
    
    return data;
  }

  async createSecuritySettings(settings: InsertSecuritySettings): Promise<SecuritySettings> {
    // Convert camelCase to snake_case for database
    const settingsData = {
      id: randomUUID(),
      user_id: settings.userId,
      two_factor_enabled: settings.twoFactorEnabled ?? false,
      two_factor_secret: settings.twoFactorSecret ? encrypt(settings.twoFactorSecret) : null,
      backup_codes: settings.backupCodes ?? null,
      login_notifications: settings.loginNotifications ?? true,
      session_timeout: settings.sessionTimeout ?? 3600,
      last_password_change: settings.lastPasswordChange ?? new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('security_settings')
      .insert(settingsData)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create security settings: ${error.message}`);
    
    // Decrypt 2FA secret and convert snake_case to camelCase
    const twoFactorSecret = data.two_factor_secret && isEncrypted(data.two_factor_secret) 
      ? decrypt(data.two_factor_secret) 
      : data.two_factor_secret;
    
    return {
      id: data.id,
      userId: data.user_id,
      twoFactorEnabled: data.two_factor_enabled,
      twoFactorSecret,
      backupCodes: data.backup_codes,
      loginNotifications: data.login_notifications,
      sessionTimeout: data.session_timeout,
      lastPasswordChange: data.last_password_change,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  async updateSecuritySettings(userId: string, updates: Partial<SecuritySettings>): Promise<SecuritySettings> {
    // Convert camelCase to snake_case for database
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (updates.twoFactorEnabled !== undefined) updateData.two_factor_enabled = updates.twoFactorEnabled;
    if (updates.twoFactorSecret !== undefined) updateData.two_factor_secret = updates.twoFactorSecret ? encrypt(updates.twoFactorSecret) : null;
    if (updates.backupCodes !== undefined) updateData.backup_codes = updates.backupCodes;
    if (updates.loginNotifications !== undefined) updateData.login_notifications = updates.loginNotifications;
    if (updates.sessionTimeout !== undefined) updateData.session_timeout = updates.sessionTimeout;
    if (updates.lastPasswordChange !== undefined) updateData.last_password_change = updates.lastPasswordChange;
    
    const { data, error } = await supabase
      .from('security_settings')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update security settings: ${error.message}`);
    
    // Decrypt 2FA secret and convert snake_case to camelCase
    const twoFactorSecret = data.two_factor_secret && isEncrypted(data.two_factor_secret) 
      ? decrypt(data.two_factor_secret) 
      : data.two_factor_secret;
    
    return {
      id: data.id,
      userId: data.user_id,
      twoFactorEnabled: data.two_factor_enabled,
      twoFactorSecret,
      backupCodes: data.backup_codes,
      loginNotifications: data.login_notifications,
      sessionTimeout: data.session_timeout,
      lastPasswordChange: data.last_password_change,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
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

  // Admin support ticket methods
  async getAllSupportTickets(filters?: { status?: string; category?: string; priority?: string; search?: string; limit?: number; offset?: number }): Promise<any[]> {
    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        user:users!user_id (
          id,
          email,
          full_name,
          plan
        )
      `)
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.search) {
      // Escape special characters in search term
      const term = filters.search.replace(/[,()]/g, '\\$&');
      query = query.or(`(subject.ilike.%${term}%,message.ilike.%${term}%)`);
    }
    
    // Apply pagination
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    query = query.range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    
    if (error) throw new Error(`Failed to get all support tickets: ${error.message}`);
    return data || [];
  }

  async getSupportTicketById(id: string): Promise<any> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select(`
        *,
        user:users!user_id (
          id,
          email,
          full_name,
          plan,
          image_url
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw new Error(`Failed to get support ticket: ${error.message}`);
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
      id: randomUUID(),
      user_id: history.userId,
      generation_type: history.generationType,
      input_data: history.inputData,
      output_data: history.outputData,
      brand_voice: history.brandVoice,
      tokens_used: history.tokensUsed,
      model: history.model,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('ai_generation_history')
      .insert(historyData)
      .select()
      .single();
    
    if (error) {
      // Log RLS errors but don't fail the request
      if (error.message.includes('row-level security') || error.message.includes('policy')) {
        console.warn('⚠️  RLS Error (non-fatal): AI generation history not saved to Supabase:', error.message);
        console.warn('⚠️  Please run this SQL in Supabase SQL Editor to fix:');
        console.warn('   ALTER TABLE ai_generation_history DISABLE ROW LEVEL SECURITY;');
        // Return a mock object to prevent breaking the flow
        return historyData as unknown as AiGenerationHistory;
      }
      throw new Error(`Failed to create AI generation history: ${error.message}`);
    }
    return data;
  }

  // AB Test methods
  async getABTests(userId: string): Promise<AbTest[]> {
    const { data, error } = await supabase
      .from('ab_tests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to get AB tests: ${error.message}`);
    return data || [];
  }

  async getABTest(id: string): Promise<AbTest | undefined> {
    const { data, error } = await supabase
      .from('ab_tests')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(`Failed to get AB test: ${error.message}`);
    }
    return data;
  }

  async createABTest(abTest: InsertAbTest): Promise<AbTest> {
    const testData = {
      id: randomUUID(),
      user_id: abTest.userId,
      test_name: abTest.testName,
      status: abTest.status || 'draft',
      duration: abTest.duration,
      participants: abTest.participants || 0,
      variant_a_data: abTest.variantAData,
      variant_b_data: abTest.variantBData,
      winner: abTest.winner,
      significance: abTest.significance,
      improvement: abTest.improvement,
      start_date: abTest.startDate,
      end_date: abTest.endDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('ab_tests')
      .insert(testData)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create AB test: ${error.message}`);
    return data;
  }

  async updateABTest(id: string, updates: Partial<AbTest>): Promise<AbTest> {
    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (updates.testName !== undefined) updateData.test_name = updates.testName;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.duration !== undefined) updateData.duration = updates.duration;
    if (updates.participants !== undefined) updateData.participants = updates.participants;
    if (updates.variantAData !== undefined) updateData.variant_a_data = updates.variantAData;
    if (updates.variantBData !== undefined) updateData.variant_b_data = updates.variantBData;
    if (updates.winner !== undefined) updateData.winner = updates.winner;
    if (updates.significance !== undefined) updateData.significance = updates.significance;
    if (updates.improvement !== undefined) updateData.improvement = updates.improvement;
    if (updates.startDate !== undefined) updateData.start_date = updates.startDate;
    if (updates.endDate !== undefined) updateData.end_date = updates.endDate;

    const { data, error } = await supabase
      .from('ab_tests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update AB test: ${error.message}`);
    return data;
  }

  async deleteABTest(id: string): Promise<void> {
    const { error } = await supabase
      .from('ab_tests')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete AB test: ${error.message}`);
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
      .eq('session_id', sessionId)
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
      .eq('session_id', sessionId);
    
    if (error) throw new Error(`Failed to delete session: ${error.message}`);
  }

  async cleanupExpiredSessions(): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .lt('expiresAt', new Date().toISOString());
    
    if (error) throw new Error(`Failed to cleanup expired sessions: ${error.message}`);
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    // Only select columns that exist in Supabase's schema cache
    // Additional columns from migration may not be recognized yet
    const { data, error} = await supabase
      .from('sessions')
      .select('id, session_id, user_id, expires_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to get user sessions: ${error.message}`);
    
    // Map snake_case to camelCase and include missing fields with null values
    const sessions = (data || []).map((session: any) => ({
      id: session.id,
      sessionId: session.session_id,
      userId: session.user_id,
      expiresAt: new Date(session.expires_at),
      createdAt: session.created_at ? new Date(session.created_at) : null,
      refreshTokenId: null,
      userAgent: null,
      deviceType: null,
      browser: null,
      os: null,
      ipAddress: null,
      location: null,
      lastSeenAt: null
    }));
    
    return sessions;
  }

  async updateSession(sessionId: string, updates: Partial<Session>): Promise<Session> {
    // Convert Date objects to ISO strings for Supabase
    const sanitizedUpdates: any = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value instanceof Date) {
        sanitizedUpdates[key] = value.toISOString();
      } else if (value !== undefined) {
        sanitizedUpdates[key] = value;
      }
    }

    const { data, error} = await supabase
      .from('sessions')
      .update(sanitizedUpdates)
      .eq('session_id', sessionId)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update session: ${error.message}`);
    return data;
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

  // Payment transaction methods
  async getPaymentTransactions(userId: string): Promise<PaymentTransaction[]> {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to get payment transactions: ${error.message}`);
    return data || [];
  }

  async createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction> {
    const transactionData = {
      ...transaction,
      id: randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('payment_transactions')
      .insert(transactionData)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create payment transaction: ${error.message}`);
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
    
    // Convert camelCase to snake_case for database
    const dbStats: any = {};
    if (stats.totalRevenue !== undefined) dbStats.total_revenue = stats.totalRevenue;
    if (stats.totalOrders !== undefined) dbStats.total_orders = stats.totalOrders;
    if (stats.conversionRate !== undefined) dbStats.conversion_rate = stats.conversionRate;
    if (stats.cartRecoveryRate !== undefined) dbStats.cart_recovery_rate = stats.cartRecoveryRate;
    if (stats.productsCount !== undefined) dbStats.products_count = stats.productsCount;
    if (stats.productsOptimized !== undefined) dbStats.products_optimized = stats.productsOptimized;
    if (stats.emailsSent !== undefined) dbStats.emails_sent = stats.emailsSent;
    if (stats.emailsRemaining !== undefined) dbStats.emails_remaining = stats.emailsRemaining;
    if (stats.smsSent !== undefined) dbStats.sms_sent = stats.smsSent;
    if (stats.smsRemaining !== undefined) dbStats.sms_remaining = stats.smsRemaining;
    if (stats.aiGenerationsUsed !== undefined) dbStats.ai_generations_used = stats.aiGenerationsUsed;
    if (stats.seoOptimizationsUsed !== undefined) dbStats.seo_optimizations_used = stats.seoOptimizationsUsed;
    if (stats.creditsUsed !== undefined) dbStats.credits_used = stats.creditsUsed;
    if (stats.creditsRemaining !== undefined) dbStats.credits_remaining = stats.creditsRemaining;
    
    if (existingStats) {
      const { data, error } = await supabase
        .from('usage_stats')
        .update({ ...dbStats, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        // Log RLS errors but don't fail the request
        if (error.message.includes('row-level security') || error.message.includes('policy') || error.message.includes('schema cache')) {
          console.warn('⚠️  RLS Error (non-fatal): Usage stats not updated in Supabase:', error.message);
          console.warn('⚠️  Please run this SQL in Supabase SQL Editor to fix:');
          console.warn('   ALTER TABLE usage_stats DISABLE ROW LEVEL SECURITY;');
          return { ...existingStats, ...stats } as UsageStats;
        }
        throw new Error(`Failed to update usage stats: ${error.message}`);
      }
      return data;
    } else {
      const statsData = {
        ...dbStats,
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
      
      if (error) {
        // Log RLS errors but don't fail the request
        if (error.message.includes('row-level security') || error.message.includes('policy') || error.message.includes('schema cache')) {
          console.warn('⚠️  RLS Error (non-fatal): Usage stats not created in Supabase:', error.message);
          console.warn('⚠️  Please run this SQL in Supabase SQL Editor to fix:');
          console.warn('   ALTER TABLE usage_stats DISABLE ROW LEVEL SECURITY;');
          return statsData as UsageStats;
        }
        throw new Error(`Failed to create usage stats: ${error.message}`);
      }
      return data;
    }
  }

  async incrementUsageStat(userId: string, stat: keyof UsageStats, amount: number = 1): Promise<void> {
    const currentStats = await this.getUserUsageStats(userId);
    const currentValue = currentStats ? (currentStats[stat] as number || 0) : 0;
    await this.createOrUpdateUsageStats(userId, { [stat]: currentValue + amount });
  }

  // Activity log methods
  async createActivityLog(userId: string, logData: any): Promise<any> {
    const activityData = {
      id: randomUUID(),
      userId,
      ...logData,
      createdAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('activity_logs')
      .insert(activityData)
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
  async trackToolAccess(userId: string, toolName: string): Promise<any> {
    const existingTools = await this.getUserToolsAccess(userId);
    const existingTool = existingTools.find(tool => tool.toolName === toolName);
    
    if (existingTool) {
      const { data, error } = await supabase
        .from('tools_access')
        .update({ 
          accessCount: (existingTool.accessCount || 0) + 1,
          lastAccessed: new Date().toISOString()
        })
        .eq('id', existingTool.id)
        .select()
        .single();
      
      if (error) throw new Error(`Failed to update tool access: ${error.message}`);
      return data;
    } else {
      const accessData = {
        id: randomUUID(),
        userId,
        toolName,
        accessCount: 1,
        lastAccessed: new Date().toISOString(),
        firstAccessed: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('tools_access')
        .insert(accessData)
        .select()
        .single();
      
      if (error) throw new Error(`Failed to create tool access: ${error.message}`);
      return data;
    }
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

  async getDashboardData(userId: string): Promise<{
    user: User | undefined;
    profile: any;
    usageStats: any;
    activityLogs: any[];
    toolsAccess: any[];
    realtimeMetrics: any[];
  }> {
    const user = await this.getUser(userId);
    const usageStats = await this.getUserUsageStats(userId);
    const activityLogs = await this.getUserActivityLogs(userId);
    const toolsAccess = await this.getUserToolsAccess(userId);
    const realtimeMetrics = await this.getUserRealtimeMetrics(userId);
    
    return {
      user,
      profile: user ? { 
        userId: user.id, 
        name: user.fullName, 
        email: user.email,
        plan: user.plan 
      } : null,
      usageStats,
      activityLogs: activityLogs.slice(0, 10),
      toolsAccess: toolsAccess || [],
      realtimeMetrics: realtimeMetrics ? [realtimeMetrics] : [],
    };
  }

  async updateUsageStats(userId: string, statField: string, increment: number): Promise<void> {
    await this.incrementUsageStat(userId, statField as keyof UsageStats, increment);
  }

  async generateSampleMetrics(userId: string): Promise<void> {
    // Generate sample realtime metrics for demo purposes
    await this.updateRealtimeMetric(userId, {
      userId: userId,
      value: String(Math.floor(Math.random() * 1000) + 500),
      metricName: "sample_metric",
      changePercent: String(Math.floor(Math.random() * 50) - 25),
      isPositive: Math.random() > 0.5
    });
  }
}

// Export a singleton instance
export const supabaseStorage = new SupabaseStorage();