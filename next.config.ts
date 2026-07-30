import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (pdfjs-dist) spins up a worker via a relative file path that Turbopack's
  // server bundling breaks ("Setting up fake worker failed: Cannot find module ...pdf.worker.mjs").
  // Excluding it from bundling lets Node's native require resolve the real on-disk path.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
