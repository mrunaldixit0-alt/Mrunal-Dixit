import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
            <span className="text-2xl font-black">!</span>
          </div>
          <h1 className="text-2xl font-black">Something went wrong</h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            {this.state.error?.message || 'An unexpected error occurred while loading this page.'}
          </p>
          <div className="pt-2 flex justify-center space-x-3">
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition-colors"
            >
              Reload Page
            </button>
            <a
              href="/admin/login"
              className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs uppercase tracking-wider hover:bg-slate-700 transition-colors"
            >
              Go to Admin Login
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
