import type { NextConfig } from "next";

import { buildSecurityHeaders } from "./src/lib/security/headers";

const securityHeaders = buildSecurityHeaders({
  appOrigin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  production: process.env.NODE_ENV === "production",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
}).map((header) =>
  header.key === "Content-Security-Policy"
    ? {
        ...header,
        // Enforce after nonce propagation has been tested with Next.js,
        // Sentry and PostHog during the deployment wave.
        key: "Content-Security-Policy-Report-Only",
      }
    : header,
);

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "192.168.1.176"],
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        headers: securityHeaders,
        source: "/(.*)",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
