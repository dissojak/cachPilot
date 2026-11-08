import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@cashpilot/domain",
    "@cashpilot/application",
    "@cashpilot/infra",
    "@cashpilot/db",
    "@cashpilot/ui",
    "@cashpilot/config"
  ],
  serverExternalPackages: ["mongoose", "mongodb"]
};

export default nextConfig;
