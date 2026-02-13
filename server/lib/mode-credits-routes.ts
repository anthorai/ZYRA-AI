/**
 * ZYRA AI Mode-Based Credit System API Routes
 * 
 * These routes handle:
 * - Credit cost preview by mode
 * - Action lock status checks
 * - Credit consumption and execution
 * - Material change verification
 * - Competitive Intelligence usage tracking
 */

import { Express, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  checkModeBasedCredits,
  executeAndConsumeCredits,
  getCreditCostPreview,
  getFullCycleCredits,
  getCreditBreakdown,
  validateActionTypeExists,
  validateExecutionMode,
  formatCreditDisplay,
  getEstimatedCyclesPerPlan,
} from './mode-based-credits';
import {
  checkActionLock,
  getEntityLockHistory,
  checkCompetitiveIntelligenceLimit,
  getCompetitiveIntelligenceUsageThisMonth,
  detectMaterialChange,
  generateContentHash,
  checkBulkActionLocks,
} from './action-lock-service';
import {
  ExecutionMode,
  EXECUTION_MODES,
  ZyraActionType,
  FOUNDATION_ACTIONS,
  GROWTH_ACTIONS,
  GUARD_ACTIONS,
  getActionDetails,
  getAllActionTypes,
  PLAN_MODE_ACCESS,
  getStarterCompetitiveWarning,
} from './constants/execution-modes';
import { ZYRA_PLANS, PLAN_NAMES, CREDIT_LIMITS } from './constants/plans';
// Note: requireAuth and apiLimiter are used in the main routes.ts

// Validation schemas
const checkCreditsSchema = z.object({
  actionType: z.string(),
  mode: z.enum(['fast', 'competitive_intelligence']),
  entityType: z.string(),
  entityId: z.string(),
});

const executeActionSchema = z.object({
  actionType: z.string(),
  mode: z.enum(['fast', 'competitive_intelligence']),
  entityType: z.string(),
  entityId: z.string(),
  entityContent: z.record(z.any()).optional(),
  userConfirmed: z.boolean().optional(),
});

const materialChangeSchema = z.object({
  entityType: z.string(),
  entityId: z.string(),
  newContentHash: z.string(),
  changeType: z.string(),
});

const bulkLockCheckSchema = z.object({
  entityType: z.string(),
  entityIds: z.array(z.string()),
  actionType: z.string(),
});

// Helper to get user from request
function getUserFromRequest(req: Request): { id: string; plan: string } | null {
  const user = (req as any).user;
  if (!user) return null;
  return { id: user.id, plan: user.plan || 'trial' };
}

