import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@surion/config", "@surion/domain", "@surion/contracts"],
};

export default nextConfig;
