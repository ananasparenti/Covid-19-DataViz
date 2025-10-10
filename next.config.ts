import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    esmExternals: true,
  },
  turbopack: {
    root: __dirname,
  },
  webpack: (config, { isServer }) => {
    // Configuration pour les modules qui ne fonctionnent que côté client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  // Configuration pour éviter les erreurs avec Leaflet sur Vercel
  transpilePackages: ['leaflet', 'react-leaflet'],
};

export default nextConfig;
