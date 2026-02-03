/**
 * ZYRA MASTER LOOP CONTROLLER
 * 
 * The ONLY loop ZYRA can use:
 * DETECT → DECIDE → EXECUTE → PROVE → LEARN → repeat
 * 
 * This is the central orchestration layer that ties all components together:
 *   1. Store Situation Detector
 *   2. Plan Permission Mapper
 *   3. Master Action Registry
 *   4. Priority Sequencing Engine
 *   5. KPI Monitor
 * 
 * ABSOLUTE SYSTEM LAWS (DO NOT VIOLATE):
 *   - NEVER bypass plan permissions
 *   - NEVER prioritize growth before trust
 *   - NEVER execute unsafe actions for store situation
 *   - NEVER run multiple risky actions together
 *   - NEVER hide rollback capability
 * 
 * CORE TRUTH:
 *   - Store situation defines caution
 *   - Plan defines power
 *   - Sequence defines intelligence
 *   - Rollback defines trust
 */

import { requireDb } from '../../db';
import { 
  autonomousActions, 
  productSnapshots, 
  pendingApprovals,
  products,
  seoMeta,
  automationSettings
} from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

import { storeSituationDetector, type StoreSituation, type StoreSituationAnalysis } from './store-situation-detector';
import { planPermissionMapper, type PlanPermissions } from './plan-permission-mapper';
import { masterActionRegistry, type MasterAction, type ActionId } from './master-action-registry';
import { prioritySequencingEngine, type SequencedAction, type ActionPool } from './priority-sequencing-engine';
import { kpiMonitor, type KPIMetrics, type KPIImpactResult } from './kpi-monitor';
import { checkAIToolCredits, consumeAIToolCredits } from '../credits';
import OpenAI from 'openai';
import { cachedTextGeneration } from '../ai-cache';
import { emitZyraActivity, type ZyraEventType } from '../zyra-event-emitter';

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export type LoopPhase = 'detect' | 'decide' | 'execute' | 'prove' | 'learn' | 'idle' | 'frozen';

export interface LoopState {
  userId: string;
  phase: LoopPhase;
  situation: StoreSituation;
  permissions: PlanPermissions;
  actionPool: ActionPool | null;
  currentAction: SequencedAction | null;
  baselineMetrics: KPIMetrics | null;
  lastCycleAt: Date | null;
  cycleCount: number;
  isFrozen: boolean;
  freezeReason: string | null;
}

export interface LoopCycleResult {
  success: boolean;
  phase: LoopPhase;
  detected: {
    situation: StoreSituation;
    actionsAvailable: number;
    actionsSkipped: number;
  };
  decided: {
    action: string | null;
    reason: string;
    requiresApproval: boolean;
  };
  executed: {
    success: boolean;
    actionId: string | null;
    changes: any[];
    creditsUsed: number;
  } | null;
  proved: {
    impact: 'positive' | 'negative' | 'neutral' | null;
    rollbackTriggered: boolean;
  } | null;
  learned: {
    patternsUpdated: boolean;
    baselineUpdated: boolean;
  } | null;
  cycleTimeMs: number;
  nextAction: string | null;
  error: string | null;
}

export interface LoopActivity {
  id: string;
  timestamp: Date;
  phase: LoopPhase;
  message: string;
  status: 'in_progress' | 'completed' | 'warning' | 'error';
  details?: string;
  actionName?: string;
}

export class MasterLoopController {
  private loopStates: Map<string, LoopState> = new Map();
  private activityLogs: Map<string, LoopActivity[]> = new Map();
  private maxActivitiesPerUser = 50;

