import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Experimental features
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:*",
        "127.0.0.1:*"
      ]
    },
    optimizePackageImports: ['lucide-react']
  },

  webpack: (config, { isServer, webpack }) => {
    // suppress opentelemetry/sentry critical dependency warnings
    config.ignoreWarnings = [
      { message: /Critical dependency: the request of a dependency is an expression/ }
    ];

    // Handle font files
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/i,
      type: 'asset/resource',
    });

    // Inject environment variables into service worker
    if (!isServer) {
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.NEXT_PUBLIC_FIREBASE_API_KEY': JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
          'process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
          'process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID': JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
          'process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
          'process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
          'process.env.NEXT_PUBLIC_FIREBASE_APP_ID': JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
        })
      );
    }

    // Only use Babel for test files in test environment
    if (process.env.NODE_ENV === 'test') {
      const originalEntry = config.entry;
      config.entry = async () => {
        const entries = await originalEntry();
        if (entries['main.js']) {
          entries['main.js'] = entries['main.js'].filter(
            (file: string) => !file.includes('node_modules')
          );
        }
        return entries;
      };
    }

    return config;
  },

  // TypeScript configuration
  typescript: {
    // Enable TypeScript error checking during builds
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    // Enable ESLint checking during builds
    ignoreDuringBuilds: false,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      }
    ],
  },
  
  // Keep server components enabled (don't use static export mode)
  // This allows for server-side rendering and API routes
  // output: 'export', // REMOVED - incompatible with server features

  // React configuration
  reactStrictMode: true, // Enable for better development experience

  // Allow external packages (for server-side)
  serverExternalPackages: ['@google-cloud/vertexai'],
  
  // Development origins
  allowedDevOrigins: [
    'd0e3856c-ae67-4138-af3a-914ab03197d2-00-1arjfvfyhoz4r.worf.replit.dev',
    '*.replit.dev',
    'localhost:5000'
  ],
  
  // API routing
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ];
  },
};

export default nextConfig;