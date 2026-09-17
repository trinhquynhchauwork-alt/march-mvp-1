import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (pdfjs-dist) spins up a worker via a relative file path that Turbopack's
  // server bundling breaks ("Setting up fake worker failed: Cannot find module ...pdf.worker.mjs").
  // Excluding it from bundling lets Node's native require resolve the real on-disk path.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],

  // pdfjs-dist loads its worker file via a dynamically-computed path, which Vercel's build
  // output file-tracing (@vercel/nft) doesn't pick up statically — the worker .mjs ends up
  // missing from the deployed function, failing at runtime with "Setting up fake worker
  // failed: Cannot find module .../pdf.worker.mjs" (reproduced on Vercel, mục bug 18/09).
  // Force-include it (and its legacy build siblings) for the route that uses it.
  outputFileTracingIncludes: {
    "/api/profile/parse": ["./node_modules/pdfjs-dist/legacy/build/*"],
  },
};

export default nextConfig;
