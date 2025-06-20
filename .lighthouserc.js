// Configuration for Lighthouse CI
// See: https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md

module.exports = {
  ci: {
    collect: {
      // Run Lighthouse CI on local build
      startServerCommand: 'npm run dev',
      url: [
        'http://localhost:3000',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/hydration-log',
        'http://localhost:3000/settings',
      ],
      numberOfRuns: 3,
      settings: {
        // Mobile device emulation
        emulatedFormFactor: 'mobile',
        // Throttling settings (simulate 4G connection)
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
        },
        // Only audit performance for now
        onlyCategories: ['performance'],
        // Skip some audits that might not be relevant in CI
        skipAudits: [
          'uses-http2',
          'full-page-screenshot',
        ],
      },
    },
    assert: {
      // Performance budget (scores are out of 100)
      assertions: {
        'categories:performance': [
          'error',
          { minScore: 0.9, aggregationMethod: 'median-run' },
        ],
        // Performance metrics
        'first-contentful-paint': [
          'warn',
          { maxNumericValue: 2000, aggregationMethod: 'median-run' },
        ],
        'largest-contentful-paint': [
          'warn',
          { maxNumericValue: 2500, aggregationMethod: 'median-run' },
        ],
        'cumulative-layout-shift': [
          'warn',
          { maxNumericValue: 0.1, aggregationMethod: 'median-run' },
        ],
        'first-meaningful-paint': [
          'warn',
          { maxNumericValue: 2000, aggregationMethod: 'median-run' },
        ],
        'speed-index': [
          'warn',
          { maxNumericValue: 4300, aggregationMethod: 'median-run' },
        ],
        'interactive': [
          'warn',
          { maxNumericValue: 3800, aggregationMethod: 'median-run' },
        ],
        'total-blocking-time': [
          'warn',
          { maxNumericValue: 300, aggregationMethod: 'median-run' },
        ],
      },
    },
    upload: {
      // Upload results to temporary public storage
      target: 'temporary-public-storage',
      // Add GitHub token if running in GitHub Actions
      ...(process.env.GITHUB_TOKEN && {
        target: 'lhci',
        serverBaseUrl: 'https://lhci.water4weightloss.app',
        token: process.env.LHCI_TOKEN,
      }),
    },
  },
};
