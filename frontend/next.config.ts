import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/voice/:path*',
        destination: 'http://localhost:8000/api/voice/:path*',
      },
      {
        source: '/auth/:path*',
        destination: 'http://localhost:8000/auth/:path*',
      },
      {
        source: '/me',
        destination: 'http://localhost:8000/me',
      },
    ];
  },
};

export default nextConfig;
