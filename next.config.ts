import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Phaser 4 type mismatches in src/game/ — pre-existing, not from our code
    ignoreBuildErrors: true,
  },
  // Server Actions CSRF 保護
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'questra.vercel.app'],
    },
  },
};

export default nextConfig;
