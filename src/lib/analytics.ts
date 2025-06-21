import { getAnalytics, logEvent } from 'firebase/analytics';
import { app } from '@/lib/firebase';

type Metric = {
  name: string;
  value: number;
  id: string;
  delta: number;
  entries: PerformanceEntry[];
  rating?: string;
};

// Initialize Firebase Analytics
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Send metrics to your analytics service
type ReportHandler = (metric: Metric) => void;

const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (typeof window === 'undefined' || !onPerfEntry || !(onPerfEntry instanceof Function)) {
    return;
  }

  // Dynamically import web-vitals to avoid SSR issues
  import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
    onCLS(onPerfEntry);
    onINP(onPerfEntry);
    onFCP(onPerfEntry);
    onLCP(onPerfEntry);
    onTTFB(onPerfEntry);
  }).catch(error => {
    console.error('Error loading web-vitals:', error);
  });
};

// Custom event logger that includes user ID if available
const logAnalyticsEvent = (
  eventName: string,
  eventParams?: { [key: string]: unknown },
  userId?: string
) => {
  if (typeof window === 'undefined' || !analytics) return;

  try {
    if (userId) {
      logEvent(analytics, eventName, { ...eventParams, user_id: userId });
    } else {
      logEvent(analytics, eventName, eventParams);
    }
  } catch (error) {
    console.error('Error logging analytics event:', error);
  }
};

// Track page views
const trackPageView = (url: string, userId?: string) => {
  logAnalyticsEvent('page_view', { page_path: url }, userId);
};

// Track feature usage
type FeatureName = 'new_navigation' | 'fab' | 'ai_motivation' | 'dark_mode';

const trackFeatureUsage = (
  feature: FeatureName,
  action: 'view' | 'click' | 'enable' | 'disable',
  userId?: string,
  metadata?: Record<string, unknown>
) => {
  logAnalyticsEvent(
    'feature_usage',
    { feature, action, ...metadata },
    userId
  );
};

// Track errors
type ErrorSeverity = 'error' | 'warning' | 'info';

const trackError = (
  error: Error,
  componentStack?: string,
  severity: ErrorSeverity = 'error',
  userId?: string,
  metadata?: Record<string, unknown>
) => {
  logAnalyticsEvent(
    'error',
    {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack,
      component_stack: componentStack,
      severity,
      ...metadata,
    },
    userId
  );
};

export {
  reportWebVitals,
  logAnalyticsEvent,
  trackPageView,
  trackFeatureUsage,
  trackError,
  type Metric,
  type ErrorSeverity,
};
