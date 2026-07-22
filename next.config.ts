import type { NextConfig } from "next";

// GitHub Pages（project pages: /motion-dict）向け静的エクスポート。
// Framer移行後、このリポは「裸デモ /demo/[slug] と録画mp4」をGH Pagesへ配信する。
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/motion-dict",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
