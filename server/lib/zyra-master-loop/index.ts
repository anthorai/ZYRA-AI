/**
 * ZYRA MASTER LOOP MODULE
 * 
 * Central export for all Master Loop components.
 * 
 * The Master Loop is ZYRA's autonomous optimization engine:
 * DETECT → DECIDE → EXECUTE → PROVE → LEARN → repeat
 */

// Store Situation Detection
export { 
  storeSituationDetector,
  type StoreSituation,
  type StoreSituationAnalysis,
} from './store-situation-detector';

// Plan Permission Mapping
export {
  planPermissionMapper,
  type MasterLoopPlan,
  type ActionCategory,
  type PermissionLevel,
  type PlanPermissions,
  type ActionPermissionCheck,
} from './plan-permission-mapper';

// Master Action Registry
export {
  masterActionRegistry,
  ALL_ACTIONS,
  ACTION_MAP,
  ACTIONS_BY_CATEGORY,
  ACTIONS_BY_PRIORITY,
  type ActionId,
  type RiskLevel,
  type ExecutionPriority,
  type SubAction,
  type MasterAction,
} from './master-action-registry';

// Priority & Sequencing Engine
export {
  prioritySequencingEngine,
  type SequencedAction,
  type ActionPool,
} from './priority-sequencing-engine';

// KPI Monitor
export {
  kpiMonitor,
  type KPIMetrics,
  type KPIChange,
  type KPIImpactResult,
  type RollbackResult,
} from './kpi-monitor';

// Master Loop Controller
export {
  masterLoopController,
  type LoopPhase,
  type LoopState,
  type LoopCycleResult,
  type LoopActivity,
} from './master-loop-controller';