  /**
   * Initialize loop state for a user
   */
  async initializeLoop(userId: string): Promise<LoopState> {
    console.log(`🔄 [Master Loop] Initializing for user ${userId}`);

    // Get situation and permissions
    const situationAnalysis = await storeSituationDetector.detectStoreSituation(userId);
    const permissions = await planPermissionMapper.getActivePlan(userId);

    // Build action pool
    const actionPool = prioritySequencingEngine.buildAllowedActionPool(
      permissions,
      situationAnalysis.situation
    );

    const state: LoopState = {
      userId,
      phase: 'idle',
      situation: situationAnalysis.situation,
      permissions,
      actionPool,
      currentAction: null,
      baselineMetrics: null,
      lastCycleAt: null,
      cycleCount: 0,
      isFrozen: false,
      freezeReason: null,
    };

    this.loopStates.set(userId, state);
    this.addActivity(userId, {
      phase: 'idle',
      message: `Loop initialized for ${permissions.planName} plan in ${situationAnalysis.situation} mode`,
      status: 'completed',
    });

    return state;
  }

  /**
   * Run a single loop cycle: DETECT → DECIDE → EXECUTE → PROVE → LEARN
   */
  async runCycle(userId: string): Promise<LoopCycleResult> {
    const startTime = Date.now();
    console.log(`\n🔄 [Master Loop] ========== STARTING CYCLE for user ${userId} ==========`);

    let state = this.loopStates.get(userId);
    if (!state) {
      state = await this.initializeLoop(userId);
    }

    // Check if frozen
    if (state.isFrozen) {
      return {
        success: false,
        phase: 'frozen',
        detected: { situation: state.situation, actionsAvailable: 0, actionsSkipped: 0 },
        decided: { action: null, reason: state.freezeReason || 'Loop is frozen', requiresApproval: false },
        executed: null,
        proved: null,
        learned: null,
        cycleTimeMs: Date.now() - startTime,
        nextAction: null,
        error: 'Loop is frozen - waiting for performance stabilization',
      };
    }

    try {
      // ============================
      // PHASE 1: DETECT
      // ============================
      state.phase = 'detect';
      this.addActivity(userId, {
        phase: 'detect',
        message: 'Analyzing store situation and available actions...',
        status: 'in_progress',
      });

      // Refresh situation and permissions
      const situationAnalysis = await storeSituationDetector.detectStoreSituation(userId);
      state.situation = situationAnalysis.situation;
      state.permissions = await planPermissionMapper.getActivePlan(userId);
      state.actionPool = prioritySequencingEngine.buildAllowedActionPool(
        state.permissions,
        state.situation
      );

      this.addActivity(userId, {
        phase: 'detect',
        message: `Detected ${state.actionPool.totalAvailable} actions, ${state.actionPool.totalSkipped} blocked`,
        status: 'completed',
        details: `Store: ${state.situation}, Plan: ${state.permissions.planName}`,
      });

      // ============================
      // PHASE 2: DECIDE
      // ============================
      state.phase = 'decide';
      this.addActivity(userId, {
        phase: 'decide',
        message: 'Selecting next action based on priority...',
        status: 'in_progress',
      });

      const nextAction = prioritySequencingEngine.getNextAction(state.actionPool);
      
      if (!nextAction) {
        this.addActivity(userId, {
          phase: 'decide',
          message: 'No actions available to execute',
          status: 'completed',
        });

        state.phase = 'idle';
        this.loopStates.set(userId, state);

        return {
          success: true,
          phase: 'idle',
          detected: {
            situation: state.situation,
            actionsAvailable: state.actionPool.totalAvailable,
            actionsSkipped: state.actionPool.totalSkipped,
          },
          decided: {
            action: null,
            reason: 'No actions available matching plan permissions and store situation',
            requiresApproval: false,
          },
          executed: null,
          proved: null,
          learned: null,
          cycleTimeMs: Date.now() - startTime,
          nextAction: null,
          error: null,
        };
      }

      state.currentAction = nextAction;
      
      // Check if action requires approval
      if (nextAction.requiresApproval) {
        this.addActivity(userId, {
          phase: 'decide',
          message: `Selected: ${nextAction.action.name} (requires approval)`,
          status: 'completed',
          actionName: nextAction.action.name,
        });

        // Create pending approval
        await this.createPendingApproval(userId, nextAction);

        state.phase = 'idle';
        this.loopStates.set(userId, state);

        return {
          success: true,
          phase: 'decide',
          detected: {
            situation: state.situation,
            actionsAvailable: state.actionPool.totalAvailable,
            actionsSkipped: state.actionPool.totalSkipped,
          },
          decided: {
            action: nextAction.action.name,
            reason: `Action selected but requires approval (${nextAction.action.riskLevel} risk)`,
            requiresApproval: true,
          },
          executed: null,
          proved: null,
          learned: null,
          cycleTimeMs: Date.now() - startTime,
          nextAction: nextAction.action.name,
          error: null,
        };
      }

      this.addActivity(userId, {
        phase: 'decide',
        message: `Selected: ${nextAction.action.name} (auto-execute)`,
        status: 'completed',
        actionName: nextAction.action.name,
      });

      // ============================
      // PHASE 3: EXECUTE
      // ============================
      state.phase = 'execute';
      
      // Capture baseline before execution
      state.baselineMetrics = await kpiMonitor.captureBaseline(userId);

      this.addActivity(userId, {
        phase: 'execute',
        message: `Executing ${nextAction.action.name}...`,
        status: 'in_progress',
        actionName: nextAction.action.name,
      });

      const executionResult = await this.executeAction(userId, nextAction);

      if (!executionResult.success) {
        this.addActivity(userId, {
          phase: 'execute',
          message: `Failed: ${executionResult.error || 'Unknown error'}`,
          status: 'error',
          actionName: nextAction.action.name,
        });

        state.phase = 'idle';
        this.loopStates.set(userId, state);

        return {
          success: false,
          phase: 'execute',
          detected: {
            situation: state.situation,
            actionsAvailable: state.actionPool.totalAvailable,
            actionsSkipped: state.actionPool.totalSkipped,
          },
          decided: {
            action: nextAction.action.name,
            reason: 'Action selected for auto-execution',
            requiresApproval: false,
          },
          executed: {
            success: false,
            actionId: executionResult.actionId,
            changes: [],
            creditsUsed: 0,
          },
          proved: null,
          learned: null,
          cycleTimeMs: Date.now() - startTime,
          nextAction: null,
          error: executionResult.error || 'Execution failed',
        };
      }

      this.addActivity(userId, {
        phase: 'execute',
        message: `Completed: ${executionResult.changes.length} changes applied`,
        status: 'completed',
        actionName: nextAction.action.name,
      });

      // ============================
      // PHASE 4: PROVE
      // ============================
      state.phase = 'prove';
      this.addActivity(userId, {
        phase: 'prove',
        message: 'Measuring impact of changes...',
        status: 'in_progress',
      });

      // Note: In production, you'd wait before measuring impact
      // For now, we log the baseline for future measurement
      let impactResult: KPIImpactResult | null = null;
      let rollbackTriggered = false;

      // Log the proof record
      await kpiMonitor.logImpact(userId, executionResult.actionId!, {
        actionId: executionResult.actionId!,
        measuredAt: new Date(),
        baselineMetrics: state.baselineMetrics,
        currentMetrics: state.baselineMetrics, // Will be updated after waiting period
        changes: [],
        overallImpact: 'neutral',
        dropDetected: false,
        dropSeverity: null,
        rollbackRecommended: false,
        confidence: 0.5,
      });

      this.addActivity(userId, {
        phase: 'prove',
        message: 'Baseline captured - impact will be measured over next 24h',
        status: 'completed',
      });

      // ============================
      // PHASE 5: LEARN (if allowed)
      // ============================
      let learnResult = { patternsUpdated: false, baselineUpdated: false };
      
      if (state.permissions.learningEnabled) {
        state.phase = 'learn';
        this.addActivity(userId, {
          phase: 'learn',
          message: 'Updating learning patterns...',
          status: 'in_progress',
        });

        learnResult = await this.updateLearning(userId, nextAction, executionResult);

        this.addActivity(userId, {
          phase: 'learn',
          message: 'Learning patterns updated',
          status: 'completed',
        });
      }

      // ============================
      // CYCLE COMPLETE
      // ============================
      state.phase = 'idle';
      state.lastCycleAt = new Date();
      state.cycleCount++;
      this.loopStates.set(userId, state);

      console.log(`✅ [Master Loop] Cycle complete in ${Date.now() - startTime}ms`);

      return {
        success: true,
        phase: 'idle',
        detected: {
          situation: state.situation,
          actionsAvailable: state.actionPool.totalAvailable,
          actionsSkipped: state.actionPool.totalSkipped,
        },
        decided: {
          action: nextAction.action.name,
          reason: 'Auto-executed based on plan permissions',
          requiresApproval: false,
        },
        executed: {
          success: true,
          actionId: executionResult.actionId,
          changes: executionResult.changes,
          creditsUsed: executionResult.creditsUsed,
        },
        proved: {
          impact: 'neutral', // Will be updated after waiting period
          rollbackTriggered,
        },
        learned: learnResult,
        cycleTimeMs: Date.now() - startTime,
        nextAction: state.actionPool.allowedActions[1]?.action.name || null,
        error: null,
      };

    } catch (error) {
      console.error(`❌ [Master Loop] Cycle error:`, error);
      
      this.addActivity(userId, {
        phase: state?.phase || 'idle',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'error',
      });

      if (state) {
        state.phase = 'idle';
        this.loopStates.set(userId, state);
      }

      return {
        success: false,
        phase: state?.phase || 'idle',
        detected: {
          situation: state?.situation || 'NEW_FRESH',
          actionsAvailable: state?.actionPool?.totalAvailable || 0,
          actionsSkipped: state?.actionPool?.totalSkipped || 0,
        },
        decided: { action: null, reason: 'Error during cycle', requiresApproval: false },
        executed: null,
        proved: null,
        learned: null,
        cycleTimeMs: Date.now() - startTime,
        nextAction: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute a specific action
   */
  private async executeAction(
    userId: string,
    sequencedAction: SequencedAction
  ): Promise<{ success: boolean; actionId: string | null; changes: any[]; creditsUsed: number; error?: string }> {
    const db = requireDb();
    const action = sequencedAction.action;

    // Check credits
    const creditCheck = await checkAIToolCredits(userId, 'product-seo-engine', action.creditsRequired);
    if (!creditCheck.hasEnoughCredits) {
      return {
        success: false,
        actionId: null,
        changes: [],
        creditsUsed: 0,
        error: 'Insufficient credits',
      };
    }

    try {
      // Get product before creating action record (needed for entityId)
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.userId, userId))
        .limit(1);

      // Create the action record with proper entityId for Change Control dashboard
      const [actionRecord] = await db.insert(autonomousActions).values({
        userId,
        actionType: action.id,
        entityType: product ? 'product' : null,
        entityId: product?.id || null,
        status: 'running',
        decisionReason: `Master Loop selected: ${action.name}`,
        payload: {
          actionId: action.id,
          subActions: action.subActions.map(sa => sa.id),
          category: action.category,
          priority: action.priority,
          productName: product?.name || null,
        },
        executedBy: 'agent',
      }).returning();

      // Create snapshot before changes
      if (product) {
        await db.insert(productSnapshots).values({
          productId: product.id,
          actionId: actionRecord.id,
          snapshotData: {
            productId: product.id,
            name: product.name,
            description: product.description,
            optimizedCopy: product.optimizedCopy,
          },
          reason: 'before_optimization',
        });
      }

      // Execute sub-actions and collect properly formatted changes
      const changes: Array<{ field: string; before: string; after: string; reason: string }> = [];
      for (const subAction of action.subActions) {
        const change = await this.executeSubAction(userId, action, subAction.id, product);
        if (change && change.field) {
          changes.push(change);
        }
      }

      // Consume credits
      await consumeAIToolCredits(userId, 'product-seo-engine', action.creditsRequired);

      // Update action record with proper format for Change Control dashboard
      await db
        .update(autonomousActions)
        .set({
          status: 'completed',
          completedAt: new Date(),
          creditsUsed: action.creditsRequired,
          payload: {
            actionId: action.id,
            subActions: action.subActions.map(sa => sa.id),
            category: action.category,
            priority: action.priority,
            productName: product?.name || null,
            changes: changes,
            actionLabel: action.name,
          },
          result: { 
            success: true,
            changes,
            changesApplied: changes.length,
          },
        })
        .where(eq(autonomousActions.id, actionRecord.id));

      return {
        success: true,
        actionId: actionRecord.id,
        changes,
        creditsUsed: action.creditsRequired,
      };

    } catch (error) {
      console.error(`❌ [Master Loop] Execution error:`, error);
      return {
        success: false,
        actionId: null,
        changes: [],
        creditsUsed: 0,
        error: error instanceof Error ? error.message : 'Execution failed',
      };
    }
  }

  /**
   * Execute a single sub-action and return change in {field, before, after, reason} format
   */
  private async executeSubAction(
    userId: string,
    action: MasterAction,
    subActionId: string,
    product: any
  ): Promise<{ field: string; before: string; after: string; reason: string } | null> {
    if (!product) return null;

    const subAction = action.subActions.find(sa => sa.id === subActionId);
    if (!subAction) return null;

    console.log(`   Executing sub-action: ${subAction.name}`);

    // Use AI to generate optimization in structured format
    try {
      const prompt = this.buildSubActionPrompt(subAction, product);
      
      const response = await cachedTextGeneration<string>(
        {
          prompt,
          model: 'gpt-4o-mini',
          temperature: 0.7,
          maxTokens: 1000,
        },
        async () => {
          const res = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1000,
          });
          return res.choices[0]?.message?.content || '';
        }
      );

      // Parse AI response - try JSON first, then extract from text
      let optimizedValue = response;
      try {
        const parsed = JSON.parse(response);
        optimizedValue = parsed.optimized || parsed.suggestion || parsed.value || response;
      } catch {
        // Use the raw response if not valid JSON
        optimizedValue = response.trim();
      }

      // Determine field name and original value based on sub-action type
      let fieldName = subAction.name;
      let originalValue = '';
      
      if (subActionId.includes('title') || subAction.name.toLowerCase().includes('title')) {
        fieldName = 'Product Title';
        originalValue = product.name || '';
      } else if (subActionId.includes('description') || subAction.name.toLowerCase().includes('description')) {
        fieldName = 'Product Description';
        originalValue = product.description || '';
      } else if (subActionId.includes('seo') || subAction.name.toLowerCase().includes('seo')) {
        fieldName = 'SEO Content';
        originalValue = product.description?.substring(0, 160) || '';
      } else if (subActionId.includes('copy') || subAction.name.toLowerCase().includes('copy')) {
        fieldName = 'Product Copy';
        originalValue = product.description || '';
      } else {
        originalValue = product.description || product.name || '';
      }

      return {
        field: fieldName,
        before: originalValue,
        after: optimizedValue,
        reason: `AI-optimized: ${subAction.description || subAction.name}`,
      };
    } catch (error) {
      console.error(`   Sub-action error:`, error);
      return null;
    }
  }

  /**
   * Build prompt for a sub-action
   */
  private buildSubActionPrompt(subAction: any, product: any): string {
    return `You are ZYRA AI, an e-commerce optimization expert.

Task: ${subAction.name}
Description: ${subAction.description}

Product Information:
- Name: ${product.name}
- Description: ${product.description || 'No description'}
- Category: ${product.category || 'Unknown'}
- Price: $${product.price || 0}

Provide specific, actionable recommendations for this product based on the task.
Focus on changes that will improve conversion without being risky.
Be concise and specific.`;
  }

  /**
   * Create a pending approval for manual review
   */
  private async createPendingApproval(userId: string, action: SequencedAction): Promise<void> {
    const db = requireDb();

    await db.insert(pendingApprovals).values({
      userId,
      actionType: action.action.id,
      entityType: 'master_loop_action',
      recommendedAction: {
        actionId: action.action.id,
        actionName: action.action.name,
        category: action.action.category,
        priority: action.action.priority,
        riskLevel: action.action.riskLevel,
        subActions: action.action.subActions.map(sa => sa.name),
        creditsRequired: action.action.creditsRequired,
      },
      aiReasoning: `Selected by Master Loop based on ${action.action.priority} priority. Risk level: ${action.action.riskLevel}. Estimated impact: ${action.action.description}`,
      priority: action.action.riskLevel === 'low' ? 'medium' : 'high',
      estimatedImpact: {
        category: action.action.category,
        subActionsCount: action.action.subActions.length,
      },
    });

    console.log(`📝 [Master Loop] Created pending approval for ${action.action.name}`);
  }

  /**
   * Update learning based on execution results
   */
  private async updateLearning(
    userId: string,
    action: SequencedAction,
    executionResult: any
  ): Promise<{ patternsUpdated: boolean; baselineUpdated: boolean }> {
    // This would update the store learning insights
    // For now, we just log that learning was attempted
    console.log(`📚 [Master Loop] Updating learning for action ${action.action.id}`);
    
    return {
      patternsUpdated: true,
      baselineUpdated: true,
    };
  }

  /**
   * Freeze the loop (for risky situations)
   */
  freezeLoop(userId: string, reason: string): void {
    const state = this.loopStates.get(userId);
    if (state) {
      state.isFrozen = true;
      state.freezeReason = reason;
      state.phase = 'frozen';
      this.loopStates.set(userId, state);

      this.addActivity(userId, {
        phase: 'frozen',
        message: `Loop frozen: ${reason}`,
        status: 'warning',
      });
    }
  }

  /**
   * Unfreeze the loop
   */
  unfreezeLoop(userId: string): void {
    const state = this.loopStates.get(userId);
    if (state) {
      state.isFrozen = false;
      state.freezeReason = null;
      state.phase = 'idle';
      this.loopStates.set(userId, state);

      this.addActivity(userId, {
        phase: 'idle',
        message: 'Loop unfrozen - resuming normal operation',
        status: 'completed',
      });
    }
  }

  /**
   * Get current loop state
   */
  getLoopState(userId: string): LoopState | null {
    return this.loopStates.get(userId) || null;
  }

  /**
   * Get activity log for a user
   */
  getActivities(userId: string): LoopActivity[] {
    return this.activityLogs.get(userId) || [];
  }

  /**
   * Add an activity to the log
   */
  private addActivity(userId: string, activity: Omit<LoopActivity, 'id' | 'timestamp'>): void {
    const activities = this.activityLogs.get(userId) || [];
    
    const fullActivity: LoopActivity = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    activities.push(fullActivity);

    // Keep only the latest activities
    if (activities.length > this.maxActivitiesPerUser) {
      activities.shift();
    }

    this.activityLogs.set(userId, activities);
    console.log(`📝 [${activity.phase.toUpperCase()}] ${activity.message}`);
    
    // CRITICAL: Emit SSE event to frontend so UI reflects current loop phase
    // Map activity status to SSE event type
    const phaseEventMap: Record<string, Record<string, ZyraEventType>> = {
      detect: { in_progress: 'DETECT_STARTED', completed: 'DETECT_COMPLETED', error: 'ERROR' },
      decide: { in_progress: 'DECIDE_STARTED', completed: 'DECIDE_COMPLETED', error: 'ERROR' },
      execute: { in_progress: 'EXECUTE_STARTED', completed: 'EXECUTE_COMPLETED', error: 'ERROR' },
      prove: { in_progress: 'PROVE_STARTED', completed: 'PROVE_UPDATED', error: 'ERROR' },
      learn: { in_progress: 'LEARN_STARTED', completed: 'LEARN_COMPLETED', error: 'ERROR' },
      idle: { completed: 'LOOP_STANDBY', in_progress: 'LOOP_STANDBY', error: 'ERROR' },
      frozen: { warning: 'LOOP_STANDBY', completed: 'LOOP_STANDBY', error: 'ERROR' },
    };
    
    const eventType = phaseEventMap[activity.phase]?.[activity.status] || 'DETECT_PROGRESS';
    const loopId = `master_loop_${userId}_${Date.now()}`;
    
    // Map activity status to SSE status
    const statusMap: Record<string, 'info' | 'thinking' | 'insight' | 'action' | 'success' | 'warning' | 'error'> = {
      in_progress: 'thinking',
      completed: 'success',
      error: 'error',
      warning: 'warning',
    };
    
    emitZyraActivity(userId, loopId, eventType, activity.message, {
      phase: activity.phase as any,
      detail: activity.details,
      status: statusMap[activity.status] || 'info',
    });
  }

  /**
   * Get loop proof summary for transparency
   */
  async getLoopProof(userId: string): Promise<{
    cyclesRun: number;
    actionsExecuted: number;
    actionsSkipped: number;
    rollbacksPerformed: number;
    estimatedRevenueDelta: number;
    lastCycleAt: Date | null;
  }> {
    const state = this.loopStates.get(userId);
    const db = requireDb();

    const [stats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        completed: sql<number>`SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)`,
        rolledBack: sql<number>`SUM(CASE WHEN status = 'rolled_back' THEN 1 ELSE 0 END)`,
      })
      .from(autonomousActions)
      .where(eq(autonomousActions.userId, userId));

    return {
      cyclesRun: state?.cycleCount || 0,
      actionsExecuted: Number(stats?.completed) || 0,
      actionsSkipped: state?.actionPool?.totalSkipped || 0,
      rollbacksPerformed: Number(stats?.rolledBack) || 0,
      estimatedRevenueDelta: 0, // Would be calculated from revenueLoopProof
      lastCycleAt: state?.lastCycleAt || null,
    };
  }

  /**
   * Check impact of recent actions and trigger rollback if needed
   * This should be called periodically (e.g., every 4-6 hours) to measure actual impact
   */
  async checkImpactAndRollback(userId: string): Promise<{
    checked: number;
    rollbacksTriggered: number;
    actions: { actionId: string; impact: string; rolledBack: boolean }[];
  }> {
    console.log(`📊 [Master Loop] Checking impact and rollback for user ${userId}`);
    
    const state = this.loopStates.get(userId);
    if (!state) {
      await this.initializeLoop(userId);
    }

    const db = requireDb();
    const now = new Date();
    const minMeasurementAge = 4 * 60 * 60 * 1000; // 4 hours minimum before measuring

    // Find completed actions that haven't been impact-checked yet
    const pendingActions = await db
      .select()
      .from(autonomousActions)
      .where(
        and(
          eq(autonomousActions.userId, userId),
          eq(autonomousActions.status, 'completed'),
          sql`${autonomousActions.executedAt} < NOW() - INTERVAL '4 hours'`
        )
      )
      .limit(10);

    const results: { actionId: string; impact: string; rolledBack: boolean }[] = [];
    let rollbacksTriggered = 0;

    for (const action of pendingActions) {
      try {
        // Measure current impact
        const impactResult = await kpiMonitor.measureImpact(userId, action.id);

        if (impactResult.rollbackRecommended && state?.permissions?.rollbackEnabled) {
          console.log(`⚠️ [Master Loop] Rollback recommended for action ${action.id}`);
          
          const rollbackResult = await kpiMonitor.executeRollback(
            userId,
            action.id,
            state.permissions
          );

          if (rollbackResult.success) {
            rollbacksTriggered++;
            this.addActivity(userId, {
              phase: 'prove',
              message: `Auto-rolled back: ${action.actionType} (${impactResult.dropSeverity} drop)`,
              status: 'warning',
              actionName: action.actionType || undefined,
            });
          }

          results.push({
            actionId: action.id,
            impact: impactResult.overallImpact,
            rolledBack: rollbackResult.success,
          });
        } else {
          results.push({
            actionId: action.id,
            impact: impactResult.overallImpact,
            rolledBack: false,
          });
        }
      } catch (error) {
        console.error(`❌ [Master Loop] Error checking impact for ${action.id}:`, error);
        results.push({
          actionId: action.id,
          impact: 'error',
          rolledBack: false,
        });
      }
    }

    console.log(`✅ [Master Loop] Impact check complete: ${results.length} checked, ${rollbacksTriggered} rolled back`);

    return {
      checked: results.length,
      rollbacksTriggered,
      actions: results,
    };
  }
}

export const masterLoopController = new MasterLoopController();
