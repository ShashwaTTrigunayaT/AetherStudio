import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft, Code2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // If a fallback component is provided, use it
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.handleRetry}
          />
        );
      }

      return (
        <div className="min-h-screen bg-[#000000] flex items-center justify-center px-6">
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-gradient-to-br from-[#ff453a]/5 to-transparent rounded-full blur-[100px]" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative text-center max-w-sm"
          >
            <div className="w-16 h-16 rounded-2xl bg-[rgba(255,69,58,0.1)] flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} className="text-[#ff453a]" />
            </div>
            <h1 className="text-2xl font-bold text-[#f5f5f7] tracking-tight mb-2">
              Something went wrong
            </h1>
            <p className="text-[rgba(255,255,255,0.4)] text-sm mb-2">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <p className="text-[rgba(255,255,255,0.2)] text-xs mb-10">
              Please try again or return to the dashboard.
            </p>

            <div className="flex gap-3 justify-center">
              <motion.button
                onClick={this.handleRetry}
                className="btn-apple gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw size={16} />
                Try Again
              </motion.button>
              <motion.button
                onClick={() => (window.location.href = '/dashboard')}
                className="btn-apple-secondary gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ArrowLeft size={16} />
                Dashboard
              </motion.button>
            </div>
          </motion.div>

          <div className="absolute bottom-8 flex items-center gap-2 text-[rgba(255,255,255,0.15)]">
            <Code2 size={16} />
            <span className="text-xs font-medium">AetherStudio</span>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
