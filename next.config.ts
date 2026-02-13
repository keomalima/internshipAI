import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn-images.welcometothejungle.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "logo.clearbit.com" },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), '@sparticuz/chromium'];
    }
    return config;
  },
};

export default nextConfig;
