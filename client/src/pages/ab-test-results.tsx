import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UnifiedHeader } from "@/components/ui/unified-header";
import { DashboardCard, MetricCard } from "@/components/ui/dashboard-card";
import { PageShell } from "@/components/ui/page-shell";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { AbTest } from "@shared/schema";
import { 
  Zap, 
  TrendingUp, 
  Award,
  Target,
  Users,
  MousePointer,
  Eye,
  BarChart3,
  Trophy,
  Activity,
  Beaker,
  AlertCircle,
  RefreshCw
} from "lucide-react";

export default function ABTestResults() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch AB tests from API
  const { data: abTests = [], isLoading, error, isError } = useQuery<AbTest[]>({
    queryKey: ['/api/ab-tests'],
  });

  // Show toast notification when errors occur
  useEffect(() => {
    if (isError && error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load A/B tests",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/20 text-green-400";
      case "running": return "bg-blue-500/20 text-blue-400";
      case "draft": return "bg-slate-500/20 text-slate-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getSignificanceColor = (significance: number | string | null) => {
    const sig = typeof significance === 'string' ? parseFloat(significance) : (significance || 0);
    if (sig >= 95) return "bg-green-500/20 text-green-400";
    if (sig >= 80) return "bg-yellow-500/20 text-yellow-400";
    return "bg-red-500/20 text-red-400";
  };

  // Calculate metrics with error guards
  const totalTests = isError ? 0 : abTests.length;
  const completedTests = isError ? 0 : abTests.filter(test => test.status === "completed").length;
  const avgImprovement = (isError || completedTests === 0)
    ? "0.0" 
    : (abTests.filter(test => test.status === "completed").reduce((sum, test) => {
        const imp = typeof test.improvement === 'string' ? parseFloat(test.improvement) : (test.improvement || 0);
        return sum + imp;
      }, 0) / completedTests).toFixed(1);
  const totalParticipants = isError ? 0 : abTests.reduce((sum, test) => sum + (test.participants || 0), 0);

  // Error State
  if (isError) {
    return (
      <PageShell
        title="A/B Test Results"
        subtitle="Compare different versions and track which optimizations perform better"
      >
        <DashboardCard testId="error-state">
          <div className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Failed to Load A/B Tests</h3>
            <p className="text-red-400 mb-4">Please try again.</p>
            <Button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/ab-tests'] })}
              className="gradient-button"
              data-testid="button-retry"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </DashboardCard>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="A/B Test Results"
      subtitle="Compare different versions and track which optimizations perform better"
    >
      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="shadow-lg border border-slate-700/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full flex-shrink-0" />
                <div className="space-y-2 min-w-0 flex-1">
                  <Skeleton className="h-4 sm:h-5 md:h-6 w-12 sm:w-14 md:w-16" />
                  <Skeleton className="h-3 sm:h-3.5 md:h-4 w-16 sm:w-18 md:w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <MetricCard
            icon={<Activity className="w-6 h-6" />}
            title="Total Tests"
            value={totalTests}
            testId="card-total-tests"
          />
          <MetricCard
            icon={<Trophy className="w-6 h-6" />}
            title="Completed"
            value={completedTests}
            testId="card-completed-tests"
          />
          <MetricCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Avg Improvement"
            value={`+${avgImprovement}%`}
            testId="card-avg-improvement"
          />
          <MetricCard
            icon={<Users className="w-6 h-6" />}
            title="Participants"
            value={`${(totalParticipants / 1000).toFixed(1)}K`}
            testId="card-total-participants"
          />
        </div>
      )}

      {/* A/B Test Results */}
      <DashboardCard
        title="A/B Test Performance"
        description="Compare different versions and track which optimizations perform better"
      >
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-800/30 rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-64" />
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Skeleton className="h-9 w-20" />
                      <Skeleton className="h-9 w-24" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <Skeleton className="h-32 w-full rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : abTests.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 rounded-full bg-slate-800/50">
                  <Beaker className="w-12 h-12 text-slate-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-white text-lg font-semibold" data-testid="text-empty-state-title">No A/B Tests Yet</h3>
                  <p className="text-slate-400 max-w-md" data-testid="text-empty-state-description">
                    Start running A/B tests to compare different versions of your content and optimize performance.
                  </p>
                </div>
                <Button className="gradient-button mt-4" data-testid="button-create-test">
                  <Target className="w-4 h-4 mr-2" />
                  Create Your First Test
                </Button>
              </div>
            </div>
          ) : (
            abTests.map((test) => {
              const variantA = test.variantAData as any;
              const variantB = test.variantBData as any;
              const significance = typeof test.significance === 'string' ? parseFloat(test.significance) : (test.significance || 0);
              const improvement = typeof test.improvement === 'string' ? parseFloat(test.improvement) : (test.improvement || 0);

              return (
                <div key={test.id} className="bg-slate-800/30 rounded-lg p-4 space-y-4" data-testid={`card-test-${test.id}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white font-semibold text-lg" data-testid={`text-test-name-${test.id}`}>{test.testName}</h3>
                      <div className="flex items-center space-x-3 mt-2">
                        <Badge variant="secondary" className={getStatusColor(test.status)} data-testid={`badge-status-${test.id}`}>
                          {test.status}
                        </Badge>
                        {significance > 0 && (
                          <Badge variant="secondary" className={getSignificanceColor(significance)} data-testid={`badge-significance-${test.id}`}>
                            {significance}% significance
                          </Badge>
                        )}
                        <span className="text-slate-400 text-sm" data-testid={`text-test-meta-${test.id}`}>
                          {test.duration} days • {(test.participants || 0).toLocaleString()} participants
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-white/10" data-testid={`button-details-${test.id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        Details
                      </Button>
                      <Button size="sm" className="gradient-button" data-testid={`button-analyze-${test.id}`}>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analyze
                      </Button>
                    </div>
                  </div>

                  {variantA && variantB && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className={`bg-slate-900/50 p-4 rounded-lg ${test.winner === 'A' ? 'border border-yellow-500/30' : ''}`} data-testid={`variant-a-${test.id}`}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-slate-300 font-medium">Variant A: {variantA.name}</h4>
                          {test.winner === 'A' && (
                            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                              <Award className="w-3 h-3 mr-1" />
                              Winner
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-slate-400">Visitors</p>
                            <p className="text-white font-semibold" data-testid={`text-variant-a-visitors-${test.id}`}>{(variantA.visitors || 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Conversions</p>
                            <p className="text-white font-semibold" data-testid={`text-variant-a-conversions-${test.id}`}>{variantA.conversions || 0}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Conv. Rate</p>
                            <p className="text-white font-semibold" data-testid={`text-variant-a-rate-${test.id}`}>{variantA.conversionRate || 0}%</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Revenue</p>
                            <p className="text-white font-semibold" data-testid={`text-variant-a-revenue-${test.id}`}>${(variantA.revenue || 0).toFixed(0)}</p>
                          </div>
                        </div>
                      </div>

                      <div className={`bg-slate-900/50 p-4 rounded-lg ${test.winner === 'B' ? 'border border-yellow-500/30' : ''}`} data-testid={`variant-b-${test.id}`}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-slate-300 font-medium">Variant B: {variantB.name}</h4>
                          {test.winner === 'B' && (
                            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                              <Award className="w-3 h-3 mr-1" />
                              Winner
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-slate-400">Visitors</p>
                            <p className="text-white font-semibold" data-testid={`text-variant-b-visitors-${test.id}`}>{(variantB.visitors || 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Conversions</p>
                            <p className="text-white font-semibold" data-testid={`text-variant-b-conversions-${test.id}`}>{variantB.conversions || 0}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Conv. Rate</p>
                            <p className="text-white font-semibold" data-testid={`text-variant-b-rate-${test.id}`}>{variantB.conversionRate || 0}%</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Revenue</p>
                            <p className="text-white font-semibold" data-testid={`text-variant-b-revenue-${test.id}`}>${(variantB.revenue || 0).toFixed(0)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {test.status === 'completed' && improvement > 0 && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3" data-testid={`result-summary-${test.id}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-green-400 font-medium">
                          Variant {test.winner} won with {improvement}% improvement
                        </span>
                        <span className="text-green-400 text-sm">
                          {significance}% statistical significance
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DashboardCard>
    </PageShell>
  );
}
