import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="min-h-screen flex items-center justify-center p-6"
          style={{ background: '#0B0E1A' }}
        >
          <div
            className="w-full max-w-md"
            style={{
              background: '#151C38',
              borderRadius: '18px',
              border: '1px solid rgba(239,68,68,0.35)',
              borderLeft: '3px solid #EF4444',
              boxShadow: 'none',
            }}
          >
            <div className="p-6 pb-4 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(239,68,68,0.12)' }}
              >
                <AlertTriangle className="w-8 h-8" style={{ color: '#EF4444', strokeWidth: 2.5 }} />
              </div>
              <h2 className="text-xl mb-2" style={{ color: '#FFFFFF', fontWeight: 700 }}>
                Something went wrong
              </h2>
              <p className="text-sm" style={{ color: '#C6D2FF' }}>
                An unexpected error occurred. You can try refreshing the page or contact support if the problem persists.
              </p>
            </div>

            <div className="p-6 pt-2 space-y-3">
              <Button
                onClick={this.handleReset}
                className="w-full"
                variant="outline"
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#E6F7FF',
                }}
                data-testid="button-reset-error"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={this.handleRefresh}
                className="w-full"
                style={{
                  background: '#00F0FF',
                  color: '#04141C',
                  border: 'none',
                  fontWeight: 600,
                }}
                data-testid="button-refresh-page"
              >
                Refresh Page
              </Button>
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4">
                  <summary
                    className="text-sm cursor-pointer transition-colors"
                    style={{ color: '#7C86B8' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#E6F7FF')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#7C86B8')}
                  >
                    Error Details (Development)
                  </summary>
                  <pre
                    className="mt-2 text-xs p-3 rounded-md overflow-auto max-h-48"
                    style={{
                      color: '#EF4444',
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.2)',
                    }}
                  >
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
