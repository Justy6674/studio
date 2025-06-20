import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
  // TypeScript configuration
  typescript: {
    // Enable TypeScript type checking during build
    ignoreBuildErrors: false,
  },
  // ESLint configuration
  eslint: {
    // Enable ESLint during build
    ignoreDuringBuilds: false,
  },
  // Disable font optimization to prevent Babel/SWC conflict
  optimizeFonts: false,
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
  serverExternalPackages: ['@google-cloud/vertexai'],
  allowedDevOrigins: [
    'd0e3856c-ae67-4138-af3a-914ab03197d2-00-1arjfvfyhoz4r.worf.replit.dev',
    '*.replit.dev',
    'localhost:5000'
  ],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
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