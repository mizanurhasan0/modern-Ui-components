import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Source is read by a Server Action from paths selected at runtime. NFT cannot
  // reliably infer those paths, so keep the source files and export-time assets
  // in the function bundle on Vercel.
  outputFileTracingIncludes: {
    "/components/*": [
      "./components/ui/**/*",
      "./public/creative-login/**/*",
      "./public/portfolio-trail/**/*",
      "./public/redbull/**/*",
      "./public/clothing-customizer/**/*",
      "./public/chrome-profiles/**/*",
      "./public/swift-sneaker-store/**/*",
      "./public/reference-travel/**/*",
      "./public/classic-microcars/**/*",
      "./public/sapiens-characters/**/*",
      "./public/glassy-login-v3/**/*",
    ],
  },
  async redirects() {
    return [
      // One canonical host: crawlers should never see the same page on www and the apex domain.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.mizanurhasan.top" }],
        destination: "https://mizanurhasan.top/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
