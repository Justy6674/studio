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

  webpack: (config, { isServer }) => {
    // Handle font files
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/i,
      type: 'asset/resource',
    });

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

  // TypeScript configuration - keep type checking for better reliability
  typescript: {
    // Enable TypeScript type checking during build for better reliability
    // Setting this to false will cause the build to fail on type errors
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration - enable for better code quality
  eslint: {
    // Enable ESLint during build for better reliability
    // Setting this to false will cause the build to fail on linting errors
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