import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export type ExecutionMode = "fast" | "competitive_intelligence";
export type ActionCategory = "foundation" | "growth" | "guard";
export type ZyraActionType = string;

interface ActionDetails {
  id: string;
  name: string;
  description: string;
  fastModeCredits: number;
  competitiveCredits: number;
  category: ActionCategory;
}

interface ActionsResponse {
  foundation: ActionDetails[];
  growth: ActionDetails[];
  guard: ActionDetails[];
  totalFoundationFastCredits: number;
  totalFoundationCompetitiveCredits: number;
}

interface CreditCheckResult {
  allowed: boolean;
  isLocked: boolean;
  hasEnoughCredits: boolean;
  creditCost: number;
  creditsRemaining: number;
  creditLimit: number;
  executionMode: ExecutionMode;
  actionDetails: {
    name: string;
    description: string;
    category: ActionCategory;
  };
  message: string;
  warnings: string[];
  requiresConfirmation: boolean;
  confirmationMessage?: string;
}

interface ExecuteActionResult {
  success: boolean;
  creditsConsumed: number;
  lockId?: string;
  message: string;
  newBalance: number;
}

interface CreditCostPreview {
  actionType: string;
  name: string;
  description: string;
  category: ActionCategory;
  fastModeCredits: number;
  competitiveCredits: number;
  selectedModeCredits: number;
  savings: number;
  modeRecommendation: ExecutionMode | "either";
  modeRecommendationReason: string;
  baseCost: number;
  modeName: string;
  modeMultiplier: string;
  breakdown: string[];
}

interface LockStatus {
  isLocked: boolean;
  lockId?: string;
  lockedAt?: string;
  executionMode?: string;
  creditsConsumed?: number;
  message: string;
  canReExecute: boolean;
  reExecuteReason?: string;
}

interface CIUsage {
  count: number;
  creditsConsumed: number;
  allowed: boolean;
  currentCount: number;
  maxAllowed: number | null;
  message?: string;
}

interface PlanAccess {
  planId: string;
  planName: string;
  creditLimit: number;
  fastModeAccess: string;
  competitiveIntelligenceAccess: string;
  maxCompetitiveActionsPerMonth: number | null;
  maxCompetitiveActionsPerCycle: number | null;
  guardActionsAllowed: boolean;
  requiresUserApproval: boolean;
  autoRecommendCompetitive: boolean;
}

export function useAvailableActions() {
  return useQuery<ActionsResponse>({
    queryKey: ["/api/mode-credits/actions"],
    staleTime: 60 * 60 * 1000, // 1 hour - actions don't change often
  });
}

export function useCreditCostPreview(actionType: string, mode: ExecutionMode) {
  return useQuery<CreditCostPreview>({
    queryKey: ["/api/mode-credits/preview", actionType, { mode }],
    enabled: !!actionType,
    staleTime: 60 * 60 * 1000,
  });
}

export function useCheckCredits() {
  return useMutation<CreditCheckResult, Error, {
    actionType: string;
    mode: ExecutionMode;
    entityType: string;
    entityId: string;
  }>({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/mode-credits/check", data);
      return response.json();
    },
  });
}

export function useExecuteAction() {
  return useMutation<ExecuteActionResult, Error, {
    actionType: string;
    mode: ExecutionMode;
    entityType: string;
    entityId: string;
    entityContent?: Record<string, any>;
    userConfirmed?: boolean;
  }>({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/mode-credits/execute", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credits/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mode-credits/ci-usage"] });
    },
  });
}

export function useLockStatus(
  entityType: string,
  entityId: string,
  actionType: string,
  enabled: boolean = true
) {
  return useQuery<LockStatus>({
    queryKey: ["/api/mode-credits/lock-status", { entityType, entityId, actionType }],
    enabled: enabled && !!entityType && !!entityId && !!actionType,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useEntityHistory(entityType: string, entityId: string) {
  return useQuery<{ history: Array<{
    actionType: string;
    actionCategory: string;
    executionMode: string;
    creditsConsumed: number;
    status: string;
    lockedAt: string | null;
    verificationResult: string | null;
  }> }>({
    queryKey: ["/api/mode-credits/entity-history", { entityType, entityId }],
    enabled: !!entityType && !!entityId,
  });
}

export function useCIUsage() {
  return useQuery<CIUsage>({
    queryKey: ["/api/mode-credits/ci-usage"],
    staleTime: 60 * 1000, // 1 minute
  });
}

export function usePlanAccess() {
  return useQuery<PlanAccess>({
    queryKey: ["/api/mode-credits/plan-access"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBulkLockCheck() {
  return useMutation<{
    results: Record<string, LockStatus>;
    lockedCount: number;
    unlockedCount: number;
  }, Error, {
    entityType: string;
    entityIds: string[];
    actionType: string;
  }>({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/mode-credits/bulk-lock-check", data);
      return response.json();
    },
  });
}

export function useReportMaterialChange() {
  return useMutation<{
    hasChange: boolean;
    locksUnlocked: number;
  }, Error, {
    entityType: string;
    entityId: string;
    newContentHash: string;
    changeType: string;
  }>({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/mode-credits/material-change", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mode-credits/lock-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mode-credits/entity-history"] });
    },
  });
}

export function useCycleEstimate(mode: ExecutionMode = "fast") {
  return useQuery<{
    selectedMode: ExecutionMode;
    fastModeCycles: Record<string, number>;
    competitiveModeCycles: Record<string, number>;
    cycleCredits: {
      foundationCredits: number;
      growthCredits: number;
      totalCredits: number;
      actions: Array<{ name: string; credits: number }>;
    };
    plans: Array<{
      id: string;
      name: string;
      credits: number;
      fastModeCycles: number;
      competitiveModeCycles: number;
    }>;
  }>({
    queryKey: ["/api/mode-credits/cycle-estimate", { mode }],
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
