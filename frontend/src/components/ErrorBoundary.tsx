import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled exception:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 text-slate-200">
          <div className="glass-panel max-w-lg w-full p-8 rounded-2xl text-center border border-red-500/20 shadow-neon">
            <div className="inline-flex p-4 bg-red-950/40 rounded-full text-red-400 mb-6 border border-red-800/30">
              <ShieldAlert className="h-10 w-10 animate-pulse" />
            </div>
            
            <h1 className="text-2xl font-bold font-sans tracking-wide mb-2 gradient-text">
              Something went sideways
            </h1>
            
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              SmartHire AI encountered an unexpected rendering error. This could be due to malformed parsed CV structures or API timeout.
            </p>
            
            {this.state.error && (
              <div className="bg-dark-950/80 p-4 rounded-xl text-left font-mono text-xs text-red-300 border border-red-900/30 overflow-auto max-h-40 mb-6 select-all">
                {this.state.error.toString()}
              </div>
            )}
            
            <button
              onClick={this.handleReset}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition duration-200 shadow-neon"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Workspace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
