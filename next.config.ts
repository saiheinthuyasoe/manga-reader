import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pub-ce27b8af752c4ae98c3ec5e2d5a66454.r2.dev", // Your actual R2 public URL
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
