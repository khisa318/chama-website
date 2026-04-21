import React, { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full rounded-[32px] bg-card border border-border p-8 card-shadow">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-[20px] bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground text-center mb-3">
              Oops! Something went wrong
            </h1>
            <p className="text-muted-foreground text-center mb-6 text-sm">
              We encountered an unexpected error. Please try refreshing the page or go back to the dashboard.
            </p>
            {this.state.error && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-[16px] p-4 mb-6">
                <p className="text-[10px] font-mono text-red-600 break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <Button
                onClick={this.handleReset}
                className="flex-1 rounded-[14px] font-bold"
              >
                Try Again
              </Button>
              <Button
                onClick={() => window.location.href = "/app/dashboard"}
                variant="outline"
                className="flex-1 rounded-[14px] font-bold"
              >
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
