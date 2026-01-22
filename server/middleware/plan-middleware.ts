/**
 * Plan Access Middleware
 * 
 * Express middleware for enforcing plan-based access restrictions on API routes.
 * This middleware should be used on routes that require specific plan features.
 * 
 * USAGE:
 * app.post('/api/bulk-optimize', requirePlan('growth'), async (req, res) => { ... });
 * app.post('/api/serp-analysis', requireFeature('serpIntelligence'), async (req, res) => { ... });
 */

import { Request, Response, NextFunction } from 'express';
import { requireDb } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import {
  getPlanCapabilities,
  checkActionAccess,
  hasSerpAccess,
  canUseBulkOperations,
  getMaxBulkProducts,
  hasAdvancedCartRecovery,
  hasScheduledRefresh,
  hasPerProductAutonomy,
  type ActionType,
} from '../lib/plan-access-controller';
import { ZYRA_PLANS, PLAN_NAMES, getPlanIdByName } from '../lib/constants/plans';

// Extend Express Request to include plan info
declare global {
  namespace Express {
    interface Request {
      userPlan?: {
        name: string;
        id: string;
        capabilities: ReturnType<typeof getPlanCapabilities>;
      };
    }
  }
}

/**
 * Load user's plan and attach to request
 * Should be called early in the middleware chain after authentication
 */
export async function loadUserPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId || (req as any).session?.userId;
    
    if (!userId) {
      return next(); // No user, skip plan loading
    }
    
    const db = requireDb();
    const [user] = await db
      .select({ plan: users.plan })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (user) {
      const planName = user.plan || 'trial';
      const planId = getPlanIdByName(planName);
      
      req.userPlan = {
        name: planName,
        id: planId,
        capabilities: getPlanCapabilities(planName),
      };
    }
    
    next();
  } catch (error) {
    console.error('❌ [Plan Middleware] Error loading user plan:', error);
    next(); // Continue without plan info, individual routes should handle missing plan
  }
}

/**
 * Require a minimum plan level for the route
 * Plans are ordered: FREE < STARTER < GROWTH < SCALE
 */
export function requirePlan(minimumPlan: 'starter' | 'growth' | 'scale') {
  const planOrder = ['free', 'trial', 'starter', 'growth', 'scale'];
  const minPlanIndex = planOrder.indexOf(minimumPlan);
  
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId || (req as any).session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Use cached plan if available
      let planName = req.userPlan?.name;
      
      if (!planName) {
        const db = requireDb();
        const [user] = await db
          .select({ plan: users.plan })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        
        planName = user?.plan || 'trial';
      }
      
      const normalizedPlan = planName.toLowerCase().replace('+', '');
      const userPlanIndex = planOrder.indexOf(normalizedPlan);
      
      if (userPlanIndex < minPlanIndex) {
        const requiredPlanName = minimumPlan.charAt(0).toUpperCase() + minimumPlan.slice(1);
        return res.status(403).json({
          error: 'Plan upgrade required',
          message: `This feature requires ${requiredPlanName} plan or higher.`,
          currentPlan: planName,
          requiredPlan: minimumPlan,
        });
      }
      
      next();
    } catch (error) {
      console.error('❌ [Plan Middleware] Error checking plan requirement:', error);
      return res.status(500).json({ error: 'Unable to verify plan access' });
    }
  };
}

/**
 * Require a specific feature to be available on the user's plan
 */
export function requireFeature(feature: 'serpIntelligence' | 'bulkOptimization' | 'advancedCartRecovery' | 'scheduledRefresh' | 'perProductAutonomy') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId || (req as any).session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      let planName = req.userPlan?.name;
      
      if (!planName) {
        const db = requireDb();
        const [user] = await db
          .select({ plan: users.plan })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        
        planName = user?.plan || 'trial';
      }
      
      let hasFeature = false;
      
      switch (feature) {
        case 'serpIntelligence':
          hasFeature = hasSerpAccess(planName);
          break;
        case 'bulkOptimization':
          hasFeature = canUseBulkOperations(planName);
          break;
        case 'advancedCartRecovery':
          hasFeature = hasAdvancedCartRecovery(planName);
          break;
        case 'scheduledRefresh':
          hasFeature = hasScheduledRefresh(planName);
          break;
        case 'perProductAutonomy':
          hasFeature = hasPerProductAutonomy(planName);
          break;
      }
      
      if (!hasFeature) {
        return res.status(403).json({
          error: 'Feature not available',
          message: `This feature is not available on your current plan.`,
          feature,
          currentPlan: planName,
        });
      }
      
      next();
    } catch (error) {
      console.error('❌ [Plan Middleware] Error checking feature access:', error);
      return res.status(500).json({ error: 'Unable to verify feature access' });
    }
  };
}

/**
 * Require a specific action to be allowed on the user's plan
 */
export function requireActionAccess(actionType: ActionType, options?: { isAutoExecution?: boolean }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId || (req as any).session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      let planName = req.userPlan?.name;
      
      if (!planName) {
        const db = requireDb();
        const [user] = await db
          .select({ plan: users.plan })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        
        planName = user?.plan || 'trial';
      }
      
      // Get product count from request body if it's a bulk action
      const productCount = req.body?.productCount || req.body?.productIds?.length || 1;
      
      const accessResult = checkActionAccess(planName, actionType, {
        productCount,
        isAutoExecution: options?.isAutoExecution,
      });
      
      if (!accessResult.allowed) {
        return res.status(403).json({
          error: 'Action not allowed',
          message: accessResult.reason,
          actionType,
          currentPlan: planName,
          upgradeHint: accessResult.upgradeHint,
        });
      }
      
      // Attach plan info to request for route handler
      (req as any).planAccessResult = accessResult;
      
      next();
    } catch (error) {
      console.error('❌ [Plan Middleware] Error checking action access:', error);
      return res.status(500).json({ error: 'Unable to verify action access' });
    }
  };
}

/**
 * Get user's plan capabilities for use in route handlers
 */
export async function getUserPlanCapabilities(userId: string) {
  try {
    const db = requireDb();
    const [user] = await db
      .select({ plan: users.plan })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    const planName = user?.plan || 'trial';
    
    return {
      planName,
      planId: getPlanIdByName(planName),
      capabilities: getPlanCapabilities(planName),
      maxBulkProducts: getMaxBulkProducts(planName),
      hasSerpAccess: hasSerpAccess(planName),
      hasAdvancedCartRecovery: hasAdvancedCartRecovery(planName),
      hasScheduledRefresh: hasScheduledRefresh(planName),
      hasPerProductAutonomy: hasPerProductAutonomy(planName),
      canUseBulkOperations: canUseBulkOperations(planName),
    };
  } catch (error) {
    console.error('❌ [Plan Middleware] Error getting plan capabilities:', error);
    return null;
  }
}
