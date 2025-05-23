import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      // Add other image hostnames if needed, e.g., for user avatars from Firebase Storage or other providers
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // For Google User Avatars
      }
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb', // Example: Increase body size limit if needed for actions
    },
  }
};

export default nextConfig;
