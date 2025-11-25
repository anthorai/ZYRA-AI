import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard, MetricCard } from "@/components/ui/dashboard-card";
import { useToast } from "@/hooks/use-toast";
import { 
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  CheckCircle2,
  Code,
  FileText,
  Gauge,
  Info,
  Lightbulb,
  Minus,
  RefreshCw,
  Search,
  Target,
  TrendingUp,
  Zap,
  XCircle
} from "lucide-react";

interface SEOHealthScore {
  overall: number;
  categories: {
    meta: number;
    content: number;
    technical: number;
    schema: number;
  };
  trend: 'up' | 'down' | 'stable';
  previousScore: number;
}

interface SEOIssue {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  description: string;
  affectedProducts: number;
  impact: string;
  fixSuggestion: string;
  priority: number;
}

interface ProductSEOAudit {
  productId: string;
  productName: string;
  score: number;
  issues: {
    type: 'critical' | 'warning' | 'info';
    message: string;
    field: string;
  }[];
  hasMetaTitle: boolean;
  hasMetaDescription: boolean;
  hasAltText: boolean;
  hasKeywords: boolean;
  titleLength: number;
  descriptionLength: number;
  metaDescriptionLength: number;
  keywordCount: number;
}

interface KeywordRanking {
  id: string;
  keyword: string;
  currentRank: number;
  previousRank: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  searchVolume: number;
  difficulty: 'Low' | 'Medium' | 'High';
  productName: string;
  productId: string;
  lastUpdate: string;
}

interface SchemaMarkup {
  productId: string;
  productName: string;
  schema: object;
  isValid: boolean;
  missingFields: string[];
}

interface Recommendations {
  quickWins: string[];
  improvements: string[];
  advanced: string[];
}

