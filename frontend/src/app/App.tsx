import { Component, ReactNode } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("Uncaught error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="text-2xl font-bold text-destructive">Something went wrong</h1>
          <p className="text-muted-foreground max-w-md">
            An unexpected error occurred. Please refresh the page or contact support if the problem persists.
          </p>
          <button
            className="px-4 py-2 rounded bg-[#004406] text-white hover:bg-[#003305]"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-4 text-left text-xs bg-muted p-4 rounded overflow-auto max-w-2xl">
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
