import { Brain, TrendingUp, Target, Lightbulb, BarChart3, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLearningStats } from '@/hooks/useLearningStats';
import { Skeleton } from '@/components/ui/skeleton';
import { useStoreCurrency } from '@/hooks/use-store-currency';
import { formatCurrency } from '@/lib/utils';

export function ZyraLearningInsights() {
  const { data: stats, isLoading, error } = useLearningStats();
  const { currency } = useStoreCurrency();

  if (isLoading) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50" data-testid="card-learning-insights-loading">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Brain className="w-4 h-4 text-cyan-400" />
            <span>ZYRA Learning</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return null;
  }

  const hasLearning = stats.baselinesCaptured > 0 || stats.patternsLearned > 0;

  if (!hasLearning) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50" data-testid="card-learning-insights-empty">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Brain className="w-4 h-4 text-cyan-400" />
            <span>ZYRA Learning</span>
            <Badge variant="outline" className="text-xs bg-slate-800/50 border-slate-600/50">
              Starting
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-slate-400 space-y-2">
            <Sparkles className="w-8 h-8 mx-auto text-cyan-400/50" />
            <p className="text-sm">
              ZYRA will start learning patterns as you optimize products
            </p>
            <p className="text-xs text-slate-500">
              Run optimizations to see what works best for your store
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const successRateNum = parseFloat(stats.successRate) || 0;
  const totalRevenueLiftNum = parseFloat(stats.totalRevenueLift) || 0;

  return (
    <Card className="bg-slate-900/50 border-slate-700/50" data-testid="card-learning-insights">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Brain className="w-4 h-4 text-cyan-400" />
          <span>ZYRA Learning</span>
          {stats.highConfidencePatterns > 0 && (
            <Badge variant="outline" className="text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
              {stats.highConfidencePatterns} confident pattern{stats.highConfidencePatterns !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-800/30 rounded-lg" data-testid="stat-optimizations">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Target className="w-3 h-3" />
              <span>Optimizations</span>
            </div>
            <div className="text-lg font-semibold text-slate-200">
              {stats.changesEvaluated}
            </div>
            <div className="text-xs text-slate-500">
              {stats.totalChangesRecorded} total recorded
            </div>
          </div>
          
          <div className="p-3 bg-slate-800/30 rounded-lg" data-testid="stat-success-rate">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <TrendingUp className="w-3 h-3" />
              <span>Success Rate</span>
            </div>
            <div className="text-lg font-semibold text-emerald-400">
              {successRateNum.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500">
              {stats.successfulOptimizations} successful
            </div>
          </div>
        </div>

        {totalRevenueLiftNum > 0 && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg" data-testid="stat-revenue-lift">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <BarChart3 className="w-3 h-3" />
                <span>Estimated Revenue Lift</span>
              </div>
              <div className="text-lg font-semibold text-emerald-400">
                +{formatCurrency(totalRevenueLiftNum, currency)}
              </div>
            </div>
          </div>
        )}

        {stats.patternsLearned > 0 && (
          <div className="space-y-2" data-testid="section-learned-patterns">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Lightbulb className="w-3 h-3" />
              <span>What ZYRA has learned ({stats.patternsLearned} patterns)</span>
            </div>
            
            <div className="space-y-2">
              {stats.topPatterns.slice(0, 3).map((pattern, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-between p-2 bg-slate-800/20 rounded-md"
                  data-testid={`pattern-${i}`}
                >
                  <div className="flex items-center gap-2">
                    <PatternTypeIcon type={pattern.type} />
                    <div>
                      <div className="text-xs text-slate-300">{formatPatternName(pattern.name)}</div>
                      <div className="text-[10px] text-slate-500">{pattern.value}</div>
                    </div>
                  </div>
                  {pattern.confidence && (
                    <div className="flex items-center gap-1">
                      <Progress 
                        value={pattern.confidence} 
                        className="w-10 h-1.5" 
                      />
                      <span className="text-[10px] text-slate-500">{pattern.confidence}%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.baselinesCaptured > 0 && stats.patternsLearned === 0 && (
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg" data-testid="stat-baselines">
            <div className="flex items-center gap-2 text-xs text-cyan-400">
              <Brain className="w-3 h-3" />
              <span>Measuring {stats.baselinesCaptured} optimization{stats.baselinesCaptured !== 1 ? 's' : ''}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Results will be available after measurement period (7-14 days)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PatternTypeIcon({ type }: { type: string }) {
  const iconClass = "w-3 h-3";
  
  switch (type) {
    case 'keyword':
      return <Target className={`${iconClass} text-blue-400`} />;
    case 'title_structure':
      return <BarChart3 className={`${iconClass} text-violet-400`} />;
    case 'description_format':
      return <Lightbulb className={`${iconClass} text-amber-400`} />;
    case 'trust_signal':
      return <TrendingUp className={`${iconClass} text-emerald-400`} />;
    default:
      return <Sparkles className={`${iconClass} text-cyan-400`} />;
  }
}

function formatPatternName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}
