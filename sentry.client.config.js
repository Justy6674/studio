// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a page is visited.

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 0.1,
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  // Disable in development or when testing locally
  enabled: process.env.NODE_ENV === 'production',
  // Add any additional configuration options below:
  environment: process.env.NODE_ENV,
  // Enable session replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    new Sentry.Replay({
      // Additional Replay configuration goes in here
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
