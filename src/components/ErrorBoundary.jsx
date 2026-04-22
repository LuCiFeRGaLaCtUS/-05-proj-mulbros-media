import React from 'react';
import { AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={24} className="text-red-400" />
          </div>
          <div className="max-w-sm">
            <h2 className="text-lg font-bold text-zinc-100 mb-2">Something went wrong</h2>
            <p className="text-sm text-zinc-600 mb-1">
              {this.state.error?.message || 'An unexpected error occurred in this view.'}
            </p>
            <p className="text-xs text-zinc-500">
              Open the browser console for the full stack trace.
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-200 transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-zinc-500 hover:text-zinc-600 transition-colors"
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
