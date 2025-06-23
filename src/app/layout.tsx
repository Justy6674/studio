import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { WebVitals } from "@/components/analytics/WebVitals";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BottomNav } from "@/components/layout/BottomNav";
import { HydrationFAB } from "@/components/HydrationFAB";

// Import Sentry's error tracking
import * as Sentry from "@sentry/nextjs";

// Configure Sentry
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  tracesSampleRate: 0.1,
  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  // Set environment
  environment: process.env.NODE_ENV,
});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Water4WeightLoss - AI-Powered Hydration Coaching",
  description: "AI-powered hydration tracking with personalised reminders and motivation for weight loss success",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

// Create a client component wrapper for the error boundary to properly handle event handlers
import { ClientErrorBoundaryWrapper } from "@/components/ClientErrorBoundaryWrapper";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* Add theme color for mobile browsers */}
        <meta name="theme-color" content="#5271ff" />
      </head>
      <body className={`${inter.className} antialiased min-h-screen bg-background text-foreground pb-16`}>
        {/* Skip to content link for keyboard users */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:outline focus:outline-2 focus:outline-primary"
        >
          Skip to content
        </a>

        {/* Wrap the app content in a client component boundary to properly handle client/server separation */}
        <ClientErrorBoundaryWrapper>
          <Providers>
            {/* Main app container with proper ARIA landmark */}
            <main id="main-content" className="min-h-screen" tabIndex={-1}>
              {children}
            </main>
            
            {/* Fixed action button - ensure it has proper accessibility */}
            <HydrationFAB />
            
            {/* Navigation landmark */}
            <nav aria-label="Main navigation">
              <BottomNav />
            </nav>
            
            <Suspense fallback={null}>
              <WebVitals />
            </Suspense>
          </Providers>
        </ClientErrorBoundaryWrapper>
      </body>
    </html>
  );
}