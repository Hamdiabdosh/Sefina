import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AppErrorFallback } from './AppErrorFallback';

type AppErrorBoundaryProps = {
  children: ReactNode;
};

export type AppErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <AppErrorFallback
          error={this.state.error}
          onReload={() => window.location.reload()}
        />
      );
    }

    return this.props.children;
  }
}
