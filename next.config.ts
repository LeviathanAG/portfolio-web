import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // content/ is read at request/build time via fs; make sure it ships
  // with the serverless bundle on Vercel.
  outputFileTracingIncludes: {
    "/blog/**": ["./content/blog/**"],
    "/blog-assets/**": ["./content/blog/**"],
  },
};

export default nextConfig;
