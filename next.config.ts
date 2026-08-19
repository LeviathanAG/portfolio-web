import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // content/ is read at request/build time via fs; make sure it ships
  // with the serverless bundle on Vercel.
  outputFileTracingIncludes: {
    "/blog/**": ["./content/blog/**"],
    "/blog-assets/**": ["./content/blog/**"],
  },
  async headers() {
    return [
      {
        source: "/certificates/gephyr-internship.pdf",
        headers: [
          { key: "Content-Type", value: "application/pdf" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Content-Disposition",
            value: 'inline; filename="gephyr-internship.pdf"',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
