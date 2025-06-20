"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { reportWebVitals, trackPageView } from '@/lib/analytics';
import { useAuth } from '@/hooks/useAuth';



export function WebVitals() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Report Web Vitals
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Initialize Web Vitals reporting
    reportWebVitals((metric) => {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(metric);
      }
      
      // Send to your analytics service in production
      // This is where you'd send metrics to your analytics service
      // Example: sendToAnalytics(metric);
    });
  }, []);

  // Track page views
  useEffect(() => {
    if (pathname) {
      // Track page view with the current path and query parameters
      const url = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
      trackPageView(url, user?.uid);
    }
  }, [pathname, searchParams, user?.uid]);

  return null;
}
