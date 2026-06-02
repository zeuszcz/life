import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Docker image keeps full node_modules and runs `next start`, so no
  // special output mode is needed. Phaser ships browser globals but is only
  // ever imported from client components, so no special handling here either.
};

export default nextConfig;
