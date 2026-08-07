import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  allowedDevOrigins: ["127.0.0.1"],
  transpilePackages: ["@surion/config", "@surion/domain", "@surion/contracts"],
};

export default nextConfig;
