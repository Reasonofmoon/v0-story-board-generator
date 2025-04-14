"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo)
    this.setState({ errorInfo })
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback UI or the provided fallback
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-6 border border-red-200 rounded-lg bg-red-50 text-red-800">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 mr-2 text-red-600" />
            <h2 className="text-lg font-semibold">Something went wrong</h2>
          </div>

          <div className="mb-4">
            <p className="mb-2">An error occurred in this component:</p>
            <pre className="p-3 bg-red-100 rounded text-sm overflow-auto max-h-40">{this.state.error?.toString()}</pre>
          </div>

          {this.state.errorInfo && (
            <div className="mb-4">
              <p className="mb-2">Component stack trace:</p>
              <pre className="p-3 bg-red-100 rounded text-sm overflow-auto max-h-40">
                {this.state.errorInfo.componentStack}
              </pre>
            </div>
          )}

          <Button onClick={this.handleReset} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      )
    }

    // When there's no error, render children normally
    return this.props.children
  }
}

export default ErrorBoundary
