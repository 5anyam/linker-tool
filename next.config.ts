import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Is domain se kahin bhi jaane pe Referer blank rahe, aur search engines index na karein.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
