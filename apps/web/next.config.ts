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
  // Mongoose must stay external (one instance per server). Next only externalizes it
  // when it can resolve it from apps/web, hence the "mongoose" dependency in
  // package.json — no code here imports it (packages/db does).
  serverExternalPackages: ["mongoose", "mongodb"]
};

export default nextConfig;
