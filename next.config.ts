import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // Configuração vazia do Turbopack - necessária porque Serwist adiciona
  // config webpack, e Next.js 16 exige config explícita do Turbopack
  turbopack: {},
  // CORS headers for API routes (Mercado Livre integration)
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
      // Cache headers for static assets (1 year)
      {
        source: "/icons/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Cache headers for banners (1 day - podem mudar)
      {
        source: "/banners/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
      // Cache headers for static images (1 year)
      {
        source: "/:all(og-image|logo|carcrewgarage)\\.(jpg|jpeg|png|svg)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
    ];  
  },
  // Cloudinary como image provider
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [480, 640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 300],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: `/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "drvnlgib2"}/**`,
      },
    ],
  },
};

const serwistConfig = {
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  // Precaching de assets estáticos
  globPatterns: ["**/*.{js,css,html,json,ico,png,svg,jpg,jpeg,webp,avif}"],
  globIgnores: ["/admin/**", "/api/**", "/sw.js"],
};

export default withSerwistInit(serwistConfig)(nextConfig);
