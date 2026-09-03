import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server Actions CSRF 保護
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'schoolsync.vercel.app'],
    },
  },
};

export default nextConfig;
