/**
 * React hooks for interacting with the ZYRA Master Loop API
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface LoopState {
  phase: string;
  situation: string;
  plan: string;
  permissions: {
    foundation: string;
    growth: string;
    guard: string;
  };
  actionsAvailable: number;
  actionsSkipped: number;
  nextAction: string | null;
  isFrozen: boolean;
  freezeReason: string | null;
  cycleCount: number;
  lastCycleAt: string | null;
}

export interface LoopCycle {
  phase: string;
  detected: {
    situation: string;
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
    impact: string | null;
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

export interface SituationAnalysis {
  classification: string;
  storeAgeInDays: number;
  totalOrders: number;
  monthlyTraffic: number;
  monthlyRevenue: number;
  revenueStability: number;
  dataAvailabilityScore: number;
  confidenceLevel: string;
  reason: string;
  detectedAt: string;
}

export interface ActionInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: string;
  riskLevel: string;
  sequenceOrder: number;
  permissionLevel: string;
  canAutoExecute: boolean;
  requiresApproval: boolean;
  subActionsCount: number;
  creditsRequired: number;
}

export interface LoopActivity {
  id: string;
  timestamp: string;
  phase: string;
  message: string;
  status: string;
  details?: string;
  actionName?: string;
}

export interface LoopProof {
  cyclesRun: number;
  actionsExecuted: number;
  actionsSkipped: number;
  rollbacksPerformed: number;
  estimatedRevenueDelta: number;
  lastCycleAt: string | null;
}

export interface KPIBaseline {
  conversionRate: number;
  revenue: number;
  cartAbandonmentRate: number;
  bounceRate: number;
  averageOrderValue: number;
  timestamp: string;
}

export function useMasterLoopState() {
  return useQuery<{ success: boolean; state: LoopState }>({
    queryKey: ["/api/master-loop/state"],
    refetchInterval: 10000,
  });
}

export function useMasterLoopSituation() {
  return useQuery<{ success: boolean; situation: SituationAnalysis }>({
    queryKey: ["/api/master-loop/situation"],
  });
}

export function useMasterLoopPermissions() {
  return useQuery<{ success: boolean; permissions: any; situationApplied: string }>({
    queryKey: ["/api/master-loop/permissions"],
  });
}

export function useMasterLoopActions() {
  return useQuery<{ success: boolean; actions: { allowed: ActionInfo[]; skipped: any[]; nextAction: any; summary: any } }>({
    queryKey: ["/api/master-loop/actions"],
  });
}

export function useMasterLoopActivities() {
  return useQuery<{ success: boolean; activities: LoopActivity[] }>({
    queryKey: ["/api/master-loop/activities"],
    refetchInterval: 5000,
  });
}

export function useMasterLoopProof() {
  return useQuery<{ success: boolean; proof: LoopProof }>({
    queryKey: ["/api/master-loop/proof"],
  });
}

export function useMasterLoopKPIBaseline() {
  return useQuery<{ success: boolean; baseline: KPIBaseline }>({
    queryKey: ["/api/master-loop/kpi-baseline"],
  });
}

export function useMasterLoopRunCycle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/master-loop/run-cycle");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/master-loop/state"] });
      queryClient.invalidateQueries({ queryKey: ["/api/master-loop/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/master-loop/proof"] });
      queryClient.invalidateQueries({ queryKey: ["/api/master-loop/actions"] });
    },
  });
}

export function useMasterLoopFreeze() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (reason: string) => {
      const response = await apiRequest("POST", "/api/master-loop/freeze", { reason });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/master-loop/state"] });
    },
  });
}

export function useMasterLoopUnfreeze() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/master-loop/unfreeze");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/master-loop/state"] });
    },
  });
}

export function useMasterLoopRefreshSituation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/master-loop/refresh-situation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/master-loop/situation"] });
      queryClient.invalidateQueries({ queryKey: ["/api/master-loop/state"] });
      queryClient.invalidateQueries({ queryKey: ["/api/master-loop/actions"] });
    },
  });
}