export default function SEOHealthDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: healthScore, isLoading: scoreLoading, refetch: refetchScore } = useQuery<SEOHealthScore>({
    queryKey: ['/api/seo-health/score'],
  });

  const { data: issues, isLoading: issuesLoading } = useQuery<SEOIssue[]>({
    queryKey: ['/api/seo-health/issues'],
  });

  const { data: audits, isLoading: auditsLoading } = useQuery<ProductSEOAudit[]>({
    queryKey: ['/api/seo-health/audit'],
  });

  const { data: keywords, isLoading: keywordsLoading } = useQuery<KeywordRanking[]>({
    queryKey: ['/api/seo-health/keywords'],
  });

  const { data: schemas, isLoading: schemasLoading } = useQuery<SchemaMarkup[]>({
    queryKey: ['/api/seo-health/schema'],
  });

  const { data: recommendations, isLoading: recommendationsLoading } = useQuery<Recommendations>({
    queryKey: ['/api/seo-health/recommendations'],
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'critical': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getIssueBadge = (type: string) => {
    switch (type) {
      case 'critical': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Critical</Badge>;
      case 'warning': return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Warning</Badge>;
      default: return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Info</Badge>;
    }
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === "up") return <ArrowUp className="w-4 h-4 text-green-400" />;
    if (trend === "down") return <ArrowDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "Low": return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Low</Badge>;
      case "Medium": return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Medium</Badge>;
      case "High": return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">High</Badge>;
      default: return null;
    }
  };

  const handleRefresh = async () => {
    await refetchScore();
    toast({
      title: "Refreshed!",
      description: "SEO health data has been updated",
    });
  };

  const criticalIssues = issues?.filter(i => i.type === 'critical').length || 0;
  const warningIssues = issues?.filter(i => i.type === 'warning').length || 0;
  const infoIssues = issues?.filter(i => i.type === 'info').length || 0;
  const avgScore = audits && audits.length > 0 
    ? Math.round(audits.reduce((sum, a) => sum + a.score, 0) / audits.length) 
    : 0;
  const improvingKeywords = keywords?.filter(k => k.trend === 'up').length || 0;

  return (
    <PageShell
      title="Google Ranking & SEO Health"
      subtitle="Track your store's search performance and fix SEO issues to rank higher"
      backTo="/dashboard?tab=ai-tools"
      maxWidth="xl"
      spacing="normal"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-overview">
            <Gauge className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="issues" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-issues">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Issues ({(criticalIssues + warningIssues) || 0})
          </TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-audit">
            <FileText className="w-4 h-4 mr-2" />
            Product Audit
          </TabsTrigger>
          <TabsTrigger value="keywords" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-keywords">
            <Search className="w-4 h-4 mr-2" />
            Keywords
          </TabsTrigger>
          <TabsTrigger value="schema" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-schema">
            <Code className="w-4 h-4 mr-2" />
            Schema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={<Gauge className="w-6 h-6 text-primary" />}
              title="SEO Health Score"
              value={scoreLoading ? "..." : `${healthScore?.overall || 0}/100`}
              subtitle={healthScore?.trend === 'up' ? "Improving" : healthScore?.trend === 'down' ? "Declining" : "Stable"}
              trend={healthScore?.trend || 'stable'}
              testId="card-seo-score"
            />
            <MetricCard
              icon={<AlertTriangle className="w-6 h-6 text-yellow-400" />}
              title="Issues Found"
              value={issuesLoading ? "..." : (criticalIssues + warningIssues)}
              subtitle={`${criticalIssues} critical, ${warningIssues} warnings`}
              testId="card-issues-count"
            />
            <MetricCard
              icon={<TrendingUp className="w-6 h-6 text-green-400" />}
              title="Keywords Improving"
              value={keywordsLoading ? "..." : improvingKeywords}
              subtitle={`of ${keywords?.length || 0} tracked`}
              trend="up"
              testId="card-keywords-improving"
            />
            <MetricCard
              icon={<BarChart3 className="w-6 h-6 text-blue-400" />}
              title="Avg Product Score"
              value={auditsLoading ? "..." : `${avgScore}/100`}
              subtitle={`${audits?.length || 0} products audited`}
              testId="card-avg-score"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DashboardCard
              title="SEO Category Scores"
              description="Performance across different SEO areas"
              testId="card-category-scores"
              className="lg:col-span-1"
            >
              {scoreLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Meta Tags</span>
                      <span className={getScoreColor(healthScore?.categories.meta || 0)}>
                        {healthScore?.categories.meta || 0}%
                      </span>
                    </div>
                    <Progress value={healthScore?.categories.meta || 0} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Content Quality</span>
                      <span className={getScoreColor(healthScore?.categories.content || 0)}>
                        {healthScore?.categories.content || 0}%
                      </span>
                    </div>
                    <Progress value={healthScore?.categories.content || 0} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Technical SEO</span>
                      <span className={getScoreColor(healthScore?.categories.technical || 0)}>
                        {healthScore?.categories.technical || 0}%
                      </span>
                    </div>
                    <Progress value={healthScore?.categories.technical || 0} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Schema Markup</span>
                      <span className={getScoreColor(healthScore?.categories.schema || 0)}>
                        {healthScore?.categories.schema || 0}%
                      </span>
                    </div>
                    <Progress value={healthScore?.categories.schema || 0} className="h-2" />
                  </div>
                </div>
              )}
            </DashboardCard>

            <DashboardCard
              title="Quick Wins"
              description="High-impact fixes you can do right now"
              testId="card-quick-wins"
              className="lg:col-span-2"
            >
              {recommendationsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations?.quickWins.slice(0, 4).map((win, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                      <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-white">{win}</p>
                      </div>
                      <Button size="sm" variant="outline" className="shrink-0" onClick={() => setLocation('/ai-tools/product-seo-engine')} data-testid={`button-fix-${idx}`}>
                        Fix Now
                      </Button>
                    </div>
                  ))}
                  {(!recommendations?.quickWins || recommendations.quickWins.length === 0) && (
                    <div className="text-center py-8 text-slate-400">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" />
                      <p>No quick wins found - your SEO is in great shape!</p>
                    </div>
                  )}
                </div>
              )}
            </DashboardCard>
          </div>

          <DashboardCard
            title="Top Issues to Fix"
            description="Prioritized list of SEO problems affecting your rankings"
            testId="card-top-issues"
            headerAction={
              <Button variant="outline" size="sm" onClick={handleRefresh} data-testid="button-refresh">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            }
          >
            {issuesLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {issues?.slice(0, 5).map((issue) => (
                  <div key={issue.id} className="flex items-start gap-4 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
                    {getIssueIcon(issue.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-semibold text-white">{issue.title}</h4>
                        {getIssueBadge(issue.type)}
                        <Badge variant="outline" className="border-slate-600 text-slate-300">
                          {issue.affectedProducts} products
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-300 mb-2">{issue.description}</p>
                      <p className="text-xs text-slate-400">{issue.impact}</p>
                    </div>
                    <Button size="sm" className="shrink-0" onClick={() => setLocation('/ai-tools/product-seo-engine')} data-testid={`button-fix-issue-${issue.id}`}>
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Fix
                    </Button>
                  </div>
                ))}
                {(!issues || issues.length === 0) && (
                  <div className="text-center py-8 text-slate-400">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" />
                    <p>No SEO issues found - great work!</p>
                  </div>
                )}
              </div>
            )}
          </DashboardCard>
        </TabsContent>

        <TabsContent value="issues" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              icon={<XCircle className="w-6 h-6 text-red-400" />}
              title="Critical Issues"
              value={criticalIssues}
              subtitle="Needs immediate attention"
              testId="card-critical-issues"
            />
            <MetricCard
              icon={<AlertTriangle className="w-6 h-6 text-yellow-400" />}
              title="Warnings"
              value={warningIssues}
              subtitle="Should be addressed"
              testId="card-warning-issues"
            />
            <MetricCard
              icon={<Info className="w-6 h-6 text-blue-400" />}
              title="Suggestions"
              value={infoIssues}
              subtitle="Optional improvements"
              testId="card-info-issues"
            />
          </div>

          <DashboardCard
            title="All SEO Issues"
            description="Complete list of issues affecting your store's search visibility"
            testId="card-all-issues"
          >
            {issuesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {issues?.map((issue) => (
                  <div key={issue.id} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
                    <div className="flex items-start gap-4">
                      {getIssueIcon(issue.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h4 className="font-semibold text-white">{issue.title}</h4>
                          {getIssueBadge(issue.type)}
                          <Badge variant="outline" className="border-slate-600 text-slate-300">
                            {issue.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-300 mb-2">{issue.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          <div className="text-slate-400">
                            <strong>Impact:</strong> {issue.impact}
                          </div>
                          <div className="text-slate-400">
                            <strong>Fix:</strong> {issue.fixSuggestion}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-bold text-primary mb-1">{issue.affectedProducts}</div>
                        <div className="text-xs text-slate-400">affected</div>
                      </div>
                    </div>
                  </div>
                ))}
                {(!issues || issues.length === 0) && (
                  <div className="text-center py-12 text-slate-400">
                    <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-400" />
                    <h3 className="text-lg font-semibold text-white mb-2">All Clear!</h3>
                    <p>No SEO issues detected in your store.</p>
                  </div>
                )}
              </div>
            )}
          </DashboardCard>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <DashboardCard
            title="Product SEO Audit"
            description="Individual SEO scores and issues for each product"
            testId="card-product-audit"
            headerAction={
              <Button onClick={() => setLocation('/ai-tools/bulk-optimization')} data-testid="button-bulk-optimize">
                <Zap className="w-4 h-4 mr-2" />
                Bulk Optimize
              </Button>
            }
          >
            {auditsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {audits?.map((audit) => (
                  <div key={audit.productId} className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${getScoreBg(audit.score)} text-white`}>
                      {audit.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white truncate">{audit.productName}</h4>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        {audit.hasMetaTitle && <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs">Meta Title</Badge>}
                        {audit.hasMetaDescription && <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs">Meta Desc</Badge>}
                        {audit.hasKeywords && <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs">Keywords</Badge>}
                        {audit.hasAltText && <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs">Alt Text</Badge>}
                        {audit.issues.length > 0 && (
                          <Badge variant="outline" className="border-red-500/30 text-red-400 text-xs">
                            {audit.issues.length} issues
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setLocation('/ai-tools/product-seo-engine')} data-testid={`button-optimize-${audit.productId}`}>
                      Optimize
                    </Button>
                  </div>
                ))}
                {(!audits || audits.length === 0) && (
                  <div className="text-center py-12 text-slate-400">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Products Found</h3>
                    <p>Add products to see their SEO audit results.</p>
                  </div>
                )}
              </div>
            )}
          </DashboardCard>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              icon={<Search className="w-6 h-6 text-primary" />}
              title="Keywords Tracked"
              value={keywords?.length || 0}
              testId="card-keywords-tracked"
            />
            <MetricCard
              icon={<TrendingUp className="w-6 h-6 text-green-400" />}
              title="Improving"
              value={improvingKeywords}
              trend="up"
              testId="card-keywords-up"
            />
            <MetricCard
              icon={<Target className="w-6 h-6 text-blue-400" />}
              title="Avg Position"
              value={keywords && keywords.length > 0 
                ? `#${Math.round(keywords.reduce((sum, k) => sum + k.currentRank, 0) / keywords.length)}`
                : "N/A"
              }
              testId="card-avg-position"
            />
          </div>

          <DashboardCard
            title="Keyword Rankings"
            description="Track your product positions in Google search results"
            testId="card-keyword-rankings"
          >
            {keywordsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {keywords?.map((kw) => (
                  <div key={kw.id} className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-center p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
                    <div className="lg:col-span-2">
                      <h4 className="font-semibold text-white">{kw.keyword}</h4>
                      <p className="text-sm text-slate-400 truncate">{kw.productName}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl font-bold text-white">#{kw.currentRank}</span>
                        {kw.change !== 0 && (
                          <Badge className={kw.trend === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                            <div className="flex items-center gap-1">
                              {getTrendIcon(kw.trend, kw.change)}
                              <span>{Math.abs(kw.change)}</span>
                            </div>
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">Current Rank</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-slate-300">{kw.searchVolume.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">Monthly Searches</p>
                    </div>
                    <div className="text-center">
                      {getDifficultyBadge(kw.difficulty)}
                      <p className="text-xs text-slate-400 mt-1">Difficulty</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-400">{kw.lastUpdate}</p>
                      <p className="text-xs text-slate-500">Last Updated</p>
                    </div>
                  </div>
                ))}
                {(!keywords || keywords.length === 0) && (
                  <div className="text-center py-12 text-slate-400">
                    <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Keywords Tracked</h3>
                    <p>Generate SEO content to start tracking keyword rankings.</p>
                    <Button className="mt-4" onClick={() => setLocation('/ai-tools/product-seo-engine')} data-testid="button-start-tracking">
                      Start Optimizing
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DashboardCard>
        </TabsContent>

        <TabsContent value="schema" className="space-y-6">
          <DashboardCard
            title="Product Schema Markup"
            description="Rich snippets help your products stand out in Google search results"
            testId="card-schema-markup"
          >
            {schemasLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {schemas?.map((schema) => (
                  <div key={schema.productId} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        {schema.isValid ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        )}
                        <div>
                          <h4 className="font-semibold text-white">{schema.productName}</h4>
                          <p className="text-sm text-slate-400">
                            {schema.isValid ? "Schema is valid" : `Missing ${schema.missingFields.length} fields`}
                          </p>
                        </div>
                      </div>
                      <Badge className={schema.isValid ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                        {schema.isValid ? "Valid" : "Incomplete"}
                      </Badge>
                    </div>
                    {!schema.isValid && schema.missingFields.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {schema.missingFields.map((field) => (
                          <Badge key={field} variant="outline" className="border-red-500/30 text-red-400 text-xs">
                            Missing: {field}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <details className="mt-3">
                      <summary className="text-sm text-primary cursor-pointer hover:underline">View Schema JSON</summary>
                      <pre className="mt-2 p-3 bg-slate-900 rounded-lg text-xs text-slate-300 overflow-x-auto">
                        {JSON.stringify(schema.schema, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))}
                {(!schemas || schemas.length === 0) && (
                  <div className="text-center py-12 text-slate-400">
                    <Code className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Schema Data</h3>
                    <p>Add products to generate schema markup.</p>
                  </div>
                )}
              </div>
            )}
          </DashboardCard>

          <DashboardCard
            title="What is Schema Markup?"
            description="Learn how structured data helps your products appear better in search"
            testId="card-schema-info"
          >
            <div className="space-y-4 text-sm text-slate-300">
              <p>
                Schema markup (structured data) is code you add to your pages to help search engines understand your content better. 
                For products, this means Google can display rich snippets showing:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li><strong className="text-white">Price</strong> - Show the product price directly in search results</li>
                <li><strong className="text-white">Availability</strong> - Display if the product is in stock</li>
                <li><strong className="text-white">Reviews</strong> - Star ratings appear in search results</li>
                <li><strong className="text-white">Images</strong> - Product images can appear in Google Shopping</li>
              </ul>
              <p className="text-slate-400">
                Products with valid schema markup can see up to 30% higher click-through rates in search results.
              </p>
            </div>
          </DashboardCard>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
