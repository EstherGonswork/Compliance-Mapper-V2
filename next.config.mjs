// Static export: `next build` writes a plain website into the `out` folder.
// Set NEXT_PUBLIC_BASE_PATH (for example /Compliance-Mapper-V2) when the site lives in a sub-folder, as on GitHub Pages.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  reactStrictMode: true,
};

export default nextConfig;
