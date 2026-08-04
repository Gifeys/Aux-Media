import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  declare props: Readonly<Props>;
  declare setState: Component<Props, State>['setState'];

  state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b1326] text-[#d4e4fa] flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-church-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-300 text-3xl">
              ⚠️
            </div>
            <h2 className="text-xl font-bold font-serif text-amber-200">
              Something went wrong loading this view
            </h2>
            <p className="text-xs text-gold-300/80 font-mono leading-relaxed">
              {this.state.error?.message || 'An unexpected error occurred while updating or rendering media data.'}
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl font-mono transition-all shadow-md cursor-pointer"
              >
                🔄 Try Recovering View
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-church-800 hover:bg-church-750 text-gold-200 border border-church-700 font-bold text-xs rounded-xl font-mono transition-all cursor-pointer"
              >
                🌐 Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
