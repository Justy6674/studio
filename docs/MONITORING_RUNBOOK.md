# Water4WeightLoss Monitoring Runbook

This document outlines the monitoring and alerting setup for the Water4WeightLoss application.

## Table of Contents
- [Overview](#overview)
- [Performance Monitoring](#performance-monitoring)
- [Error Tracking](#error-tracking)
- [Analytics](#analytics)
- [Alerts and Notifications](#alerts-and-notifications)
- [Incident Response](#incident-response)
- [Maintenance](#maintenance)

## Overview

Our monitoring stack consists of:

1. **Lighthouse CI**: For performance monitoring and audits
2. **Sentry**: For error tracking and monitoring
3. **Firebase Analytics**: For user behavior and engagement metrics
4. **GitHub Actions**: For CI/CD and automated testing

## Performance Monitoring

### Lighthouse CI

Lighthouse CI runs on every pull request and push to main/develop branches. It checks the following metrics against predefined thresholds:

- First Contentful Paint (FCP): < 2s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1
- First Input Delay (FID): < 100ms
- Time to Interactive (TTI): < 3.8s

#### Running Locally

```bash
# Run performance tests
npm run lhci:autorun

# View results
npm run lhci:open
```

#### Configuration

- Config file: `.lighthouserc.js`
- Test URLs are defined in the config
- Thresholds can be adjusted in the config file

## Error Tracking

### Sentry

Sentry is configured to track:

- Unhandled exceptions
- Unhandled promise rejections
- React component errors
- Network request failures

#### Configuration

- DSN: Set in `NEXT_PUBLIC_SENTRY_DSN`
- Environment: `NODE_ENV`
- Sample rates:
  - Error tracking: 100%
  - Performance monitoring: 10%
  - Session replay: 10%

#### Common Issues

1. **Missing Source Maps**
   - Ensure source maps are uploaded during build
   - Check `sentry.client.config.js` and `sentry.server.config.js`

2. **Rate Limiting**
   - Check Sentry quota in dashboard
   - Adjust sample rates if needed

## Analytics

### Firebase Analytics

Tracked events:

- Page views
- Feature usage
- User interactions
- Conversion events

#### Accessing Analytics

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Analytics > Dashboard

## Alerts and Notifications

### Performance Alerts

- **LCP > 4s**: Warning
- **CLS > 0.25**: Warning
- **Error rate > 1%**: Critical

### Error Alerts

- **New errors**: Notify team
- **Error rate spike**: Page on-call
- **Critical errors**: Immediate page

## Incident Response

### Performance Issues

1. Check Lighthouse CI results
2. Review Web Vitals in Firebase
3. Check Sentry for related errors
4. Rollback if recent deploy

### Error Outbreak

1. Check Sentry for error details
2. Identify affected users
3. Apply hotfix if needed
4. Update error boundaries

## Maintenance

### Monthly Tasks

1. Review and clean up old alerts
2. Update dependencies
3. Review and update performance budgets
4. Clean up old source maps in Sentry

### Quarterly Tasks

1. Review monitoring coverage
2. Update runbook with new processes
3. Train team on incident response
4. Review and update alert thresholds

## Support

For issues with monitoring:

1. Check the [Sentry Dashboard](https://sentry.io/)
2. Review [Firebase Console](https://console.firebase.google.com/)
3. Contact the platform team

---

Last Updated: June 2024
