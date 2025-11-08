import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  ShieldCheck, 
  Play, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Clock,
  Activity
} from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface TestResult {
  category: string;
  status: "passed" | "needsFix" | "failed";
  message: string;
  timestamp: string;
  logs: string[];
  recommendations: string[];
}

interface TestReport {
  summary: {
    passed: number;
    needsFix: number;
    failed: number;
    total: number;
  };
  tests: TestResult[];
  timestamp: string;
}

export default function AdminPage() {
  const { appUser } = useAuth();
  const [, setLocation] = useLocation();
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<TestReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Redirect if not admin (in effect to avoid render-time navigation)
  useEffect(() => {
    if (appUser !== undefined) {
      if (appUser?.role !== 'admin') {
        setLocation('/dashboard');
      } else {
        setIsCheckingAuth(false);
      }
    }
  }, [appUser, setLocation]);

  // Show loading state until auth is verified
  if (isCheckingAuth || !appUser) {
    return (
      <div className="min-h-screen dark-theme-bg flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-slate-400">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  const runIntegrationTests = async () => {
    setIsRunning(true);
    setError(null);
    setReport(null);

    try {
      const response = await apiRequest(
        'POST',
        '/api/shopify/run-integration-tests'
      );

      if (!response.ok) {
        throw new Error('Failed to run integration tests');
      }

      const data = await response.json() as { success: boolean; report: TestReport; error?: string };

      if (data.success) {
        setReport(data.report);
      } else {
        setError(data.error || 'Failed to run integration tests');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while running tests');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'needsFix':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Activity className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      passed: { className: "bg-green-500/20 text-green-400 border-green-500/30", label: "✅ Passed" },
      needsFix: { className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", label: "⚠️ Needs Fix" },
      failed: { className: "bg-red-500/20 text-red-400 border-red-500/30", label: "❌ Failed" }
    };

    const variant = variants[status] || variants.passed;
    
    return (
      <Badge className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen dark-theme-bg">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-primary/20 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          </div>
          <p className="text-slate-400">System diagnostics and integration testing</p>
        </div>

        {/* User Info */}
        <Card className="mb-6 bg-black/40 border-border">
          <CardHeader>
            <CardTitle className="text-white">Logged in as</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{appUser.email}</p>
                <p className="text-sm text-slate-400">Role: {appUser.role}</p>
              </div>
              {appUser.role === 'admin' && (
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  Admin Access
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Integration Test Card */}
        <Card className="bg-black/40 border-border">
          <CardHeader>
            <CardTitle className="text-white">Shopify Integration Tests</CardTitle>
            <CardDescription className="text-slate-400">
              Run comprehensive tests to validate your Shopify integration health
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Run Tests Button */}
            <Button
              onClick={runIntegrationTests}
              disabled={isRunning}
              className="w-full sm:w-auto"
              size="lg"
              data-testid="button-run-tests"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Integration Tests
                </>
              )}
            </Button>

            {/* Error Display */}
            {error && (
              <Alert className="bg-red-500/10 border-red-500/30 text-red-400">
                <XCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Test Results */}
            {report && (
              <div className="space-y-6">
                <Separator className="bg-border" />

                {/* Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <Card className="bg-black/20 border-border">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">{report.summary.total}</p>
                        <p className="text-sm text-slate-400">Total Tests</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-500/10 border-green-500/30">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-400">{report.summary.passed}</p>
                        <p className="text-sm text-slate-400">Passed</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-yellow-500/10 border-yellow-500/30">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-400">{report.summary.needsFix}</p>
                        <p className="text-sm text-slate-400">Needs Fix</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-red-500/10 border-red-500/30">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-400">{report.summary.failed}</p>
                        <p className="text-sm text-slate-400">Failed</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Test Results Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Test Results</h3>
                  
                  {report.tests.map((test, index) => (
                    <Card key={index} className="bg-black/20 border-border">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(test.status)}
                            <div>
                              <CardTitle className="text-white text-base">{test.category}</CardTitle>
                              <p className="text-sm text-slate-400 mt-1">{test.message}</p>
                            </div>
                          </div>
                          {getStatusBadge(test.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Timestamp */}
                        <div className="flex items-center space-x-2 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(test.timestamp).toLocaleString()}</span>
                        </div>

                        {/* Logs */}
                        {test.logs.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-slate-300 mb-2">Logs:</p>
                            <div className="bg-black/40 border border-border rounded-lg p-3 space-y-1">
                              {test.logs.map((log, logIndex) => (
                                <p key={logIndex} className="text-xs font-mono text-slate-400">
                                  {log}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommendations */}
                        {test.recommendations.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-yellow-400 mb-2">
                              Recommendations:
                            </p>
                            <ul className="space-y-1">
                              {test.recommendations.map((rec, recIndex) => (
                                <li key={recIndex} className="text-sm text-slate-300 flex items-start space-x-2">
                                  <span className="text-yellow-400 mt-0.5">•</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Report Timestamp */}
                <div className="text-center text-sm text-slate-500">
                  Report generated at {new Date(report.timestamp).toLocaleString()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
