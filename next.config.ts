import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
