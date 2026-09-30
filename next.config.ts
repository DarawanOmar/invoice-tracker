import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let phones and tablets on the local network open the dev server
  // (e.g. http://192.168.0.109:3000) to test printing from mobile.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
};

export default nextConfig;
