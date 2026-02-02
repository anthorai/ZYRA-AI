/**
 * ZYRA MASTER LOOP API ROUTES
 * 
 * Exposes the Master Loop functionality through REST API endpoints.
 * These routes provide transparency and control over the autonomous system.
 */

import { Router, Request, Response } from 'express';
import { 
  masterLoopController,
  storeSituationDetector,
  planPermissionMapper,
  masterActionRegistry,
  prioritySequencingEngine,
  kpiMonitor,
  type LoopState,
  type LoopCycleResult,
  type ActionPool,
} from './index';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string };
}

const router = Router();

// Middleware to require authentication
const requireAuth = (req: Request, res: Response, next: Function) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user?.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

/**
 * GET /api/master-loop/state
 * Get current loop state for the authenticated user
 */
router.get('/state', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    
    let state = masterLoopController.getLoopState(userId);
    if (!state) {
      state = await masterLoopController.initializeLoop(userId);
    }

    res.json({
      success: true,
      state: {
        phase: state.phase,
        situation: state.situation,
        plan: state.permissions.planName,
        permissions: {
          foundation: state.permissions.foundation,
          growth: state.permissions.growth,
          guard: state.permissions.guard,
        },
        actionsAvailable: state.actionPool?.totalAvailable || 0,
        actionsSkipped: state.actionPool?.totalSkipped || 0,
        nextAction: state.actionPool?.nextAction?.action.name || null,
        isFrozen: state.isFrozen,
        freezeReason: state.freezeReason,
        cycleCount: state.cycleCount,
        lastCycleAt: state.lastCycleAt,
      },
    });
  } catch (error) {
    console.error('Error getting loop state:', error);
    res.status(500).json({ 
      error: 'Failed to get loop state',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/master-loop/run-cycle
 * Run a single loop cycle: DETECT → DECIDE → EXECUTE → PROVE → LEARN
 */
router.post('/run-cycle', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    
    console.log(`📡 [API] Starting loop cycle for user ${userId}`);
    const result = await masterLoopController.runCycle(userId);

    res.json({
      success: result.success,
      cycle: {
        phase: result.phase,
        detected: result.detected,
        decided: result.decided,
        executed: result.executed,
        proved: result.proved,
        learned: result.learned,
        cycleTimeMs: result.cycleTimeMs,
        nextAction: result.nextAction,
        error: result.error,
      },
    });
  } catch (error) {
    console.error('Error running loop cycle:', error);
    res.status(500).json({ 
      error: 'Failed to run loop cycle',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/master-loop/situation
 * Get detailed store situation analysis
 */
router.get('/situation', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const analysis = await storeSituationDetector.detectStoreSituation(userId);

    res.json({
      success: true,
      situation: {
        classification: analysis.situation,
        storeAgeInDays: analysis.storeAgeInDays,
        totalOrders: analysis.totalOrders,
        monthlyTraffic: analysis.monthlyTraffic,
        monthlyRevenue: analysis.monthlyRevenue,
        revenueStability: analysis.revenueStability,
        dataAvailabilityScore: analysis.dataAvailabilityScore,
        confidenceLevel: analysis.confidenceLevel,
        reason: analysis.reason,
        detectedAt: analysis.detectedAt,
      },
    });
  } catch (error) {
    console.error('Error getting situation:', error);
    res.status(500).json({ 
      error: 'Failed to get store situation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/master-loop/permissions
 * Get plan-based permissions for the authenticated user
 */
router.get('/permissions', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const permissions = await planPermissionMapper.getActivePlan(userId);
    const situation = await storeSituationDetector.detectStoreSituation(userId);
    const effectivePermissions = planPermissionMapper.getEffectivePermissions(
      permissions,
      situation.situation
    );

    res.json({
      success: true,
      permissions: {
        plan: permissions.plan,
        planName: permissions.planName,
        raw: {
          foundation: permissions.foundation,
          growth: permissions.growth,
          guard: permissions.guard,
        },
        effective: {
          foundation: effectivePermissions.foundation,
          growth: effectivePermissions.growth,
          guard: effectivePermissions.guard,
        },
        maxDailyActions: effectivePermissions.maxDailyActions,
        maxCatalogChangePercent: effectivePermissions.maxCatalogChangePercent,
        rollbackEnabled: effectivePermissions.rollbackEnabled,
        learningEnabled: effectivePermissions.learningEnabled,
      },
      situationApplied: situation.situation,
    });
  } catch (error) {
    console.error('Error getting permissions:', error);
    res.status(500).json({ 
      error: 'Failed to get permissions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/master-loop/actions
 * Get all available actions with their status
 */
router.get('/actions', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    
    const permissions = await planPermissionMapper.getActivePlan(userId);
    const situation = await storeSituationDetector.detectStoreSituation(userId);
    const actionPool = prioritySequencingEngine.buildAllowedActionPool(
      permissions,
      situation.situation
    );
    const summary = prioritySequencingEngine.getPoolSummary(actionPool);

    res.json({
      success: true,
      actions: {
        allowed: actionPool.allowedActions.map(sa => ({
          id: sa.action.id,
          name: sa.action.name,
          description: sa.action.description,
          category: sa.action.category,
          priority: sa.action.priority,
          riskLevel: sa.action.riskLevel,
          sequenceOrder: sa.sequenceOrder,
          permissionLevel: sa.permissionLevel,
          canAutoExecute: sa.canAutoExecute,
          requiresApproval: sa.requiresApproval,
          subActionsCount: sa.action.subActions.length,
          creditsRequired: sa.action.creditsRequired,
        })),
        skipped: actionPool.skippedActions.map(sa => ({
          id: sa.action.id,
          name: sa.action.name,
          category: sa.action.category,
          skipReason: sa.skipReason,
        })),
        nextAction: actionPool.nextAction ? {
          id: actionPool.nextAction.action.id,
          name: actionPool.nextAction.action.name,
          requiresApproval: actionPool.nextAction.requiresApproval,
        } : null,
        summary: {
          totalAvailable: actionPool.totalAvailable,
          totalSkipped: actionPool.totalSkipped,
          byPriority: summary.byPriority,
          byCategory: summary.byCategory,
          byRisk: summary.byRisk,
        },
      },
    });
  } catch (error) {
    console.error('Error getting actions:', error);
    res.status(500).json({ 
      error: 'Failed to get actions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/master-loop/actions/registry
 * Get the full action registry (all possible actions)
 */
router.get('/actions/registry', requireAuth, async (req: Request, res: Response) => {
  try {
    const allActions = masterActionRegistry.getAllActions();

    res.json({
      success: true,
      registry: allActions.map(action => ({
        id: action.id,
        name: action.name,
        description: action.description,
        category: action.category,
        priority: action.priority,
        priorityOrder: action.priorityOrder,
        riskLevel: action.riskLevel,
        subActions: action.subActions.map(sa => ({
          id: sa.id,
          name: sa.name,
          description: sa.description,
          riskLevel: sa.riskLevel,
          estimatedImpact: sa.estimatedImpact,
          creditsRequired: sa.creditsRequired,
        })),
        requiredDataPoints: action.requiredDataPoints,
        safeForSituation: action.safeForSituation,
        creditsRequired: action.creditsRequired,
        estimatedExecutionTime: action.estimatedExecutionTime,
      })),
    });
  } catch (error) {
    console.error('Error getting action registry:', error);
    res.status(500).json({ 
      error: 'Failed to get action registry',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/master-loop/activities
 * Get loop activity log for transparency
 */
router.get('/activities', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const activities = masterLoopController.getActivities(userId);

    res.json({
      success: true,
      activities: activities.map(a => ({
        id: a.id,
        timestamp: a.timestamp,
        phase: a.phase,
        message: a.message,
        status: a.status,
        details: a.details,
        actionName: a.actionName,
      })),
    });
  } catch (error) {
    console.error('Error getting activities:', error);
    res.status(500).json({ 
      error: 'Failed to get activities',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/master-loop/proof
 * Get loop proof summary (transparency metrics)
 */
router.get('/proof', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const proof = await masterLoopController.getLoopProof(userId);

    res.json({
      success: true,
      proof: {
        cyclesRun: proof.cyclesRun,
        actionsExecuted: proof.actionsExecuted,
        actionsSkipped: proof.actionsSkipped,
        rollbacksPerformed: proof.rollbacksPerformed,
        estimatedRevenueDelta: proof.estimatedRevenueDelta,
        lastCycleAt: proof.lastCycleAt,
      },
    });
  } catch (error) {
    console.error('Error getting loop proof:', error);
    res.status(500).json({ 
      error: 'Failed to get loop proof',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/master-loop/freeze
 * Freeze the loop (pause all autonomous actions)
 */
router.post('/freeze', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { reason } = req.body;

    masterLoopController.freezeLoop(userId, reason || 'Manually frozen by user');

    res.json({
      success: true,
      message: 'Loop frozen successfully',
      reason: reason || 'Manually frozen by user',
    });
  } catch (error) {
    console.error('Error freezing loop:', error);
    res.status(500).json({ 
      error: 'Failed to freeze loop',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/master-loop/unfreeze
 * Unfreeze the loop (resume autonomous actions)
 */
router.post('/unfreeze', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;

    masterLoopController.unfreezeLoop(userId);

    res.json({
      success: true,
      message: 'Loop unfrozen successfully',
    });
  } catch (error) {
    console.error('Error unfreezing loop:', error);
    res.status(500).json({ 
      error: 'Failed to unfreeze loop',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/master-loop/refresh-situation
 * Clear situation cache and recalculate
 */
router.post('/refresh-situation', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    
    storeSituationDetector.clearCache(userId);
    const analysis = await storeSituationDetector.detectStoreSituation(userId);

    res.json({
      success: true,
      situation: {
        classification: analysis.situation,
        confidenceLevel: analysis.confidenceLevel,
        reason: analysis.reason,
        detectedAt: analysis.detectedAt,
      },
    });
  } catch (error) {
    console.error('Error refreshing situation:', error);
    res.status(500).json({ 
      error: 'Failed to refresh situation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/master-loop/kpi-baseline
 * Get current KPI baseline metrics
 */
router.get('/kpi-baseline', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const baseline = await kpiMonitor.captureBaseline(userId);

    res.json({
      success: true,
      baseline: {
        conversionRate: baseline.conversionRate,
        revenue: baseline.revenue,
        cartAbandonmentRate: baseline.cartAbandonmentRate,
        bounceRate: baseline.bounceRate,
        averageOrderValue: baseline.averageOrderValue,
        timestamp: baseline.timestamp,
      },
    });
  } catch (error) {
    console.error('Error getting KPI baseline:', error);
    res.status(500).json({ 
      error: 'Failed to get KPI baseline',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/master-loop/check-impact
 * Check impact of recent actions and trigger rollback if needed
 */
router.post('/check-impact', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    
    console.log(`📡 [API] Checking impact for user ${userId}`);
    const result = await masterLoopController.checkImpactAndRollback(userId);

    res.json({
      success: true,
      impactCheck: {
        checked: result.checked,
        rollbacksTriggered: result.rollbacksTriggered,
        actions: result.actions,
      },
    });
  } catch (error) {
    console.error('Error checking impact:', error);
    res.status(500).json({ 
      error: 'Failed to check impact',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
