import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Traces exactly which node_modules files the built server actually
  // needs and copies just those into .next/standalone — what the
  // Dockerfile uses to build a much smaller runtime image than shipping
  // the whole node_modules tree.
  output: "standalone",
};

export default nextConfig;
