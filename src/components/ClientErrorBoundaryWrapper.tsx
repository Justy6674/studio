'use client';

import { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

/**
 * A client component wrapper for ErrorBoundary to properly handle the client/server component boundary.
 * This ensures that event handlers like onClick stay on the client side and don't leak into server components.
 */
export function ClientErrorBoundaryWrapper({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 bg-card rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="mb-4">We're sorry, but an unexpected error occurred. Our team has been notified.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