// Type for auth middleware
type AuthMiddleware = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export function registerModeCreditsRoutes(app: Express, requireAuth: AuthMiddleware) {
  // =========================================================================
  // GET /api/mode-credits/actions - List all available actions with pricing
  // =========================================================================
  app.get('/api/mode-credits/actions', async (req, res) => {
    try {
      const foundationActions = Object.entries(FOUNDATION_ACTIONS).map(([key, action]) => ({
        id: key,
        ...action,
        category: 'foundation',
      }));

      const growthActions = Object.entries(GROWTH_ACTIONS).map(([key, action]) => ({
        id: key,
        ...action,
        category: 'growth',
      }));

      const guardActions = Object.entries(GUARD_ACTIONS).map(([key, action]) => ({
        id: key,
        ...action,
        category: 'guard',
      }));

      res.json({
        foundation: foundationActions,
        growth: growthActions,
        guard: guardActions,
        totalFoundationFastCredits: foundationActions.reduce((sum, a) => sum + a.fastModeCredits, 0),
        totalFoundationCompetitiveCredits: foundationActions.reduce((sum, a) => sum + a.competitiveCredits, 0),
      });
    } catch (error) {
      console.error('Error fetching actions:', error);
      res.status(500).json({ error: 'Failed to fetch actions' });
    }
  });

  // =========================================================================
  // GET /api/mode-credits/preview/:actionType - Get credit cost preview
  // =========================================================================
  app.get('/api/mode-credits/preview/:actionType', async (req, res) => {
    try {
      const { actionType } = req.params;
      const mode = (req.query.mode as ExecutionMode) || 'fast';

      if (!validateActionTypeExists(actionType)) {
        return res.status(400).json({ error: 'Invalid action type' });
      }

      if (!validateExecutionMode(mode)) {
        return res.status(400).json({ error: 'Invalid execution mode' });
      }

      const preview = getCreditCostPreview(actionType as ZyraActionType, mode);
      const breakdown = getCreditBreakdown(actionType as ZyraActionType, mode);
      const details = getActionDetails(actionType as ZyraActionType);

      res.json({
        actionType,
        ...details,
        ...preview,
        ...breakdown,
      });
    } catch (error) {
      console.error('Error getting credit preview:', error);
      res.status(500).json({ error: 'Failed to get credit preview' });
    }
  });

  // =========================================================================
  // POST /api/mode-credits/check - Check if action can be executed
  // =========================================================================
  app.post('/api/mode-credits/check', requireAuth, async (req, res) => {
    try {
      const user = getUserFromRequest(req);
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validationResult = checkCreditsSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid request',
          details: validationResult.error.errors 
        });
      }

      const { actionType, mode, entityType, entityId } = validationResult.data;

      if (!validateActionTypeExists(actionType)) {
        return res.status(400).json({ error: 'Invalid action type' });
      }

      const result = await checkModeBasedCredits(
        user.id,
        actionType as ZyraActionType,
        mode,
        entityType,
        entityId
      );

      res.json(result);
    } catch (error) {
      console.error('Error checking credits:', error);
      res.status(500).json({ error: 'Failed to check credits' });
    }
  });

  // =========================================================================
  // POST /api/mode-credits/execute - Execute action and consume credits
  // =========================================================================
  app.post('/api/mode-credits/execute', requireAuth, async (req, res) => {
    try {
      const user = getUserFromRequest(req);
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validationResult = executeActionSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid request',
          details: validationResult.error.errors 
        });
      }

      const { actionType, mode, entityType, entityId, entityContent, userConfirmed } = validationResult.data;

      console.log(`[Credits Execute] User: ${user.id}, Action: ${actionType}, Mode: ${mode}, Entity: ${entityType}/${entityId}`);

      if (!validateActionTypeExists(actionType)) {
        return res.status(400).json({ error: 'Invalid action type' });
      }

      // Check if CI mode requires confirmation for Starter plan
      if (mode === 'competitive_intelligence') {
        const planId = ZYRA_PLANS.STARTER; // TODO: Get from subscription
        const access = PLAN_MODE_ACCESS[planId];
        
        if (access?.competitiveIntelligenceAccess === 'limited' && !userConfirmed) {
          return res.status(400).json({
            error: 'Confirmation required',
            requiresConfirmation: true,
            confirmationMessage: getStarterCompetitiveWarning(),
          });
        }
      }

      const result = await executeAndConsumeCredits(
        user.id,
        actionType as ZyraActionType,
        mode,
        entityType,
        entityId,
        entityContent
      );

      res.json(result);
    } catch (error) {
      console.error('Error executing action:', error);
      res.status(500).json({ error: 'Failed to execute action' });
    }
  });

  // =========================================================================
  // GET /api/mode-credits/lock-status - Check action lock status
  // =========================================================================
  app.get('/api/mode-credits/lock-status', requireAuth, async (req, res) => {
    try {
      const user = getUserFromRequest(req);
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { entityType, entityId, actionType } = req.query;

      if (!entityType || !entityId || !actionType) {
        return res.status(400).json({ error: 'entityType, entityId, and actionType are required' });
      }

      if (!validateActionTypeExists(actionType as string)) {
        return res.status(400).json({ error: 'Invalid action type' });
      }

      const result = await checkActionLock(
        user.id,
        entityType as string,
        entityId as string,
        actionType as ZyraActionType
      );

      res.json(result);
    } catch (error) {
      console.error('Error checking lock status:', error);
      res.status(500).json({ error: 'Failed to check lock status' });
    }
  });

  // =========================================================================
  // GET /api/mode-credits/entity-history - Get lock history for entity
  // =========================================================================
  app.get('/api/mode-credits/entity-history', requireAuth, async (req, res) => {
    try {
      const user = getUserFromRequest(req);
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { entityType, entityId } = req.query;

      if (!entityType || !entityId) {
        return res.status(400).json({ error: 'entityType and entityId are required' });
      }

      const history = await getEntityLockHistory(
        user.id,
        entityType as string,
        entityId as string
      );

      res.json({ history });
    } catch (error) {
      console.error('Error getting entity history:', error);
      res.status(500).json({ error: 'Failed to get entity history' });
    }
  });

  // =========================================================================
  // POST /api/mode-credits/bulk-lock-check - Check locks for multiple entities
  // =========================================================================
  app.post('/api/mode-credits/bulk-lock-check', requireAuth, async (req, res) => {
    try {
      const user = getUserFromRequest(req);
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validationResult = bulkLockCheckSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid request',
          details: validationResult.error.errors 
        });
      }

      const { entityType, entityIds, actionType } = validationResult.data;

      if (!validateActionTypeExists(actionType)) {
        return res.status(400).json({ error: 'Invalid action type' });
      }

      const results = await checkBulkActionLocks(
        user.id,
        entityType,
        entityIds,
        actionType as ZyraActionType
      );

      // Convert Map to object for JSON response
      const resultsObject: Record<string, any> = {};
      results.forEach((value, key) => {
        resultsObject[key] = value;
      });

      res.json({
        results: resultsObject,
        lockedCount: Array.from(results.values()).filter(r => r.isLocked).length,
        unlockedCount: Array.from(results.values()).filter(r => !r.isLocked).length,
      });
    } catch (error) {
      console.error('Error checking bulk locks:', error);
      res.status(500).json({ error: 'Failed to check bulk locks' });
    }
  });

  // =========================================================================
  // GET /api/mode-credits/ci-usage - Get Competitive Intelligence usage
  // =========================================================================
  app.get('/api/mode-credits/ci-usage', requireAuth, async (req, res) => {
    try {
      const user = getUserFromRequest(req);
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const usage = await getCompetitiveIntelligenceUsageThisMonth(user.id);
      const limit = await checkCompetitiveIntelligenceLimit(user.id, ZYRA_PLANS.STARTER); // TODO: Get actual plan

      res.json({
        ...usage,
        ...limit,
      });
    } catch (error) {
      console.error('Error getting CI usage:', error);
      res.status(500).json({ error: 'Failed to get CI usage' });
    }
  });

  // =========================================================================
  // POST /api/mode-credits/material-change - Report material change
  // =========================================================================
  app.post('/api/mode-credits/material-change', requireAuth, async (req, res) => {
    try {
      const user = getUserFromRequest(req);
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validationResult = materialChangeSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid request',
          details: validationResult.error.errors 
        });
      }

      const { entityType, entityId, newContentHash, changeType } = validationResult.data;

      const result = await detectMaterialChange(
        user.id,
        entityType,
        entityId,
        newContentHash,
        changeType as any,
        'user_triggered'
      );

      res.json(result);
    } catch (error) {
      console.error('Error processing material change:', error);
      res.status(500).json({ error: 'Failed to process material change' });
    }
  });

  // =========================================================================
  // GET /api/mode-credits/cycle-estimate - Get estimated cycles per plan
  // =========================================================================
  app.get('/api/mode-credits/cycle-estimate', async (req, res) => {
    try {
      const mode = (req.query.mode as ExecutionMode) || 'fast';

      if (!validateExecutionMode(mode)) {
        return res.status(400).json({ error: 'Invalid execution mode' });
      }

      const fastCycles = getEstimatedCyclesPerPlan('fast');
      const competitiveCycles = getEstimatedCyclesPerPlan('competitive_intelligence');
      const fullCycleCredits = getFullCycleCredits(mode);

      res.json({
        selectedMode: mode,
        fastModeCycles: fastCycles,
        competitiveModeCycles: competitiveCycles,
        cycleCredits: fullCycleCredits,
        plans: Object.entries(PLAN_NAMES).map(([id, name]) => ({
          id,
          name,
          credits: CREDIT_LIMITS[id as keyof typeof CREDIT_LIMITS] || 0,
          fastModeCycles: fastCycles[id] || 0,
          competitiveModeCycles: competitiveCycles[id] || 0,
        })),
      });
    } catch (error) {
      console.error('Error getting cycle estimate:', error);
      res.status(500).json({ error: 'Failed to get cycle estimate' });
    }
  });

  // =========================================================================
  // POST /api/mode-credits/generate-hash - Generate content hash
  // =========================================================================
  app.post('/api/mode-credits/generate-hash', async (req, res) => {
    try {
      const { content } = req.body;

      if (!content || typeof content !== 'object') {
        return res.status(400).json({ error: 'Content object is required' });
      }

      const hash = generateContentHash(content);

      res.json({ hash });
    } catch (error) {
      console.error('Error generating hash:', error);
      res.status(500).json({ error: 'Failed to generate hash' });
    }
  });

  // =========================================================================
  // GET /api/mode-credits/plan-access - Get mode access for user's plan
  // =========================================================================
  app.get('/api/mode-credits/plan-access', requireAuth, async (req, res) => {
    try {
      const user = getUserFromRequest(req);
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // TODO: Get actual plan from subscription
      const planId = ZYRA_PLANS.STARTER;
      const access = PLAN_MODE_ACCESS[planId];

      if (!access) {
        return res.status(404).json({ error: 'Plan access not found' });
      }

      res.json({
        planId,
        planName: PLAN_NAMES[planId as keyof typeof PLAN_NAMES] || 'Unknown',
        creditLimit: CREDIT_LIMITS[planId as keyof typeof CREDIT_LIMITS] || 0,
        ...access,
      });
    } catch (error) {
      console.error('Error getting plan access:', error);
      res.status(500).json({ error: 'Failed to get plan access' });
    }
  });

  // =========================================================================
  // Real Learning API Endpoints
  // =========================================================================

  // GET /api/mode-credits/learning-stats - Get learning statistics for user
  app.get('/api/mode-credits/learning-stats', requireAuth, async (req, res) => {
    try {
      const user = getUserFromRequest(req);
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { realLearningService } = await import('./real-learning-service');
      const stats = await realLearningService.getLearningStats(user.id);

      res.json(stats);
    } catch (error) {
      console.error('Error getting learning stats:', error);
      res.status(500).json({ error: 'Failed to get learning stats' });
    }
  });

  // GET /api/mode-credits/learned-patterns - Get learned patterns for user
  app.get('/api/mode-credits/learned-patterns', requireAuth, async (req, res) => {
    try {
      const user = getUserFromRequest(req);
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { actionType, minConfidence } = req.query;
      const { realLearningService } = await import('./real-learning-service');
      
      const patterns = await realLearningService.getApplicablePatterns(
        user.id,
        actionType as string | undefined,
        minConfidence ? parseInt(minConfidence as string) : 60
      );

      res.json({ patterns });
    } catch (error) {
      console.error('Error getting learned patterns:', error);
      res.status(500).json({ error: 'Failed to get learned patterns' });
    }
  });

  // POST /api/mode-credits/mark-pushed - Mark change as pushed to Shopify
  app.post('/api/mode-credits/mark-pushed', requireAuth, async (req, res) => {
    try {
      const user = getUserFromRequest(req);
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { changeId } = req.body;
      if (!changeId) {
        return res.status(400).json({ error: 'changeId is required' });
      }

      const { realLearningService } = await import('./real-learning-service');
      await realLearningService.markPushedToShopify(changeId);

      res.json({ success: true, message: 'Change marked as pushed, measurement period started' });
    } catch (error) {
      console.error('Error marking change as pushed:', error);
      res.status(500).json({ error: 'Failed to mark change as pushed' });
    }
  });

  // POST /api/mode-credits/process-measurements - Manually trigger measurement processing
  app.post('/api/mode-credits/process-measurements', requireAuth, async (req, res) => {
    try {
      const user = getUserFromRequest(req);
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { realLearningService } = await import('./real-learning-service');
      const processed = await realLearningService.processMeasurements();

      res.json({ success: true, processed, message: `Processed ${processed} measurements` });
    } catch (error) {
      console.error('Error processing measurements:', error);
      res.status(500).json({ error: 'Failed to process measurements' });
    }
  });

  console.log('[Mode Credits] Routes registered successfully');
}
